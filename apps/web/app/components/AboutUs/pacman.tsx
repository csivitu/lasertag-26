"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import styles from "./AboutSection.module.css";

type AudioContextCtor = typeof AudioContext;
type WindowWithAudio = Window & { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };

const getAudioContextCtor = (): AudioContextCtor | undefined => {
    const w = window as WindowWithAudio;
    return w.AudioContext ?? w.webkitAudioContext;
};

const PACMAN_SRC = "/about/pacman.png";

// Desktop settings: 8 dots (Dot 0 is Power Pellet at 8%), 4 ghosts
const DESKTOP_DOT_POSITIONS = [8, 14, 20, 26, 32, 38, 44, 50];
const DESKTOP_PACMAN_START_X = 57;
const DESKTOP_GHOST_OFFSETS = [9, 18, 27, 36];
const DESKTOP_GHOST_HUNT_POSITIONS = [28, 48, 68, 88];

// Mobile settings: 4 dots only including big one at 8%, 2 ghosts only
const MOBILE_DOT_POSITIONS = [8, 20, 32, 44];
const MOBILE_PACMAN_START_X = 56;
const MOBILE_GHOST_OFFSETS = [14, 28];
const MOBILE_GHOST_HUNT_POSITIONS = [42, 78];

const GHOST_DATA = [
    { id: 0, src: "/about/ghost-1.png", alt: "Blinky" },
    { id: 1, src: "/about/ghost-2.png", alt: "Inky" },
    { id: 2, src: "/about/ghost-3.png", alt: "Pinky" },
    { id: 3, src: "/about/ghost-4.png", alt: "Clyde" },
];

function createInitialDots(isMobile: boolean) {
    const positions = isMobile ? MOBILE_DOT_POSITIONS : DESKTOP_DOT_POSITIONS;
    return positions.map((pct, idx) => ({
        id: idx,
        pct,
        isPower: idx === 0,
        eaten: false,
    }));
}

function createInitialGhosts(isMobile: boolean) {
    const ghostList = isMobile ? GHOST_DATA.slice(0, 2) : GHOST_DATA;
    const startX = isMobile ? MOBILE_PACMAN_START_X : DESKTOP_PACMAN_START_X;
    const offsets = isMobile ? MOBILE_GHOST_OFFSETS : DESKTOP_GHOST_OFFSETS;
    return ghostList.map((g, idx) => ({
        ...g,
        pct: startX + offsets[idx],
        state: "normal" as "normal" | "frightened" | "eaten",
    }));
}

