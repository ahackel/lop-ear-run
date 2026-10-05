// The squirrel as a rig (see the cat, and kit.js): red, a tufted ear, a white belly, a big bushy tail curled up over its
// back.
import { quadruped, earsBack } from './kit.js';

const rig = {
  fur: 'STRIPE',
  joints: { hip: [9, 13], chest: [14, 13], head: [18.5, 9.6] },
  torso: { r: 3.6, ends: 3.5 },
  shapes: [
    { on: 'hip', ellipse: [0, 1.2, 3.8, 3.4] }, // the haunch
    { on: 'head', ellipse: [0, 0, 3.3, 3.1] },
    { on: 'head', ellipse: [2.8, 1.2, 1.7, 1.4] }, // the snout
  ],
  paint: [
    { color: 'BELLY', on: 'spine', ellipse: [5, 2.2, 4, 1.3] },
    { color: 'BELLY', on: 'head', ellipse: [2.5, 2, 1.6, 0.8] },
  ],
  legs: {
    hindFar: { on: 'hip', at: [0.5, 2.5], thigh: 1.6, shin: 1.6, r: 0.75, far: true, bend: 1 },
    frontFar: { on: 'chest', at: [1.5, 2], thigh: 1.8, shin: 1.8, r: 0.75, far: true, bend: -1 },
    hindNear: { on: 'hip', at: [-0.5, 2.5], thigh: 1.6, shin: 1.6, r: 0.85, bend: 1 },
    frontNear: { on: 'chest', at: [1, 2], thigh: 1.8, shin: 1.8, r: 0.85, bend: -1 },
  },
  chains: {
    // up from the rump and curling forward over the back, bushier toward its end
    tail: { on: 'hip', at: [-3, -1], angle: 0.42, links: 4, length: 9.2, r: [2.2, 2.6], curl: 0.45, stiffness: 600, damping: 22, weight: 50 },
    ear: { on: 'head', ear: [[-1.9, -2.4], [0.1, -3.2]], tip: [-1.5, -6.8], stiffness: 1400, damping: 22, weight: 60 },
  },
  face: { eye: [1, -0.8], nose: [4.5, 0.8] },
};

// lying low: the tail out flat behind
const low = { joints: { hip: [9.5, 16.4], chest: [14.5, 16.4], head: [19, 15.6] }, torso: { r: 2.6, ends: 4.5 },
  chains: { tail: { at: [-3.5, -0.5], angle: 1.75, curl: 0.05 }, ...earsBack(rig) } };

export default { ...rig, poses: quadruped(rig, low) };
