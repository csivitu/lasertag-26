'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BULLET_HEIGHT,
  BULLET_SPEED,
  BULLET_WIDTH,
  ENEMY_BULLET_HEIGHT,
  ENEMY_BULLET_SPEED,
  ENEMY_BULLET_WIDTH,
  ENEMY_SHOOT_CHANCE_PER_TICK,
  GRID_CENTER_X,
  GRID_ROW_Y,
  GRID_SPACING_X,
  INITIAL_LIVES,
  INITIAL_SCORE,
  INVADER_HEIGHT,
  INVADER_MAX_X,
  INVADER_MIN_X,
  INVADER_WIDTH,
  PARTICLE_COUNT,
  PARTICLE_DECAY_RATE,
  PARTICLE_SIZE,
  PLAYER_HEIGHT,
  PLAYER_INITIAL_Y,
  PLAYER_INVULNERABLE_DURATION_MS,
  PLAYER_SPEED,
  PLAYER_WIDTH,
  POINTS_CYAN,
  POINTS_PINK,
  POINTS_YELLOW,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  SVG_INVADER_CYAN,
  SVG_INVADER_PINK,
  SVG_INVADER_YELLOW,
  SVG_PLAYER_BULLET,
  SVG_PLAYER_SHIP,
} from './space-invaders.constants';
import type {
  Bullet,
  GameStatus,
  Invader,
  InvaderType,
  Particle,
  Player,
} from './space-invaders.types';

const COLOR_PINK = '#ee218f';
const COLOR_CYAN = '#00cade';
const COLOR_YELLOW = '#f6ce01';
const COLOR_PLAYER_HIT = '#ffffff';
const MAX_PLAYER_BULLETS = 3;
const MAX_ENEMY_BULLETS = 3;
const WAVE_RESPAWN_DELAY_MS = 1200;

function createInitialFleet(): Invader[] {
  const fleet: Invader[] = [];

  // Row 0: 1 Pink invader at apex
  fleet.push({
    id: 'pink-0-0',
    type: 'pink',
    x: GRID_CENTER_X - INVADER_WIDTH / 2,
    y: GRID_ROW_Y[0],
    width: INVADER_WIDTH,
    height: INVADER_HEIGHT,
    points: POINTS_PINK,
    isAlive: true,
  });

  // Row 1: 3 Pink invaders
  [-1, 0, 1].forEach((offset, idx) => {
    fleet.push({
      id: `pink-1-${idx}`,
      type: 'pink',
      x: GRID_CENTER_X + offset * GRID_SPACING_X - INVADER_WIDTH / 2,
      y: GRID_ROW_Y[1],
      width: INVADER_WIDTH,
      height: INVADER_HEIGHT,
      points: POINTS_PINK,
      isAlive: true,
    });
  });

  // Row 2: 5 Cyan invaders
  [-2, -1, 0, 1, 2].forEach((offset, idx) => {
    fleet.push({
      id: `cyan-2-${idx}`,
      type: 'cyan',
      x: GRID_CENTER_X + offset * GRID_SPACING_X - INVADER_WIDTH / 2,
      y: GRID_ROW_Y[2],
      width: INVADER_WIDTH,
      height: INVADER_HEIGHT,
      points: POINTS_CYAN,
      isAlive: true,
    });
  });

  // Row 3: 7 Yellow invaders
  [-3, -2, -1, 0, 1, 2, 3].forEach((offset, idx) => {
    fleet.push({
      id: `yellow-3-${idx}`,
      type: 'yellow',
      x: GRID_CENTER_X + offset * GRID_SPACING_X - INVADER_WIDTH / 2,
      y: GRID_ROW_Y[3],
      width: INVADER_WIDTH,
      height: INVADER_HEIGHT,
      points: POINTS_YELLOW,
      isAlive: true,
    });
  });

  return fleet;
}

function getInvaderColor(type: InvaderType): string {
  switch (type) {
    case 'pink':
      return COLOR_PINK;
    case 'cyan':
      return COLOR_CYAN;
    case 'yellow':
      return COLOR_YELLOW;
  }
}

