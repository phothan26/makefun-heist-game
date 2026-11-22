// Sable & Smoke — everything the eye sees, and nothing else. One canvas,
// one logical room of 1280x720, scaled to the window. The HUD is drawn on
// the same canvas, so a screenshot always shows the alarm meter, the loot,
// the tools and the objective together with the room.

import { ALARM, CAMERA, FIELD, GUARD, PALETTE, THIEF, VAULT } from './config.js';
import { angleDiff } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_OVER = 'over';
export const SCREEN_ESCAPED = 'escaped';
export const SCREEN_WIN = 'win';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, halfCone, range, color, alpha) {
  const gradient = ctx.createRadialGradient(x, y, 10, x, y, range);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfCone, angle + halfCone);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawFloor(ctx, level) {
  ctx.fillStyle = PALETTE.floorA;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // Marble tiles: a whisper of a checker, so the floor reads as stone
  // without shouting over the cones and the loot.
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  for (let x = 0; x < FIELD.width; x += 80) {
    for (let y = 0; y < FIELD.height; y += 80) {
      if ((x / 80 + y / 80) % 2 === 0) ctx.fillRect(x + 1, y + 1, 78, 78);
    }
  }
  // The red carpet runner down the main hall.
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(600, 18, 80, 684);
  ctx.fillStyle = PALETTE.carpetEdge;
  ctx.fillRect(600, 18, 4, 684);
  ctx.fillRect(676, 18, 4, 684);
  // Framed pictures leaning by the north wall, below the HUD bar.
  const paintings = [
    { x: 120, c: '#7a4a2b', t: 'Foxglove' },
    { x: 300, c: '#2b4a6e', t: 'Harbour' },
    { x: 900, c: '#4a6e2b', t: 'Meadow' },
    { x: 1100, c: '#6e2b4a', t: 'Dancer' },
  ];
  for (const p of paintings) {
    ctx.fillStyle = PALETTE.paintingFrame;
    ctx.fillRect(p.x, 64, 72, 52);
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x + 6, 70, 60, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(p.x + 6, 70, 60, 10);
  }
}

function drawWalls(ctx, level) {
  for (const wall of level.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(wall.x, wall.y, wall.w, 4);
    ctx.fillStyle = PALETTE.wallTrim;
    if (wall.h <= 20) ctx.fillRect(wall.x, wall.y + wall.h - 3, wall.w, 3);
    if (wall.w <= 20) ctx.fillRect(wall.x + wall.w - 3, wall.y, 3, wall.h);
  }
}

