// The hedgehog as a rig (see the cat, and kit.js): a round spiky back, a cream face and belly, a pointed snout, a little
// round ear; short legs. (Its power, rolled up in a ball: still drawn, see DRAW in art.js.)
import { quadruped } from './kit.js';

const rig = {
  fur: 'BROWN',
  joints: { hip: [8, 11.3], chest: [14, 11.3], head: [18.5, 13] },
  torso: { r: 7.2, ends: 5.5 },
  shapes: [
    { on: 'spine', ellipse: [4, 4.2, 6, 2.5] }, // the belly
    { on: 'head', ellipse: [0, 0, 3.4, 3] },
    { on: 'head', capsule: [1.5, 1.4, 5.1, 1.8, 1.1] }, // the snout
  ],
  paint: [
    { color: 'EAR', on: 'head', ellipse: [0, 0, 3.4, 3] },
    { color: 'EAR', on: 'head', capsule: [1.5, 1.4, 5.1, 1.8, 1.1] },
    { color: 'EAR', on: 'spine', ellipse: [4.5, 5.1, 5, 1.3] },
  ],
  spikes: { on: 'spine', box: [-12, -12, 9, 3.7], speck: 'TAN' }, // (on its back: in front of the face, above the belly)
  top: [{ color: 'EAR', shapes: [{ on: 'head', ellipse: [-0.9, -3.4, 1.1, 1.1] }] }], // the ear
  legs: {
    hindFar: { on: 'hip', at: [1, 5.2], thigh: 1.2, shin: 1.2, r: 0.8, far: true, bend: 1 },
    frontFar: { on: 'chest', at: [1.5, 5.2], thigh: 1.2, shin: 1.2, r: 0.8, far: true, bend: -1 },
    hindNear: { on: 'hip', at: [0, 5.2], thigh: 1.2, shin: 1.2, r: 0.9, bend: 1 },
    frontNear: { on: 'chest', at: [1, 5.2], thigh: 1.2, shin: 1.2, r: 0.9, bend: -1 },
  },
  chains: {},
  face: { eye: [1, -0.6], nose: [5.5, 1.4] },
};

// lying low: flat, the spikes still up
const low = { joints: { hip: [8.5, 15.5], chest: [14.5, 15.5], head: [19.5, 16] }, torso: { r: 4, ends: 6 } };

export default { ...rig, poses: quadruped(rig, low) };
