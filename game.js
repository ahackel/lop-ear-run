// Lop Hop: a rabbit (then a cat, a dog, a fox) runs, jumps cacti and ducks under branches and crows. A small game
// that drives the Stardrift engine the way a game would: one mood for each state of play, stingers for its events.
//
//   menu       the title                      go         a run starts
//   highscore  the high scores                jump       the animal jumps
//   relaxed    knocked out                    reward     food
//   exploring  the first stretch              bump       it runs into something
//   tension    once crows fly in (300)        smash      a super power smashes something
//   action     once the run is fast (700)     dusk, dawn night falls, and ends
//   wonder     as night falls                 chased     the next animal gives chase (each night)
//   danger     while the next animal chases   escape     … and is left behind at dawn
//              it (the fox: a wolf)           discovery  … the first time: it is unlocked
//   power      while a super power lasts      record     past the best score so far
//                                             alert      knocked out (fanfare: into the high scores)
//                                             power, powerdown   golden food gives one, and it wears off
import { StardriftPlayer, openSongZip } from './engine/src/index.js'; // (by path: Safari before 16.4 knows no import maps)
import { songFor } from './music.js';
import { W, H, GROUND, PALETTES, COLOR, FOOT, ANIMALS, TRUNK, animal, moveBody, stride, bird, crow,
  FOOD, face, FACE_W, cloud, moon, heart, star, golden, text, textWidth, hits, snap, setScale, idleFrame, jumpFrame, leaps, hitbox, readying,
  JUMP, GRAVITY, hill, strides, rgb, luma } from './art.js';
import { course, pace, drain, hardness, nightAt, landOf, random, seedOf, SCORE_PER_PX, CROWS_FROM, FAST_FROM, CHASE } from './level.js';
import { ease } from './animals/kit.js';
import { BUILT, ENGINE } from './version.js';

const view = document.getElementById('game'), vctx = view.getContext('2d');
let ctx = vctx; // (the screen, in art pixels scaled up, see fit; for a moment the second palette's canvas, see draw)

// ------------------------------------------------------------------------------------------------------------- tuning
// (what comes, how fast, how tiring: level.js)
const JUMP_CUT = 140; // a held jump rises to about 36 px (see JUMP in art.js), a tap to about 12
const BUFFER = 0.12; // seconds: a jump pressed this early (in the air, before it lands) jumps as it lands
let RUN_X = 30; // (where the animal runs: right of a notch, see fit)
// A run is days and nights (see level.js: a day's run, a night's, where the chaser comes), getting dark over TWILIGHT
// seconds (and light again after dawn); the next animal chases the animal till dawn. It runs at CRUISE_X; a bump brings
// it closer, and it falls back in RECOVER seconds; a second bump before it is back lets it catch the animal (at
// CATCH_X). Getting away at dawn unlocks it (the first time). It all gets harder as the run goes on (level.js), and
// the chaser takes longer to fall back (DAY_RECOVER more seconds a day of hardness, up to the sixth).
const TWILIGHT = 10, CRUISE_X = -8, CATCH_X = 6, RECOVER = 5, DAY_RECOVER = 2, ESCAPE = 100;
const BUMP = 30, MEAL = 12, SAFE_SECS = 1.5; // energy (of 100): lost per bump; won per food; blinking after a bump
const FEAST = 4; // food eaten one after another (no bump, none missed) is worth 25 more each time, up to this many times 25
// golden food (the first after 250 points, then about every half minute) gives a super power for 8 seconds, each animal its
// own: its name, and what it does (smashes: what it runs into tumbles away; bounces: off it; passes: through it; clears:
// what is ahead is blown away; boost: runs that much faster; doubles: scores double; shakes off the chaser, saying so).
// The rest, where it happens (the kind's own checks)
const POWER_SECS = 8; // (where golden food comes: level.js)
const POWERS = {
  rabbit: { name: 'SUPER HOP!' }, // jumps higher, and once more in the air
  guineapig: { name: 'POPCORN!' }, // hops by itself (see autopilot), and for joy
  cat: { name: 'NINE LIVES!', bounces: true }, // bumps cost nothing
  dog: { name: 'ZOOMIES!', boost: 1.3, smashes: true },
  pig: { name: 'TRUFFLE SNOUT!' }, // what is ahead turns into truffles
  fox: { name: 'SLY FOX!', shakes: 'LOST YOU!' }, // food comes to it
  hedgehog: { name: 'SPIKE BALL!', smashes: true }, // rolled up
  squirrel: { name: 'GLIDE!' }, // falls slowly, and jumps again in the air
  otter: { name: 'BELLY SLIDE!', smashes: true }, // slides under what hangs low
  skunk: { name: 'STINK!', passes: true, shakes: 'PHEW!' }, // obstacles fade, crows flee
  wolf: { name: 'HOWL!', clears: true },
  boar: { name: 'TUSK CHARGE!', boost: 1.35, smashes: true }, // (worth double)
  bear: { name: 'BERRY RUSH!', doubles: true }, // and food fills it twice as much
  yak: { name: 'STAMPEDE!', smashes: true, shakes: 'EEK!' }, // a herd runs by, trampling what is ahead
  ostrich: { name: 'FLY!' }, // it keeps flying while the jump is held
  cheetah: { name: 'SPRINT!', boost: 1.6, passes: true },
  dromedary: { name: 'SPIT!' }, // what flies or hangs is knocked away
  rhino: { name: 'QUAKE!', clears: true }, // stomps: everything on the screen flies off
  gorilla: { name: 'CHEST DRUM!' }, // ducking drums: the next obstacle is knocked over
  elephant: { name: 'SPLASH!', clears: true }, // sprays water from its trunk
  dino: { name: 'GIANT DINO!', passes: true, doubles: true }, // twice as big: it tramples everything
};
const powered = () => (power > 0 ? POWERS[kind] : {}); // the super power on now (none: {})
const T = () => ANIMALS[kind]; // the animal's dials (see art.js)
const Q = new URLSearchParams(location.search); // (the address's switches: ?auto, ?fps, ?all, ?scale)

// what this browser keeps (localStorage, lop.<name>; in a private window perhaps nothing): get, set (null: removed)
const kept = (k) => { try { return localStorage.getItem(`lop.${k}`); } catch { return null; } };
const keptJSON = (k) => { try { return JSON.parse(kept(k)); } catch { return null; } };
const keep = (k, v) => { try { if (v === null) localStorage.removeItem(`lop.${k}`); else localStorage.setItem(`lop.${k}`, v); } catch { /* no storage */ } };

// --------------------------------------------------------------------------------------------------------- the music
const music = new StardriftPlayer();
const song = fetch('song.zip').then((r) => r.arrayBuffer()); // the song and the recordings it plays (the editor's Export for a game)
let tunes = null, playing = null; // the song and its recordings, unzipped (each animal plays it its own way: music.js); whose plays
let audio = 'off'; // off | starting | on
let muted = kept('muted') === '1';
let mood = null;
const calls = []; // the last calls to the music, newest first, as game code would write them

function call(name, ...args) {
  calls.unshift(`music.${name}(${args.map((a) => JSON.stringify(a).replace(/"/g, "'").replace(/'(\w+)':/g, '$1: ')).join(', ')})`);
  calls.length = Math.min(calls.length, 5);
  if (audio === 'on') music[name](...args);
  callsShown = false;
}

// the first key or tap starts the audio (browsers need a user gesture for it)
async function startAudio() {
  if (audio !== 'off' || state === 'run') return; // (not from a jump or a duck: a start that failed is tried again after the run)
  audio = 'starting';
  try {
    await music.init();
    const { song: base, read } = await openSongZip(await song);
    tunes = { base, read }; playing = kind;
    music.load(songFor(base, kind), { seed: Math.floor(Math.random() * 1e6), read });
    music.setVolume(muted ? 0 : 1, 0);
    await music.play();
    audio = 'on';
    music.setMood(mood || 'relaxed', { within: 0 });
  } catch (err) {
    audio = 'off';
    status.textContent = `no music: ${err.message}`;
  }
}

// which mood the game is in: the music follows it
function wantedMood() {
  if (board) return board.credits ? 'menu' : 'highscore';
  if (state === 'title') return 'menu';
  if (state !== 'run') return 'relaxed';
  if (power) return 'power';
  if (chase) return 'danger';
  if (night) return 'wonder';
  return far() < CROWS_FROM ? 'exploring' : far() < FAST_FROM ? 'tension' : 'action';
}
function updateMood(options) {
  const m = wantedMood();
  if (m === mood) return;
  mood = m;
  if (options) call('setMood', m, options); else call('setMood', m);
  showMood();
}

// ----------------------------------------------------------------------------------------------------------- state
let state = 'title'; // title | run | ko | paused
let kind = 'rabbit'; // (the one picked last: see the high scores, which unlock the fox)
let speed, dist, bonus, alt, vAlt, ducking, phase, obstacles, food, parts, floats;
let track, ahead, chase, night, hunted, dark, day, koT, streak, duckHeld, queued, jumpHeld, koWhy, blinkT, flash, hundreds, energy, safe, hurtT, slow, power, gold, airJumps, quake, shake = 0;
let herd, herdT, spits, spitT, drumT; // the yak's stampede (the herd running by), the dromedary's spit (in flight), the gorilla's drumming
const CLOUDS = [{ x: 60, y: 14 }, { x: 170, y: 28 }, { x: 260, y: 10 }];
let clouds, sky, hillX, groundX; // the clouds, where the next comes from, how far the hills and the ground have gone (as they were, every run)
let fresh = null; // a knock-out's new entry in the high scores, to name
let beat = 0; // the best score when the run started (0: passed, or none to pass)
const far = () => Math.floor(dist * SCORE_PER_PX); // how far the run went: when night, crows, the chase come
const score = () => Math.floor(dist * SCORE_PER_PX * T().mult + bonus); // what it scores: harder animals count more
const rnd = Math.random; // (for what only looks: sparks, dust; what comes is level.js's, the same every run)
const AUTO = Q.has('auto'); // ?auto: the animal runs by itself (to hear the moods)

