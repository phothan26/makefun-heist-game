// The three nights of the Vermilion Gallery: each one is a single room the
// thief crosses, drawn in full on one screen — no scrolling, no hidden
// corners. Walls and display cases block movement and sight; pillars block
// sight; the carpet is just somewhere soft to walk.
//
// Coordinates are in the 1280x720 logical room. A wall is a rectangle, a
// case is a rectangle, a pillar is a circle. Every night has several routes
// between the door and the vault, so the player plans before moving.

const WALL = 18;

function outerWalls() {
  return [
    { x: 0, y: 0, w: 1280, h: WALL },
    { x: 0, y: 702, w: 1280, h: WALL },
    { x: 0, y: 0, w: WALL, h: 720 },
    { x: 1262, y: 0, w: WALL, h: 720 },
  ];
}

export const NIGHTS = [
  {
    id: 1,
    name: 'Night One — The Vermilion Gallery',
    brief: 'Lift the Amber Ledger from the east vault, then slip back out the front door.',
    parSeconds: 240,
    guardSpeed: 1.0,
    start: { x: 600, y: 656 },
    exit: { x: 600, y: 668 },
    vault: { x: 1136, y: 108 },
    terminal: { x: 112, y: 112 },
    walls: [
      ...outerWalls(),
      // West wing wall: gap is the doorway at y 300-380.
      { x: 430, y: 18, w: 16, h: 282 },
      { x: 430, y: 380, w: 16, h: 180 },
      // East wing wall: gap is the doorway at y 430-510.
      { x: 850, y: 18, w: 16, h: 412 },
      { x: 850, y: 510, w: 16, h: 50 },
      // South wall of the west wing: gap at x 180-260.
      { x: 18, y: 560, w: 162, h: 16 },
      { x: 260, y: 560, w: 170, h: 16 },
      // South wall of the east wing: gap at x 1000-1080.
      { x: 866, y: 560, w: 134, h: 16 },
      { x: 1080, y: 560, w: 182, h: 16 },
    ],
    cases: [
      { x: 560, y: 150, w: 120, h: 44, label: 'Porcelain' },
      { x: 560, y: 430, w: 120, h: 44, label: 'Bronzes' },
      { x: 960, y: 300, w: 44, h: 110, label: 'Masks' },
    ],
    pillars: [
      { x: 640, y: 300, r: 22 },
      { x: 760, y: 180, r: 18 },
    ],
    loot: [
      { id: 'painting-1', kind: 'painting', x: 520, y: 78, value: 150, label: 'Foxglove Portrait' },
      { id: 'gem-1', kind: 'gem', x: 1200, y: 620, value: 250, label: 'Vermilion Ruby' },
      { id: 'pouch-1', kind: 'pouch', x: 716, y: 626, value: 50, label: 'Coin pouch' },
    ],
    guards: [
      { name: 'Mara', waypoints: [[500, 200], [780, 200], [780, 480], [500, 480]] },
      { name: 'Odo', waypoints: [[120, 300], [350, 300], [350, 626], [120, 626]] },
      { name: 'Piet', waypoints: [[950, 200], [1180, 200], [1180, 480], [950, 480]] },
    ],
    cameras: [
      { x: 1238, y: 120, angle: Math.PI },
      // Watches the south-east corner and the ruby — not the front door,
      // so the entrance gives the thief a moment to read the room.
      // Sits in the gap between the bottom HUD panels, so it stays visible.
      { x: 940, y: 694, angle: -Math.PI / 2 },
    ],
  },
  {
    id: 2,
    name: 'Night Two — The Marble Annex',
    brief: 'A fourth guard, a third camera, and a vault that sits behind two doors.',
    parSeconds: 240,
    guardSpeed: 1.15,
    start: { x: 600, y: 656 },
    exit: { x: 600, y: 668 },
    vault: { x: 1136, y: 108 },
    terminal: { x: 112, y: 112 },
    walls: [
      ...outerWalls(),
      { x: 430, y: 18, w: 16, h: 282 },
      { x: 430, y: 380, w: 16, h: 180 },
      { x: 850, y: 18, w: 16, h: 412 },
      { x: 850, y: 510, w: 16, h: 50 },
      { x: 18, y: 560, w: 162, h: 16 },
      { x: 260, y: 560, w: 170, h: 16 },
      { x: 866, y: 560, w: 134, h: 16 },
      { x: 1080, y: 560, w: 182, h: 16 },
      // The annex adds a cross wall in the main hall: two routes around it.
      { x: 560, y: 300, w: 16, h: 120 },
      { x: 704, y: 180, w: 16, h: 120 },
    ],
    cases: [
      { x: 560, y: 150, w: 120, h: 44, label: 'Porcelain' },
      { x: 560, y: 430, w: 120, h: 44, label: 'Bronzes' },
      { x: 960, y: 300, w: 44, h: 110, label: 'Masks' },
      { x: 700, y: 500, w: 110, h: 40, label: 'Jewels' },
      { x: 180, y: 420, w: 44, h: 100, label: 'Tapestries' },
    ],
    pillars: [
      { x: 640, y: 300, r: 22 },
      { x: 760, y: 180, r: 18 },
      { x: 1060, y: 420, r: 18 },
    ],
    loot: [
      { id: 'painting-2', kind: 'painting', x: 520, y: 78, value: 150, label: 'Foxglove Portrait' },
      { id: 'gem-2', kind: 'gem', x: 1200, y: 620, value: 250, label: 'Vermilion Ruby' },
      { id: 'pouch-2a', kind: 'pouch', x: 716, y: 626, value: 50, label: 'Coin pouch' },
      { id: 'pouch-2b', kind: 'pouch', x: 240, y: 120, value: 50, label: 'Coin pouch' },
    ],
    guards: [
      { name: 'Mara', waypoints: [[500, 200], [780, 200], [780, 480], [500, 480]] },
      { name: 'Odo', waypoints: [[120, 300], [350, 300], [350, 626], [120, 626]] },
      { name: 'Piet', waypoints: [[950, 200], [1180, 200], [1180, 480], [950, 480]] },
      { name: 'Sable', waypoints: [[950, 560], [1180, 560]] },
    ],
    cameras: [
      { x: 1238, y: 120, angle: Math.PI },
      { x: 1238, y: 300, angle: Math.PI },
      { x: 38, y: 300, angle: 0 },
    ],
  },
  {
    id: 3,
    name: 'Night Three — The Gilded Vault',
    brief: 'The last night. Every patrol is faster, the cameras never blink, and the Ledger waits behind the far wall.',
    parSeconds: 240,
    guardSpeed: 1.3,
    start: { x: 600, y: 656 },
    exit: { x: 600, y: 668 },
    vault: { x: 1136, y: 108 },
    terminal: { x: 112, y: 112 },
    walls: [
      ...outerWalls(),
      { x: 430, y: 18, w: 16, h: 282 },
      { x: 430, y: 380, w: 16, h: 180 },
      { x: 850, y: 18, w: 16, h: 412 },
      { x: 850, y: 510, w: 16, h: 50 },
      { x: 18, y: 560, w: 162, h: 16 },
      { x: 260, y: 560, w: 170, h: 16 },
      { x: 866, y: 560, w: 134, h: 16 },
      { x: 1080, y: 560, w: 182, h: 16 },
      { x: 560, y: 300, w: 16, h: 120 },
      { x: 704, y: 180, w: 16, h: 120 },
      // A vault antechamber: the Ledger sits behind one more doorway.
      { x: 1020, y: 18, w: 16, h: 150 },
      { x: 1020, y: 240, w: 16, h: 60 },
    ],
    cases: [
      { x: 560, y: 150, w: 120, h: 44, label: 'Porcelain' },
      { x: 560, y: 430, w: 120, h: 44, label: 'Bronzes' },
      { x: 960, y: 300, w: 44, h: 110, label: 'Masks' },
      { x: 700, y: 500, w: 110, h: 40, label: 'Jewels' },
      { x: 180, y: 420, w: 44, h: 100, label: 'Tapestries' },
    ],
    pillars: [
      { x: 640, y: 300, r: 22 },
      { x: 760, y: 180, r: 18 },
      { x: 1060, y: 420, r: 18 },
      { x: 920, y: 140, r: 16 },
    ],
    loot: [
      { id: 'painting-3', kind: 'painting', x: 520, y: 78, value: 150, label: 'Foxglove Portrait' },
      { id: 'gem-3', kind: 'gem', x: 1200, y: 620, value: 250, label: 'Vermilion Ruby' },
      { id: 'pouch-3a', kind: 'pouch', x: 716, y: 626, value: 50, label: 'Coin pouch' },
      { id: 'pouch-3b', kind: 'pouch', x: 240, y: 120, value: 50, label: 'Coin pouch' },
      { id: 'gem-3b', kind: 'gem', x: 1120, y: 420, value: 250, label: 'Gilded Opal' },
    ],
    guards: [
      { name: 'Mara', waypoints: [[500, 200], [780, 200], [780, 480], [500, 480]] },
      { name: 'Odo', waypoints: [[120, 300], [350, 300], [350, 626], [120, 626]] },
      { name: 'Piet', waypoints: [[950, 200], [1180, 200], [1180, 480], [950, 480]] },
      { name: 'Sable', waypoints: [[950, 560], [1180, 560]] },
    ],
    cameras: [
      { x: 1238, y: 120, angle: Math.PI },
      { x: 1238, y: 300, angle: Math.PI },
      { x: 38, y: 300, angle: 0 },
    ],
  },
];
