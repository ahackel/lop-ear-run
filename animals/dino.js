// The dino as a rig (see the cat, and kit.js): the runner of Google's game, drawn like the others: a big boxy head with
// its jaw, little teeth, a stubby arm, a tail standing up behind, two legs with big feet, a lighter belly. Made of shapes,
// it stays smooth as it grows giant (drawn bigger, not its pixels: see drawRig).
import { quadruped, crawl } from './kit.js';

const HEAD = [
  { on: 'head', box: [-3.5, -2, 4.5, 0.6, 0.7] },
  { on: 'head', box: [-3.5, 0.4, 2, 2.5, 0.6] }, // the jaw
];
const rig = {
  fur: 'DINO',
  joints: { hip: [10, 12], chest: [14, 12], head: [17.5, 3] },
  torso: { r: 0 },
  smooth: 0.8,
  shapes: [
    { on: 'spine', ellipse: [2, -0.5, 3.8, 4.6] }, // the body
    { on: 'chest', capsule: [0.5, -2.5, 1.8, -6.5, 2] }, // the neck
    { on: 'chest', capsule: [2.5, -4.2, 4, -3.2, 0.6], smooth: 0.3 }, // the arm
    ...HEAD,
  ],
  paint: [{ color: 'DINO_LIGHT', on: 'spine', box: [-0.5, -2, 4, 3.5, 1] }], // the belly
  dots: [{ on: 'head', at: [1.5, 0], color: 'BELLY' }, { on: 'head', at: [3.5, 0], color: 'BELLY' }, { on: 'head', at: [0.5, 2], color: 'BELLY' }], // its teeth
  legs: {
    hindFar: { on: 'hip', at: [2.5, 2.5], thigh: 2.4, shin: 2.4, r: 0.95, foot: [1.5, 0.8], far: true, bend: -1 },
    hindNear: { on: 'hip', at: [-0.5, 2.5], thigh: 2.4, shin: 2.4, r: 1, foot: [1.5, 0.8], bend: -1 },
  },
  chains: {
    tail: { on: 'hip', at: [-2.5, -1], angle: 0.45, links: 3, length: 5, r: [1.8, 0.6], stiffness: 1200, damping: 30, weight: 40 },
  },
  face: { eye: [-0.5, -1] },
};

// lying low: long and flat, the head forward, the tail out behind
const low = { joints: { hip: [9, 15.5], chest: [16, 15.5], head: [19.5, 14] }, torso: { r: 2.4, ends: 5 }, ownShapes: true, shapes: HEAD,
  paint: [{ color: 'DINO_LIGHT', on: 'spine', box: [-2, 0, 10, 1.5, 0.5] }], chains: { tail: { at: [-4.5, -1], angle: 1.5 } } };

// the run: two legs taking turns, a long stride
const run = { gait: { frames: 8, stance: 0.45, reach: 5, lift: 2.2, bob: 0.5, ground: 18.4, legs: { hindNear: [0, 0.5], hindFar: [0.5, -0.5] } } };

// jumping: legs apart as it rises, together as it falls (its body upright)
const jump = [{ paws: { hindNear: [7.5, 17.6], hindFar: [14.5, 17.8] } }, { paws: { hindNear: [10.5, 18], hindFar: [12.5, 17.4] } }];

export default { ...rig, poses: quadruped(rig, low, { run, jump, duck: crawl(rig, low, { legs: { hindNear: [0, 0], hindFar: [0.5, 1] } }) }) };