function reset() {
  dist = 0; speed = pace(kind, 0); bonus = 0; alt = 0; vAlt = 0; phase = 0;
  ducking = duckHeld = jumpHeld = false; queued = 0; streak = 0;
  obstacles = []; food = []; parts = []; floats = [];
  track = course(kind); ahead = track.next(); chase = null; night = hunted = false; dark = 0; day = 1; flash = 0; hundreds = 0;
  energy = 100; safe = 0; hurtT = 0; slow = 0; koT = 0;
  power = 0; gold = null; airJumps = 0; quake = 0;
  herd = []; herdT = 0; spits = []; spitT = 0; drumT = 0;
  sky = random(seedOf(kind) ^ 0x5c1e5); hillX = groundX = 0; // (the clouds too: as they were)
  clouds = CLOUDS.map((c) => ({ ...c }));
}
reset();
blinkT = 0;

function start() {
  gained = null;
  beat = best(); // the best so far: passing it plays a fanfare
  if (kind === newKind) { newKind = null; keep('new', null); } // (no longer new)
  reset();
  state = 'run';
  updateMood();
  call('sting', 'go');
  banner('DAY 1', 30); banner(landOf(1).name, 38);
}

function choose(k) {
  if (inRun() || !ANIMALS[k] || !unlocked(k)) return;
  pick(k);
  if (state === 'ko') { gained = null; reset(); state = 'title'; }
}
const pick = (k) => { kind = k; keep('animal', k); songOf(k); }; // (kept for the next visit)
// the animal's own song (the same song, played its way: music.js), never abruptly: the one playing fades out over
// SONG_FADE seconds, then the new one starts from its beginning, in the mood the game is in. Picked again meanwhile:
// the last one picked (the one playing: it comes back)
const SONG_FADE = 1;
let wanted = null, switching = false;
function songOf(k) {
  wanted = k;
  if (!tunes || switching || playing === k) return;
  switching = true;
  if (!muted) music.setVolume(0, SONG_FADE * 0.7); // (a curve: all but silent by the end)
  setTimeout(() => {
    switching = false;
    if (wanted !== playing) {
      playing = wanted;
      music.load(songFor(tunes.base, playing), { read: tunes.read, restart: true });
      if (mood) music.setMood(mood, { within: 0 });
    }
    music.setVolume(muted ? 0 : 1, 0.05);
  }, muted ? 0 : SONG_FADE * 1000);
}
const inRun = () => state === 'run' || state === 'paused';
const KINDS = Object.keys(ANIMALS);
const renamed = (k) => (k === 'sabre' ? 'elephant' : k); // (kept in this browser under an animal's old name: the sabre-tooth became the elephant)
// the next animal one way or the other, from k, among those that can be played
const nextKind = (k, d) => { let i = KINDS.indexOf(k); do i = (i + d + KINDS.length) % KINDS.length; while (!unlocked(KINDS[i])); return KINDS[i]; };
const chooseNext = (d) => choose(nextKind(kind, d));
const playable = () => KINDS.filter(unlocked); // the ones on the title (the others stay a surprise)

// The animals come one by one: a run starts with the rabbit, chased by the cat at night; getting away from it till dawn
// unlocks it (lop.unlocked, in this browser). The fox, last, is chased by a wolf.
const chaserOf = (k) => KINDS[KINDS.indexOf(k) + 1] || 'rabbit'; // (the dino, last, by the rabbit)
let open = ['rabbit'];
{ // (every one before the furthest unlocked: the newer animals came in between the others)
  const u = keptJSON('unlocked'), far = Array.isArray(u) ? Math.max(0, ...u.map(renamed).map((k) => KINDS.indexOf(k))) : 0;
  open = KINDS.slice(0, far + 1);
}
const FPS = Q.has('fps'); // ?fps: frames a second, and the work of a frame (to check a device)
const ALL = Q.has('all'); // ?all: every animal open, for this visit (nothing saved)
function unlocked(k) { return ALL || open.includes(k); }
// the one unlocked last: in this run (gained: after the knock-out and the high scores, the title, to pick it there) and
// until played (newKind, marked NEW on the title)
let gained = null, newKind = null;
const keptKind = (name) => { const k = renamed(kept(name)); return ANIMALS[k] && unlocked(k) ? k : null; };
newKind = keptKind('new');
kind = keptKind('animal') || kind;
function unlock(k) {
  open.push(k);
  gained = newKind = k;
  keep('unlocked', JSON.stringify(open)); keep('new', k);
  call('sting', 'discovery');
  banner(`${ANIMALS[k].name} UNLOCKED!`, 30, 2.5);
}
// words in the middle of the screen for a while, standing (rise: or rising)
const banner = (text, y, life = 2, rise = 0) => floats.push({ text, x: W / 2 - textWidth(text) / 2, y, life, rise });

// home: back to the title, from wherever (a run is given up)
function goHome() {
  if (board) closeScores();
  if (state === 'title') return;
  if (state === 'paused' && audio === 'on') music.play();
  fresh = null;
  gained = null; // (the new one waits on the title, marked NEW, to be picked)
  reset();
  state = 'title';
  fingers.clear();
  updateMood({ within: 0 });
}

// a bump costs energy and leaves the animal blinking (safe) for a moment; with none left it is knocked out
function bump(o) {
  if (powered().smashes) return smash(o);
  if (powered().bounces) { // nine lives: it bounces off, no harm done
    safe = 0.4; vAlt = Math.max(vAlt, 220);
    floats.push({ text: 'BOING!', x: RUN_X, y: animalY() - 6, life: 0.6 });
    call('sting', 'jump');
    return;
  }
  if (!power) energy = Math.max(0, energy - BUMP * T().bump); // (a super power keeps the energy)
  streak = 0;
  safe = SAFE_SECS; hurtT = 0.35; slow = 1;
  if (chase && !chase.leaving) { if (chase.heat > 0.05) chase.catching = true; chase.heat = 1; } // the chaser closes in
  if (alt === 0) vAlt = 150; // knocked up a little
  const [hx, hy] = headAt();
  for (let i = 0; i < 7; i++) parts.push({ x: hx, y: hy, vx: (rnd() - 0.3) * 120, vy: -40 - rnd() * 80, life: 0.5, color: COLOR.YELLOW });
  if (energy <= 0) { speed = -70; return knockOut('KNOCKED OUT!'); } // thrown back from what it ran into
  floats.push({ text: 'OUCH!', x: hx - 8, y: hy - 6, life: 0.7 });
  call('sting', 'bump');
}

// zoomies: what the dog runs into tumbles away (and is worth 10)
function smash(o, quiet = false) {
  const worth = kind === 'boar' ? 20 : 10;
  o.smashed = true; o.vx = 90 + rnd() * 60; o.vy = -140 - rnd() * 60;
  bonus += worth;
  floats.push({ text: `+${worth}`, x: o.x, y: Math.max(8, o.y) - 4, life: 0.6 });
  for (let i = 0; i < 6; i++) parts.push({ x: o.x + o.sprite.w / 2, y: Math.max(o.y, GROUND - 12), vx: (rnd() - 0.2) * 120, vy: -40 - rnd() * 80, life: 0.4, color: kind === 'elephant' ? COLOR.ICE : COLOR.YELLOW });
  if (!quiet) call('sting', 'smash');
}

// golden food: a super power, for a while
function startPower() {
  power = POWER_SECS; airJumps = 0;
  call('sting', 'power');
  updateMood({ within: 0 });
  banner(POWERS[kind].name, 28, 1.6, 12);
  sparkle(16, 140);
  if (powered().shakes && chase && !chase.leaving) { chase.leaving = true; floats.push({ text: powered().shakes, x: safeL + 4, y: GROUND - 32, life: 1.2 }); }
}
// golden sparks around the animal
function sparkle(n, v = 40) {
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    parts.push({ x: RUN_X + 4 + rnd() * 16, y: animalY() + 4 + rnd() * 14, vx: Math.cos(a) * v * rnd(), vy: Math.sin(a) * v * rnd() - 20, life: 0.3 + rnd() * 0.3, color: rnd() < 0.5 ? COLOR.YELLOW : COLOR.WHITE });
  }
}

// dawn: the chaser gives up (the first time it joins), and the next day is harder
function dawn() {
  const c = chaserOf(kind), away = chase && !chase.leaving, joins = !unlocked(c) && !AUTO, worth = ESCAPE * day;
  if (chase) chase.leaving = true;
  bonus += worth;
  floats.push({ text: `ESCAPED! +${worth}`, x: RUN_X, y: GROUND - 40, life: 1.4 });
  if (joins) unlock(c);
  else call('sting', away ? 'escape' : 'dawn');
  day++; night = hunted = false;
  banner(`DAY ${day}`, joins ? 40 : 30); // (under the unlock)
  banner(landOf(day).name, joins ? 48 : 38); // (the land its obstacles come from now)
}

function knockOut(why) {
  state = 'ko'; koT = 0; koWhy = why; energy = 0; ducking = duckHeld = false; power = 0;
  if (chase && !chase.caught) chase.leaving = true; // (one that caught it stays)
  if (!AUTO) fresh = record(kind, score());
  call('sting', fresh ? 'fanfare' : 'alert'); // (into the high scores: a fanfare)
  updateMood({ within: 0 });
}

