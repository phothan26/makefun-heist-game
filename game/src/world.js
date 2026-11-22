// Sable & Smoke — the rules and the state, with no drawing and no browser
// in it. The world knows the thief, the guards, the cameras, the loot, the
// alarm and the vault; step() advances one fixed step and reports what
// happened, so the caller can play sounds and change screens without the
// world knowing about either.

import { ALARM, CAMERA, FIELD, GUARD, LIVES, NIGHT_SECONDS, SCORE, THIEF, TOOLS, VAULT } from './config.js';

export const EVENT_PICKUP = 'pickup';
export const EVENT_LEDGER = 'ledger';
export const EVENT_SMOKE = 'smoke';
export const EVENT_COIN = 'coin';
export const EVENT_TERMINAL = 'terminal';
export const EVENT_SPOTTED = 'spotted';
export const EVENT_CAUGHT = 'caught';
export const EVENT_ESCAPED = 'escaped';
export const EVENT_GAMEOVER = 'gameover';
export const EVENT_WIN = 'win';
export const EVENT_CRACK = 'crack';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

/** Smallest absolute difference between two angles. */
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Liang-Barsky: does the segment cross the rectangle?
  const dx = x2 - x1;
  const dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - rect.x, rect.x + rect.w - x1, y1 - rect.y, rect.y + rect.h - y1];
  let t0 = 0;
  let t1 = 1;
  for (let i = 0; i < 4; i += 1) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const r = q[i] / p[i];
      if (p[i] < 0) {
        if (r > t1) return false;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return false;
        if (r < t1) t1 = r;
      }
    }
  }
  return true;
}

function segmentHitsCircle(x1, y1, x2, y2, circle) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((circle.x - x1) * dx + (circle.y - y1) * dy) / lenSq;
  t = clamp(t, 0, 1);
  const px = x1 + dx * t;
  const py = y1 + dy * t;
  return distance(px, py, circle.x, circle.y) < circle.r;
}

function circleHitsRect(cx, cy, r, rect) {
  const nx = clamp(cx, rect.x, rect.x + rect.w);
  const ny = clamp(cy, rect.y, rect.y + rect.h);
  return distance(cx, cy, nx, ny) < r;
}

function circleHitsCircle(cx, cy, r, circle) {
  return distance(cx, cy, circle.x, circle.y) < r + circle.r;
}

