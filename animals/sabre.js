// The sabre-tooth cat as a rig (see the cat, and kit.js): a tiger's stripes, a big head, the mouth open, two long white
// fangs reaching below its chin (drawn on top), a short tail.
import { quadruped } from './kit.js';

const fang = (dy) => [{ color: 'BELLY', shapes: [{ on: 'head', capsule: [2.8, 1.8, 3.1, 5.8 + dy, 0.6] }] }];

const rig = {
  fur: 'TAN',
  joints: { hip: [7.5, 11.2], chest: [14.5, 11.2], head: [19.4, 8.6] },
  torso: { r: 3.4, ends: 3.5 },
  shapes: [
    { on: 'chest', ellipse: [0.5, -0.4, 3, 3.2] },
    { on: 'head', ellipse: [0, 0, 3.8, 3.5] },
    { on: 'head', ellipse: [3.4, 0.8, 2, 1.3] }, // the muzzle
    { on: 'head', ellipse: [2, 3.8, 1.6, 0.9] }, // the jaw
    { on: 'head', ellipse: [-2.4, -3.4, 1.2, 1.1] }, // the ear
  ],
  paint: [
    { color: 'BELLY', on: 'head', ellipse: [3.4, 0.8, 2, 1.3] },
    { color: 'BELLY', on: 'head', ellipse: [2, 3.8, 1.4, 0.7] },
    ...[-0.5, 2.5, 5.5].map((x) => ({ color: 'BROWN', on: 'spine', capsule: [x, -3.2, x - 0.6, -1, 0.6] })), // stripes
  ],
  top: fang(0),
  dots: [{ on: 'head', at: [3.6, 2.4] }, { on: 'head', at: [4.6, 2.4] }], // the open mouth
  legs: {
    hindFar: { on: 'hip', at: [1, 2.4], thigh: 2.6, shin: 2.6, r: 1, far: true, bend: 1 },
    frontFar: { on: 'chest', at: [1.5, 2.4], thigh: 2.6, shin: 2.6, r: 1, far: true, bend: -1 },
    hindNear: { on: 'hip', at: [0, 2.4], thigh: 2.6, shin: 2.6, r: 1.1, bend: 1 },
    frontNear: { on: 'chest', at: [1, 2.4], thigh: 2.6, shin: 2.6, r: 1.1, bend: -1 },
  },
  chains: {
    tail: { on: 'hip', at: [-3.7, -1.7], angle: 1.15, links: 2, length: 3, r: 1, stiffness: 600, damping: 16, weight: 60 },
  },
  face: { eye: [1, -1], nose: [5.2, 0.2] },
};

// lying low: the fangs shorter (its jaw on the ground)
const low = { joints: { hip: [8, 16.4], chest: [15, 16.4], head: [19.5, 15.2] }, torso: { r: 2.6, ends: 4.5 }, top: fang(-2),
  chains: { tail: { at: [-4.5, -0.8], angle: 1.8 } } };

export default { ...rig, poses: quadruped(rig, low) };
