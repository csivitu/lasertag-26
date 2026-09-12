export type InvaderType = 'pink' | 'cyan' | 'yellow';

export interface Invader {
  readonly id: string;
  readonly type: InvaderType;
  x: number;
  y: number;
  readonly width: number;
  readonly height: number;
  readonly points: number;
  isAlive: boolean;
}

export interface Bullet {
  readonly id: string;
  x: number;
  y: number;
  readonly width: number;
  readonly height: number;
  readonly vy: number;
  readonly isEnemy?: boolean;
}

export interface Particle {
  readonly id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  readonly size: number;
}

export interface Player {
  x: number;
  y: number;
  readonly width: number;
  readonly height: number;
  readonly speed: number;
}

export type GameStatus = 'idle' | 'playing' | 'cleared' | 'gameover';
