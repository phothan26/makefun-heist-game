// Keyboard and mouse, turned into the one input object the world steps
// with. Keys are edge-triggered for tools (press once, use once) and held
// for movement and for cracking the vault.

export function createInput(canvas) {
  const keys = new Set();
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    interact: false,
    smoke: false,
    coinToss: null,
    paused: false,
    muted: false,
    restart: false,
    anyKey: false,
  };
  let clicked = null;

  function refresh() {
    input.up = keys.has('ArrowUp') || keys.has('KeyW');
    input.down = keys.has('ArrowDown') || keys.has('KeyS');
    input.left = keys.has('ArrowLeft') || keys.has('KeyA');
    input.right = keys.has('ArrowRight') || keys.has('KeyD');
    input.sneak = keys.has('ShiftLeft') || keys.has('ShiftRight');
    input.interact = keys.has('Space') || keys.has('KeyE');
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.repeat) return;
    input.anyKey = true;
    keys.add(event.code);
    if (event.code === 'Digit1' || event.code === 'KeyQ') input.smoke = true;
    if (event.code === 'Digit2') {
      // Toss a coin a short way ahead of the thief.
      input.coinToss = { forward: true };
    }
    if (event.code === 'KeyP' || event.code === 'Escape') input.paused = !input.paused;
    if (event.code === 'KeyM') input.muted = !input.muted;
    if (event.code === 'KeyR') input.restart = true;
    refresh();
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
    refresh();
  });
  window.addEventListener('blur', () => {
    keys.clear();
    refresh();
  });

  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    clicked = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
    input.anyKey = true;
  });

  return {
    input,
    /** Hand the world its input for one step, clearing one-shot presses. */
    take(playerAngle) {
      const out = { ...input, coinToss: null };
      if (input.coinToss && input.coinToss.forward) {
        out.coinToss = {
          x: 0,
          y: 0,
          forward: true,
          angle: playerAngle,
        };
      } else if (clicked) {
        out.coinToss = { x: clicked.x, y: clicked.y };
      }
      input.smoke = false;
      input.coinToss = null;
      input.restart = false;
      clicked = null;
      return out;
    },
    clearFlags() {
      input.anyKey = false;
      input.paused = false;
      input.muted = false;
    },
  };
}
