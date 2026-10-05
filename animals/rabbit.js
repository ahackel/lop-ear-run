// The rabbit as a rig (see the cat, and kit.js): round and compact, one lop ear in front, a cotton tail, a pink nose and
// blush; long hind feet, short front legs. It hops (a leap: see leapPose in art.js): crouched on the ground, gathered,
// pushing off with its hind feet, stretched out as it rises, reaching for the ground as it falls.
import { crawl, ko, bump, wave } from './kit.js';

const HEAD = [{ on: 'head', ellipse: [0, 0, 4.5, 4.5] }, { on: 'head', ellipse: [3.5, 1.8, 2.5, 2.2] }]; // (the muzzle)

const rig = {
  fur: 'FUR',
  joints: { hip: [7, 13.5], chest: [12, 13.5], head: [15.5, 9] },
  torso: { r: 5, ends: 4.5 },
  shapes: [{ on: 'hip', ellipse: [0.5, 1.5, 5, 4] }, ...HEAD], // the haunch, the head
  dots: [{ on: 'head', at: [2.5, 2], color: 'PINK' }], // a blush
  legs: {
    // the hind leg: its thigh in the haunch, its long foot from the heel (the knee here) to the toe
    hindNear: { on: 'hip', at: [0, 2], thigh: 4, shin: 6.5, r: 1.3, bend: 1 },
    frontNear: { on: 'chest', at: [2.5, 0.5], thigh: 2.3, shin: 2.3, r: 1.2, bend: -1 },
  },
  chains: {
    tail: { on: 'hip', at: [-4.7, -1], angle: 1.2, links: 1, length: 0.5, r: 2.3, stiffness: 900, damping: 16, weight: 80 },
    // the lop ear: hanging back from the top of its head, a spoon at its end, in front; loose, so it flops as it hops
    ear: { on: 'head', at: [-2, -3], angle: 2.7, links: 2, length: 5.6, r: 1.4, end: 2.1, color: 'EAR', front: true, stiffness: 240, damping: 8, weight: 140 },
  },
  face: { eye: [1.5, -1], nose: [4.5, 1], noseColor: 'PINK' },
};

// crouched on the ground: the foot flat, the front paws down
const crouched = { paws: { hindNear: [11, 18.4], frontNear: [15, 18.4] } };
// lying low: long and flat
const low = { joints: { hip: [7.5, 16], chest: [12.5, 16], head: [17.5, 15.5] }, torso: { r: 3.3, ends: 6 },
  chains: { tail: { at: [-5.5, -0.5], angle: 1.5 } } };

// the hop: long and slow (rate: 0.6 of the usual strides), on the ground for the first quarter of it, then 6 high
const run = { gait: { leap: true, rate: 0.6, frames: 12, land: 0.25, height: 6, stretch: 1.5, gather: 1, crouch: 0.6, pitch: 1.2, ground: 18.4, legs: {
  hindNear: { down: [0, 0.25], at: [4, 2], air: [-14, -1.5] }, frontNear: { down: [0.92, 0.25], at: [0.5, -0.5], air: [4.5, -3] },
} } };

// sitting about, t (0…1) through an 8 s loop: crouched, breathing, its nose twitching now and then; once it sits up tall
// to look about
const idle = (t) => {
  const b = 0.3 * wave(t, 4), tall = bump(t, 0.45, 0.7, 0.06), twitch = (bump(t, 0.1, 0.2, 0.01) + bump(t, 0.8, 0.88, 0.01)) * (wave(t, 60) > 0 ? 0.5 : 0);
  return { ...crouched, ownShapes: true, shapes: [rig.shapes[0], HEAD[0], { on: 'head', ellipse: [3.5, 1.8 - twitch, 2.5, 2.2] }],
    joints: { hip: [7, 13.5], chest: [12, 13.5 - 2 * tall - b * 0.3], head: [15.5 - 0.5 * tall, 9 - 2.5 * tall - b * 0.5] }, torso: { r: 5 + b }, headAngle: -0.15 * tall };
};

export default { ...rig, poses: {
  run,
  jump: [ // rising, stretched out, the foot trailing; falling, gathered, reaching for the ground
    { joints: { hip: [7, 14.5], chest: [12, 12.3], head: [15.5, 7.8] }, paws: { hindNear: [0, 17.6], frontNear: [19, 15] } },
    { joints: { hip: [7.5, 12.8], chest: [12, 14], head: [16, 9.5] }, paws: { hindNear: [11.5, 17.6], frontNear: [16.5, 17.8] } },
  ],
  duck: crawl(rig, low, { bob: 0.2, legs: { hindNear: [0, 1], frontNear: [0.5, 2.5] } }), // (its round back barely rolling)
  hurt: [crouched],
  ko: [{ ...ko(rig, low), dots: [] }],
  idle: { frames: 80, fps: 10, at: idle },
} };