function drawCases(ctx, level) {
  for (const box of level.cases) {
    ctx.fillStyle = PALETTE.caseFrame;
    roundRect(ctx, box.x, box.y, box.w, box.h, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(159,196,216,0.35)';
    roundRect(ctx, box.x + 5, box.y + 5, box.w - 10, box.h - 10, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(box.x + 8, box.y + 6, box.w - 16, 3);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(box.label, box.x + box.w / 2, box.y + box.h + 14);
  }
  for (const pillar of level.pillars) {
    ctx.fillStyle = '#4a4258';
    ctx.beginPath();
    ctx.arc(pillar.x, pillar.y, pillar.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b5f85';
    ctx.beginPath();
    ctx.arc(pillar.x - 4, pillar.y - 4, pillar.r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLoot(ctx, state) {
  for (const item of state.loot) {
    if (item.taken) continue;
    const pulse = 0.6 + 0.4 * Math.sin(state.time * 3 + item.x);
    ctx.save();
    ctx.translate(item.x, item.y);
    if (item.kind === 'painting') {
      ctx.fillStyle = PALETTE.paintingFrame;
      ctx.fillRect(-22, -16, 44, 32);
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(-17, -11, 34, 22);
      ctx.fillStyle = `rgba(251,191,36,${0.5 * pulse})`;
      ctx.fillRect(-17, -11, 34, 6);
    } else if (item.kind === 'gem') {
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, 14);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.7 * pulse})`;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 14);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(0, 2, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', 0, 7);
    }
    ctx.restore();
    ctx.fillStyle = `rgba(251,191,36,${0.35 * pulse})`;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 20 + 4 * pulse, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawVaultTerminalExit(ctx, state) {
  const level = state.level;
  // The vault: a gold pedestal with the Amber Ledger.
  const vault = level.vault;
  ctx.fillStyle = '#3f3a2a';
  ctx.beginPath();
  ctx.arc(vault.x, vault.y, VAULT.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.vaultDoor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(vault.x, vault.y, VAULT.radius, 0, Math.PI * 2);
  ctx.stroke();
  if (!state.hasLedger) {
    const glow = 0.6 + 0.4 * Math.sin(state.time * 4);
    ctx.fillStyle = `rgba(255,215,106,${glow})`;
    ctx.fillRect(vault.x - 14, vault.y - 10, 28, 20);
    ctx.fillStyle = '#7a4d00';
    ctx.fillRect(vault.x - 14, vault.y - 1, 28, 2);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AMBER LEDGER', vault.x, vault.y + VAULT.radius + 20);
  } else {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VAULT EMPTY', vault.x, vault.y + VAULT.radius + 20);
  }
  if (state.vaultProgress > 0 && state.vaultProgress < 1) {
    ctx.strokeStyle = PALETTE.vaultGlow;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(vault.x, vault.y, VAULT.radius + 8, -Math.PI / 2, -Math.PI / 2 + state.vaultProgress * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CRACKING…', vault.x, vault.y + VAULT.radius + 22);
  }
  // The camera terminal in the west wing.
  const term = level.terminal;
  const camerasOff = state.time < state.camerasDisabledUntil;
  ctx.fillStyle = camerasOff ? '#14532d' : '#1e3a5f';
  roundRect(ctx, term.x - 18, term.y - 14, 36, 28, 4);
  ctx.fill();
  ctx.fillStyle = camerasOff ? '#4ade80' : '#7dd3fc';
  ctx.beginPath();
  ctx.arc(term.x, term.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(camerasOff ? 'CAMERAS OFF' : 'CAMERA PANEL — hold SPACE', term.x, term.y - 22);
  if (state.terminalProgress > 0 && state.terminalProgress < 1) {
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(term.x - 30, term.y + 22, 60, 6);
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(term.x - 30, term.y + 22, 60 * state.terminalProgress, 6);
  }
  // The front door and its rope.
  const exit = level.exit;
  ctx.fillStyle = state.hasLedger ? '#166534' : '#3f3a2a';
  ctx.fillRect(exit.x - 42, 692, 84, 10);
  ctx.strokeStyle = PALETTE.exitRope;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(exit.x, 692);
  ctx.lineTo(exit.x, 668);
  ctx.stroke();
  ctx.fillStyle = state.hasLedger ? '#4ade80' : PALETTE.text;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.hasLedger ? '▼ ESCAPE ▼' : 'EXIT', exit.x, 686);
}

function drawCones(ctx, state) {
  const level = state.level;
  const camerasOff = state.time < state.camerasDisabledUntil;
  for (const guard of state.guards) {
    const alert = guard.mode === 'chase' || guard.suspicious > 0.4;
    drawCone(
      ctx, guard.x, guard.y, guard.angle, GUARD.halfCone, GUARD.sightRange,
      alert ? 'rgba(239,68,68,0.55)' : 'rgba(250,204,21,0.4)',
      alert ? 0.5 : 0.34,
    );
  }
  if (!camerasOff) {
    for (const camera of state.cameras) {
      drawCone(
        ctx, camera.x, camera.y, camera.angle, CAMERA.halfCone, CAMERA.sightRange,
        'rgba(250,204,21,0.4)', 0.3,
      );
    }
  }
}

function drawSmoke(ctx, state) {
  for (const cloud of state.clouds) {
    const alpha = Math.min(0.85, (cloud.life / 3.5) * 0.9 + 0.2);
    ctx.fillStyle = `rgba(203,213,225,${alpha})`;
    ctx.beginPath();
    ctx.arc(cloud.x - 22, cloud.y + 8, cloud.radius * 0.55, 0, Math.PI * 2);
    ctx.arc(cloud.x + 24, cloud.y - 6, cloud.radius * 0.6, 0, Math.PI * 2);
    ctx.arc(cloud.x, cloud.y, cloud.radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SMOKE', cloud.x, cloud.y - cloud.radius - 6);
  }
}

function drawGuards(ctx, state) {
  for (const guard of state.guards) {
    ctx.save();
    ctx.translate(guard.x, guard.y);
    ctx.rotate(guard.angle);
    ctx.fillStyle = PALETTE.guardUniform;
    ctx.beginPath();
    ctx.arc(0, 0, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(5, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.guardCap;
    ctx.fillRect(-4, -9, 12, 5);
    ctx.restore();
    // A "?" when suspicious, a "!" when chasing.
    if (guard.mode === 'chase') {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - 24);
    } else if (guard.suspicious > 0.25 || guard.mode === 'investigate') {
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', guard.x, guard.y - 24);
    }
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(guard.name, guard.x, guard.y + 28);
  }
  // Cameras on the walls.
  const camerasOff = state.time < state.camerasDisabledUntil;
  for (const camera of state.cameras) {
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.rotate(camera.angle);
    ctx.fillStyle = camerasOff ? '#14532d' : PALETTE.camera;
    ctx.fillRect(-6, -6, 14, 12);
    ctx.fillStyle = camerasOff ? '#4ade80' : '#ef4444';
    ctx.beginPath();
    ctx.arc(9, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawThief(ctx, state) {
  const player = state.player;
  const blink = player.invulnerable > 0 && Math.floor(state.time * 10) % 2 === 0;
  if (blink) return;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  const crouch = player.sneaking ? 0.8 : 1;
  ctx.fillStyle = PALETTE.thiefCloak;
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-10, -10 * crouch);
  ctx.lineTo(-12, 0);
  ctx.lineTo(-10, 10 * crouch);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.arc(0, 0, THIEF.radius * crouch, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0b0a10';
  ctx.beginPath();
  ctx.arc(3, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (state.hasLedger) {
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(player.x - 4, player.y - 24, 8, 6);
  }
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WREN', player.x, player.y + 26);
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.min(1, f.life);
    ctx.fillStyle = f.color;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, state) {
  const level = state.level;
  const alarm = state.alarm;
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, 8, 8, 1264, 46, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 1;
  roundRect(ctx, 8, 8, 1264, 46, 8);
  ctx.stroke();
  // Left: night and objective.
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(level.name, 20, 27);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(state.hasLedger ? 'Escape through the front door!' : 'Steal the Amber Ledger — hold SPACE at the vault', 20, 45);
  // Centre: the alarm meter.
  const meterX = 470;
  const meterW = 340;
  const alarmColor = alarm >= ALARM.critical ? '#ef4444' : alarm >= ALARM.wary ? '#f59e0b' : '#22c55e';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`ALARM ${Math.round(alarm)}%`, meterX + meterW / 2, 24);
  ctx.fillStyle = '#1c1626';
  roundRect(ctx, meterX, 30, meterW, 14, 7);
  ctx.fill();
  ctx.fillStyle = alarmColor;
  if (meterW * (alarm / 100) > 0) {
    roundRect(ctx, meterX, 30, Math.max(8, meterW * (alarm / 100)), 14, 7);
    ctx.fill();
  }
  // Right: score, time, lives.
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE ${state.score}`, 1110, 27);
  const timeLeft = Math.max(0, Math.ceil(state.timeLeft));
  ctx.fillStyle = timeLeft < 30 ? '#ef4444' : PALETTE.muted;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')} left`, 1110, 45);
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < state.lives ? '#f472b6' : '#3f3a4a';
    ctx.beginPath();
    ctx.arc(1140 + i * 26, 26, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b0a10';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('♥', 1140 + i * 26, 30);
  }
  // Bottom-left: tools and keys.
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, 8, 668, 430, 44, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.text;
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`◉ Smoke ×${state.smokes}  [1]    ◎ Coins ×${state.coins}  [2 / click]    Sneak [Shift]    Hold [Space]`, 20, 695);
  // Bottom-right: loot tally.
  const taken = state.loot.filter((item) => item.taken).length;
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, 1000, 668, 272, 44, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.text;
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(state.hasLedger ? '◆ AMBER LEDGER — GET OUT!' : `Loot ${taken}/${state.loot.length}  •  Ledger: not yet`, 1260, 695);
  // Vignette.
  const vignette = ctx.createRadialGradient(640, 360, 320, 640, 360, 780);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function drawBanner(ctx, title, subtitle, color) {
  ctx.fillStyle = 'rgba(8, 6, 12, 0.72)';
  ctx.fillRect(0, 280, FIELD.width, 150);
  ctx.fillStyle = color;
  ctx.font = 'bold 54px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 640, 340);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(subtitle, 640, 382);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Press R to try again — or Enter to continue', 640, 410);
}

function drawTitle(ctx, state, best) {
  ctx.fillStyle = 'rgba(8, 6, 12, 0.52)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('SABLE & SMOKE', 640, 190);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '24px Georgia, serif';
  ctx.fillText('The Vermilion Gallery Heist', 640, 228);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('You are Wren, a cat-burglar in a gallery that never sleeps.', 640, 268);
  ctx.fillText('Read the cones. Spend your smoke. Lift the Amber Ledger. Get out.', 640, 294);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '16px system-ui, sans-serif';
  const lines = [
    'WASD / Arrows — move      Shift — sneak (half as easy to spot)',
    'Space (hold) — crack the vault / shut the cameras off at the panel',
    '1 — smoke bomb      2 or click — toss a coin to lure a guard',
    'P — pause      M — mute      R — restart',
  ];
  lines.forEach((line, i) => ctx.fillText(line, 640, 340 + i * 28));
  ctx.fillStyle = '#2dd4bf';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('Press Enter or click to begin', 640, 490);
  if (best > 0) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(`Best score so far: ${best}`, 640, 524);
  }
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Three nights. One gallery. No second chances after the third bell.', 640, 560);
}

/** Draw one frame. `screen` is one of the SCREEN_* constants. */
export function draw(ctx, state, screen, info = {}) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  drawFloor(ctx, state.level);
  drawLoot(ctx, state);
  drawVaultTerminalExit(ctx, state);
  drawCones(ctx, state);
  drawSmoke(ctx, state);
  drawGuards(ctx, state);
  drawThief(ctx, state);
  drawParticles(ctx, state);
  drawCases(ctx, state.level);
  drawWalls(ctx, state.level);
  drawHud(ctx, state);

  if (screen === SCREEN_TITLE) drawTitle(ctx, state, info.best ?? 0);
  if (screen === SCREEN_PAUSE) {
    ctx.fillStyle = 'rgba(8, 6, 12, 0.66)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', 640, 360);
    ctx.font = '17px system-ui, sans-serif';
    ctx.fillText('Press P to keep sneaking', 640, 396);
  }
  if (state.alarm >= ALARM.critical && screen === SCREEN_PLAY) {
    ctx.fillStyle = `rgba(239,68,68,${0.25 + 0.2 * Math.sin(state.time * 8)})`;
    ctx.fillRect(0, 54, FIELD.width, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ LOCKDOWN IMMINENT — BREAK LINE OF SIGHT ⚠', 640, 74);
  } else if (state.alarm >= ALARM.wary && screen === SCREEN_PLAY) {
    ctx.fillStyle = 'rgba(245,158,11,0.85)';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPOTTED — stay out of the cones', 640, 72);
  }
  if (screen === SCREEN_OVER) {
    drawBanner(ctx, 'CAUGHT!', info.message ?? 'The gallery keeps its Ledger — this time.', '#ef4444');
  }
  if (screen === SCREEN_ESCAPED) {
    drawBanner(
      ctx,
      state.night >= 3 ? 'THE LAST LEDGER IS YOURS' : 'CLEAN GETAWAY!',
      info.message ?? `Night ${state.night} complete — score ${state.score}. Press Enter for the next night.`,
      '#4ade80',
    );
  }
  if (screen === SCREEN_WIN) {
    drawBanner(ctx, 'THE GALLERY IS YOURS', info.message ?? `All three nights cleared — final score ${state.score}.`, '#ffd76a');
  }
}

export { angleDiff };
