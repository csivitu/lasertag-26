export const SCREEN_WIDTH = 308;
export const SCREEN_HEIGHT = 189;

export const INVADER_WIDTH = 20;
export const INVADER_HEIGHT = 22;

export const PLAYER_WIDTH = 23;
export const PLAYER_HEIGHT = 21;
export const PLAYER_INITIAL_Y = 136;
export const PLAYER_SPEED = 3.1;

export const BULLET_WIDTH = 5;
export const BULLET_HEIGHT = 12;
export const BULLET_SPEED = 5.2;

export const ENEMY_BULLET_WIDTH = 4;
export const ENEMY_BULLET_HEIGHT = 9;
export const ENEMY_BULLET_SPEED = 2.2;
export const ENEMY_SHOOT_CHANCE_PER_TICK = 0.012;
export const PLAYER_INVULNERABLE_DURATION_MS = 1800;

export const INITIAL_INVADER_SPEED_X = 0.55;
export const INVADER_DROP_Y = 6;
export const INVADER_MIN_X = 12;
export const INVADER_MAX_X = SCREEN_WIDTH - INVADER_WIDTH - 12;

export const POINTS_PINK = 30;
export const POINTS_CYAN = 20;
export const POINTS_YELLOW = 10;

export const INITIAL_LIVES = 3;
export const INITIAL_SCORE = 0;

export const PARTICLE_COUNT = 8;
export const PARTICLE_DECAY_RATE = 0.06;
export const PARTICLE_SIZE = 3;

export const SVG_INVADER_PINK = '/guidelines/space-invaders/invader-pink.svg';
export const SVG_INVADER_CYAN = '/guidelines/space-invaders/invader-cyan.svg';
export const SVG_INVADER_YELLOW = '/guidelines/space-invaders/invader-yellow.svg';
export const SVG_PLAYER_SHIP = '/guidelines/space-invaders/player-ship.svg';
export const SVG_PLAYER_BULLET = '/guidelines/space-invaders/player-bullet.svg';

export const SCREEN_LEFT_PERCENT = 20.6;
export const SCREEN_TOP_PERCENT = 9.45;
export const SCREEN_WIDTH_PERCENT = 52.58;
export const SCREEN_HEIGHT_PERCENT = 34.95;

export const GRID_CENTER_X = 153.8;
export const GRID_SPACING_X = 30;
export const GRID_ROW_Y = [34, 56, 78, 100] as const;