// ------------------------------------------------------------------------------------------------------------- input
function press() {
  startAudio();
  if (scoresOpen()) return;
  if (state === 'title') return start();
  if (state === 'ko') { if (koT > 0.8) { if (fresh) { if (!TOUCH) nameIt(); } else if (gained) goHome(); else start(); } return; } // (a new high score is named first, on a phone as the tap ends: see touchend; one unlocked: to the title, to pick it)
  if (state === 'paused') { state = 'run'; if (audio === 'on') music.play(); return; }
  jumpHeld = true;
  if (ducking) return; // (no jumping while ducking: let go first)
  if (alt === 0) jump();
  else if (power && kind === 'ostrich') vAlt = Math.max(vAlt, 120); // (flying again: a beat of its wings)
  else if ((superHop() && airJumps < 1) || (power && kind === 'squirrel')) { // once more in the air (gliding: again and again)
    airJumps++;
    vAlt = JUMP * (kind === 'squirrel' ? 0.6 : 1);
    sparkle(8, 60);
    call('sting', 'jump');
  } else queued = BUFFER; // too early: it jumps as it lands
}
// off the ground: not while ducking (or in a belly slide)
function jump() {
  if (ducking) return;
  vAlt = JUMP * T().jump * (superHop() ? 1.25 : 1);
  call('sting', 'jump');
}
// ducking: held (a key, a finger; in the air: falling fast), or a belly slide
function duck(held = duckHeld) {
  if (held && !duckHeld && power > 0 && kind === 'gorilla') return drum(); // (its power: it drums instead)
  duckHeld = held;
  ducking = duckHeld || (power > 0 && kind === 'otter');
}
// chest drum: the gorilla stands up and beats its chest, and the next obstacle ahead is knocked over
function drum() {
  drumT = 0.35; shake = 0.2;
  const o = obstacles.filter((x) => !x.smashed && !x.over && x.x + x.sprite.w > RUN_X + 10).sort((a, b) => a.x - b.x)[0];
  floats.push({ text: 'BOOM!', x: RUN_X + 6, y: animalY() - 8, life: 0.5 });
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; parts.push({ x: RUN_X + 14, y: animalY() + 8, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, life: 0.3, color: COLOR.DIM }); }
  if (o) smash(o); else call('sting', 'smash');
}
const superHop = () => power > 0 && kind === 'rabbit';
const flying = () => power > 0 && kind === 'ostrich' && jumpHeld && !ducking; // (the ostrich's power, while the jump is held)
const stinks = () => power > 0 && kind === 'skunk';
function release() {
  jumpHeld = false;
  if (vAlt > JUMP_CUT) vAlt = JUMP_CUT;
}

const JUMP_KEYS = ['Space', 'ArrowUp', 'KeyW'], DUCK_KEYS = ['ArrowDown', 'KeyS'];
addEventListener('keydown', (e) => {
  if (e.target.closest?.('button') && (e.code === 'Space' || e.code === 'Enter')) return; // the buttons take their own keys
  if (e.code === 'KeyM') return toggleMute();
  if (e.code === 'KeyF') return toggleFull();
  if (e.code === 'KeyH' && !inRun()) return ACTS.scores();
  if (e.code === 'KeyC' && !inRun()) return ACTS.credits();
  if (scoresOpen()) { // the high scores: Space or Enter runs (again), Esc goes back
    if (e.code === 'Escape') leaveScores();
    else if (['Space', 'Enter'].includes(e.code)) { e.preventDefault(); closeScores(); press(); }
    return;
  }
  if (e.code === 'Escape') return goHome();
  if (JUMP_KEYS.includes(e.code)) { e.preventDefault(); if (!e.repeat) press(); }
  else if (DUCK_KEYS.includes(e.code)) { e.preventDefault(); startAudio(); if (!e.repeat) duck(true); }
  else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); chooseNext(-1); }
  else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); chooseNext(1); }
});
addEventListener('keyup', (e) => {
  if (JUMP_KEYS.includes(e.code)) release();
  else if (DUCK_KEYS.includes(e.code)) duck(false);
});
// touch: a finger on the left half of the screen ducks while it is held, one on the right half jumps (not while ducking),
// anywhere but on the game's buttons (around the game too, where it does not fill the screen); a mouse click jumps. On
// the title, a tap on an animal picks it (a second tap runs).
const TOUCH = matchMedia('(pointer: coarse)').matches;
const fingers = new Map(); // pointer id → 'duck' | 'jump'
const stage = document.getElementById('stage');
// where a pointer is, in the game's pixels from the top left of the screen (outside it: below 0 or past W, VH)
let viewRect = view.getBoundingClientRect(); // (kept: see fit, and scrolling; reading it in a press could make the browser lay the page out)
addEventListener('scroll', () => { viewRect = view.getBoundingClientRect(); }, { passive: true });
const artAt = (e) => { const r = viewRect; return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * VH]; };
stage.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const [x, y] = artAt(e);
  stage.setPointerCapture(e.pointerId);
  const btn = buttonAt(x, y) || padAt(e);
  if (btn) { pressedBtn = btn.id; return; }
  if (scoresOpen()) { startAudio(); return tapScores(); }
  if (state === 'title') { // a tap on an animal picks it (the start button runs)
    const k = y >= 0 && y < VH && playable().find((_, i) => x >= titleX(i) - 2 && x < titleX(i) + 26);
    startAudio();
    if (k && k !== kind) choose(k);
    return;
  }
  if (e.pointerType === 'touch' && x < W / 2 && state === 'run') { startAudio(); duck(true); fingers.set(e.pointerId, 'duck'); }
  else { fingers.set(e.pointerId, 'jump'); press(); }
});
const lift = (e) => {
  if (pressedBtn) {
    const btn = e.type === 'pointerup' && (buttonAt(...artAt(e)) || padAt(e));
    if (btn?.id === pressedBtn) { startAudio(); ACTS[btn.id](); }
    pressedBtn = null;
  }
  const what = fingers.get(e.pointerId);
  fingers.delete(e.pointerId);
  if (what === 'duck' && ![...fingers.values()].includes('duck')) duck(false);
  if (what === 'jump') release();
};
stage.addEventListener('pointerup', lift);
// after a knock-out with a new high score, a press (a key, a click; on a phone the tap, as it ends: a phone shows a
// dialog only then) asks for the name in the browser's own dialog, then opens the high scores
function nameIt() {
  const entry = fresh;
  fresh = null;
  askName(entry);
  wake(); // (the dialog may have stopped the audio)
  showScores(entry);
}
stage.addEventListener('touchend', (e) => {
  if (!TOUCH || state !== 'ko' || !fresh || koT <= 0.8 || board) return;
  e.preventDefault();
  nameIt();
});
stage.addEventListener('pointercancel', lift);
// phones count a touch as a gesture (that may start audio) only when it ends: start (or resume) the audio there too
addEventListener('pointerup', () => { startAudio(); wake(); });
// the audio again (not while paused) where the browser stopped it: suspended, or interrupted (iOS: by a call, Siri, a
// dialog of its own)
function wake() {
  if (music.ctx && music.ctx.state !== 'running' && state !== 'paused') music.ctx.resume().catch(() => {});
}

// a phone turned upright pauses the run (the page asks to turn it back)
const upright = matchMedia('(pointer: coarse) and (orientation: portrait)');
upright.addEventListener('change', () => { if (upright.matches) pause(); });

