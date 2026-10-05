// The cat as a rig (see the rigs in art.js): a ginger kitten, pointed ears, the tail up.
// Places are in the 26×20 box the game puts every animal in (x to the right, y down, the feet on row 19); a shape `on` a
// joint is placed in that joint's frame: the spine's (hip and chest: from the hip toward the chest, turning with it) or
// the head's. Colors are palette names.

// (the run is a gait, worked out from the stride: see gait below) standing, all four paws down: hurt
const standing = { paws: { hindNear: [7, 18.4], hindFar: [8.5, 18.4], frontNear: [14.5, 18.4], frontFar: [16.5, 18.4] } };

// jumping: rising, the nose up, the hind legs trailing and the front ones reaching forward; falling, the nose down, the
// paws reaching for the ground
const jump = [
  { joints: { hip: [7, 12.45], chest: [14, 11.1], head: [19.5, 7.9] }, paws: { hindNear: [3.3, 16.9], hindFar: [4.3, 16.9], frontNear: [17.6, 16.6], frontFar: [18.5, 16.6] } },
  { joints: { hip: [7, 11.55], chest: [14, 12.9], head: [19.5, 9.1] }, paws: { hindNear: [3.9, 17.3], hindFar: [4.9, 17.3], frontNear: [17, 17.9], frontFar: [17.8, 17.9] } },
];

// lying low (ducking, and knocked out on its back): the body long and flat, the ears laid back
const low = { joints: { hip: [7, 16.3], chest: [14, 16.3], head: [19.5, 15.3] }, torso: { r: 2.9, ends: 4.5 },
  chains: { tail: { at: [-3.5, -0.3], angle: 1.55 }, earA: { tip: [-4.2, -5] }, earB: { tip: [1.5, -5.2] } } };
const duck = (f) => ({ ...low, paws: { hindNear: [5.5, 18.6], hindFar: [8, 18.6], frontNear: [f ? 21.5 : 20.5, 18.6], frontFar: [16, 18.6] },
  shapes: [{ ellipse: [f ? 21.5 : 20.5, 18.9, 2.3, 1] }, { ellipse: [f ? 5 : 7, 18.9, 2.6, 1] }] }); // the paws flat on the ground (shuffling)

// sitting: a round body on its haunch, the front legs straight, the tail along the ground (its tip wagging)
const sit = (f) => ({
  joints: { hip: [9.5, 14], chest: [13, 13], head: [14.5, 7.5] }, torso: { r: 0 },
  shapes: [{ ellipse: [9.5, 14, 5.5, 5] }, { ellipse: [13, 13, 3, 4.5] }, { ellipse: [10, 18.6, 3.5, 1.2] }],
  roots: { hindNear: [8, 16], hindFar: [10, 16], frontNear: [13, 15], frontFar: [15, 15] },
  paws: { hindNear: [8, 18.4], hindFar: [10, 18.4], frontNear: [13, 18.4], frontFar: [15.2, 18.4] },
  paint: [
    { color: 'STRIPE', capsule: [5.5, 10, 5, 12.5, 0.6] }, { color: 'STRIPE', capsule: [8.5, 10, 8, 12.5, 0.6] },
    { color: 'BELLY', ellipse: [14, 12, 2, 2.5] }, { color: 'BELLY', on: 'head', ellipse: [2.8, 1.5, 2, 1.6] },
  ],
  chains: { tail: { root: [4.5, 17], angle: 1.25 + (f ? 0.2 : 0) } },
});

export default {
  fur: 'GINGER',
  joints: { hip: [7, 12], chest: [14, 12], head: [19.5, 8.5] }, // standing, running
  torso: { r: 3.8, ends: 3.5 }, // an ellipse along the spine, reaching `ends` past the hip and the chest
  shapes: [
    { on: 'head', ellipse: [0, 0, 4, 3.7] },
    { on: 'head', ellipse: [2.8, 1.5, 2, 1.6] }, // the muzzle
  ],
  paint: [ // markings, only on the body
    { color: 'STRIPE', on: 'spine', capsule: [-0.5, -4, -1, -1.7, 0.6] },
    { color: 'STRIPE', on: 'spine', capsule: [2.5, -4, 2, -1.7, 0.6] },
    { color: 'STRIPE', on: 'spine', capsule: [5.5, -4, 5, -1.7, 0.6] },
    { color: 'BELLY', on: 'head', ellipse: [2.8, 1.5, 2, 1.6] }, // the muzzle
    { color: 'BELLY', on: 'chest', ellipse: [2, 1, 2.5, 2.2] }, // the chest
  ],
  // legs: from where they join the body (in its frame) to their paws; bend: which way the knee points (1 back, -1 forward)
  legs: {
    hindFar: { on: 'hip', at: [0.5, 1.5], thigh: 2.75, shin: 2.75, r: 0.9, far: true, bend: 1 },
    frontFar: { on: 'chest', at: [1.5, 1.5], thigh: 2.75, shin: 2.75, r: 0.9, far: true, bend: -1 },
    hindNear: { on: 'hip', at: [-0.5, 1.5], thigh: 2.75, shin: 2.75, r: 1, bend: 1 },
    frontNear: { on: 'chest', at: [1, 1.5], thigh: 2.75, shin: 2.75, r: 1, bend: -1 },
  },
  // chains, swung by the body's motion: angle from straight up (more: further back), curl per link (+: forward);
  // stiffness pulls each link to its rest angle, damping stops it ringing, the air drags, weight pulls down
  chains: {
    tail: { on: 'hip', at: [-3, -1.5], angle: 0.6, links: 4, length: 8, r: 1.1, curl: 0.3, stiffness: 900, damping: 30, weight: 60, soft: true },
    // a pointed ear: a triangle on the head, its tip on one stiff link from the middle of its base
    earA: { on: 'head', ear: [[-3.1, -2.3], [0, -3.5]], tip: [-2.5, -6.9], stiffness: 1400, damping: 22, weight: 60 },
    earB: { on: 'head', ear: [[0.5, -3.7], [3.5, -1.9]], tip: [2.5, -7.1], stiffness: 1400, damping: 22, weight: 60 },
  },
  face: { eye: [1, -1], nose: [3.5, 1], noseColor: 'PINK' }, // in the head's frame
  // the run: a rotary gallop worked out from where the cat is in its stride, in `frames` poses. Each paw pushes back
  // along the ground (reach) for `stance` of the stride, then swings forward in an arc (lift); legs: each one's place in
  // the stride and where its paw's sweep is centred (from its root). The body bobs, the hip and the chest out of step.
  gait: { frames: 8, stance: 0.4, reach: 6, lift: 2.6, bob: 0.6, ground: 18.4,
    legs: { hindNear: [0, -0.5], hindFar: [0.1, -0.5], frontNear: [0.5, 0.8], frontFar: [0.6, 0.8] } },
  poses: {
    jump, // rising, falling
    hurt: [standing],
    duck: [duck(0), duck(1)],
    ko: [{ ...low, flip: true, paws: { hindNear: [6, 11], hindFar: [10, 11], frontNear: [14, 11], frontFar: [17, 11] } }], // on its back, legs up
    idle: [sit(0), sit(1)],
  },
};