export default function Pacman({ isMobile = false }: { isMobile?: boolean }) {
    const trackRef = useRef<HTMLDivElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const chompToggleRef = useRef(false);
    const inViewRef = useRef(false);

    const dotPositions = isMobile ? MOBILE_DOT_POSITIONS : DESKTOP_DOT_POSITIONS;
    const pacmanStartX = isMobile ? MOBILE_PACMAN_START_X : DESKTOP_PACMAN_START_X;
    const ghostOffsets = isMobile ? MOBILE_GHOST_OFFSETS : DESKTOP_GHOST_OFFSETS;
    const ghostHuntPositions = isMobile ? MOBILE_GHOST_HUNT_POSITIONS : DESKTOP_GHOST_HUNT_POSITIONS;
    const totalGhosts = isMobile ? 2 : 4;
    const initialChaseStep = dotPositions.length - 1;

    // Game state: 'chase' (eating dots left) | 'hunt' (hunting blue ghosts right)
    const [mode, setMode] = useState<"chase" | "hunt">("chase");
    const [pacmanX, setPacmanX] = useState<number>(pacmanStartX);
    const [pacmanDir, setPacmanDir] = useState<1 | -1>(-1); // -1 = left, 1 = right
    const [isChomping, setIsChomping] = useState(false);

    // Current step targets
    const [chaseStep, setChaseStep] = useState(initialChaseStep);
    const [huntStep, setHuntStep] = useState(0);

    const [dots, setDots] = useState(() => createInitialDots(isMobile));
    const [ghosts, setGhosts] = useState(() => createInitialGhosts(isMobile));

    // Audio synthesizer helper with automatic resume handling
    const playWithContext = useCallback((callback: (ctx: AudioContext) => void) => {
        try {
            let ctx = audioCtxRef.current;
            if (!ctx) {
                const AudioCtx = getAudioContextCtor();
                if (AudioCtx) {
                    ctx = new AudioCtx();
                    audioCtxRef.current = ctx;
                }
            }
            if (!ctx) return;
            if (ctx.state === "suspended") {
                ctx.resume().then(() => {
                    if (ctx) callback(ctx);
                }).catch(() => {});
            } else {
                callback(ctx);
            }
        } catch {}
    }, []);

    // Unlock audio context proactively on first user click or keydown
    useEffect(() => {
        const unlock = () => {
            try {
                if (!audioCtxRef.current) {
                    const AudioCtx = getAudioContextCtor();
                    if (AudioCtx) audioCtxRef.current = new AudioCtx();
                }
                if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
                    audioCtxRef.current.resume().catch(() => {});
                }
            } catch {}
        };
        window.addEventListener("pointerdown", unlock, { once: true });
        window.addEventListener("keydown", unlock, { once: true });
        return () => {
            window.removeEventListener("pointerdown", unlock);
            window.removeEventListener("keydown", unlock);
        };
    }, []);

    // 1. Crisp arcade dot eat chime (matches the big dot's square-wave arpeggio family)
    const playChomp = useCallback(() => {
        playWithContext((ctx) => {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "square";

            // Alternate between 554Hz (C#5) and 659Hz (E5) from the big pellet's chord
            chompToggleRef.current = !chompToggleRef.current;
            const freq = chompToggleRef.current ? 554 : 659;

            osc.frequency.setValueAtTime(freq, now);

            // Short, crisp arcade blip with quick decay (80% volume)
            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.004, now + 0.055);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.055);
        });
    }, [playWithContext]);

    // 2. Power Pellet ascending 4-note arcade arpeggio (80% volume)
    const playPowerPelletSound = useCallback(() => {
        playWithContext((ctx) => {
            const now = ctx.currentTime;
            [440, 554, 659, 880].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "square";
                const start = now + idx * 0.06;
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0.16, start);
                gain.gain.exponentialRampToValueAtTime(0.008, start + 0.06);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + 0.06);
            });
        });
    }, [playWithContext]);

    // 3. Ghost Munch: Authentic 180Hz -> 1800Hz arcade exponential ascending sweep (80% volume)
    const playGhostMunchSound = useCallback(() => {
        playWithContext((ctx) => {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            osc.type = "square";
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(1800, now + 0.38);

            filter.type = "lowpass";
            filter.frequency.setValueAtTime(2400, now);

            gain.gain.setValueAtTime(0.24, now);
            gain.gain.exponentialRampToValueAtTime(0.008, now + 0.38);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.38);
        });
    }, [playWithContext]);

    // 4. Victory fanfare (80% volume)
    const playVictorySound = useCallback(() => {
        playWithContext((ctx) => {
            const now = ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "triangle";
                const start = now + idx * 0.09;
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0.14, start);
                gain.gain.exponentialRampToValueAtTime(0.008, start + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + 0.12);
            });
        });
    }, [playWithContext]);

    // Reset loop
    const resetLoop = useCallback(() => {
        setMode("chase");
        setPacmanX(pacmanStartX);
        setPacmanDir(-1);
        setChaseStep(initialChaseStep);
        setHuntStep(0);
        setDots(createInitialDots(isMobile));
        setGhosts(createInitialGhosts(isMobile));
    }, [isMobile, pacmanStartX, initialChaseStep]);

    // Core step handler
    const stepGame = useCallback(() => {
        setIsChomping(true);
        setTimeout(() => setIsChomping(false), 160);

        if (mode === "chase") {
            // PHASE 1: CHOMP LEFT TOWARDS POWER PELLET
            const targetDotIdx = chaseStep;
            const targetPct = dotPositions[targetDotIdx];

            // 1. Move Pacman directly onto the dot
            setPacmanX(targetPct);
            setPacmanDir(-1);

            // 2. Eat dot & play accurate sound
            setDots((prev) =>
                prev.map((d) => (d.id === targetDotIdx ? { ...d, eaten: true } : d))
            );

            if (targetDotIdx === 0) {
                // EATEN THE POWER PELLET!
                playPowerPelletSound();
                setMode("hunt");
                setPacmanDir(1); // Flip facing right

                // Frightened ghosts take their fixed spaced positions along the returning runway
                setGhosts((prev) =>
                    prev.map((g, idx) => ({
                        ...g,
                        pct: ghostHuntPositions[idx],
                        state: "frightened" as const,
                    }))
                );
                setHuntStep(0);
            } else {
                // REGULAR DOT: Play chomp sound on every dot!
                playChomp();
                setChaseStep((s) => s - 1);

                // Ghosts follow in strict convoy formation behind Pacman
                setGhosts((prev) =>
                    prev.map((g, idx) => ({
                        ...g,
                        pct: targetPct + ghostOffsets[idx],
                        state: "normal",
                    }))
                );
            }
        } else {
            // PHASE 2: HUNT BLUE GHOSTS RIGHT
            if (huntStep >= totalGhosts) return;
            setPacmanDir(1);
            const targetGhostIdx = huntStep;
            const targetPct = ghostHuntPositions[targetGhostIdx] ?? 88;

            // 1. Pacman charges onto the exact spaced ghost position
            setPacmanX(targetPct);

            // 2. Play ghost munch sound
            playGhostMunchSound();

            // 3. That ghost disappears immediately! All other ghosts stay strictly in their spaced spots
            setGhosts((prevGhosts) =>
                prevGhosts.map((g, idx) => {
                    if (idx === targetGhostIdx) {
                        return { ...g, state: "eaten" as const };
                    }
                    return g;
                })
            );

            if (targetGhostIdx >= totalGhosts - 1) {
                // All ghosts eaten! Victory!
                setHuntStep(totalGhosts);
                playVictorySound();
                setTimeout(resetLoop, 850);
            } else {
                setHuntStep((s) => s + 1);
            }
        }
    }, [
        mode,
        chaseStep,
        huntStep,
        dotPositions,
        ghostOffsets,
        ghostHuntPositions,
        totalGhosts,
        playChomp,
        playPowerPelletSound,
        playGhostMunchSound,
        playVictorySound,
        resetLoop,
    ]);

    // Keyboard support (Left/Right Arrows or A/D) — only while the track is in view
    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                inViewRef.current = entry.isIntersecting;
            },
            { threshold: 0.3 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!inViewRef.current) return;
            if (["ArrowLeft", "a", "A"].includes(e.key)) {
                if (mode === "chase") stepGame();
            } else if (["ArrowRight", "d", "D"].includes(e.key)) {
                if (mode === "hunt") stepGame();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [mode, stepGame]);

    return (
        <div
            ref={trackRef}
            onClick={stepGame}
            className={isMobile ? styles.arcadeTrackMobile : styles.arcadeTrackDesktop}
            title={
                mode === "hunt"
                    ? "★ CHASE THE BLUE GHOSTS! (Click or press →) ★"
                    : "◄ CHOMP TOWARDS THE POWER PELLET! (Click or press ←)"
            }
        >
            {/* 8 Dots along the left runway */}
            {dots.map((dot) => (
                <span
                    key={dot.id}
                    className={`${dot.isPower ? styles.dotPower : styles.dotRegular} ${
                        dot.eaten ? styles.dotEaten : ""
                    }`}
                    style={{ left: `${dot.pct}%` }}
                />
            ))}

            {/* Chunky Playable Pacman */}
            <div
                className={styles.pacmanPlayable}
                onClick={(e) => {
                    e.stopPropagation();
                    stepGame();
                }}
                style={{
                    left: `${pacmanX}%`,
                    transform: `translate(-50%, -50%) scaleX(${pacmanDir === -1 ? 1 : -1})`,
                }}
                title={mode === "hunt" ? "Hunt ghosts!" : "Chomp left!"}
            >
                <div className={`${styles.pacmanSprite} ${isChomping ? styles.pacmanChomp : ""}`}>
                    <Image
                        src={PACMAN_SRC}
                        alt="Pac-Man"
                        fill
                        className={styles.fitImg}
                        priority
                    />
                </div>
            </div>

            {/* 4 Ghosts in convoy formation */}
            {ghosts.map((ghost) => (
                <div
                    key={ghost.id}
                    className={`${styles.ghostPlayable} ${
                        ghost.state === "frightened"
                            ? styles.ghostFrightened
                            : ghost.state === "eaten"
                            ? styles.ghostEaten
                            : ""
                    }`}
                    style={{
                        left: `${ghost.pct}%`,
                        transform: `translate(-50%, -50%) scaleX(${mode === "hunt" ? -1 : 1})`,
                    }}
                >
                    <Image
                        src={ghost.src}
                        alt={ghost.alt}
                        fill
                        className={styles.fitImg}
                        priority
                    />
                </div>
            ))}
        </div>
    );
}

export { default as Dots } from "./Dots";
export { default as Ghosts } from "./Ghosts";