export function createWorld(level, random) {
  const state = {
    level,
    night: level.id,
    time: 0,
    timeLeft: level.parSeconds ?? NIGHT_SECONDS,
    score: 0,
    lives: LIVES,
    alarm: 0,
    maxAlarm: 0,
    smokes: TOOLS.smokeStart,
    coins: TOOLS.coinStart,
    hasLedger: false,
    vaultProgress: 0,
    terminalProgress: 0,
    camerasDisabledUntil: -1,
    status: 'playing',
    escapeSecondsLeft: 0,
    player: {
      x: level.start.x,
      y: level.start.y,
      angle: -Math.PI / 2,
      sneaking: false,
      moving: false,
      invulnerable: 0,
    },
    guards: level.guards.map((g) => ({
      name: g.name,
      waypoints: g.waypoints,
      waypoint: 0,
      x: g.waypoints[0][0],
      y: g.waypoints[0][1],
      angle: 0,
      mode: 'patrol',
      target: null,
      timer: 0,
      suspicious: 0,
    })),
    cameras: level.cameras.map((c) => ({
      x: c.x,
      y: c.y,
      baseAngle: c.angle,
      angle: c.angle,
      sweepPhase: random() * Math.PI * 2,
    })),
    loot: level.loot.map((item) => ({ ...item, taken: false })),
    clouds: [],
    lures: [],
    particles: [],
    floaters: [],
  };

  function blocked(x1, y1, x2, y2) {
    for (const wall of level.walls) if (segmentHitsRect(x1, y1, x2, y2, wall)) return true;
    for (const box of level.cases) if (segmentHitsRect(x1, y1, x2, y2, box)) return true;
    for (const pillar of level.pillars) if (segmentHitsCircle(x1, y1, x2, y2, pillar)) return true;
    return false;
  }

  function inSmoke(x, y) {
    for (const cloud of state.clouds) {
      if (distance(x, y, cloud.x, cloud.y) < cloud.radius) return true;
    }
    return false;
  }

  function smokeBlocks(x1, y1, x2, y2) {
    for (const cloud of state.clouds) {
      if (segmentHitsCircle(x1, y1, x2, y2, { x: cloud.x, y: cloud.y, r: cloud.radius })) return true;
    }
    return false;
  }

  /** Can `from` see `to`? Range, cone, walls, cases, pillars and smoke. */
  function canSee(from, to, range, halfCone, facing) {
    const d = distance(from.x, from.y, to.x, to.y);
    if (d > range) return false;
    if (angleDiff(Math.atan2(to.y - from.y, to.x - from.x), facing) > halfCone) return false;
    if (blocked(from.x, from.y, to.x, to.y)) return false;
    if (smokeBlocks(from.x, from.y, to.x, to.y)) return false;
    if (inSmoke(to.x, to.y)) return false;
    return true;
  }

  function moveCircle(body, dx, dy) {
    const r = THIEF.radius;
    let nx = body.x + dx;
    let ny = body.y;
    for (const wall of level.walls) if (circleHitsRect(nx, ny, r, wall)) nx = body.x;
    for (const box of level.cases) if (circleHitsRect(nx, ny, r, box)) nx = body.x;
    for (const pillar of level.pillars) if (circleHitsCircle(nx, ny, r, pillar)) nx = body.x;
    nx = clamp(nx, r + 2, FIELD.width - r - 2);
    body.x = nx;
    ny = body.y + dy;
    for (const wall of level.walls) if (circleHitsRect(body.x, ny, r, wall)) ny = body.y;
    for (const box of level.cases) if (circleHitsRect(body.x, ny, r, box)) ny = body.y;
    for (const pillar of level.pillars) if (circleHitsCircle(body.x, ny, r, pillar)) ny = body.y;
    ny = clamp(ny, r + 2, FIELD.height - r - 2);
    body.y = ny;
  }

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const a = random() * Math.PI * 2;
      const v = speed * (0.4 + random() * 0.8);
      state.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.5 + random() * 0.5,
        maxLife: 1,
        color,
        size: 2 + random() * 3,
      });
    }
  }

  function floater(x, y, text, color) {
    state.floaters.push({ x, y, text, color, life: 1.4 });
  }

  function resetGuardsToPatrol() {
    for (const guard of state.guards) {
      guard.mode = 'patrol';
      guard.target = null;
      guard.timer = 0;
      guard.x = guard.waypoints[guard.waypoint][0];
      guard.y = guard.waypoints[guard.waypoint][1];
    }
  }

  function caught() {
    state.lives -= 1;
    burst(state.player.x, state.player.y, '#ef4444', 26, 160);
    if (state.lives <= 0) {
      state.status = 'gameover';
      return [EVENT_CAUGHT, EVENT_GAMEOVER];
    }
    state.player.x = level.start.x;
    state.player.y = level.start.y;
    state.player.invulnerable = 2.5;
    state.alarm = 40;
    state.vaultProgress = 0;
    state.terminalProgress = 0;
    resetGuardsToPatrol();
    return [EVENT_CAUGHT];
  }

  function step(dt, input) {
    const events = [];
    if (state.status !== 'playing') return { events, state };
    state.time += dt;
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.status = 'gameover';
      events.push(EVENT_GAMEOVER);
      return { events, state };
    }

    const player = state.player;
    if (player.invulnerable > 0) player.invulnerable -= dt;

    // --- The thief moves. ---
    const mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    player.sneaking = Boolean(input.sneak);
    player.moving = mx !== 0 || my !== 0;
    if (player.moving) {
      const len = Math.hypot(mx, my);
      const speed = player.sneaking ? THIEF.sneakSpeed : THIEF.walkSpeed;
      const dx = (mx / len) * speed * dt;
      const dy = (my / len) * speed * dt;
      player.angle = Math.atan2(my, mx);
      moveCircle(player, dx, dy);
    }

    // --- Tools. ---
    if (input.smoke && state.smokes > 0) {
      state.smokes -= 1;
      state.clouds.push({ x: player.x, y: player.y, radius: TOOLS.smokeRadius, life: TOOLS.smokeSeconds });
      burst(player.x, player.y, '#cbd5e1', 22, 90);
      events.push(EVENT_SMOKE);
    }
    if (input.coinToss && state.coins > 0) {
      state.coins -= 1;
      const point = input.coinToss;
      state.lures.push({ x: point.x, y: point.y, life: 0.6 });
      burst(point.x, point.y, '#fbbf24', 12, 70);
      let nearest = null;
      let nearestD = TOOLS.coinLureRadius;
      for (const guard of state.guards) {
        const d = distance(guard.x, guard.y, point.x, point.y);
        if (d < nearestD) { nearest = guard; nearestD = d; }
      }
      if (nearest) {
        nearest.mode = 'investigate';
        nearest.target = { x: point.x, y: point.y };
        nearest.timer = GUARD.investigateTime;
      }
      events.push(EVENT_COIN);
    }
    for (let i = state.clouds.length - 1; i >= 0; i -= 1) {
      state.clouds[i].life -= dt;
      if (state.clouds[i].life <= 0) state.clouds.splice(i, 1);
    }
    for (let i = state.lures.length - 1; i >= 0; i -= 1) {
      state.lures[i].life -= dt;
      if (state.lures[i].life <= 0) state.lures.splice(i, 1);
    }

    // --- Loot: walk close to take it. ---
    for (const item of state.loot) {
      if (item.taken) continue;
      if (distance(player.x, player.y, item.x, item.y) < 30) {
        item.taken = true;
        state.score += item.value;
        burst(item.x, item.y, '#fbbf24', 16, 110);
        floater(item.x, item.y - 18, `+${item.value} ${item.label}`, '#fbbf24');
        events.push(EVENT_PICKUP);
      }
    }

    // --- The vault: hold beside it to crack it. ---
    const nearVault = distance(player.x, player.y, level.vault.x, level.vault.y) < VAULT.radius + 14;
    if (nearVault && input.interact && !state.hasLedger) {
      state.vaultProgress += dt / VAULT.crackSeconds;
      if (Math.random() < dt * 6) burst(level.vault.x, level.vault.y, '#ffd76a', 1, 40);
      if (state.vaultProgress >= 1) {
        state.vaultProgress = 1;
        state.hasLedger = true;
        state.score += SCORE.ledger;
        burst(level.vault.x, level.vault.y, '#ffd76a', 30, 150);
        floater(level.vault.x, level.vault.y - 30, `+${SCORE.ledger} AMBER LEDGER`, '#ffd76a');
        events.push(EVENT_LEDGER);
      } else {
        events.push(EVENT_CRACK);
      }
    } else if (!nearVault) {
      state.vaultProgress = Math.max(0, state.vaultProgress - dt * 0.25);
    }

    // --- The camera terminal: hold beside it to kill the cameras. ---
    const nearTerminal = distance(player.x, player.y, level.terminal.x, level.terminal.y) < 44;
    const camerasOff = state.time < state.camerasDisabledUntil;
    if (nearTerminal && input.interact && !camerasOff) {
      state.terminalProgress += dt / 2;
      if (state.terminalProgress >= 1) {
        state.terminalProgress = 0;
        state.camerasDisabledUntil = state.time + CAMERA.disabledTime;
        events.push(EVENT_TERMINAL);
      }
    } else if (!nearTerminal) {
      state.terminalProgress = Math.max(0, state.terminalProgress - dt * 0.3);
    }

    // --- Guards: patrol, investigate a noise, chase what they see. ---
    let seenByGuard = false;
    let seenByCamera = false;
    for (const guard of state.guards) {
      // Eyes on the thief? A glimpse only makes a guard stop and stare:
      // suspicion has to fill before they give chase, so a flash of cloak
      // across a cone is a scare, not a sentence.
      if (player.invulnerable <= 0 && canSee(guard, player, GUARD.sightRange, GUARD.halfCone, guard.angle)) {
        seenByGuard = true;
        guard.suspicious = Math.min(1, guard.suspicious + dt * 1.5);
        guard.angle = Math.atan2(player.y - guard.y, player.x - guard.x);
        if (guard.suspicious >= 1) {
          guard.mode = 'chase';
          guard.target = { x: player.x, y: player.y };
          guard.timer = GUARD.chaseMemory;
        }
      } else {
        guard.suspicious = Math.max(0, guard.suspicious - dt * 0.5);
      }
      const speedScale = level.guardSpeed ?? 1;
      let speed = GUARD.patrolSpeed * speedScale;
      let dest = null;
      if (guard.mode === 'patrol') {
        // A wary guard stands and stares instead of walking on.
        if (guard.suspicious < 0.05) {
          dest = { x: guard.waypoints[guard.waypoint][0], y: guard.waypoints[guard.waypoint][1] };
          if (distance(guard.x, guard.y, dest.x, dest.y) < 8) {
            guard.waypoint = (guard.waypoint + 1) % guard.waypoints.length;
          }
        }
      } else if (guard.mode === 'investigate' && guard.target) {
        speed = GUARD.investigateSpeed * speedScale;
        dest = guard.target;
        guard.timer -= dt;
        if (distance(guard.x, guard.y, dest.x, dest.y) < 10 || guard.timer <= 0) {
          guard.mode = 'patrol';
          guard.target = null;
        }
      } else if (guard.mode === 'chase' && guard.target) {
        speed = GUARD.chaseSpeed * speedScale;
        dest = guard.target;
        guard.timer -= dt;
        if (guard.timer <= 0) {
          // Lost her: back to the beat, but wary — they remember the scare.
          guard.mode = 'patrol';
          guard.target = null;
          guard.suspicious = 0.5;
        }
      }
      if (dest) {
        const d = distance(guard.x, guard.y, dest.x, dest.y);
        if (d > 1) {
          const vx = ((dest.x - guard.x) / d) * speed * dt;
          const vy = ((dest.y - guard.y) / d) * speed * dt;
          guard.x += vx;
          guard.y += vy;
          guard.angle = Math.atan2(dest.y - guard.y, dest.x - guard.x);
        }
      }
      // Caught: a guard lays hands on the thief.
      if (player.invulnerable <= 0 && distance(guard.x, guard.y, player.x, player.y) < GUARD.radius + THIEF.radius - 2) {
        events.push(...caught());
        return { events, state };
      }
    }

    // --- Cameras: sweep, and watch. ---
    if (!camerasOff) {
      for (const camera of state.cameras) {
        camera.angle = camera.baseAngle + Math.sin(state.time * CAMERA.sweepSpeed + camera.sweepPhase) * CAMERA.sweepArc;
        if (player.invulnerable <= 0 && canSee(camera, player, CAMERA.sightRange, CAMERA.halfCone, camera.angle)) {
          seenByCamera = true;
        }
      }
    }

    // --- The alarm meter. ---
    const alarmBefore = state.alarm;
    if (seenByGuard) state.alarm += ALARM.guardSeen * (player.sneaking ? 0.5 : 1) * dt;
    if (seenByCamera) state.alarm += ALARM.cameraSeen * dt;
    if (!seenByGuard && !seenByCamera) state.alarm -= ALARM.drain * dt;
    state.alarm = clamp(state.alarm, 0, 100);
    state.maxAlarm = Math.max(state.maxAlarm, state.alarm);
    if (alarmBefore < ALARM.wary && state.alarm >= ALARM.wary) events.push(EVENT_SPOTTED);
    if (state.alarm >= ALARM.lockdown) {
      // Lockdown: the nearest guard sprints for the thief's last position.
      let nearest = null;
      let nearestD = Infinity;
      for (const guard of state.guards) {
        const d = distance(guard.x, guard.y, player.x, player.y);
        if (d < nearestD) { nearest = guard; nearestD = d; }
      }
      if (nearest) {
        nearest.mode = 'chase';
        nearest.target = { x: player.x, y: player.y };
        nearest.timer = GUARD.chaseMemory + 1.5;
      }
      state.alarm = 99;
    }

    // --- Escape: ledger in hand, reach the front door. ---
    if (state.hasLedger && distance(player.x, player.y, level.exit.x, level.exit.y) < 34) {
      const timeBonus = Math.round(state.timeLeft * SCORE.timeBonusPerSecond);
      state.score += timeBonus;
      if (state.maxAlarm < ALARM.wary) {
        state.score += SCORE.ghostBonus;
        floater(player.x, player.y - 30, `GHOST +${SCORE.ghostBonus}`, '#2dd4bf');
      }
      state.escapeSecondsLeft = state.timeLeft;
      state.status = 'escaped';
      events.push(EVENT_ESCAPED);
      return { events, state };
    }

    // --- Particles and floating text age. ---
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.floaters.length - 1; i >= 0; i -= 1) {
      const f = state.floaters[i];
      f.life -= dt;
      f.y -= 22 * dt;
      if (f.life <= 0) state.floaters.splice(i, 1);
    }

    return { events, state };
  }

  return { state, step, canSee, blocked, inSmoke };
}
