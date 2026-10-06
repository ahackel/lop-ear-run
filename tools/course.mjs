// What the courses are like (level.js), for the tests and for tuning: node tools/course.mjs prints, for every animal
// and day, how fast, how close, how much food, and where even a player who eats everything runs out of energy.
//   playThrough(kind, days, chase) → null (it can be got past) | { s, near } (nothing gets past, s points in)
//   days(kind, n) → [{ day, speed, every, sees, food, drain }]    starves(kind) → the day energy runs out, eating all
//   courseOf(kind, s) → the pieces up to s points (to compare)
import { GROUND, FOOT, W, JUMP, GRAVITY, ANIMALS, hitbox, stride, jumpFrame, hits } from '../art.js';
import { course, pace, drain, nightAt, dayOf, CHASE, SCORE_PER_PX } from '../level.js';

const RUN_X = 30, JUMP_CUT = 140, MEAL = 12, POWER_SECS = 8, DT = 1 / 60;

export function courseOf(kind, s) {
  const c = course(kind), out = [];
  for (let p = c.next(); p.at * SCORE_PER_PX < s; p = c.next()) out.push(p);
  return out;
}

// every frame of a move, one on the other: what the animal could run into, in any of them
function union(sprites) {
  const x0 = Math.min(...sprites.map((s) => s.ox || 0)), y0 = Math.min(...sprites.map((s) => s.oy || 0));
  const w = Math.max(...sprites.map((s) => (s.ox || 0) + s.w)) - x0, h = Math.max(...sprites.map((s) => (s.oy || 0) + s.h)) - y0;
  const mask = new Uint8Array(w * h);
  for (const s of sprites) for (let i = 0; i < s.mask.length; i++) if (s.mask[i]) mask[(Math.floor(i / s.w) + (s.oy || 0) - y0) * w + (i % s.w) + (s.ox || 0) - x0] = 1;
  return { w, h, ox: x0, oy: y0, mask };
}
function shapes(kind) {
  const frames = (move) => [...new Set([...Array(64).keys()].map((i) => stride(kind, i / 64, move).frame))].map((f) => hitbox(kind, move, f));
  const jumps = [...new Set([-1.5, -1, -0.5, 0, 0.5, 1].map((r) => jumpFrame(kind, r)))].map((f) => hitbox(kind, 'jump', f));
  return { run: union(frames('run')), duck: union(frames('duck')), jump: union(jumps) };
}

// A player who never misses, on a course: every way to press (jump, held or let go, duck, stand), every other frame,
// played at once (the same states as one). Any one getting through is enough.
export function playThrough(kind, days, chase = 1, every = 6) {
  const a = ANIMALS[kind], body = shapes(kind), c = course(kind), end = nightAt(kind, days).to;
  let ahead = c.next(), dist = 0, time = 0, frame = 0;
  const obstacles = [];
  let states = [{ alt: 0, v: 0, duck: false, held: false }];
  while (dist * SCORE_PER_PX < end) {
    const v = pace(kind, dist) * chase, dx = v * DT;
    time += DT;
    while (dist >= ahead.at) { for (const it of ahead.items) obstacles.push({ ...it, x: W - (dist - ahead.at) + it.dx }); ahead = c.next(); }
    const choose = frame++ % every === 0, next = new Map();
    for (const st of states) {
      const options = !choose ? [st] : st.alt === 0
        ? [{ ...st, duck: false, held: false }, { ...st, duck: true, held: false }, { ...st, duck: false, held: true, v: JUMP * a.jump }]
        : [st, ...(st.held ? [{ ...st, held: false, v: Math.min(st.v, JUMP_CUT) }] : []), { ...st, held: false, duck: true, v: Math.min(st.v, JUMP_CUT) }];
      for (const o of options) {
        let { alt, v: vy } = o;
        if (alt > 0 || vy > 0) {
          vy -= GRAVITY * a.gravity * (o.duck ? 3 : 1) * DT;
          alt += vy * DT;
          if (alt <= 0) { alt = 0; vy = 0; }
        }
        const n = { alt, v: vy, duck: o.duck, held: o.held && alt > 0 };
        const key = `${alt.toFixed(2)} ${vy.toFixed(1)} ${n.duck} ${n.held}`;
        if (!next.has(key)) next.set(key, n);
      }
    }
    for (const o of obstacles) o.x -= dx + o.fly * DT;
    for (let i = obstacles.length - 1; i >= 0; i--) if (obstacles[i].x < -40) obstacles.splice(i, 1);
    const near = obstacles.filter((o) => o.x < RUN_X + 40 && o.x + o.sprite.w > RUN_X - 10);
    states = [...next.values()].filter((st) => {
      const sp = st.alt > 0 ? body.jump : st.duck ? body.duck : body.run, y = GROUND - FOOT - st.alt;
      return !near.some((o) => hits(sp, RUN_X, y, o.sprite, o.x, o.y));
    });
    if (!states.length) return { s: Math.floor(dist * SCORE_PER_PX), near: near.map((o) => `${o.kind}${o.duck ? ' (duck)' : o.over ? ' (over)' : ''} ${o.sprite.w}×${o.sprite.h} at ${o.x.toFixed(0)}`) };
    dist += dx;
  }
  return null;
}