function pause() {
  if (state !== 'run') return;
  state = 'paused';
  fingers.clear(); duck(false); release();
  if (audio === 'on') music.pause(0.2);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

function toggleMute() {
  muted = !muted;
  keep('muted', muted ? '1' : '0');
  if (audio === 'on' && !switching) music.setVolume(muted ? 0 : 1, 0.1); // (while a song fades out: the next comes in so)
}

// full screen: only the game (Esc, F or its button leaves), sideways on a phone. Where the browser has none (iPhone), or
// its request fails or never answers (some embedded browsers), the game fills the window instead. Phones, tablets and
// the installed app show only the game anyway (the page's CSS).
const APP = matchMedia('(pointer: coarse), (display-mode: standalone), (display-mode: fullscreen)');
const isFull = () => !!document.fullscreenElement || stage.classList.contains('full');
// installed, the app is full screen already; on a phone without the API (iPhone) the game fills the screen anyway
const CAN_FULL = !matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches && (document.fullscreenEnabled || !APP.matches);
function toggleFull() {
  if (isFull()) {
    stage.classList.remove('full');
    if (document.fullscreenElement) document.exitFullscreen();
    return;
  }
  if (!document.fullscreenEnabled) { if (!APP.matches) stage.classList.add('full'); return; }
  stage.requestFullscreen().then(() => screen.orientation?.lock?.('landscape')).catch(() => {});
  setTimeout(() => { if (!document.fullscreenElement && !APP.matches) stage.classList.add('full'); }, 500);
}
document.addEventListener('fullscreenchange', () => { if (document.fullscreenElement) stage.classList.remove('full'); });

// the game's buttons, in its own pixels from the top left of the screen: sound, the high scores, full screen, and after a knock-out, back to
// the animals; while running only the sound. A button acts when the press ends on it (a phone lets full screen start
// only then).
const ICONS = {
  soundOn: ['..x....', '.xx.x..', 'xxx..x.', 'xxx..x.', 'xxx..x.', '.xx.x..', '..x....'],
  soundOff: ['..x....', '.xx....', 'xxx.x.x', 'xxx..x.', 'xxx.x.x', '.xx....', '..x....'],
  scores: ['xxxxxxx', 'x.xxx.x', '.xxxxx.', '..xxx..', '...x...', '..xxx..', '.xxxxx.'],
  credits: ['.xx.xx.', 'xxxxxxx', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'],
  full: ['xx...xx', 'x.....x', '.......', '.......', '.......', 'x.....x', 'xx...xx'],
  leave: ['.x...x.', 'xx...xx', '.......', '.......', '.......', 'xx...xx', '.x...x.'],
  home: ['...x...', '..xxx..', '.xxxxx.', 'xxxxxxx', '.x...x.', '.x.x.x.', '.x.x.x.'],
};
const ACTS = {
  sound: toggleMute,
  scores: () => { if (board && !board.credits) leaveScores(); else { closeScores(); showScores(fresh); fresh = null; } },
  credits: () => { if (board?.credits) leaveScores(); else { closeScores(); board = { credits: true }; updateMood(); } },
  full: toggleFull,
  home: goHome,
  prev: () => chooseNext(-1),
  next: () => chooseNext(1),
  start: press,
  back: () => leaveScores(),
};
const BTN = 11; // a button: 11×11, an icon of 7×7 in a frame
let SKY = 0, VH = H; // the sky added above the world, where the screen is taller than it; the height of all (see fit)
let safeL = 0, safeR = 0, safeT = 0; // how much of the game a phone's notch (or its round corners), on the left and right, or a tablet's status bar, at the top, may cover (see fit)
function buttons() {
  if (inRun()) return [{ id: 'sound', x: safeL + 60, y: 2 }, { id: 'home', x: safeL + 60 + BTN + 2, y: 2 }];
  const ids = ['sound', 'scores', 'credits', ...(CAN_FULL ? ['full'] : []), ...(state !== 'title' || board ? ['home'] : [])];
  const row = ids.map((id, i) => ({ id, x: safeL + 4 + i * (BTN + 2), y: 2 }));
  // on the title, the button that runs (under the writing, over the animals: in the world, from the top of the screen)
  // in the row of the pads, in the middle: on the title the button that runs, on the high scores the one back
  const mid = board ? { id: 'back', text: 'BACK' } : state === 'title' ? { id: 'start', text: 'START' } : null;
  return mid ? [...row, { ...mid, x: W / 2 - 15, y: SKY - safeT + padRow + 2, w: 31, h: 13 }] : row;
}
// under the ground, from the top in the world: the row of the pads (and the start button), between the ground and the
// line of help at the bottom of the screen (see fit)
let padRow = GROUND + 4, helpY = GROUND + 24;
// on the title, arrows in the bottom corners (pads, see showPad) pick the animal before or after (round the row),
// whenever there is more than one
const picking = () => state === 'title' && !board && carousel !== null && playable().length > 1;
const buttonAt = (x, y) => (y -= safeT, buttons().find((b) => x >= b.x - 1 && x < b.x + (b.w || BTN) + 1 && y >= b.y - 1 && y < b.y + (b.h || BTN) + 1));
let pressedBtn = null;
function drawButtons(pal) {
  for (const b of buttons()) {
    const icon = b.id === 'sound' ? (muted ? 'soundOff' : 'soundOn') : b.id === 'full' ? (isFull() ? 'leave' : 'full') : b.id;
    if (b.text) drawButton(b.x, b.y, null, b.id === pressedBtn, pal, b);
    else drawButton(b.x, b.y, icon, b.id === pressedBtn || (board && b.id === (board.credits ? 'credits' : 'scores')), pal);
  }
  if (TOUCH && !board && inRun()) {
    showPad(pads.left, 'duck', ducking);
    showPad(pads.right, 'jump', [...fingers.values()].includes('jump'));
  } else if (picking()) {
    showPad(pads.left, 'prev', pressedBtn === 'prev');
    showPad(pads.right, 'next', pressedBtn === 'next');
  } else { showPad(pads.left, null); showPad(pads.right, null); }
}
// round, half seen, in the bottom corners of the game (on a phone: of the screen, below the world, clear of a notch): on
// the title, the animal before and after; on a phone while running, where to tap (the whole half of the screen works),
// duck left, jump right. In the game's pixels and colors (--px, --game-ink, --game-bg)
const ARROW = ['....x....', '...xxx...', '..xxxxx..', '.xxxxxxx.', 'xxxxxxxxx', '...xxx...', '...xxx...', '...xxx...', '...xxx...'];
const LEFT = ARROW.map((_, y) => ARROW.map((r) => r[y]).join('')); // (turned: pointing left)
const flip = (rows) => rows.map((r) => [...r].reverse().join(''));
const PAD = 17, PAD_ICONS = { jump: ARROW, duck: [...ARROW].reverse(), prev: LEFT, next: flip(LEFT) };
function padSvg(icon) {
  const r = PAD / 2, o = (PAD - icon.length) / 2;
  const inside = (x, y) => x >= 0 && y >= 0 && x < PAD && y < PAD && Math.hypot(x + 0.5 - r, y + 0.5 - r) <= r;
  const paths = { ring: '', fill: '', icon: '' };
  for (let y = 0; y < PAD; y++) for (let x = 0; x < PAD; x++) {
    if (!inside(x, y)) continue;
    const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
    paths[edge ? 'ring' : icon[y - o]?.[x - o] === 'x' ? 'icon' : 'fill'] += `M${x} ${y}h1v1h-1z`;
  }
  // (twice: as it is, and pressed over it, shown by its opacity alone, so a press never has the pad painted again)
  const svg = (as) => `<svg class="${as}" viewBox="0 0 ${PAD} ${PAD}">${Object.entries(paths).map(([k, d]) => `<path class="${k}" d="${d}"/>`).join('')}</svg>`;
  return svg('up') + svg('down');
}
const PAD_SVGS = Object.fromEntries(Object.entries(PAD_ICONS).map(([k, icon]) => [k, padSvg(icon)]));
const pads = Object.fromEntries(['left', 'right'].map((side) => {
  const el = document.createElement('div');
  el.className = 'pad'; el.id = `${side}Pad`; el.hidden = true; el.setAttribute('aria-hidden', 'true');
  stage.append(el);
  return [side, el];
}));
// a pad showing an icon (null: none), pressed or not
function showPad(el, icon, pressed = false) {
  if (el.hidden !== !icon) el.hidden = !icon;
  if (icon && el.dataset.icon !== icon) { el.dataset.icon = icon; el.innerHTML = PAD_SVGS[icon]; }
  if (el.classList.contains('on') !== pressed) el.classList.toggle('on', pressed);
}
// the button a pad is, where a pointer is (on the title: the animal before or after)
function padAt(e) {
  if (!picking()) return null;
  for (const [side, id] of [['left', 'prev'], ['right', 'next']]) {
    const r = pads[side].getBoundingClientRect(), m = r.width * 0.25; // (a little round it counts too)
    if (e.clientX >= r.left - m && e.clientX < r.right + m && e.clientY >= r.top - m && e.clientY < r.bottom + m) return { id };
  }
  return null;
}
// a button: a frame with rounded corners, an icon in it (inverted while pressed); or, wider ({ w, h, text }), words;
// or (no icon) empty
function drawButton(x, y, icon, on, pal, { w = BTN, h = BTN, text: words } = {}) {
  const ink = pal[COLOR.INK];
  ctx.fillStyle = ink;
  ctx.fillRect(x + 1, y, w - 2, 1); ctx.fillRect(x + 1, y + h - 1, w - 2, 1);
  ctx.fillRect(x, y + 1, 1, h - 2); ctx.fillRect(x + w - 1, y + 1, 1, h - 2);
  ctx.fillStyle = on ? ink : pal.bg;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = on ? pal.bg : ink;
  if (words) return text(ctx, words, x + w / 2, y + (h - 5) / 2, on ? pal.bg : ink, 'center');
  ctx.beginPath();
  ICONS[icon]?.forEach((r, dy) => { for (let dx = 0; dx < r.length; dx++) if (r[dx] === 'x') ctx.rect(x + 2 + dx, y + 2 + dy, 1, 1); });
  ctx.fill();
}

// ------------------------------------------------------------------------------------------------- the music panel
const status = document.getElementById('status'), moodsEl = document.getElementById('moods'), callsEl = document.getElementById('calls');
let section = '–';
music.on('state', (ev) => { if (ev.section) { section = ev.section; showMood(); } });
music.on('error', (ev) => { status.textContent = ev.text; });
function showMood() {
  for (const el of moodsEl.children) el.classList.toggle('on', el.dataset.mood === mood);
  status.textContent = audio === 'on' ? `section: ${section}` : 'press a key or tap the game to start the music';
}
let callsShown = true; // (the calls written out: once a frame at most, see draw)
function showCalls() { if (!callsShown) { callsShown = true; callsEl.textContent = calls.join('\n'); } }

// ------------------------------------------------------------------------------------------------------ high scores
// one table of ten, every animal in it, kept in this browser (localStorage lop.scores: [{ name, score, kind, date }]). A
// knock-out that makes the table goes in at once, under the last name given; then the name is asked (see nameIt).
const TOP = 10;
let scores = [], lastName = '';
try {
  const s = keptJSON('scores');
  if (Array.isArray(s)) scores = s.map((e) => ({ ...e, kind: renamed(e.kind) }));
  else if (s) scores = Object.entries(s).flatMap(([k, t]) => t.map((e) => ({ ...e, kind: k }))).sort((a, b) => b.score - a.score).slice(0, TOP); // one table per animal, before
} catch { /* a table spoilt: none */ }
lastName = kept('name') || '';
const best = () => scores[0]?.score || 0;
const saveScores = () => keep('scores', JSON.stringify(scores));

// → the new entry, if the score makes the table (below those it ties with)
function record(k, s) {
  if (s <= 0 || (scores.length >= TOP && s <= scores[TOP - 1].score)) return null;
  const entry = { name: lastName || '???', score: s, kind: k, date: new Date().toISOString().slice(0, 10) };
  const at = scores.findIndex((e) => s > e.score);
  scores.splice(at < 0 ? scores.length : at, 0, entry);
  scores.length = Math.min(scores.length, TOP);
  saveScores();
  return entry;
}

// The high scores screen is drawn in the game, like the rest: rank, the animal's face, name, score; the new entry
// marked. Its name is asked in the browser's own dialog before (see askName).
let board = null; // the screen on show: { entry: the new one (marked) }
const scoresOpen = () => !!board;
const NAME_LEN = 10, ROW = 9, COLS = [57, 157]; // a row's height; the columns' left edges (rank, face, name, score: 96 wide)
const rowAt = (i) => [COLS[Math.floor(i / 5)], 14 + (i % 5) * ROW];

function showScores(entry = null) {
  board = { entry };
  updateMood();
}
// back from the high scores (or the credits): to the title, if the run is over (not to its knock-out)
const leaveScores = () => (state === 'ko' ? goHome() : closeScores());
function closeScores() {
  board = null;
  updateMood();
}
const cleanName = (v) => v.toUpperCase().replace(/[^A-Z0-9 .!-]/g, '').slice(0, NAME_LEN); // what the pixel font has
// the name asked in the browser's own dialog (cancelled: the name it went in under, the last one given)
function askName(entry) {
  const v = prompt('New high score! Your name:', entry.name === '???' ? '' : entry.name);
  if (v === null) return;
  entry.name = cleanName(v).trim() || '???';
  lastName = entry.name === '???' ? '' : entry.name;
  keep('name', lastName);
  saveScores();
}

// a tap on the screen runs
function tapScores() {
  closeScores(); press();
}

// the high scores (or the credits), the animal sitting under them, and what to do
function drawBoard(pal) {
  (board.credits ? drawCredits : drawScores)(pal);
  animal(kind, 'idle', idleFrame(kind, blinkT), { blink: blinking() }).draw(ctx, W / 2 - 13, GROUND - FOOT, pal);
  help(TOUCH ? 'TAP TO RUN' : 'SPACE: RUN - ESC: BACK', pal);
}
function drawScores(pal) {
  const ink = pal[COLOR.INK], dim = pal[COLOR.DIM];
  text(ctx, 'HIGH SCORES', W / 2, 4, ink, 'center');
  for (let i = 0; i < TOP; i++) {
    const [x, y] = rowAt(i), e = scores[i], mark = e && e === board.entry;
    if (mark) { ctx.fillStyle = pal[7]; ctx.fillRect(x - 2, y - 3, 98, 10); }
    const c = mark ? pal.bg : e ? ink : dim;
    text(ctx, `${i + 1}.`, x + 11, y, c, 'right');
    if (e) face(e.kind)?.draw(ctx, x + 13, y - 2, pal);
    text(ctx, e ? e.name : '-', x + 15 + FACE_W, y, c);
    if (e) text(ctx, e.score, x + 93, y, c, 'right');
  }
}

// the credits: who made what (what, dim, on the left; who on the right), on the high scores' screen (board.credits)
const CREDITS = [
  ['GAME AND ART', 'ANDREAS HACKEL'],
  ['MUSIC', 'STARDRIFT ENGINE'],
  ['', 'BY ANDREAS HACKEL'],
];
function drawCredits(pal) {
  const ink = pal[COLOR.INK], dim = pal[COLOR.DIM];
  text(ctx, 'CREDITS', W / 2, 4, ink, 'center');
  CREDITS.forEach(([what, who], i) => { text(ctx, what, W / 2 - 4, 16 + i * ROW, dim, 'right'); text(ctx, who, W / 2 + 4, 16 + i * ROW, ink); });
  text(ctx, 'THANKS FOR PLAYING!', W / 2, 16 + (CREDITS.length + 1) * ROW, pal[7], 'center');
  const v = 16 + (CREDITS.length + 3) * ROW; // which build this is, either side of the animal sitting in the middle
  text(ctx, `VERSION ${BUILT}`, W / 2 - 32, v, dim, 'right');
  text(ctx, `ENGINE ${ENGINE.toUpperCase()}`, W / 2 + 32, v, dim);
}
const LOGO = { O: '75557', P: '75744' }; // (the title's letters: square)
// what to do, in a line of its own at the bottom of the screen (dim, or in a color)
const help = (s, pal, color = pal[COLOR.DIM]) => text(ctx, s, W / 2, helpY, color, 'center');

// ------------------------------------------------------------------------------------------------------------ world
// the course's next piece comes in at the right (where it is in the course: the same every run, see level.js): low
// obstacles to jump (cacti, rocks, logs, low crows), high ones to duck under (branches, crows at head height), crows to
// run under; food now and then, on the ground or up in the air (more for the sly fox); golden food over an obstacle
function place(p) {
  const x = W - (dist - p.at);
  for (const it of p.items) obstacles.push({ kind: it.kind, sprite: it.sprite, x: x + it.dx, y: it.y, fly: it.fly, duck: it.duck, over: it.over });
  for (const f of p.food) if (!f.sly || (power && kind === 'fox')) food.push({ x: x + f.dx, y: f.y });
  if (p.gold) gold = { x: x + p.gold.dx, y: p.gold.y };
}

// ?auto: jump what is low, duck what is at head height, run under the rest; jump for food in the air when it is clear.
// (popcorn: the guinea pig's super power, the same, through anything, and little hops for joy when nothing is near)
function autopilot(popcorn = false) {
  const next = obstacles.filter((o) => o.x + o.sprite.w > RUN_X + 2 && !o.over).sort((a, b) => a.x - b.x)[0];
  duck(false);
  const p = powered();
  if (!popcorn && (p.smashes || p.bounces || p.passes || p.clears)) return; // straight through (the otter slides by itself)
  const gap = next ? next.x - (RUN_X + 22) : Infinity;
  if (next?.duck) { duck(alt === 0 && gap < 30); return; }
  if (alt === 0 && gap < speed * 0.1 && gap > -8) return press();
  if (popcorn) { if (alt === 0 && gap > speed * 0.5 && rnd() < 0.05) { vAlt = 150; sparkle(4, 40); } return; }
  const snack = food.find((f) => f.y < GROUND - 20 && f.x > RUN_X);
  if (snack && alt === 0 && gap > 90 && snack.x - (RUN_X + 12) < speed * 0.12) press();
}

// blinking, now and then (t: the time; a little later for another animal)
const blinking = (t = blinkT) => t % 3.2 < 0.12;
// the animal's pose now → [pose, frame, blink]
function animalPose() {
  if (state === 'ko') return [alt > 0 ? 'hurt' : 'ko', 0, false];
  if (state === 'title') return ['idle', idleFrame(kind, blinkT), blinking()];
  if (hurtT > 0) return ['hurt', 0, false];
  if (power && kind === 'hedgehog') return ['ball', Math.floor(phase * 8) % 4, false]; // spike ball
  if (drumT > 0 && alt === 0) return ['drum', Math.floor(drumT * 12) % 2, false]; // (the gorilla's chest drum)
  if (alt > 0 && flying()) return ['jump', Math.floor(blinkT * 10) % 2, blinking()]; // (the ostrich's wings beating: see its jump)
  if (alt > 0) return ['jump', jumpFrame(kind, vAlt / (JUMP * T().jump)), blinking()];
  if (ducking) return ['duck', stride(kind, phase, 'duck').frame, blinking()];
  return [power && kind === 'elephant' ? 'spray' : 'run', stride(kind, phase).frame, blinking()]; // (splash: the trunk up)
}
// the animal as it is drawn now (scale: the giant dino's); the same until it moves on (see update), however often drawn
let drawn = {};
const animalSprite = (scale = 1) => {
  if (drawn.scale !== scale) { const [pose, f, blink] = animalPose(); drawn = { scale, sprite: animal(kind, pose, f, { blink, body, scale }) }; }
  return drawn.sprite;
};
// the animal's moving parts (its tail, its ears: see the rigs in art.js), swung by how it moves on the screen
const body = {};
// the giant dino's size (it grows and shrinks in a quarter second) and where it is drawn: its feet stay on the ground,
// it grows forward a little. → x, y, w, h, scale (1 for anyone else)
function giantBox() {
  const s = power && kind === 'dino' ? (POWER_SECS - power < 0.25 || power < 0.25 ? 1.5 : 2) : 1; // (as POWERS has it: twice as big)
  return [RUN_X - 4 * (s - 1), animalY() + FOOT * (1 - s), 26 * s, 20 * s, s];
}
const hopping = () => state === 'run' && alt === 0 && !ducking && hurtT <= 0;
const animalY = () => GROUND - FOOT - alt - (hopping() ? stride(kind, phase).lift : 0);
const headAt = () => { const sp = animalSprite(); return [RUN_X + sp.head[0], animalY() + sp.head[1]]; };

function update(dt) {
  drawn = {};
  blinkT += dt;
  const sel = playable().indexOf(kind);
  carousel = carousel === null ? sel : carousel + (sel - carousel) * Math.min(1, dt * 10);
  { const [pose, f] = animalPose(); moveBody(body, kind, pose, f, state === 'title' ? W / 2 - 13 : RUN_X, state === 'title' ? GROUND - FOOT : animalY(), state === 'run' ? speed : 0, dt); } // (on the title: where it settles, so sliding there does not fling its ears)
  if (state === 'ko') koT += dt;
  if (AUTO && state === 'ko' && koT > 3) start();
  if (state !== 'run' && state !== 'ko') return;

  if (state === 'run') {
    if (AUTO || (power && kind === 'guineapig')) autopilot(!AUTO);
    duck();
    queued = Math.max(0, queued - dt);
    slow = Math.max(0, slow - dt / 1.2);
    speed = pace(kind, dist) * (chase ? CHASE : 1) * (1 - 0.45 * slow) * (powered().boost || 1);
  } else speed *= Math.exp(-5 * dt); // knocked out: the world rolls to a stop (back a little, after a bump)
  const dx = speed * dt;
  dist += state === 'run' ? dx : 0;
  if (powered().doubles && state === 'run') bonus += dx * SCORE_PER_PX * T().mult; // double points
  const was = phase;
  phase = (phase + dt * strides(kind, speed)) % 1;
  if (phase < was && hopping() && leaps(kind)) { // a leap lands: a puff of dust
    for (let i = 0; i < 2; i++) parts.push({ x: RUN_X + 6 + i * 4, y: GROUND - 1, vx: -20 - rnd() * 20, vy: -10 - rnd() * 15, life: 0.25, color: COLOR.FAINT });
  }
  flash = Math.max(0, flash - dt);
  shake = Math.max(0, shake - dt);
  safe = Math.max(0, safe - dt);
  hurtT = Math.max(0, hurtT - dt);
  drumT = Math.max(0, drumT - dt);

  // jumping: a held jump floats, a ducked one falls fast
  if (alt > 0 || vAlt > 0) {
    vAlt -= GRAVITY * T().gravity * (ducking ? 3 : 1) * dt;
    if (power && kind === 'squirrel') vAlt = Math.max(vAlt, -55); // gliding down
    if (flying()) vAlt = Math.max(vAlt, 0); // flying: it stays up while the jump is held (pressed again: up a little more)
    alt += vAlt * dt;
    if (alt > 56) { alt = 56; vAlt = Math.min(vAlt, 0); } // (a super hop stays on the screen)
    if (alt <= 0) {
      alt = 0; vAlt = 0; airJumps = 0;
      for (let i = 0; i < 3; i++) parts.push({ x: RUN_X + 8 + i * 3, y: GROUND - 1, vx: -30 - rnd() * 30, vy: -20 - rnd() * 20, life: 0.35, color: COLOR.INK });
      if (queued && state === 'run') { queued = 0; jump(); if (!jumpHeld) release(); } // (pressed just before: a tap or held on)
    }
  }

  // the world moves left
  while (state === 'run' && dist >= ahead.at) { place(ahead); ahead = track.next(); }
  for (const o of obstacles) {
    o.x -= dx + o.fly * dt;
    if (o.smashed) { o.x += o.vx * dt; o.y += o.vy * dt; o.vy += 600 * dt; } // bowled over: tumbling away
    if (o.kind === 'crow') o.sprite = crow(Math.floor(blinkT * 6) % 2);
  }
  for (const y of herd) { // the stampede: yaks running by, faster than the world, trampling what is ahead (all but what is high)
    y.x += 170 * dt; y.phase = (y.phase + dt * strides('yak', speed + 170)) % 1;
    for (const o of obstacles) if (!o.smashed && !o.over && o.x < y.x + 24 && o.x + o.sprite.w > y.x + 4) smash(o, true);
  }
  herd = herd.filter((y) => y.x < W + 10);
  for (const p of spits) { // spit, flying at what it was aimed at
    const o = p.to, tx = o.x + o.sprite.w / 2, ty = o.y + (o.kind === 'branch' ? o.sprite.h - 4 : o.sprite.h / 2), d = Math.hypot(tx - p.x, ty - p.y);
    if (o.smashed || d < 5) { if (!o.smashed) smash(o); p.done = true; continue; }
    p.x += ((tx - p.x) / d) * 320 * dt; p.y += ((ty - p.y) / d) * 320 * dt;
    if (rnd() < dt * 30) parts.push({ x: p.x, y: p.y, vx: -20, vy: 0, life: 0.2, color: COLOR.FAINT });
  }
  spits = spits.filter((p) => !p.done);
  obstacles = obstacles.filter((o) => o.x > -o.sprite.w && o.y < H);
  for (const f of food) f.x -= dx;
  food = food.filter((f) => f.x > -14);
  if (gold) { gold.x -= dx; if (gold.x < -14) gold = null; }
  for (const c of clouds) { c.x -= dx * 0.15; if (c.x < -20) { c.x = W + sky() * 80; c.y = 8 + sky() * 30 - sky() * SKY * 0.7; } }
  hillX += dx * 0.08;
  groundX = (groundX + dx) % GROUND_LOOP;
  if (chase) { // the chaser runs up behind, closer with every bump (and back while a super power lasts)
    // it runs like the animal: its own stride, its tail and ears swung by it
    const c = chaserOf(kind);
    chase.phase = (chase.phase + dt * strides(c, Math.max(speed, 60))) % 1;
    const st = stride(c, chase.phase);
    moveBody(chase.body, c, chase.caught ? 'idle' : 'run', chase.caught ? idleFrame(c, blinkT) : st.frame, chase.x + 4, GROUND - FOOT - (chase.caught ? 0 : st.lift), speed, dt);
    if (chase.leaving) { chase.x -= (state === 'run' ? 60 : 30) * dt; if (chase.x < -40) chase = null; }
    else if (!chase.caught) {
      if (power) chase.catching = false;
      chase.heat = Math.max(0, chase.heat - dt / (RECOVER + DAY_RECOVER * Math.min(6, hardness(kind, far()))));
      const to = safeL + (power ? CRUISE_X - 12 : chase.catching ? CATCH_X : CRUISE_X + ((CATCH_X - CRUISE_X) / 2) * chase.heat); // (right of a notch)
      chase.x += Math.max(-10 * dt, Math.min(40 * dt, to - chase.x));
      if (state === 'run' && chase.catching && chase.x >= safeL + CATCH_X - 0.5) { // caught
        speed = 0; chase.caught = true;
        return knockOut(`CAUGHT BY THE ${ANIMALS[chaserOf(kind)].name}!`);
      }
    }
  }
  if (state !== 'run') return;

  // a super power wears off (a little warning first: the animal flashes slower)
  if (power) {
    power = Math.max(0, power - dt);
    if (rnd() < dt * 30) sparkle(1);
    if (kind === 'dino') { // giant: what its big body touches tumbles away
      const [x, y, w, h] = giantBox();
      for (const o of obstacles) if (!o.smashed && o.x < x + w && o.x + o.sprite.w > x && o.y < y + h && o.y + o.sprite.h > y) smash(o);
    }
    if (kind === 'pig') { // truffle snout: what is just ahead is dug up as truffles (its food), to eat on the way
      const meal = FOOD.truffle;
      for (const o of obstacles) if (!o.smashed && !o.dug && !o.over && o.x > RUN_X + 30 && o.x < RUN_X + 100) {
        o.dug = true;
        food.push({ x: o.x + Math.max(0, o.sprite.w / 2 - meal.w / 2), y: GROUND - meal.h - 1 });
        for (let i = 0; i < 8; i++) parts.push({ x: o.x + rnd() * o.sprite.w, y: GROUND - 2 - rnd() * 6, vx: (rnd() - 0.5) * 80, vy: -40 - rnd() * 70, life: 0.4, color: COLOR.DIM });
        floats.push({ text: 'SNIFF!', x: o.x - 4, y: GROUND - 26, life: 0.6 });
      }
      obstacles = obstacles.filter((o) => !o.dug);
    }
    if (kind === 'yak' && (herdT -= dt) <= 0) { // stampede: a herd of three now and then
      herdT = 1.6;
      for (let i = 0; i < 3; i++) herd.push({ x: -30 - i * 24 - rnd() * 8, phase: rnd() });
    }
    if (kind === 'dromedary' && (spitT -= dt) <= 0) { // spit: at what flies or hangs ahead
      const o = obstacles.find((x) => !x.smashed && !x.aimed && (x.kind === 'crow' || x.kind === 'branch') && x.x > RUN_X + 10 && x.x < W - 10);
      if (o) { o.aimed = true; spitT = 0.25; spits.push({ x: RUN_X + 24, y: animalY() + 4, to: o }); floats.push({ text: 'PTOO!', x: RUN_X + 18, y: animalY() - 6, life: 0.4 }); }
    }
    if (kind === 'wolf') for (const o of obstacles) if (!o.smashed && o.x > RUN_X + 12 && o.x < RUN_X + 80) smash(o, true); // howl
    if (kind === 'elephant') { // splash: water sprayed from the trunk, washing away what is just ahead
      if (rnd() < dt * 70) parts.push({ x: RUN_X + 29, y: animalY() + 6, vx: 110 + rnd() * 80, vy: -40 - rnd() * 40, life: 0.5, color: COLOR.ICE }); // (from the trunk's tip)
      for (const o of obstacles) if (!o.smashed && o.x > RUN_X + 14 && o.x < RUN_X + 64) smash(o, true);
    }
    if (kind === 'rhino' && (quake -= dt) <= 0) { // quake: a stomp every so often, everything on the screen flies off
      quake = 1.4; shake = 0.3;
      for (const o of obstacles) if (!o.smashed && o.x < W) smash(o, true);
      call('sting', 'smash');
    }
    if (kind === 'skunk') { // stink: a green cloud behind it, crows flap off
      if (rnd() < dt * 40) parts.push({ x: RUN_X + 2, y: animalY() + 6 + rnd() * 8, vx: -30 - rnd() * 40, vy: -10 - rnd() * 20, life: 0.6, color: COLOR.LEAF });
      for (const o of obstacles) if (o.kind === 'crow') o.y -= 50 * dt;
    }
    if (powered().shakes && chase) chase.leaving = true; // (it comes, and turns away)
    if (!power) { duck(kind === 'guineapig' ? false : duckHeld); call('sting', 'powerdown'); updateMood({ within: 0 }); } // (a belly slide ends; popcorn lets go of its own ducking)
  }

  // what the animal runs into (the frame of its move as it is, not eased into: it ducks as quickly as ever), what it eats
  const [pose, f] = animalPose(), sp = hitbox(kind, pose, f), ay = animalY();
  if (!safe && !powered().passes) for (const o of obstacles) if (!o.smashed && hits(sp, RUN_X, ay, o.sprite, o.x, o.y)) { bump(o); if (state !== 'run') return; break; }
  const meal = FOOD[ANIMALS[kind].food];
  if (power && kind === 'fox') for (const f of food) { // sly: the food comes to the fox
    const tx = RUN_X + 10 - f.x, ty = ay + 8 - f.y, d = Math.hypot(tx, ty);
    if (d < 120 && d > 1) { f.x += (tx / d) * 160 * dt; f.y += (ty / d) * 160 * dt; }
  }
  const reaches = (f) => f.x + meal.w > RUN_X + 3 && f.x < RUN_X + 22 && f.y + meal.h > ay + 3 && f.y < ay + FOOT; // (its mouth: food comes to it)
  if (gold && reaches(gold)) { gold = null; startPower(); }
  food = food.filter((f) => {
    if (!reaches(f)) {
      if (!f.missed && f.x + meal.w <= RUN_X + 3) { f.missed = true; streak = 0; } // (gone by: a feast ends)
      return true;
    }
    energy = Math.min(100, energy + MEAL * (power && kind === 'bear' ? 2 : 1));
    streak++;
    const worth = 25 * Math.min(streak, FEAST);
    bonus += worth;
    call('sting', 'reward');
    floats.push({ text: streak > 1 ? `+${worth} X${streak}` : '+25', x: f.x, y: f.y - 6, life: 0.8 }, { sprite: heart, x: f.x + (streak > 1 ? 34 : 14), y: f.y - 6, life: 0.8 });
    for (let i = 0; i < 6; i++) parts.push({ x: f.x + 3, y: f.y + 3, vx: (rnd() - 0.5) * 90, vy: -rnd() * 80, life: 0.5, color: COLOR.BERRY });
    return false;
  });

  // running tires: without food the energy runs out
  if (!power) energy -= drain(kind, far()) * dt; // (a super power keeps the energy)
  if (energy <= 0) return knockOut('TOO TIRED!');

  // the days: night falls after a day's run, the next animal chases the animal through it, and at dawn it is left behind
  const s = far();
  dark = Math.max(0, Math.min(1, dark + (night ? dt : -dt) / TWILIGHT)); // (dusk and dawn take a while)
  const n = nightAt(kind, day); // (where this day's night falls: the same every run)
  if (!night && s >= n.from) { night = true; call('sting', 'dusk'); }
  if (night) {
    if (!hunted && s >= n.hunt) { // the chaser comes
      hunted = true;
      chase = { x: -40, heat: 0, catching: false, phase: 0, body: {} };
      call('sting', 'chased');
      banner(`THE ${ANIMALS[chaserOf(kind)].name} IS AFTER YOU!`, 30);
    }
    if (s >= n.to) dawn();
  }
  if (beat && score() > beat && !AUTO) { // past the best score so far
    beat = 0;
    call('sting', 'record');
    banner('NEW BEST!', 30);
  }
  if (Math.floor(score() / 100) > hundreds) { hundreds = Math.floor(score() / 100); flash = 1; } // the score blinks every 100
  updateMood();
}

function updateBits(dt) {
  for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.life -= dt; }
  parts = parts.filter((p) => p.life > 0);
  for (const f of floats) { f.y -= (f.rise ?? 12) * dt; f.life -= dt; }
  floats = floats.filter((f) => f.life > 0);
}

// ------------------------------------------------------------------------------------------------------------- draw
const scenery = random(1); // (the stars, the ground's bits: the same every time too)
const stars = Array.from({ length: 100 }, () => ({ x: Math.floor(scenery() * W), y: 50 - Math.floor(scenery() * 210), p: scenery() * 6 })); // (up into the sky a tall screen adds)
const GROUND_LOOP = 600;
const groundBits = Array.from({ length: 70 }, () => ({ x: Math.floor(scenery() * GROUND_LOOP), kind: scenery() < 0.15 ? 'tuft' : scenery() < 0.5 ? 'dash' : 'dot', y: 2 + Math.floor(scenery() * 4) }));
let stageBg = null, stageInk = null;
// the title's animals in a row, the one picked in the middle: the row slides to it (carousel: where it is now)
let carousel = null;
const titleX = (i) => Math.round(W / 2 - 13 + (i - carousel) * 34);

// an animal standing on the title (and the high scores): the one picked in front, with an arrow over it, the others
// faded behind
function standing(k, i, on, pal) {
  const x = titleX(i);
  if (x < -26 || x > W) return;
  ctx.globalAlpha = on ? 1 : 0.4;
  (on && !board ? animalSprite() : animal(k, 'idle', on ? idleFrame(k, blinkT) : 0, { blink: on && blinking() })).draw(ctx, x, GROUND - FOOT, pal);
  ctx.globalAlpha = 1;
  if (k === newKind && !board) text(ctx, 'NEW!', x + 12, GROUND - 32 + (on ? 0 : 6), pal[7], 'center'); // unlocked, not played yet
  if (!on) return;
  const ax = x + 11, ay = GROUND - 25 + Math.round(Math.sin(blinkT * 5) * 0.6);
  ctx.fillStyle = pal[COLOR.INK];
  ctx.fillRect(ax - 2, ay, 5, 1); ctx.fillRect(ax - 1, ay + 1, 3, 1); ctx.fillRect(ax, ay + 2, 1, 1);
}

// a bar at the top left, at y: an icon, a frame, filled that much (0…1) in a color
function bar(pal, icon, y, full, color) {
  const x = safeL;
  icon.draw(ctx, x + 6, y, pal);
  ctx.fillStyle = pal[COLOR.INK];
  ctx.fillRect(x + 13, y, 42, 5);
  ctx.fillStyle = pal.bg;
  ctx.fillRect(x + 14, y + 1, 40, 3);
  ctx.fillStyle = pal[color];
  ctx.fillRect(x + 14, y + 1, Math.ceil(40 * full), 3);
}
// the energy: a heart and a bar that turns red (and blinks) when it runs low
function energyBar(pal) {
  const low = energy < 30;
  if (!(low && state === 'run' && Math.floor(blinkT * 4) % 2)) bar(pal, heart, 5, energy / 100, low ? COLOR.BERRY : COLOR.ENERGY);
}
// what is left of a super power, under the energy: a star and a golden bar (blinking in its last two seconds)
function powerBar(pal) {
  if (power && !(power < 2 && Math.floor(power * 6) % 2)) bar(pal, star, 12, power / POWER_SECS, COLOR.YELLOW);
}

// birds circling a knocked-out head; the ones behind it are drawn first
function dizzyBirds(pal, behind) {
  const [hx, hy] = headAt();
  for (let i = 0; i < 3; i++) {
    const a = koT * 4 + (i * Math.PI * 2) / 3;
    if ((Math.sin(a) < 0) !== behind) continue;
    bird(Math.floor(koT * 8 + i) % 2).draw(ctx, hx + Math.cos(a) * 9 - 4, hy + Math.sin(a) * 2.5 - 4, pal);
  }
}

// dusk and dawn: day turns to a sunset, a purple dusk, then night; night to a morning, then day. Each pass on the way
// is a crossfade: the world drawn in both palettes, the second over the first (a pixel's colours blend smoothly). Sunset
// and morning are the day tinted, dusk the night; each with a sky of its own (one colour: no gradient).
const blend = (a, b, f) => `#${rgb(a).map((v, i) => Math.round(v * (1 - f) + rgb(b)[i] * f).toString(16).padStart(2, '0')).join('')}`;
const tint = (pal, by, f, more) => ({ ...Object.fromEntries(Object.entries(pal).map(([k, c]) =>
  [k, blend(c, `#${rgb(c).map((v, i) => Math.round((v * rgb(by)[i]) / 255).toString(16).padStart(2, '0')).join('')}`, f)])), ...more });
const SKIES = {
  day: PALETTES.day,
  sunset: tint(PALETTES.day, '#ff8c5a', 0.6, { bg: '#f7a76c' }),
  dusk: tint(PALETTES.night, '#ffb4d8', 0.3, { bg: '#56457a' }),
  night: PALETTES.night,
  morning: tint(PALETTES.day, '#ffb4c4', 0.45, { bg: '#ffdcbc' }),
};
// the two palettes to draw in and how much of the second, from how dark it is and which way it is going
function skies() {
  const way = night ? ['day', 'sunset', 'dusk', 'night'] : ['night', 'morning', 'day'], f = (night ? dark : 1 - dark) * (way.length - 1);
  const i = Math.min(Math.floor(f), way.length - 1);
  return i < way.length - 1 ? [SKIES[way[i]], SKIES[way[i + 1]], ease(f - i)] : [SKIES[way[i]], null, 0];
}
const second = document.createElement('canvas'), secondCtx = second.getContext('2d');
const themeColor = document.querySelector('meta[name=theme-color]');

function draw() {
  drawn = {};
  showCalls();
  const [a, b, f] = board ? [PALETTES.day, null, 0] : skies(); // (the high scores: always by day)
  const bg = f ? blend(a.bg, b.bg, f) : a.bg;
  if (stageBg !== bg) { // around the game in full screen, and the phone's bars
    document.documentElement.style.setProperty('--game-bg', stageBg = bg);
    themeColor.content = bg;
  }
  // a quake shakes the screen (by a screen pixel)
  const q = shake > 0 ? Math.round((rnd() - 0.5) * 2) * SCALE : 0;
  vctx.setTransform(SCALE, 0, 0, SCALE, q, (SKY * SCALE) + (q && (rnd() < 0.5 ? -q : q)));
  if (f < 1) scene(a);
  if (f > 0) {
    ctx = secondCtx;
    scene(b);
    ctx = vctx;
    ctx.globalAlpha = f; ctx.drawImage(second, 0, -SKY, W, VH); ctx.globalAlpha = 1;
  }
  // the writing in whichever palette stands out more against the sky as it is now (blended, it would fade away)
  const stands = (p) => Math.abs(luma(p[COLOR.INK]) - luma(bg));
  const hp = f && stands(b) > stands(a) ? b : a;
  if (stageInk !== hp[COLOR.INK]) document.documentElement.style.setProperty('--game-ink', stageInk = hp[COLOR.INK]); // (the pads)
  hud(hp);
}

// the ground: its line, the bits on it and under it (→ where it has scrolled to, in screen pixels)
function ground(pal) {
  ctx.fillStyle = pal[COLOR.INK];
  ctx.beginPath();
  ctx.rect(0, GROUND, W, 1);
  const scroll = snap(groundX);
  for (const b of groundBits) {
    let x = snap(((b.x - scroll) % GROUND_LOOP + GROUND_LOOP) % GROUND_LOOP);
    if (x > GROUND_LOOP - 6) x -= GROUND_LOOP; // (going off on the left)
    if (x >= W) continue;
    if (b.kind === 'dot') ctx.rect(x, GROUND + b.y, 1, 1);
    else if (b.kind === 'dash') ctx.rect(x, GROUND + b.y, 3, 1);
    else { ctx.rect(x, GROUND - 1, 1, 1); ctx.rect(x + 2, GROUND - 2, 1, 2); ctx.rect(x + 4, GROUND - 1, 1, 1); }
  }
  ctx.fill();
  return scroll;
}

// the world, in one palette
function scene(pal) {
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, -SKY, W, VH);
  if (board) return ground(pal); // (the high scores: on the plain sky and the ground, see hud)
  if (pal === PALETTES.night) { // the stars and the moon
    ctx.fillStyle = pal[COLOR.INK];
    ctx.beginPath();
    for (const s of stars) if (s.y >= -SKY && Math.sin(blinkT * 2 + s.p) > -0.6) ctx.rect(s.x, s.y, 1, 1);
    ctx.fill();
    moon.draw(ctx, W - 60, 10 - Math.round(SKY / 2), pal);
  }
  // far hills
  ctx.fillStyle = pal[COLOR.FAINT];
  const hills = snap(hillX), from = Math.floor(hills);
  ctx.beginPath();
  for (let x = 0; x <= W; x++) { // (each column of the hills keeps its height; they slide by screen pixels)
    const h = hill(x + from);
    ctx.rect(x - (hills - from), Math.round(GROUND - h), 1, Math.round(h));
  }
  ctx.fill(); // (one path: one fill, not a fill a column)
  for (const c of clouds) cloud.draw(ctx, c.x, c.y, pal);

  const scroll = ground(pal);


  // what lies on the ground moves with it, rounded with it to the same screen pixel (on its own, it could be one off)
  const onGround = (x) => snap(x + groundX) - scroll;
  const meal = FOOD[ANIMALS[kind].food];
  for (const f of food) meal.draw(ctx, onGround(f.x), f.y + Math.round(Math.sin(blinkT * 5 + f.x * 0.1)), pal);
  if (gold) { // golden, with a glint going round it
    const x = onGround(gold.x), y = gold.y + Math.round(Math.sin(blinkT * 5));
    meal.draw(ctx, x, y, golden(pal));
    const a = blinkT * 6;
    ctx.fillStyle = pal[COLOR.YELLOW];
    ctx.fillRect(x + Math.round(meal.w / 2 + Math.cos(a) * (meal.w / 2 + 3)), Math.round(y + meal.h / 2 + Math.sin(a) * (meal.h / 2 + 3)), 1, 1);
    ctx.fillStyle = pal[COLOR.WHITE];
    ctx.fillRect(x + Math.round(meal.w / 2 - Math.cos(a) * (meal.w / 2 + 3)), Math.round(y + meal.h / 2 - Math.sin(a) * (meal.h / 2 + 3)), 1, 1);
  }
  for (const y of herd) animal('yak', 'run', stride('yak', y.phase).frame).draw(ctx, y.x, GROUND - FOOT - 1, pal); // (the stampede, a little behind)
  ctx.fillStyle = pal[COLOR.WHITE];
  for (const p of spits) ctx.fillRect(snap(p.x) - 1, snap(p.y) - 1, 2, 2);
  ctx.globalAlpha = stinks() ? 0.35 : 1; // (faded while the skunk stinks: it runs through them)
  for (const o of obstacles) o.sprite.draw(ctx, onGround(o.x), o.y, pal);
  ctx.globalAlpha = 1;
  if (chase) { // the next animal (the last: a bear)
    const c = chaserOf(kind);
    const st = stride(c, chase.phase), blink = blinking(blinkT + 1.3);
    (chase.caught ? animal(c, 'idle', idleFrame(c, blinkT), { blink, body: chase.body }) : animal(c, 'run', st.frame, { blink, body: chase.body }))
      .draw(ctx, chase.x + 4, GROUND - FOOT - (chase.caught ? 0 : st.lift), pal);
  }

  if (state === 'title') {
    playable().forEach((k, i) => standing(k, i, k === kind, pal));
  }
  else {
    if (state === 'ko') dizzyBirds(pal, true);
    ctx.globalAlpha = safe > 0 && state === 'run' && Math.floor(safe * 10) % 2 ? 0.35 : 1;
    const flashing = power > 0 && Math.floor(power / (power > 2 ? 0.1 : 0.25)) % 2 === 0; // slower in the last two seconds
    if (power && kind === 'cheetah') { // sprint: a blur behind it
      for (const [d, a] of [[12, 0.15], [6, 0.3]]) { ctx.globalAlpha = a; animalSprite().draw(ctx, RUN_X - d, animalY(), pal); }
      ctx.globalAlpha = 1;
    }
    const [gx, gy, , , s] = giantBox();
    animalSprite(s).draw(ctx, gx, gy, flashing ? golden(pal) : pal); // (the giant: drawn bigger, still smooth)
    ctx.globalAlpha = 1;
    if (state === 'ko') dizzyBirds(pal, false);
  }
  let color = null;
  for (const p of parts) { if (p.color !== color) ctx.fillStyle = pal[color = p.color]; ctx.fillRect(snap(p.x), snap(p.y), 1, 1); }
  for (const f of floats) {
    if (f.sprite) f.sprite.draw(ctx, f.x, Math.round(f.y), pal);
    else text(ctx, f.text, f.x, Math.round(f.y), pal[COLOR.INK]);
  }
}

