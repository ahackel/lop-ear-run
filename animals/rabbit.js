// The rabbit as a rig (see the cat, and kit.js): round and compact, one lop ear in front, a cotton tail, a pink nose
// and blush. It hops (see stride in art.js): crouched on the ground, stretched out as it rises, gathered as it falls. Its
// body is a shape for each pose (no legs to bend); the head, its ear and its tail swing as the pose and the hop move them.
import { bump, wave } from './kit.js';

// a pose: the body's shapes (in the box), the head (its place), the tail's root
const pose = (shapes, head, tail, more = {}) => ({ ownShapes: true, torso: { r: 0 }, joints: { head }, shapes: [...shapes, ...HEAD], chains: { tail: { root: tail } }, ...more });
const HEAD = [{ on: 'head', ellipse: [0, 0, 4.5, 4.5] }, { on: 'head', ellipse: [3.5, 1.8, 2.5, 2.2] }];
const e = (x, y, rx, ry) => ({ ellipse: [x, y, rx, ry] }), c = (ax, ay, bx, by, r) => ({ capsule: [ax, ay, bx, by, r] });

const crouch = (b = 0) => pose([e(9.5, 13.5 - b, 7, 5 + b), e(7.5, 15, 5, 4), e(8.5, 18.4, 4.5, 1.4), c(14.5, 14, 15, 18.3, 1.2)], [15.5, 9 - b * 0.6], [2.2, 12.5]);
const stretch = pose([c(6.5, 12.5, 12, 10.5, 4.3), c(5, 14.5, 1.5, 17.5, 1.5), c(15, 12, 19, 15, 1.1)], [16.5, 7.5], [1.7, 10.5]);
const gathered = pose([e(10, 12.5, 7, 5), c(8, 16, 12.5, 17.5, 1.5), c(15, 12.5, 16.5, 17.3, 1.1)], [16, 8], [2.2, 11]);
const LOW = [{ on: 'head', ellipse: [0, 0, 4, 3.4] }, { on: 'head', ellipse: [3.3, 1.1, 2, 1.7] }];
const duck = (f) => ({ ...pose([e(10, 16, 8.5, 3.3), e(f ? 6 : 8.5, 18.8, 3.5, 1.1), c(17, 18, f ? 20.5 : 19.5, 18.8, 1)], [17.5, 15.5], [1.5, 15]), shapes: [e(10, 16, 8.5, 3.3), e(f ? 6 : 8.5, 18.8, 3.5, 1.1), c(17, 18, f ? 20.5 : 19.5, 18.8, 1), ...LOW] });
const ko = { ...pose([], [18.5, 16.5], [2.2, 16]), dots: [], shapes: [e(11, 16.5, 8, 3.2), c(8, 14, 6, 10.5, 1.3), c(13.5, 14, 14.5, 11, 1.1), ...LOW] };

// sitting about, t (0…1) through an 8 s loop: crouched, breathing, its nose twitching now and then, once it sits up tall
// to look about
const idle = (t) => {
  const tall = bump(t, 0.45, 0.7, 0.06), twitch = (bump(t, 0.1, 0.2, 0.01) + bump(t, 0.8, 0.88, 0.01)) * (wave(t, 60) > 0 ? 1 : 0);
  const p = crouch(0.25 * wave(t, 4) + tall * 1.2);
  return { ...p, shapes: [...p.shapes.slice(0, -1), { on: 'head', ellipse: [3.5, 1.8 - twitch * 0.5, 2.5, 2.2] }], headAngle: -0.15 * tall };
};

export default {
  fur: 'FUR',
  joints: { hip: [7, 13], chest: [14, 13], head: [15.5, 9] }, // (the hip and chest: only for the tail's frame)
  torso: { r: 0 },
  shapes: HEAD,
  legs: {},
  dots: [{ on: 'head', at: [2.5, 2], color: 'PINK' }], // a blush
  chains: {
    tail: { on: 'hip', at: [0, 0], angle: 1.2, links: 1, length: 0.5, r: 2.3, stiffness: 900, damping: 16, weight: 80 },
    // the lop ear: hanging back from the top of its head, a spoon at its end, in front; loose, so it flops as it hops
    ear: { on: 'head', at: [-2, -3], angle: 2.7, links: 2, length: 5.6, r: 1.4, end: 2.1, color: 'EAR', front: true, stiffness: 240, damping: 8, weight: 140 },
  },
  face: { eye: [1.5, -1], nose: [4.5, 1], noseColor: 'PINK' },
  poses: {
    run: [crouch(), stretch, gathered], // (the hop's frames: see stride)
    jump: [stretch, gathered],
    duck: [duck(0), duck(1)],
    hurt: [crouch()],
    ko: [ko],
    idle: { frames: 80, fps: 10, at: idle },
  },
};
