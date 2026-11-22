[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/phothan26/makefun-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/phothan26/makefun-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

# Sable & Smoke — The Vermilion Gallery Heist

A top-down stealth heist game for [make.fun's "Make the best heist game" bounty](https://make.fun/bounty/best-heist-game-20261122-0559).

You are **Wren**, a cat-burglar in a gallery that never sleeps. Read the
guards' vision cones, slip past the sweeping cameras, crack the vault,
lift the **Amber Ledger**, and get out the front door before the alarm
hits lockdown. Three nights, one gallery, and a Ghost bonus if nobody
ever spots you.

## How to play

Serve the game and open it in a desktop browser (Chrome works best):

```sh
node serve.ts
# then open http://localhost:8080
```

No build step, no network requests — everything the game loads is a file
under `game/`, and every sound is synthesised in code.

| Key | Action |
| --- | --- |
| WASD / Arrows | Move |
| Shift | Sneak — slower, half as easy to spot |
| Space (hold) | Crack the vault · shut the cameras off at the panel |
| 1 | Smoke bomb — blocks every vision cone it covers |
| 2 or click | Toss a coin — the nearest guard goes to investigate |
| P | Pause · M — Mute · R — Restart |

The alarm meter fills while a guard or a camera has eyes on you and
drains while you stay hidden. At 100% the nearest guard sprints for you,
and if one lays hands on you, you lose a life and wake up back at the
front door. Three lives, four minutes a night.

## The nights

1. **The Vermilion Gallery** — three guards, two cameras.
2. **The Marble Annex** — a fourth guard, a third camera, more cover.
3. **The Gilded Vault** — faster patrols, and the Ledger behind one more door.

Side loot — a portrait, the Vermilion Ruby, coin pouches — adds to your
score, and escaping with time to spare pays a bonus.

## Layout

- `main.ts` — the entrypoint the grader runs: copies `game/` and
  `screenshots/` to `/output` and writes `dossier.json`.
- `serve.ts` — a tiny static server for local play.
- `game/index.html` — the page; `game/src/` holds the game, one job per file:
  `config.js` (tuning), `levels.js` (the three nights), `world.js` (rules),
  `render.js` (drawing), `input.js` (keyboard and mouse), `audio.js`
  (synthesised sound), `shots.js` (staged screenshot scenes),
  `main.js` (loop and screens), `random.js` (seeded random).
- `screenshots/` — four real renders of the game, staged with `shots.json`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## Screenshots

The cover is the title frame over the live gallery; the others are the
heist mid-flight, the caught moment, and the getaway — all rendered by
the game's own code (`?shot=start|play|caught|escape`).

## License

MIT — see [LICENSE](LICENSE).

---

<sub>Entered on [make.fun](https://make.fun/?ref=t7e39kme&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
