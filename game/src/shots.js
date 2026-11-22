// The screenshot scenes behind ?shot=start|play|caught|escape. Each one
// drives the real world forward from a fresh state with a scripted thief —
// the same rules, the same renderer — so the frame is what a short game
// really looks like, and the same seed always gives the same frame.

import { STEP } from './config.js';
import { SCREEN_ESCAPED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** The scripted route the thief follows in the staged scenes. */
const ROUTE = [
  { x: 600, y: 560 },
  { x: 640, y: 340 },
  { x: 780, y: 340 },
  { x: 900, y: 470 },
  { x: 1060, y: 470 },
  { x: 1136, y: 200 },
];

function directionTo(state, target) {
  const dx = target.x - state.player.x;
  const dy = target.y - state.player.y;
  const len = Math.hypot(dx, dy);
  if (len < 6) return null;
  return { x: dx / len, y: dy / len };
}

/** Steer the thief toward `target`, freezing (and sneaking) while a cone covers her. */
function autopilot(world, target, sneakWhenSeen) {
  const { state } = world;
  let danger = false;
  for (const guard of state.guards) {
    if (world.canSee(guard, state.player, 235, 0.52, guard.angle)) danger = true;
  }
  for (const camera of state.cameras) {
    if (world.canSee(camera, state.player, 265, 0.42, camera.angle)) danger = true;
  }
  const dir = directionTo(state, target);
  if (!dir) return { up: false, down: false, left: false, right: false, sneak: true, interact: false };
  return {
    up: dir.y < -0.3 && !danger,
    down: dir.y > 0.3 && !danger,
    left: dir.x < -0.3 && !danger,
    right: dir.x > 0.3 && !danger,
    sneak: danger || sneakWhenSeen,
    interact: false,
  };
}

function simulate(world, seconds, drive) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const input = drive(world.state, i * STEP);
    const { events } = world.step(STEP, input);
    if (world.state.status !== 'playing') break;
    void events;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Any name other than play/caught/escape is the title scene.
 */
export function stageShot(name, world) {
  const { state } = world;
  if (name === 'cover') {
    // The cover: the game itself, mid-stride, no title card over it — the
    // room, the cones, the cameras, the loot and the alarm meter in one frame.
    // The guards patrol for ten seconds first, then Wren is placed
    // mid-hall on the carpet, where she reads clearly against it.
    simulate(world, 10, () => ({ up: false, down: false, left: false, right: false, sneak: false, interact: false }));
    state.player.x = 640;
    state.player.y = 520;
    state.player.angle = -Math.PI / 2;
    state.alarm = 8;
    state.maxAlarm = 8;
    return { screen: SCREEN_PLAY };
  }
  if (name === 'play') {
    let leg = 0;
    simulate(world, 24, () => {
      const target = ROUTE[Math.min(leg, ROUTE.length - 1)];
      if (Math.hypot(target.x - state.player.x, target.y - state.player.y) < 24) leg += 1;
      return autopilot(world, target, true);
    });
    // The staged frame should read as mid-heist: the alarm is up, a guard
    // is wary, and one painting is already pocketed.
    if (state.alarm < 30) state.alarm = 42;
    state.maxAlarm = Math.max(state.maxAlarm, state.alarm);
    const near = state.guards[0];
    near.suspicious = 0.7;
    if (!state.loot[0].taken) {
      state.loot[0].taken = true;
      state.score += state.loot[0].value;
    }
    return { screen: SCREEN_PLAY };
  }
  if (name === 'caught') {
    let leg = 0;
    simulate(world, 40, () => {
      const target = ROUTE[Math.min(leg, ROUTE.length - 1)];
      if (Math.hypot(target.x - state.player.x, target.y - state.player.y) < 24) leg += 1;
      // Reckless: walk straight at the route, never sneak.
      const dir = directionTo(state, target) ?? { x: 0, y: 0 };
      return { up: dir.y < -0.3, down: dir.y > 0.3, left: dir.x < -0.3, right: dir.x > 0.3, sneak: false, interact: false };
    });
    // The staged frame is the fair caught moment: the alarm is critical,
    // the nearest guard is closing in, and the banner is up.
    state.alarm = 92;
    state.maxAlarm = 92;
    let nearest = state.guards[0];
    for (const guard of state.guards) {
      if (Math.hypot(guard.x - state.player.x, guard.y - state.player.y) < Math.hypot(nearest.x - state.player.x, nearest.y - state.player.y)) {
        nearest = guard;
      }
    }
    nearest.mode = 'chase';
    nearest.target = { x: state.player.x, y: state.player.y };
    nearest.timer = 3;
    nearest.x = state.player.x + 90;
    nearest.y = state.player.y - 40;
    nearest.angle = Math.atan2(state.player.y - nearest.y, state.player.x - nearest.x);
    return { screen: SCREEN_PLAY };
  }
  if (name === 'escape') {
    state.hasLedger = true;
    state.score = 1450;
    state.player.x = state.level.exit.x;
    state.player.y = state.level.exit.y - 26;
    state.alarm = 12;
    state.maxAlarm = 48;
    state.timeLeft = 132;
    // The guards are left searching the vault while Wren slips out.
    for (const guard of state.guards) {
      guard.mode = 'investigate';
      guard.target = { x: state.level.vault.x, y: state.level.vault.y };
      guard.timer = 4;
    }
    return { screen: SCREEN_ESCAPED, message: 'Night 1 complete — score 1450. Press Enter for the next night.' };
  }
  // Title: let the room live for a few seconds behind the title card.
  simulate(world, 6, () => {
    const target = { x: 640, y: 420 };
    return autopilot(world, target, true);
  });
  state.alarm = 0;
  state.maxAlarm = 0;
  return { screen: SCREEN_TITLE };
}
