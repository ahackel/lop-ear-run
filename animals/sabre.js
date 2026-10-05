// The sabre-tooth cat as a rig (see the cat, and kit.js): a tiger's stripes, a big head, the mouth open, two long white
// fangs reaching below its chin (drawn on top), a short tail.
import { quadruped } from './kit.js';

const fang = (dy) => [{ color: 'BELLY', shapes: [{ on: 'head', capsule: [2.8, 1.8, 3.1, 5.8 + dy, 0.6] }] }];

// @build: the rig, edited in the workshop (tools/workshop.html), which rewrites what is between these lines
export const build = {
  fur: 'TAN',
  joints: { hip: [7.5, 11.2], chest: [14.5, 11.2], head: [19.4, 8.6] },
  torso: { r: 3.4, ends: 3.5 },
  shapes: [
    { name: 'chest', on: 'chest', ellipse: [0.5, -0.4, 3, 3.2] },
    { name: 'head', on: 'head', ellipse: [0, 0, 3.8, 3.5] },
    { name: 'muzzle', on: 'head', ellipse: [3.4, 0.8, 2, 1.3] },
    { name: 'jaw', on: 'head', ellipse: [2, 3.8, 1.6, 0.9] },
    { name: 'ear', on: 'head', ellipse: [-2.4, -3.4, 1.2, 1.1] },
  ],
  paint: [
    { name: 'muzzle', color: 'BELLY', on: 'head', ellipse: [3.4, 0.8, 2, 1.3] },
    { name: 'jaw', color: 'BELLY', on: 'head', ellipse: [2, 3.8, 1.4, 0.7] },
    { name: 'stripe', color: 'BROWN', on: 'spine', capsule: [-0.5, -3.2, -1.1, -1, 0.6] },
    { name: 'stripe', color: 'BROWN', on: 'spine', capsule: [2.5, -3.2, 1.9, -1, 0.6] },
    { name: 'stripe', color: 'BROWN', on: 'spine', capsule: [5.5, -3.2, 4.9, -1, 0.6] },
  ],
  top: [{ name: 'fang', color: 'BELLY', shapes: [{ on: 'head', capsule: [2.8, 1.8, 3.1, 5.8, 0.6] }] }],
  dots: [{ name: 'mouth', on: 'head', at: [3.6, 2.4] }, { name: 'mouth', on: 'head', at: [4.6, 2.4] }],
  legs: {
    hindFar: { on: 'hip', at: [1, 2.4], thigh: 2.6, shin: 2.6, r: 1, far: true, bend: 1 },
    frontFar: { on: 'chest', at: [1.5, 2.4], thigh: 2.6, shin: 2.6, r: 1, far: true, bend: -1 },
    hindNear: { on: 'hip', at: [0, 2.4], thigh: 2.6, shin: 2.6, r: 1.1, bend: 1 },
    frontNear: { on: 'chest', at: [1, 2.4], thigh: 2.6, shin: 2.6, r: 1.1, bend: -1 },
  },
  chains: { tail: { on: 'hip', at: [-3.7, -1.7], angle: 1.15, links: 2, length: 3, r: 1, stiffness: 600, damping: 16, weight: 60 } },
  face: { eye: [1, -1], nose: [5.2, 0.2] },
};
// @end

// the sabre with its moves, from its build
export const make = (rig) => {
  // lying low: the fangs shorter (its jaw on the ground)
  const low = { joints: { hip: [8, 16.4], chest: [15, 16.4], head: [19.5, 15.2] }, torso: { r: 2.6, ends: 4.5 }, top: fang(-2),
    chains: { tail: { at: [-4.5, -0.8], angle: 1.8 } } };

  return { ...rig, poses: quadruped(rig, low) };
};

export default make(build);
