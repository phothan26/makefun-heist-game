// Sable & Smoke — tuning, palette and shared constants.
//
// Every number the game balances on lives here, so a tweak never means
// hunting through the rules or the renderer. The playfield is a fixed
// 1280x720 logical room; the renderer scales it to the window, so no rule
// below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** The thief, Wren. Sneaking is slower but halves how fast she is spotted. */
export const THIEF = {
  radius: 13,
  walkSpeed: 215,
  sneakSpeed: 112,
  /** Seconds of grace after being caught before the alarm can bite again. */
  graceAfterCaught: 1.2,
};

/** A guard's patrol and senses. */
export const GUARD = {
  radius: 14,
  patrolSpeed: 68,
  chaseSpeed: 168,
  investigateSpeed: 120,
  /** How far a guard can see, in pixels. */
  sightRange: 235,
  /** Half of the vision cone's angle, in radians. */
  halfCone: 0.52,
  /** Seconds a guard stares at a noise before giving up. */
  investigateTime: 4.0,
  /** Seconds a guard keeps chasing a last-seen position. */
  chaseMemory: 2.5,
};

/** A wall camera: fixed, sweeping, and quick to raise the alarm. */
export const CAMERA = {
  sightRange: 265,
  halfCone: 0.42,
  /** Radians per second the camera sweeps. */
  sweepSpeed: 0.55,
  /** How far, in radians, it sweeps either side of its base angle. */
  sweepArc: 0.85,
  /** Seconds a camera stays dead after its terminal is held. */
  disabledTime: 12,
};

/** The alarm meter: 0 is silent, 100 is lockdown. */
export const ALARM = {
  /** Per second, while a guard has eyes on the thief. */
  guardSeen: 44,
  /** Per second, while a camera has eyes on the thief. */
  cameraSeen: 48,
  /** Per second, while nobody can see the thief. */
  drain: 16,
  /** At this level the banner turns amber and guards grow wary. */
  wary: 55,
  /** At this level the banner turns red and guards converge. */
  critical: 85,
  /** At this level the nearest guard sprints for the thief. */
  lockdown: 100,
};

/** The vault: hold beside it to crack it. */
export const VAULT = { crackSeconds: 3.0, radius: 46 };

/** Tools. Smoke blocks every cone it covers; a coin lures a guard. */
export const TOOLS = {
  smokeStart: 3,
  smokeRadius: 95,
  smokeSeconds: 3.5,
  coinStart: 5,
  coinLureRadius: 320,
};

export const LIVES = 3;

/** Score values. */
export const SCORE = {
  painting: 150,
  gem: 250,
  pouch: 50,
  ledger: 600,
  ghostBonus: 500,
  /** Points per second left on the clock when escaping. */
  timeBonusPerSecond: 4,
};

/** Night timer: escape before it runs out or the gallery locks down. */
export const NIGHT_SECONDS = 240;

export const PALETTE = {
  backdrop: '#0d0b12',
  floorA: '#2b2118',
  floorB: '#241c14',
  floorTile: '#33291d',
  carpet: '#6e1f2a',
  carpetEdge: '#a67c2e',
  wall: '#171320',
  wallTop: '#241d33',
  wallTrim: '#8a6d2f',
  caseGlass: '#9fc4d8',
  caseFrame: '#4a3b22',
  vaultDoor: '#c9a227',
  vaultGlow: '#ffd76a',
  paintingFrame: '#7a5c1e',
  exitRope: '#d8c08a',
  thief: '#2dd4bf',
  thiefCloak: '#0f766e',
  guard: '#e2e8f0',
  guardUniform: '#334155',
  guardCap: '#1e293b',
  camera: '#94a3b8',
  cone: '#facc15',
  coneAlert: '#ef4444',
  smoke: '#cbd5e1',
  loot: '#fbbf24',
  text: '#f1ead8',
  muted: '#a89f8d',
  panel: 'rgba(12, 10, 18, 0.82)',
  panelEdge: '#5b4a26',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Best score, kept in this browser only. */
export const BEST_KEY = 'sable-and-smoke.best';