// what is written over the world (and the high scores), in one palette
function hud(pal) {
  if (board) { drawBoard(pal); atTop(() => drawButtons(pal)); return; }
  // the energy, the score (blinking at every hundred): at the top of the screen
  atTop(() => {
    if (state === 'run' || state === 'paused') { energyBar(pal); powerBar(pal); text(ctx, `DAY ${day}`, W - safeR - 6, 12, pal[COLOR.INK], 'right'); }
    const pad = (n) => String(n).padStart(5, '0');
    if (!(flash > 0 && Math.floor(flash * 8) % 2)) text(ctx, pad(score()), W - safeR - 6, 5, pal[COLOR.INK], 'right');
    if (best()) text(ctx, `HI ${pad(best())}`, W - safeR - 30, 5, pal[COLOR.DIM], 'right');
  });

  if (state === 'title') {
    text(ctx, 'LOP HOP', W / 2, 10, pal[COLOR.INK], 'center', 2, LOGO);
    const pick = playable().length > 1;
    if (TOUCH) { if (pick) help('TAP AN ANIMAL TO PICK IT', pal); }
    else help(pick ? '< > OR CLICK TO PICK - SPACE TO RUN' : 'SPACE TO RUN', pal);
  } else if (state === 'ko') {
    text(ctx, koWhy, W / 2, 24, pal[COLOR.INK], 'center');
    if (koT > 0.8 && fresh) help(`NEW HIGH SCORE! ${TOUCH ? 'TAP' : 'SPACE OR CLICK'} TO ENTER YOUR NAME`, pal, pal[7]);
    else if (koT > 0.8 && !fresh && gained) help(`THE ${ANIMALS[gained].name} IS YOURS! ${TOUCH ? 'TAP' : 'SPACE OR TAP'} TO PICK`, pal, pal[7]);
    else if (koT > 0.8 && !fresh) help(TOUCH ? 'TAP TO RUN AGAIN' : 'SPACE OR TAP TO RUN AGAIN', pal);
  } else if (state === 'paused') {
    text(ctx, TOUCH ? 'PAUSED - TAP TO GO ON' : 'PAUSED - SPACE OR TAP', W / 2, 30, pal[COLOR.INK], 'center');
  }

  atTop(() => {
    drawButtons(pal);
    if (FPS) text(ctx, rate.shown, W - safeR - 3, 21, pal[COLOR.INK], 'right'); // (under the day)
  });
}
// drawn from the top of the screen (under a status bar), not of the world (see fit: the sky added above it)
function atTop(draw) { ctx.translate(0, safeT - SKY); draw(); ctx.translate(0, SKY - safeT); }

