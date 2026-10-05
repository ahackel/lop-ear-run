// The cheetah as a rig (see the cat, and kit.js): slim and long-legged, golden with black spots, black tear lines from
// its eyes, a long tail with dark rings and a white tip.
import { quadruped } from './kit.js';

const rig = {
  fur: 'CHEETAH',
  joints: { hip: [8, 10.8], chest: [15, 10.8], head: [19.6, 7.6] },
  torso: { r: 3, ends: 3 },
  shapes: [
    { on: 'chest', ellipse: [0.5, 0.4, 2.6, 2.8] },
    { on: 'head', ellipse: [0, 0, 3.3, 3.1] },
    { on: 'head', ellipse: [2.5, 1.4, 1.4, 1.1] }, // the muzzle
    { on: 'head', ellipse: [-2, -2.8, 1.1, 1.1] }, { on: 'head', ellipse: [1, -3.2, 1.1, 1.1] }, // the ears
  ],
  paint: [
    { color: 'BELLY', on: 'head', ellipse: [2.5, 1.4, 1.4, 1.1] },
    { color: 'BELLY', on: 'spine', ellipse: [5, 2.5, 4.5, 0.9] },
  ],
  dots: [
    ...[[-1, -2], [1.5, -2.5], [4, -2.2], [6.5, -1.7], [0.5, 0], [3, 0.1]].map((at) => ({ on: 'spine', at })), // spots
    { on: 'head', at: [1, 1] }, { on: 'head', at: [1.4, 1.7] }, { on: 'head', at: [0, 1.4], color: 'PINK' }, // the tear lines
  ],
  legs: {
    hindFar: { on: 'hip', at: [1, 2], thigh: 2.9, shin: 2.9, r: 0.77, far: true, bend: 1 },
    frontFar: { on: 'chest', at: [0.5, 2], thigh: 2.9, shin: 2.9, r: 0.77, far: true, bend: -1 },
    hindNear: { on: 'hip', at: [0, 2], thigh: 2.9, shin: 2.9, r: 0.85, bend: 1 },
    frontNear: { on: 'chest', at: [0, 2], thigh: 2.9, shin: 2.9, r: 0.85, bend: -1 },
  },
  chains: {
    // long and thin, swinging out behind for balance, ringed, its tip white
    tail: { on: 'hip', at: [-2.5, -0.8], angle: 1.1, links: 4, length: 8, r: 0.8, curl: -0.15, marks: [[0.45, 'OUT', 0], [0.7, 'OUT', 0], [1, 'BELLY', 0]], stiffness: 600, damping: 18, weight: 40 },
  },
  face: { eye: [0.9, -1], nose: [3.6, 1] },
};

const low = { joints: { hip: [8, 16.5], chest: [15, 16.5], head: [19.8, 15.6] }, torso: { r: 2.6, ends: 4.5 },
  chains: { tail: { at: [-4, -0.5], angle: 1.75, curl: 0 } } };

export default { ...rig, poses: quadruped(rig, low) };
