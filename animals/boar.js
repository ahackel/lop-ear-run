// The boar as a rig (see the cat, and kit.js): dark and stocky, bristles along its back, a pink snout, little white
// tusks, a pointed ear, a thin tail.
import { quadruped, earsBack } from './kit.js';

// @build: the rig, edited in the workshop (tools/workshop.html), which rewrites what is between these lines
export const build = {
  fur: 'BOAR',
  joints: { hip: [8, 11.8], chest: [15, 11.8], head: [18.3, 11.2] },
  torso: { r: 4.8, ends: 3.8 },
  shapes: [{ name: 'head', on: 'head', ellipse: [0, 0, 3.9, 3.8] }, { name: 'snout', on: 'head', ellipse: [4, 1.4, 1.9, 1.9] }],
  paint: [{ name: 'snout', color: 'SNOUT', on: 'head', ellipse: [4, 1.4, 1.9, 1.9] }],
  dots: [
    { name: 'nostril', on: 'head', at: [4.3, 1.2] },
    { name: 'tusk', on: 'head', at: [2.7, 3.4], color: 'BELLY' },
    { name: 'tusk', on: 'head', at: [3.5, 2.7], color: 'BELLY' },
  ],
  spikes: { on: 'spine', box: [-12, -12, 9, -1.8] },
  legs: {
    hindFar: { on: 'hip', at: [1, 4], thigh: 1.45, shin: 1.45, r: 0.9, far: true, bend: 1 },
    frontFar: { on: 'chest', at: [0.5, 3.7], thigh: 1.6, shin: 1.6, r: 0.9, far: true, bend: -1 },
    hindNear: { on: 'hip', at: [0, 4], thigh: 1.45, shin: 1.45, r: 1, bend: 1 },
    frontNear: { on: 'chest', at: [0, 3.7], thigh: 1.6, shin: 1.6, r: 1, bend: -1 },
  },
  chains: {
    tail: { on: 'hip', at: [-3.6, -1.8], angle: 1.33, links: 2, length: 3.4, r: 0.6, stiffness: 500, damping: 14, weight: 60 },
    ear: { on: 'head', ear: [[-2.9, -3], [-0.1, -3.7]], tip: [-2.4, -7.8], stiffness: 1400, damping: 22, weight: 60 },
  },
  face: { eye: [0.5, -1.3] },
};
// @end

// the boar with its moves, from its build
export const make = (rig) => {
  const low = { joints: { hip: [8, 16.2], chest: [15, 16.2], head: [18.8, 15.7] }, torso: { r: 3, ends: 4.5 },
    chains: { tail: { at: [-4, -1], angle: 1.6 }, ...earsBack(rig) } };

  return { ...rig, poses: quadruped(rig, low) };
};

export default make(build);