// the days of a run, on average: how fast (px/s), an obstacle every so many seconds, each on the screen for so long
// before it reaches the animal, food a second (it comes with), energy lost a second
export function days(kind, n) {
  const pieces = courseOf(kind, nightAt(kind, n).to), out = [];
  for (let d = 1; d <= n; d++) {
    const ps = pieces.filter((p) => dayOf(kind, p.at * SCORE_PER_PX) === d);
    let secs = 0;
    for (let i = 1; i < ps.length; i++) secs += (ps[i].at - ps[i - 1].at) / pace(kind, ps[i].at);
    const speed = ps.reduce((t, p) => t + pace(kind, p.at), 0) / ps.length;
    const foods = ps.reduce((t, p) => t + p.food.filter((f) => !f.sly).length, 0);
    out.push({ day: d, speed: Math.round(speed), every: secs / (ps.length - 1), sees: (W - RUN_X) / speed, food: foods / secs, drain: drain(kind, ps[Math.floor(ps.length / 2)].at * SCORE_PER_PX) });
  }
  return out;
}

// where energy runs out for a player who eats that much of the food (1: all), and every golden one (8 s without losing
// any), and is never bumped: the day (with a fraction), or null if not within 12 days
export function starves(kind, eats = 1) {
  const end = nightAt(kind, 12).to, c = course(kind);
  let energy = 100, prev = c.next(), rest = 0, ate = 0;
  for (let p = c.next(); p.at * SCORE_PER_PX < end; prev = p, p = c.next()) {
    const s = prev.at * SCORE_PER_PX, n = nightAt(kind, dayOf(kind, s)), v = pace(kind, prev.at) * (s >= n.hunt ? CHASE : 1);
    let secs = (p.at - prev.at) / v;
    const free = Math.min(rest, secs); rest -= free; secs -= free;
    energy -= drain(kind, s) * secs;
    if (energy <= 0) return Math.round(((s / (nightAt(kind, 1).to)) + 1) * 10) / 10;
    for (const f of prev.food) if (!f.sly && (ate += eats) >= 1) { ate--; energy = Math.min(100, energy + MEAL); }
    if (prev.gold) rest += POWER_SECS;
  }
  return null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const kind of Object.keys(ANIMALS)) {
    console.log(`${kind.padEnd(9)} runs out of energy on day ${starves(kind) ?? '12+'} eating everything, ${starves(kind, 0.8) ?? '12+'} eating 4 in 5`);
    for (const d of days(kind, 6)) console.log(`  day ${d.day}: ${d.speed} px/s, an obstacle every ${d.every.toFixed(2)} s (seen ${d.sees.toFixed(2)} s), food ${(d.food * MEAL).toFixed(1)}/s vs ${d.drain.toFixed(1)}/s`);
  }
}