// the canvases in screen pixels, a whole number per art pixel: the art is drawn in art pixels, scaled up (not blurred),
// and what moves is placed to the screen pixel (see snap), so it glides instead of stepping a big pixel at a time
const FORCE = +Q.get('scale') || 0; // ?scale=3: drawn 3 screen pixels an art pixel (the page scales it up)
// (a probe for how much of the screen's sides a notch or round corners may cover, in CSS pixels)
const inset = document.createElement('div');
inset.style.cssText = 'position: fixed; visibility: hidden; pointer-events: none; padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
document.body.append(inset);
function fit() {
  // the game fills the screen's width on a phone (see index.html): what is drawn at its sides keeps clear of the notch
  const r = (viewRect = view.getBoundingClientRect()), cs = getComputedStyle(inset), art = W / (r.width || W);
  safeL = Math.max(0, Math.ceil((parseFloat(cs.paddingLeft) - r.left) * art));
  safeR = Math.max(0, Math.ceil((parseFloat(cs.paddingRight) - (document.documentElement.clientWidth - r.right)) * art));
  const top = parseFloat(cs.paddingTop) - r.top; // (and a little more: the status bar fades out below its edge)
  safeT = top > 0 ? Math.ceil(top * art) + 5 : 0;
  RUN_X = 30 + safeL; // (the animal, and the one chasing it, where they were before the game went under the notch)
  const px = r.width / W || 1; // (CSS pixels an art pixel)
  document.documentElement.style.setProperty('--px', px); // (the pads)
  // a screen taller than the world (a phone, full screen): the world in the middle, as much more sky above it as room
  // below it (where the pads are), up to where the branches' trunks end
  const more = Math.max(0, Math.round((W * r.height) / (r.width || W)) - H);
  SKY = Math.min(Math.floor(more / 2), TRUNK); VH = H + more;
  // under the ground: the line of help at the bottom (5 art pixels under it on every screen, clear of a phone's home bar
  // too), the pads' row between
  helpY = VH - SKY - 10;
  padRow = Math.max(GROUND + 2, Math.round((GROUND + 1 + helpY - 2 - PAD) / 2));
  stage.style.setProperty('--pad-top', `${view.offsetTop + (SKY + padRow) * px}px`);
  const scale = FORCE || Math.max(1, Math.round((view.clientWidth * devicePixelRatio) / W));
  if (fitted === `${scale} ${VH} ${SKY}`) return;
  fitted = `${scale} ${VH} ${SKY}`;
  setScale(SCALE = scale);
  for (const c of [view, second]) { c.width = W * scale; c.height = VH * scale; }
  for (const cx of [vctx, secondCtx]) { cx.setTransform(scale, 0, 0, scale, 0, SKY * scale); cx.imageSmoothingEnabled = false; }
}
let SCALE = 1, fitted = ''; // (screen pixels an art pixel; the size fitted to)
new ResizeObserver(fit).observe(view);
addEventListener('resize', fit); // (turned the other way round: the notch on the other side)
fit();