export function SpaceInvadersScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [score, setScore] = useState<number>(INITIAL_SCORE);
  const [lives, setLives] = useState<number>(INITIAL_LIVES);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');

  // Pre-loaded image sprites
  const imagesRef = useRef<{
    pink: HTMLImageElement;
    cyan: HTMLImageElement;
    yellow: HTMLImageElement;
    ship: HTMLImageElement;
    bullet: HTMLImageElement;
  } | null>(null);

  // Mutable game state held in refs for 60fps canvas loop
  const playerRef = useRef<Player>({
    x: GRID_CENTER_X - PLAYER_WIDTH / 2,
    y: PLAYER_INITIAL_Y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: PLAYER_SPEED,
  });

  const livesRef = useRef<number>(INITIAL_LIVES);
  const gameStatusRef = useRef<GameStatus>('idle');
  const invulnerableUntilRef = useRef<number>(0);

  const fleetRef = useRef<Invader[]>(createInitialFleet());
  const playerBulletsRef = useRef<Bullet[]>([]);
  const enemyBulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  const keysPressedRef = useRef<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  });

  const fleetDirectionRef = useRef<number>(1);
  const fleetStepTimerRef = useRef<number>(0);
  const waveNumberRef = useRef<number>(1);
  const bulletIdCounterRef = useRef<number>(0);
  const particleIdCounterRef = useRef<number>(0);

  // Synchronize ref with state
  useEffect(() => {
    gameStatusRef.current = gameStatus;
  }, [gameStatus]);

  // Initialize sprite images
  useEffect(() => {
    const loadImg = (src: string) => {
      const img = new Image();
      img.src = src;
      return img;
    };

    imagesRef.current = {
      pink: loadImg(SVG_INVADER_PINK),
      cyan: loadImg(SVG_INVADER_CYAN),
      yellow: loadImg(SVG_INVADER_YELLOW),
      ship: loadImg(SVG_PLAYER_SHIP),
      bullet: loadImg(SVG_PLAYER_BULLET),
    };
  }, []);

  const spawnExplosion = useCallback(
    (x: number, y: number, color: string, count: number = PARTICLE_COUNT) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 0.8 + Math.random() * 1.6;
        particleIdCounterRef.current += 1;
        particlesRef.current.push({
          id: `particle-${particleIdCounterRef.current}`,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          alpha: 1.0,
          size: PARTICLE_SIZE,
        });
      }
    },
    []
  );

  const resetGame = useCallback(() => {
    setScore(INITIAL_SCORE);
    setLives(INITIAL_LIVES);
    livesRef.current = INITIAL_LIVES;
    playerRef.current.x = GRID_CENTER_X - PLAYER_WIDTH / 2;
    fleetRef.current = createInitialFleet();
    playerBulletsRef.current = [];
    enemyBulletsRef.current = [];
    particlesRef.current = [];
    fleetDirectionRef.current = 1;
    fleetStepTimerRef.current = 0;
    waveNumberRef.current = 1;
    invulnerableUntilRef.current = 0;
    setGameStatus('playing');
    gameStatusRef.current = 'playing';
  }, []);

  const handlePlayerHit = useCallback(
    (now: number) => {
      if (now < invulnerableUntilRef.current) return;
      invulnerableUntilRef.current = now + PLAYER_INVULNERABLE_DURATION_MS;

      const player = playerRef.current;
      spawnExplosion(
        player.x + player.width / 2,
        player.y + player.height / 2,
        COLOR_PLAYER_HIT,
        14
      );

      const nextLives = livesRef.current - 1;
      livesRef.current = nextLives;
      setLives(Math.max(0, nextLives));

      if (nextLives <= 0) {
        setGameStatus('gameover');
        gameStatusRef.current = 'gameover';
      } else {
        // Reset player to center after hit
        player.x = GRID_CENTER_X - PLAYER_WIDTH / 2;
      }
    },
    [spawnExplosion]
  );

  const firePlayerBullet = useCallback(() => {
    if (gameStatusRef.current === 'idle') {
      setGameStatus('playing');
      gameStatusRef.current = 'playing';
      return;
    }
    if (gameStatusRef.current === 'gameover') {
      resetGame();
      return;
    }
    if (gameStatusRef.current !== 'playing') return;
    if (playerBulletsRef.current.length >= MAX_PLAYER_BULLETS) return;

    const player = playerRef.current;
    bulletIdCounterRef.current += 1;
    playerBulletsRef.current.push({
      id: `p-bullet-${bulletIdCounterRef.current}`,
      x: player.x + player.width / 2 - BULLET_WIDTH / 2,
      y: player.y - BULLET_HEIGHT,
      width: BULLET_WIDTH,
      height: BULLET_HEIGHT,
      vy: -BULLET_SPEED,
    });
  }, [resetGame]);

  // Handle external arcade controller clicks
  useEffect(() => {
    const handleArcadeControl = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const action = customEvent.detail;
      if (gameStatusRef.current === 'idle') {
        setGameStatus('playing');
        gameStatusRef.current = 'playing';
      }
      if (action === 'left') {
        playerRef.current.x = Math.max(INVADER_MIN_X, playerRef.current.x - 12);
        firePlayerBullet();
      } else if (action === 'right') {
        playerRef.current.x = Math.min(INVADER_MAX_X, playerRef.current.x + 12);
        firePlayerBullet();
      } else if (action === 'fire') {
        firePlayerBullet();
      }
    };

    window.addEventListener('arcade-control', handleArcadeControl);
    return () => {
      window.removeEventListener('arcade-control', handleArcadeControl);
    };
  }, [firePlayerBullet]);

  // Handle keyboard inputs (ONLY Arrow keys and Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysPressedRef.current.left = true;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysPressedRef.current.right = true;
      } else if (
        e.code === 'Space' ||
        e.code === 'ArrowUp' ||
        e.code === 'Enter'
      ) {
        e.preventDefault();
        firePlayerBullet();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysPressedRef.current.left = false;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysPressedRef.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [firePlayerBullet]);

  // Click on screen starts game or fires
  const handleClick = () => {
    firePlayerBullet();
  };

  // Main 60fps Game Loop using Canvas
  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = () => {
      const now = performance.now();
      const status = gameStatusRef.current;
      const player = playerRef.current;
      const fleet = fleetRef.current;
      const canvas = canvasRef.current;

      // 1. Update Player Position from keyboard ONLY
      if (status === 'playing') {
        if (keysPressedRef.current.left) {
          player.x = Math.max(INVADER_MIN_X, player.x - player.speed);
        }
        if (keysPressedRef.current.right) {
          player.x = Math.min(INVADER_MAX_X, player.x + player.speed);
        }
      }

      // 2. Update Fleet Movement & Enemy Attacks
      const aliveInvaders = fleet.filter((inv) => inv.isAlive);

      if (status === 'playing') {
        if (aliveInvaders.length === 0) {
          setGameStatus('cleared');
          gameStatusRef.current = 'cleared';
          setTimeout(() => {
            waveNumberRef.current += 1;
            fleetRef.current = createInitialFleet();
            setGameStatus('playing');
            gameStatusRef.current = 'playing';
          }, WAVE_RESPAWN_DELAY_MS);
        } else {
          fleetStepTimerRef.current += 1;
          const stepInterval = Math.max(8, 24 - waveNumberRef.current * 2);

          if (fleetStepTimerRef.current >= stepInterval) {
            fleetStepTimerRef.current = 0;

            // Check if any alive invader touches boundary
            let hitBoundary = false;
            const currentDir = fleetDirectionRef.current;

            for (const inv of aliveInvaders) {
              if (
                (currentDir > 0 && inv.x >= INVADER_MAX_X) ||
                (currentDir < 0 && inv.x <= INVADER_MIN_X)
              ) {
                hitBoundary = true;
                break;
              }
            }

            if (hitBoundary) {
              fleetDirectionRef.current = -currentDir;
              for (const inv of aliveInvaders) {
                inv.y += 4;
              }
            } else {
              const stepX = currentDir * (3.0 + waveNumberRef.current * 0.4);
              for (const inv of aliveInvaders) {
                inv.x += stepX;
              }
            }
          }

          // Periodic enemy fire
          if (
            enemyBulletsRef.current.length < MAX_ENEMY_BULLETS &&
            Math.random() < ENEMY_SHOOT_CHANCE_PER_TICK &&
            aliveInvaders.length > 0
          ) {
            const randomInvader =
              aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
            bulletIdCounterRef.current += 1;
            enemyBulletsRef.current.push({
              id: `e-bullet-${bulletIdCounterRef.current}`,
              x: randomInvader.x + randomInvader.width / 2 - ENEMY_BULLET_WIDTH / 2,
              y: randomInvader.y + randomInvader.height,
              width: ENEMY_BULLET_WIDTH,
              height: ENEMY_BULLET_HEIGHT,
              vy: ENEMY_BULLET_SPEED + waveNumberRef.current * 0.2,
              isEnemy: true,
            });
          }

          // Check direct shuttle collision with descending invaders
          for (const inv of aliveInvaders) {
            if (
              player.x < inv.x + inv.width &&
              player.x + player.width > inv.x &&
              player.y < inv.y + inv.height &&
              player.y + player.height > inv.y
            ) {
              handlePlayerHit(now);
              break;
            }
          }
        }
      }

      // 3. Update Player Bullets
      const activePlayerBullets: Bullet[] = [];
      for (const bullet of playerBulletsRef.current) {
        bullet.y += bullet.vy;
        if (bullet.y + bullet.height < 0) continue;

        let bulletHit = false;
        for (const inv of aliveInvaders) {
          if (
            bullet.x < inv.x + inv.width &&
            bullet.x + bullet.width > inv.x &&
            bullet.y < inv.y + inv.height &&
            bullet.y + bullet.height > inv.y
          ) {
            inv.isAlive = false;
            bulletHit = true;
            spawnExplosion(
              inv.x + inv.width / 2,
              inv.y + inv.height / 2,
              getInvaderColor(inv.type)
            );
            setScore((prev) => prev + inv.points);
            break;
          }
        }

        if (!bulletHit) {
          activePlayerBullets.push(bullet);
        }
      }
      playerBulletsRef.current = activePlayerBullets;

      // 4. Update Enemy Bullets & Shuttle Hitbox Collision
      const activeEnemyBullets: Bullet[] = [];
      for (const bullet of enemyBulletsRef.current) {
        bullet.y += bullet.vy;
        if (bullet.y > SCREEN_HEIGHT) continue;

        // Hitbox collision against the Player Shuttle
        if (
          bullet.x < player.x + player.width &&
          bullet.x + bullet.width > player.x &&
          bullet.y < player.y + player.height &&
          bullet.y + bullet.height > player.y
        ) {
          handlePlayerHit(now);
          continue;
        }

        activeEnemyBullets.push(bullet);
      }
      enemyBulletsRef.current = activeEnemyBullets;

      // 5. Update Particles
      const activeParticles: Particle[] = [];
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= PARTICLE_DECAY_RATE;
        if (p.alpha > 0) {
          activeParticles.push(p);
        }
      }
      particlesRef.current = activeParticles;

      // 6. Draw to Canvas
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

          const imgs = imagesRef.current;
          if (imgs) {
            // Draw alive invaders
            for (const inv of aliveInvaders) {
              const img = imgs[inv.type];
              if (img && img.complete) {
                ctx.drawImage(img, inv.x, inv.y, inv.width, inv.height);
              }
            }

            // Draw player bullets
            const bulletImg = imgs.bullet;
            if (bulletImg && bulletImg.complete) {
              for (const bullet of activePlayerBullets) {
                ctx.drawImage(
                  bulletImg,
                  bullet.x,
                  bullet.y,
                  bullet.width,
                  bullet.height
                );
              }
            }

            // Draw enemy lasers (pulsing red/cyan plasma bars)
            for (const eBullet of activeEnemyBullets) {
              ctx.fillStyle = '#ff2a6d';
              ctx.fillRect(
                eBullet.x,
                eBullet.y,
                eBullet.width,
                eBullet.height
              );
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(
                eBullet.x + 1,
                eBullet.y + 1,
                1,
                eBullet.height - 2
              );
            }

            // Draw player ship (flashing if invulnerable)
            const isFlashing =
              now < invulnerableUntilRef.current &&
              Math.floor(now / 100) % 2 === 0;

            if (!isFlashing) {
              const shipImg = imgs.ship;
              if (shipImg && shipImg.complete) {
                ctx.drawImage(
                  shipImg,
                  player.x,
                  player.y,
                  player.width,
                  player.height
                );
              }
            }
          }

          // Draw explosion particles
          for (const p of activeParticles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillRect(p.x, p.y, p.size, p.size);
          }
          ctx.globalAlpha = 1.0;
        }
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [handlePlayerHit, spawnExplosion]);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="relative h-full w-full select-none overflow-hidden rounded-[4px] bg-black cursor-pointer"
      tabIndex={0}
      role="application"
      aria-label="Space Invaders Arcade Game. Use Left and Right Arrow keys to move, Space to fire."
    >
      {/* HUD Header */}
      <div className="absolute left-0 top-0 z-20 flex w-full items-center justify-between px-3 py-1 text-[9px] font-mono tracking-wider text-[#35ecf0]">
        <div className="flex items-center gap-1">
          <span className="text-white">SCORE</span>
          <span className="text-[#35ecf0]">
            {score.toString().padStart(4, '0')}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: lives }).map((_, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`life-${i}`}
              src={SVG_PLAYER_SHIP}
              alt=""
              width={10}
              height={9}
              className="inline-block"
            />
          ))}
        </div>
      </div>

      {/* Hardware-accelerated Pixel Canvas */}
      <canvas
        ref={canvasRef}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        className="absolute inset-0 h-full w-full [image-rendering:pixelated]"
      />

      {/* Controls Communication Bar in CRT Screen */}
      <div className="pointer-events-none absolute bottom-1.5 left-0 right-0 z-20 text-center">
        <span className="rounded bg-black/80 px-2 py-0.5 font-mono text-[7px] tracking-wider text-guideline-cyan border border-guideline-cyan/30 shadow-sm">
          ◄ / ► ARROW KEYS TO MOVE • SPACE TO SHOOT
        </span>
      </div>

      {/* Attract Mode Start Prompt (Idle State) */}
      {gameStatus === 'idle' && (
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-1 rounded bg-black/85 px-2.5 py-1.5 border border-brand-pink/50 shadow-lg text-center">
            <span className="animate-pulse font-mono text-[8px] font-bold tracking-wider text-guideline-yellow">
              PRESS SPACE OR CLICK TO START
            </span>
          </div>
        </div>
      )}


      {/* Wave Cleared Message */}
      {gameStatus === 'cleared' && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/60 font-mono text-xs font-bold text-[#f6ce01]">
          WAVE CLEARED!
        </div>
      )}

      {/* Game Over Screen */}
      {gameStatus === 'gameover' && (
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-1 bg-black/80 font-mono">
          <span className="text-sm font-bold tracking-widest text-[#ff2a6d] animate-pulse">
            GAME OVER
          </span>
          <span className="text-[9px] text-[#35ecf0]">
            FINAL SCORE: {score.toString().padStart(4, '0')}
          </span>
          <span className="mt-1 rounded bg-black px-2 py-0.5 text-[7px] text-white/90 border border-white/30">
            [ PRESS SPACE OR CLICK TO RESTART ]
          </span>
        </div>
      )}

      {/* CRT Scanline Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-30"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 2px)',
        }}
      />
    </div>
  );
}