// fixed steps, so a slow frame never lets the animal pass through a cactus; at most a quarter second caught up. At most
// 60 frames a second (a faster screen, 120 Hz: every other one), each due a 60th of a second after the one before
const STEP = 1 / 120, FRAME = 1000 / 60;
let last = performance.now(), behind = 0, due = 0, readied = null, ready = null;
// (?fps: each second, the frames drawn in it, the work of a frame on average and at most, in ms)
const rate = { frames: 0, since: 0, work: 0, worst: 0, shown: '' };
function frame(now) {
  if (now < due - 4) { requestAnimationFrame(frame); return; } // (too soon: the screen's next one)
  due = now - due > FRAME ? now + FRAME : due + FRAME; // (behind: from now on)
  const began = performance.now();
  behind = Math.min(0.25, behind + (now - last) / 1000);
  last = now;
  for (; behind >= STEP; behind -= STEP) if (state !== 'paused') { update(STEP); updateBits(STEP); }
  if (readied !== kind) { readied = kind; ready = readying(kind); }
  if (ready?.next().done) ready = null; // (the animal made ready to run, a piece a frame: see readying)
  draw();
  if (FPS) {
    const work = performance.now() - began;
    rate.frames++; rate.work += work; rate.worst = Math.max(rate.worst, work);
    if (now - rate.since >= 1000) {
      rate.shown = `${Math.round((rate.frames * 1000) / (now - rate.since))} FPS  ${(rate.work / rate.frames).toFixed(1)} MS  MAX ${rate.worst.toFixed(1)}  ${view.width}X${view.height}`;
      Object.assign(rate, { frames: 0, since: now, work: 0, worst: 0 });
    }
  }
  requestAnimationFrame(frame);
}
updateMood();
requestAnimationFrame(frame);

// offline, and installable: a service worker keeps the game's files (not on localhost, where files change all the time)
if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(location.hostname)) navigator.serviceWorker.register('sw.js');
