// Lop Ear Run: a rabbit, a dog or a cat runs, jumps cacti and ducks under branches and crows. A small game that drives
// the Stardrift engine the way a game would: one mood for each state of play, stingers for its events.
//
//   relaxed    the title, knocked out         jump       the animal jumps
//   exploring  the first stretch              reward     food
//   tension    once crows fly in (300)        bump       it runs into something
//   action     once the run is fast (700)     discovery  the fox is left behind
//   danger     while the fox chases it        alert      knocked out
//              (a wolf, when the runner is the fox: it plays once every other animal has a high score)
//   wonder     while it is night
//   power      while a super power lasts      power, powerdown   golden food gives one, and it wears off
import { StardriftPlayer } from 'stardrift-engine';
import { W, H, GROUND, PALETTES, COLOR, FOOT, ANIMALS, DUCK_UNDER, CROW_BOTTOM, animal, stride, bird, cactus, rock, log, branch, crow, chaser,
  FOOD, cloud, moon, heart, star, golden, text, textWidth, hits } from './art.js';

const view = document.getElementById('game'), vctx = view.getContext('2d');
const world = document.createElement('canvas');
world.width = W; world.height = H;
const ctx = world.getContext('2d');

// ------------------------------------------------------------------------------------------------------------- tuning
const START_SPEED = 110, MAX_SPEED = 270, ACCEL = 3; // art pixels per second (per second)
const GRAVITY = 1500, JUMP = 330, JUMP_CUT = 140; // a held jump rises to about 36 px, a tap to about 12
const RUN_X = 30, SCORE_PER_PX = 0.1;
const BRANCHES_FROM = 150, CROWS_FROM = 300, FAST_FROM = 700; // the scores where branches, crows (tension) and speed (action) begin
const NIGHT_EVERY = 900, NIGHT_SECS = 14, FOX_FIRST = 500, FOX_EVERY = 1000, FOX_SECS = 12;
const DRAIN = 2, BUMP = 30, MEAL = 12, SAFE_SECS = 1.5; // energy (of 100): lost per second, per bump; won per food; blinking after a bump
// golden food (the first after 250, then one in every 400-700 points) gives a super power for 8 seconds, each animal its own
const POWER_SECS = 8, GOLD_FIRST = 250, GOLD_GAP = [400, 700];
const POWERS = {
  rabbit: 'SUPER HOP!', // jumps higher, and once more in the air
  dog: 'ZOOMIES!', // runs faster and bowls everything over
  cat: 'NINE LIVES!', // bumps cost nothing: it bounces off
  fox: 'SLY FOX!', // food comes to it, the chaser loses its trail
};

// --------------------------------------------------------------------------------------------------------- the music
const music = new StardriftPlayer();
const song = fetch('song.json').then((r) => r.json());
let audio = 'off'; // off | starting | on
let muted = false;
try { muted = localStorage.getItem('lop.muted') === '1'; } catch { /* no storage: sound on */ }
let mood = null;
const calls = []; // the last calls to the music, newest first, as game code would write them

function call(name, ...args) {
  calls.unshift(`music.${name}(${args.map((a) => JSON.stringify(a).replace(/"/g, "'").replace(/'(\w+)':/g, '$1: ')).join(', ')})`);
  calls.length = Math.min(calls.length, 5);
  if (audio === 'on') music[name](...args);
  showCalls();
}

// the first key or tap starts the audio (browsers need a user gesture for it)
async function startAudio() {
  if (audio !== 'off') return;
  audio = 'starting';
  try {
    await music.init();
    music.load(await song, { seed: Math.floor(Math.random() * 1e6) });
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
  if (state !== 'run') return 'relaxed';
  if (power) return 'power';
  if (chase) return 'danger';
  if (night) return 'wonder';
  return score() < CROWS_FROM ? 'exploring' : score() < FAST_FROM ? 'tension' : 'action';
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
let speed, dist, bonus, t, alt, vAlt, held, ducking, soft, softVel, phase, obstacles, food, parts, floats;
let spawnIn, chase, night, nextNight, nextFox, koT, koWhy, blinkT, flash, hundreds, energy, safe, hurtT, slow, power, gold, nextGold, airJumps;
let fresh = null; // a knock-out's new entry in the high scores, to name
const score = () => Math.floor(dist * SCORE_PER_PX) + bonus;
const rnd = Math.random;
const AUTO = new URLSearchParams(location.search).has('auto'); // ?auto: the animal runs by itself (to hear the moods)

function reset() {
  speed = START_SPEED; dist = 0; bonus = 0; t = 0; alt = 0; vAlt = 0; held = false; ducking = false; soft = 0.2; softVel = 0; phase = 0;
  obstacles = []; food = []; parts = []; floats = [];
  spawnIn = 120; chase = null; night = 0; nextNight = NIGHT_EVERY; nextFox = FOX_FIRST; flash = 0; hundreds = 0;
  energy = 100; safe = 0; hurtT = 0; slow = 0; koT = 0;
  power = 0; gold = null; nextGold = GOLD_FIRST + rnd() * 150; airJumps = 0;
}
reset();
blinkT = 0;

function start() {
  reset();
  state = 'run';
  updateMood();
}

function choose(k) {
  if (state === 'run' || state === 'paused' || !ANIMALS[k]) return;
  if (!unlocked(k)) return;
  kind = k;
  try { localStorage.setItem('lop.animal', k); } catch { /* no storage */ }
  if (state === 'ko') { reset(); state = 'title'; }
  softVel -= 6; // a little bounce for the one picked
}
const KINDS = Object.keys(ANIMALS);
// the next animal one way or the other, from k, among those that can be played
const nextKind = (k, d) => { let i = KINDS.indexOf(k); do i = (i + d + KINDS.length) % KINDS.length; while (!unlocked(KINDS[i])); return KINDS[i]; };
const chooseNext = (d) => choose(nextKind(kind, d));
const playable = () => KINDS.filter(unlocked); // the ones on the title (the fox only once it is unlocked: a surprise)

// a bump costs energy and leaves the animal blinking (safe) for a moment; with none left it is knocked out
function bump(o) {
  if (power && kind === 'dog') return smash(o);
  if (power && kind === 'cat') { // nine lives: it bounces off, no harm done
    safe = 0.4; vAlt = Math.max(vAlt, 220); softVel -= 10;
    floats.push({ text: 'BOING!', x: RUN_X, y: animalY() - 6, life: 0.6 });
    call('sting', 'jump');
    return;
  }
  energy = Math.max(0, energy - BUMP);
  safe = SAFE_SECS; hurtT = 0.35; slow = 1;
  if (alt === 0) vAlt = 150; // knocked up a little
  softVel -= 14;
  const [hx, hy] = headAt();
  for (let i = 0; i < 7; i++) parts.push({ x: hx, y: hy, vx: (rnd() - 0.3) * 120, vy: -40 - rnd() * 80, life: 0.5, color: COLOR.YELLOW });
  if (energy <= 0) { speed = -70; return knockOut('KNOCKED OUT!'); } // thrown back from what it ran into
  floats.push({ text: 'OUCH!', x: hx - 8, y: hy - 6, life: 0.7 });
  call('sting', 'bump');
}

// zoomies: what the dog runs into tumbles away (and is worth 10)
function smash(o) {
  o.smashed = true; o.vx = 90 + rnd() * 60; o.vy = -140 - rnd() * 60;
  bonus += 10;
  floats.push({ text: '+10', x: o.x, y: Math.max(8, o.y) - 4, life: 0.6 });
  for (let i = 0; i < 6; i++) parts.push({ x: o.x + o.sprite.w / 2, y: Math.max(o.y, GROUND - 12), vx: (rnd() - 0.2) * 120, vy: -40 - rnd() * 80, life: 0.4, color: COLOR.YELLOW });
  call('sting', 'bump');
}

// golden food: a super power, for a while
function startPower() {
  power = POWER_SECS; airJumps = 0;
  call('sting', 'power');
  updateMood({ within: 0 });
  floats.push({ text: POWERS[kind], x: W / 2 - textWidth(POWERS[kind]) / 2, y: 28, life: 1.6 });
  sparkle(16, 140);
  if (kind === 'fox' && chase && !chase.leaving) { chase.leaving = true; floats.push({ text: 'LOST YOU!', x: 4, y: GROUND - 32, life: 1.2 }); }
}
// golden sparks around the animal
function sparkle(n, v = 40) {
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    parts.push({ x: RUN_X + 4 + rnd() * 16, y: animalY() + 4 + rnd() * 14, vx: Math.cos(a) * v * rnd(), vy: Math.sin(a) * v * rnd() - 20, life: 0.3 + rnd() * 0.3, color: rnd() < 0.5 ? COLOR.YELLOW : COLOR.WHITE });
  }
}

function knockOut(why) {
  state = 'ko'; koT = 0; koWhy = why; energy = 0; ducking = false; power = 0;
  if (chase) chase.leaving = true;
  call('sting', 'alert');
  updateMood({ within: 0 });
  if (!AUTO) {
    const was = unlocked('fox');
    fresh = record(kind, score());
    if (fresh && !was && unlocked('fox')) fresh.unlocks = 'fox'; // this score unlocks the fox
  }
}

// ------------------------------------------------------------------------------------------------------------- input
function press() {
  startAudio();
  if (scoresOpen()) return;
  if (state === 'title') return start();
  if (state === 'ko') { if (koT > 0.8) start(); return; }
  if (state === 'paused') { state = 'run'; if (audio === 'on') music.play(); return; }
  held = true;
  if (alt === 0 && !ducking) {
    vAlt = JUMP * (superHop() ? 1.25 : 1);
    softVel -= 9; // the ear flicks down as it takes off
    call('sting', 'jump');
  } else if (alt > 0 && superHop() && airJumps < 1) { // super hop: once more, in the air
    airJumps++;
    vAlt = JUMP;
    softVel -= 9;
    sparkle(8, 60);
    call('sting', 'jump');
  }
}
const superHop = () => power > 0 && kind === 'rabbit';
function release() {
  held = false;
  if (vAlt > JUMP_CUT) vAlt = JUMP_CUT;
}

const JUMP_KEYS = ['Space', 'ArrowUp', 'KeyW'], DUCK_KEYS = ['ArrowDown', 'KeyS'];
addEventListener('keydown', (e) => {
  if (e.target.closest?.('input')) return; // typing a name
  if (e.target.closest?.('button') && (e.code === 'Space' || e.code === 'Enter')) return; // the buttons take their own keys
  if (e.code === 'KeyM') return toggleMute();
  if (e.code === 'KeyF') return toggleFull();
  if (e.code === 'KeyH' && state !== 'run' && state !== 'paused') return ACTS.scores();
  if (scoresOpen()) { // the high scores: ← → another animal's, Space or Enter runs (again), Esc goes back
    if (e.code === 'Escape') closeScores();
    else if (['Space', 'Enter'].includes(e.code)) { e.preventDefault(); closeScores(); press(); }
    else if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) {
      e.preventDefault();
      board.k = nextKind(board.k, /Left|KeyA/.test(e.code) ? -1 : 1);
    }
    return;
  }
  if (JUMP_KEYS.includes(e.code)) { e.preventDefault(); if (!e.repeat) press(); }
  else if (DUCK_KEYS.includes(e.code)) { e.preventDefault(); startAudio(); ducking = true; }
  else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); chooseNext(-1); }
  else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); chooseNext(1); }
});
addEventListener('keyup', (e) => {
  if (JUMP_KEYS.includes(e.code)) release();
  else if (DUCK_KEYS.includes(e.code)) ducking = false;
});
// touch: a finger on the left half ducks while it is held, one on the right half jumps (both at once too); a mouse
// click jumps. On the title, a tap on an animal picks it (a second tap runs).
const TOUCH = matchMedia('(pointer: coarse)').matches;
const fingers = new Map(); // pointer id → 'duck' | 'jump'
view.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const x = (e.offsetX / view.clientWidth) * W, y = (e.offsetY / view.clientHeight) * H;
  view.setPointerCapture(e.pointerId);
  const btn = buttonAt(x, y);
  if (btn) { pressedBtn = btn.id; return; }
  if (scoresOpen()) { startAudio(); return tapScores(x, y); }
  if (state === 'title') {
    const k = playable().find((_, i) => x >= titleX(i) - 2 && x < titleX(i) + 26);
    if (k && k !== kind) { startAudio(); choose(k); return; }
  }
  if (e.pointerType === 'touch' && x < W / 2 && state === 'run') { startAudio(); ducking = true; fingers.set(e.pointerId, 'duck'); }
  else { fingers.set(e.pointerId, 'jump'); press(); }
});
const lift = (e) => {
  if (pressedBtn) {
    const btn = e.type === 'pointerup' && buttonAt((e.offsetX / view.clientWidth) * W, (e.offsetY / view.clientHeight) * H);
    if (btn?.id === pressedBtn) { startAudio(); ACTS[btn.id](); }
    pressedBtn = null;
  }
  const what = fingers.get(e.pointerId);
  fingers.delete(e.pointerId);
  if (what === 'duck' && ![...fingers.values()].includes('duck')) ducking = false;
  if (what === 'jump') release();
};
view.addEventListener('pointerup', lift);
view.addEventListener('pointercancel', lift);
// phones count a touch as a gesture (that may start audio) only when it ends: start (or resume) the audio there too
addEventListener('pointerup', () => {
  startAudio();
  if (music.ctx?.state === 'suspended' && state !== 'paused') music.ctx.resume().catch(() => {});
});

// a phone turned upright pauses the run (the page asks to turn it back)
const upright = matchMedia('(pointer: coarse) and (orientation: portrait)');
upright.addEventListener('change', () => { if (upright.matches) pause(); });

function pause() {
  if (state !== 'run') return;
  state = 'paused';
  fingers.clear(); ducking = false; held = false;
  if (audio === 'on') music.pause(0.2);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

function toggleMute() {
  muted = !muted;
  try { localStorage.setItem('lop.muted', muted ? '1' : '0'); } catch { /* no storage */ }
  if (audio === 'on') music.setVolume(muted ? 0 : 1, 0.1);
}

// full screen: only the game (Esc, F or its button leaves), sideways on a phone. Where the browser has none (iPhone), or
// its request fails or never answers (some embedded browsers), the game fills the window instead. Phones, tablets and
// the installed app show only the game anyway (the page's CSS).
const stage = document.getElementById('stage');
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

// the game's buttons, in its own pixels (top left): sound, the high scores, full screen, and after a knock-out, back to
// the animals; while running only the sound. A button acts when the press ends on it (a phone lets full screen start
// only then).
const ICONS = {
  soundOn: ['..x....', '.xx.x..', 'xxx..x.', 'xxx..x.', 'xxx..x.', '.xx.x..', '..x....'],
  soundOff: ['..x....', '.xx....', 'xxx.x.x', 'xxx..x.', 'xxx.x.x', '.xx....', '..x....'],
  scores: ['xxxxxxx', 'x.xxx.x', '.xxxxx.', '..xxx..', '...x...', '..xxx..', '.xxxxx.'],
  full: ['xx...xx', 'x.....x', '.......', '.......', '.......', 'x.....x', 'xx...xx'],
  leave: ['.x...x.', 'xx...xx', '.......', '.......', '.......', 'xx...xx', '.x...x.'],
  animals: ['.x...x.', '.x.x.x.', '...x...', '..xxx..', '.xxxxx.', '.xxxxx.', '..x.x..'],
};
const ACTS = {
  sound: toggleMute,
  scores: () => (board ? closeScores() : showScores()),
  full: toggleFull,
  animals: () => { if (state === 'ko') { reset(); state = 'title'; } },
};
const BTN = 11; // a button: 11×11, an icon of 7×7 in a frame
function buttons() {
  if (state === 'run' || state === 'paused') return [{ id: 'sound', x: 60, y: 2 }];
  const ids = ['sound', 'scores', ...(CAN_FULL ? ['full'] : []), ...(state === 'ko' && !board ? ['animals'] : [])];
  return ids.map((id, i) => ({ id, x: 4 + i * (BTN + 2), y: 2 }));
}
const buttonAt = (x, y) => buttons().find((b) => x >= b.x - 1 && x < b.x + BTN + 1 && y >= b.y - 1 && y < b.y + BTN + 1);
let pressedBtn = null;
function drawButtons(pal) {
  const ink = pal[COLOR.INK];
  for (const b of buttons()) {
    const on = b.id === pressedBtn || (b.id === 'scores' && board);
    ctx.fillStyle = ink;
    ctx.fillRect(b.x + 1, b.y, BTN - 2, 1); ctx.fillRect(b.x + 1, b.y + BTN - 1, BTN - 2, 1);
    ctx.fillRect(b.x, b.y + 1, 1, BTN - 2); ctx.fillRect(b.x + BTN - 1, b.y + 1, 1, BTN - 2);
    ctx.fillStyle = on ? ink : pal.bg;
    ctx.fillRect(b.x + 1, b.y + 1, BTN - 2, BTN - 2);
    const rows = ICONS[b.id === 'sound' ? (muted ? 'soundOff' : 'soundOn') : b.id === 'full' ? (isFull() ? 'leave' : 'full') : b.id];
    ctx.fillStyle = on ? pal.bg : ink;
    rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'x') ctx.fillRect(b.x + 2 + x, b.y + 2 + y, 1, 1); }));
  }
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
function showCalls() { callsEl.textContent = calls.join('\n'); }

// ------------------------------------------------------------------------------------------------------ high scores
// ten for each animal, kept in this browser (localStorage lop.scores: { rabbit: [{ name, score, date }], … }). A
// knock-out that makes the table goes in at once, under the last name typed; the table then opens to name it.
const TOP = 10;
let tables = {}, lastName = '';
try { tables = JSON.parse(localStorage.getItem('lop.scores')) || {}; lastName = localStorage.getItem('lop.name') || ''; } catch { /* no storage */ }
const table = (k) => (tables[k] ||= []);
const best = (k) => table(k)[0]?.score || 0;
const saveTables = () => { try { localStorage.setItem('lop.scores', JSON.stringify(tables)); } catch { /* no storage */ } };
// the fox plays once every other animal has a high score
const unlocked = (k) => !ANIMALS[k].locked || KINDS.every((o) => ANIMALS[o].locked || table(o).length > 0);
try { const k = localStorage.getItem('lop.animal'); if (ANIMALS[k] && unlocked(k)) kind = k; } catch { /* no storage */ }

// → the new entry, if the score makes the table (below those it ties with)
function record(k, s) {
  const t = table(k);
  if (s <= 0 || (t.length >= TOP && s <= t[TOP - 1].score)) return null;
  const entry = { name: lastName || '???', score: s, date: new Date().toISOString().slice(0, 10) };
  const at = t.findIndex((e) => s > e.score);
  t.splice(at < 0 ? t.length : at, 0, entry);
  t.length = Math.min(t.length, TOP);
  saveTables();
  return entry;
}

// The high scores screen is drawn in the game, like the rest: the table of the animal standing out below (the others
// pick theirs), the new entry marked. A text field, invisible, lies over the new entry's name and takes the typing; on a
// phone a tap there brings up the keyboard.
let board = null; // the screen on show: { k: whose table, entry: the new one (marked), typing }
const scoresOpen = () => !!board;
const nameEl = document.getElementById('name');
const NAME_LEN = 10, ROW = 8, COLS = [57, 157]; // a row's height; the columns' left edges (rank, name, score: 92 wide)
const rowAt = (i) => [COLS[Math.floor(i / 5)], 14 + (i % 5) * ROW];

function showScores(k = kind, entry = null) {
  board = { k, entry, typing: !!entry, unlocks: entry?.unlocks };
  if (board.unlocks) { delete entry.unlocks; call('sting', 'discovery'); }
  if (entry) {
    nameEl.value = entry.name === '???' ? '' : entry.name;
    nameEl.hidden = false;
    placeName();
    if (!TOUCH) nameEl.focus({ preventScroll: true }); // a phone brings up its keyboard on a tap in the field
  }
}
function closeScores() {
  if (board?.typing) doneTyping();
  board = null;
}
function doneTyping() {
  board.typing = false;
  lastName = board.entry.name === '???' ? '' : board.entry.name;
  try { localStorage.setItem('lop.name', lastName); } catch { /* no storage */ }
  nameEl.blur();
  nameEl.hidden = true;
}
// the text field over the new entry's name, in the page's pixels
function placeName() {
  if (!board?.typing) return;
  const i = table(board.k).indexOf(board.entry), [x, y] = rowAt(i), s = view.clientWidth / W;
  Object.assign(nameEl.style, { left: `${view.offsetLeft + (x + 14) * s}px`, top: `${view.offsetTop + (y - 2) * s}px`, width: `${48 * s}px`, height: `${9 * s}px` });
}
new ResizeObserver(placeName).observe(view);
nameEl.addEventListener('input', () => {
  const v = nameEl.value.toUpperCase().replace(/[^A-Z0-9 .!-]/g, '').slice(0, NAME_LEN); // what the pixel font has
  if (v !== nameEl.value) nameEl.value = v;
  board.entry.name = v.trim() || '???';
  saveTables();
});
nameEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); doneTyping(); } });

// a tap on the screen: an animal shows its table, anywhere else ends the typing, or runs
function tapScores(x, y) {
  const k = y > GROUND - 24 && playable().find((_, i) => x >= titleX(i) - 2 && x < titleX(i) + 26);
  if (board.typing) doneTyping();
  else if (k) board.k = k;
  else { closeScores(); press(); }
}

function drawBoard(pal) {
  const ink = pal[COLOR.INK], dim = pal[COLOR.DIM], t = table(board.k);
  text(ctx, 'HIGH SCORES', W / 2, 4, ink, 'center');
  for (let i = 0; i < TOP; i++) {
    const [x, y] = rowAt(i), e = t[i], mark = e && e === board.entry;
    if (mark) { ctx.fillStyle = pal[7]; ctx.fillRect(x - 2, y - 2, 96, 9); }
    const c = mark ? pal.bg : e ? ink : dim;
    text(ctx, `${i + 1}.`, x + 11, y, c, 'right');
    text(ctx, e ? (board.typing && mark && e.name === '???' ? '' : e.name) : '-', x + 15, y, c);
    if (e) text(ctx, e.score, x + 91, y, c, 'right');
    if (mark && board.typing && blinkT % 0.8 < 0.5) { ctx.fillStyle = c; ctx.fillRect(x + 15 + (e.name === '???' ? 0 : e.name.length * 4), y + 5, 3, 1); } // the cursor
  }
  playable().forEach((k, i) => standing(k, i, k === board.k, pal));
  const [l1, l2, r1, r2] = board.typing
    ? ['NEW HIGH SCORE!', TOUCH ? 'TAP IT, TYPE A NAME' : 'TYPE YOUR NAME', TOUCH ? 'TAP HERE' : 'ENTER', 'WHEN DONE']
    : board.unlocks
      ? ['FOX UNLOCKED!', 'PICK IT TO PLAY IT', TOUCH ? 'TAP HERE' : 'SPACE: RUN', TOUCH ? 'TO RUN' : 'ESC: BACK']
      : [TOUCH ? 'TAP AN ANIMAL' : '< > ANIMALS', TOUCH ? 'FOR ITS SCORES' : '', TOUCH ? 'TAP HERE' : 'SPACE: RUN', TOUCH ? 'TO RUN' : 'ESC: BACK'];
  text(ctx, l1, 6, GROUND - 16, board.typing || board.unlocks ? pal[7] : ink); text(ctx, l2, 6, GROUND - 9, ink);
  text(ctx, r1, W - 6, GROUND - 16, ink, 'right'); text(ctx, r2, W - 6, GROUND - 9, ink, 'right');
}

// ------------------------------------------------------------------------------------------------------------ world
// low obstacles to jump (cacti, rocks, logs, low crows), high ones to duck under (branches, crows at head height),
// crows to run under; food now and then, on the ground or up in the air
function spawn() {
  const s = score(), r = rnd();
  let o;
  if (s >= CROWS_FROM && r < 0.22) {
    const at = ['low', 'head', 'head', 'high'][Math.floor(rnd() * 4)];
    const bottom = at === 'low' ? GROUND - 1 : at === 'head' ? DUCK_UNDER : GROUND - 24;
    o = { kind: 'crow', sprite: crow(0), x: W, y: bottom - CROW_BOTTOM, fly: 20, duck: at === 'head', over: at === 'high' };
  } else if (s >= BRANCHES_FROM && r < 0.38) {
    o = { kind: 'branch', sprite: branch(rnd), x: W, y: 0, fly: 0, duck: true };
  } else {
    const k = rnd(), sp = k < 0.15 ? rock(rnd) : k < 0.3 ? log(rnd) : cactus(rnd, s > 150 && rnd() < 0.35);
    o = { kind: 'ground', sprite: sp, x: W, y: GROUND - sp.h + 1, fly: 0 };
    // at speed, small cacti come in twos and threes
    for (let n = speed > 170 && rnd() < 0.35 ? 1 + Math.floor(rnd() * (speed > 220 ? 2 : 1)) : 0, x = W + sp.w; n > 0; n--) {
      const more = cactus(rnd, false);
      obstacles.push({ kind: 'ground', sprite: more, x: x - 2, y: GROUND - more.h + 1, fly: 0 });
      x += more.w - 2;
      o.extra = (o.extra || 0) + more.w - 2;
    }
  }
  obstacles.push(o);
  const gap = speed * (0.75 + rnd() * 0.9) + 24 + (o.duck ? 20 : 0);
  spawnIn = o.sprite.w + (o.extra || 0) + gap;
  // golden food, now and then: high over a ground obstacle (jump it at the right moment)
  if (o.kind === 'ground' && !gold && !power && s >= nextGold) {
    gold = { x: o.x + (o.sprite.w + (o.extra || 0)) / 2 - 6, y: GROUND - Math.min(48, o.sprite.h + 26) };
    nextGold = s + GOLD_GAP[0] + rnd() * (GOLD_GAP[1] - GOLD_GAP[0]);
  }
  if (rnd() < (power && kind === 'fox' ? 0.8 : 0.35)) { // (the sly fox finds more)
    const sp = FOOD[ANIMALS[kind].food];
    food.push({ x: W + o.sprite.w + (o.extra || 0) + gap / 2, y: rnd() < 0.5 ? GROUND - sp.h - 3 : GROUND - 30 - rnd() * 10 });
  }
}

// ?auto: jump what is low, duck what is at head height, run under the rest; jump for food in the air when it is clear
function autopilot() {
  const ahead = obstacles.filter((o) => o.x + o.sprite.w > RUN_X + 2 && !o.over).sort((a, b) => a.x - b.x)[0];
  ducking = false;
  if (power && (kind === 'dog' || kind === 'cat')) return; // zoomies, nine lives: straight through
  const gap = ahead ? ahead.x - (RUN_X + 22) : Infinity;
  if (ahead?.duck) { ducking = alt === 0 && gap < 30; return; }
  if (alt === 0 && gap < speed * 0.1 && gap > -8) return press();
  const snack = food.find((f) => f.y < GROUND - 20 && f.x > RUN_X);
  if (snack && alt === 0 && gap > 90 && snack.x - (RUN_X + 12) < speed * 0.12) press();
}

// the rabbit's tail: it bobs with every hop, and wiggles in quick bursts when the rabbit is not hopping
function wiggle() {
  if (kind !== 'rabbit') return 0;
  if (hopping()) return phase % 0.5 < 0.25 ? 1 : 0; // up a pixel, down again: twice a hop
  return blinkT % 1.7 < 0.45 && Math.floor(blinkT * 12) % 2 ? 1 : 0;
}
function animalSprite() {
  const blink = (blinkT % 3.2) < 0.12, w = wiggle();
  if (state === 'ko') return animal(kind, alt > 0 ? 'hurt' : 'ko', 0, soft, false, w);
  if (state === 'title') return animal(kind, 'idle', Math.floor(blinkT * 5) % 2, soft, blink, w);
  if (hurtT > 0) return animal(kind, 'hurt', 0, soft);
  if (alt > 0) return animal(kind, 'jump', vAlt > 0 ? 0 : 1, soft, blink);
  if (ducking) return animal(kind, 'duck', Math.floor(phase * 4) % 2, soft, blink, w);
  return animal(kind, 'run', stride(kind, phase).frame, soft, blink, w);
}
const hopping = () => state === 'run' && alt === 0 && !ducking && hurtT <= 0;
const animalY = () => GROUND - FOOT - alt - (hopping() ? stride(kind, phase).lift : 0);
const headAt = () => { const sp = animalSprite(); return [RUN_X + sp.head[0], animalY() + sp.head[1]]; };

function update(dt) {
  blinkT += dt;
  // the ear (the cat's tail) swings on a spring toward where the run, the wind and the jump would put it
  const target = state === 'title' ? 0.15 + 0.05 * Math.sin(blinkT * 2)
    : state === 'ko' ? (kind === 'rabbit' ? -0.3 : 1.2)
    : state !== 'run' ? 0.9
    : ducking && alt === 0 ? 1.5
    : alt > 0 ? 0.5 + Math.max(-0.4, Math.min(1.9, -vAlt / 220))
    : 0.45 + 0.12 * Math.sin(phase * Math.PI * 2);
  softVel += ((target - soft) * 170 - softVel * 11) * dt;
  soft += softVel * dt;
  if (state === 'ko') koT += dt;
  if (state === 'ko' && fresh && koT > 1.2) { showScores(kind, fresh); fresh = null; } // a new high score: its name
  if (AUTO && state === 'ko' && koT > 3) start();
  if (state !== 'run' && state !== 'ko') return;

  if (state === 'run') {
    if (AUTO) autopilot();
    t += dt;
    slow = Math.max(0, slow - dt / 1.2);
    speed = Math.min(MAX_SPEED, START_SPEED + ACCEL * t) * (chase ? 1.12 : 1) * (1 - 0.45 * slow) * (power && kind === 'dog' ? 1.3 : 1);
  } else speed *= Math.exp(-5 * dt); // knocked out: the world rolls to a stop (back a little, after a bump)
  const dx = speed * dt;
  dist += state === 'run' ? dx : 0;
  const was = phase;
  phase = (phase + dt * (1.6 + speed / 90)) % 1;
  if (phase < was && hopping() && kind === 'rabbit') { // a hop lands: the ear flops, a puff of dust
    softVel += 4;
    for (let i = 0; i < 2; i++) parts.push({ x: RUN_X + 6 + i * 4, y: GROUND - 1, vx: -20 - rnd() * 20, vy: -10 - rnd() * 15, life: 0.25, color: COLOR.FAINT });
  }
  flash = Math.max(0, flash - dt);
  safe = Math.max(0, safe - dt);
  hurtT = Math.max(0, hurtT - dt);

  // jumping: a held jump floats, a ducked one falls fast
  if (alt > 0 || vAlt > 0) {
    vAlt -= GRAVITY * (ducking ? 3 : 1) * dt;
    alt += vAlt * dt;
    if (alt > 56) { alt = 56; vAlt = Math.min(vAlt, 0); } // (a super hop stays on the screen)
    if (alt <= 0) {
      alt = 0; vAlt = 0; airJumps = 0;
      softVel += 7; // flop
      for (let i = 0; i < 3; i++) parts.push({ x: RUN_X + 8 + i * 3, y: GROUND - 1, vx: -30 - rnd() * 30, vy: -20 - rnd() * 20, life: 0.35, color: COLOR.INK });
    }
  }

  // the world moves left
  if (state === 'run') { spawnIn -= dx; if (spawnIn <= 0) spawn(); }
  for (const o of obstacles) {
    o.x -= dx + o.fly * dt;
    if (o.smashed) { o.x += o.vx * dt; o.y += o.vy * dt; o.vy += 600 * dt; } // bowled over: tumbling away
    if (o.kind === 'crow') o.sprite = crow(Math.floor(blinkT * 6) % 2);
  }
  obstacles = obstacles.filter((o) => o.x > -o.sprite.w && o.y < H);
  for (const f of food) f.x -= dx;
  food = food.filter((f) => f.x > -14);
  if (gold) { gold.x -= dx; if (gold.x < -14) gold = null; }
  for (const c of clouds) { c.x -= dx * 0.15; if (c.x < -20) { c.x = W + rnd() * 80; c.y = 8 + rnd() * 30; } }
  hillX += dx * 0.08;
  groundX = (groundX + dx) % GROUND_LOOP;
  if (chase) {
    chase.t += dt;
    if (chase.leaving || chase.t >= FOX_SECS) chase.x -= (state === 'run' ? 60 : 30) * dt;
    else chase.x = Math.min(-4, chase.x + 20 * dt) + Math.sin(chase.t * 9) * 0.6;
    if (chase.x < -40 && (chase.leaving || chase.t > FOX_SECS)) {
      if (!chase.leaving) {
        bonus += 100;
        call('sting', 'discovery');
        floats.push({ text: 'ESCAPED! +100', x: RUN_X, y: GROUND - 40, life: 1.4 });
      }
      chase = null;
    }
  }
  if (state !== 'run') return;

  // a super power wears off (a little warning first: the animal flashes slower)
  if (power) {
    power = Math.max(0, power - dt);
    if (rnd() < dt * 30) sparkle(1);
    if (!power) { call('sting', 'powerdown'); updateMood({ within: 0 }); }
  }

  // what the animal runs into, what it eats
  const sp = animalSprite(), ay = animalY();
  if (!safe) for (const o of obstacles) if (!o.smashed && hits(sp, RUN_X, ay, o.sprite, o.x, o.y)) { bump(o); if (state !== 'run') return; break; }
  const meal = FOOD[ANIMALS[kind].food];
  if (power && kind === 'fox') for (const f of food) { // sly: the food comes to the fox
    const tx = RUN_X + 10 - f.x, ty = ay + 8 - f.y, d = Math.hypot(tx, ty);
    if (d < 120 && d > 1) { f.x += (tx / d) * 160 * dt; f.y += (ty / d) * 160 * dt; }
  }
  if (gold && gold.x + meal.w > RUN_X + 3 && gold.x < RUN_X + 22 && gold.y + meal.h > ay + 3 && gold.y < ay + FOOT) { gold = null; startPower(); }
  food = food.filter((f) => {
    if (!(f.x + meal.w > RUN_X + 3 && f.x < RUN_X + 22 && f.y + meal.h > ay + 3 && f.y < ay + FOOT)) return true;
    energy = Math.min(100, energy + MEAL);
    bonus += 25;
    call('sting', 'reward');
    floats.push({ text: '+25', x: f.x, y: f.y - 6, life: 0.8 }, { sprite: heart, x: f.x + 14, y: f.y - 6, life: 0.8 });
    for (let i = 0; i < 6; i++) parts.push({ x: f.x + 3, y: f.y + 3, vx: (rnd() - 0.5) * 90, vy: -rnd() * 80, life: 0.5, color: COLOR.BERRY });
    return false;
  });

  // running tires: without food the energy runs out
  energy -= DRAIN * dt;
  if (energy <= 0) return knockOut('TOO TIRED!');

  // the events: night falls now and then, a fox gives chase now and then (never both at once)
  const s = score();
  if (night) { night = Math.max(0, night - dt); }
  else if (!chase && s >= nextNight) { night = NIGHT_SECS; nextNight += NIGHT_EVERY; }
  if (!chase && !night && s >= nextFox && !(power && kind === 'fox')) { chase = { t: 0, x: -40 }; nextFox += FOX_EVERY; }
  if (Math.floor(s / 100) > hundreds) { hundreds = Math.floor(s / 100); flash = 1; } // the score blinks every 100
  updateMood();
}

function updateBits(dt) {
  for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.life -= dt; }
  parts = parts.filter((p) => p.life > 0);
  for (const f of floats) { f.y -= 12 * dt; f.life -= dt; }
  floats = floats.filter((f) => f.life > 0);
}

// ------------------------------------------------------------------------------------------------------------- draw
const clouds = [{ x: 60, y: 14 }, { x: 170, y: 28 }, { x: 260, y: 10 }];
const stars = Array.from({ length: 28 }, () => ({ x: Math.floor(rnd() * W), y: Math.floor(rnd() * 50), p: rnd() * 6 }));
let hillX = 0, groundX = 0;
const GROUND_LOOP = 600;
const groundBits = Array.from({ length: 70 }, () => ({ x: Math.floor(rnd() * GROUND_LOOP), kind: rnd() < 0.15 ? 'tuft' : rnd() < 0.5 ? 'dash' : 'dot', y: 2 + Math.floor(rnd() * 4) }));
let stageBg = null;
const titleX = (i) => Math.round(W / 2 - 13 + (i - (playable().length - 1) / 2) * 34); // where the animals stand on the title

// an animal standing on the title (and the high scores): the one picked in front, with an arrow over it, the others
// faded behind
function standing(k, i, on, pal) {
  const x = titleX(i), blink = (blinkT % 3.2) < 0.12;
  ctx.globalAlpha = on ? 1 : 0.4;
  (on && !board ? animalSprite() : animal(k, 'idle', on ? Math.floor(blinkT * 5) % 2 : 0, 0.15, on && blink)).draw(ctx, x, GROUND - FOOT, pal);
  ctx.globalAlpha = 1;
  if (!on) return;
  const ax = x + 11, ay = GROUND - 25 + Math.round(Math.sin(blinkT * 5) * 0.6);
  ctx.fillStyle = pal[COLOR.INK];
  ctx.fillRect(ax - 2, ay, 5, 1); ctx.fillRect(ax - 1, ay + 1, 3, 1); ctx.fillRect(ax, ay + 2, 1, 1);
}

// the energy bar, top left: a heart and a bar that turns red (and blinks) when it runs low
function energyBar(pal) {
  const low = energy < 30;
  if (low && state === 'run' && Math.floor(blinkT * 4) % 2) return;
  heart.draw(ctx, 6, 5, pal);
  ctx.fillStyle = pal[COLOR.INK];
  ctx.fillRect(13, 5, 42, 5);
  ctx.fillStyle = pal.bg;
  ctx.fillRect(14, 6, 40, 3);
  ctx.fillStyle = pal[low ? COLOR.BERRY : COLOR.ENERGY];
  ctx.fillRect(14, 6, Math.ceil((40 * energy) / 100), 3);
}

// what is left of a super power, under the energy: a star and a golden bar (blinking in its last two seconds)
function powerBar(pal) {
  if (!power || (power < 2 && Math.floor(power * 6) % 2)) return;
  star.draw(ctx, 6, 12, pal);
  ctx.fillStyle = pal[COLOR.INK];
  ctx.fillRect(13, 12, 42, 5);
  ctx.fillStyle = pal.bg;
  ctx.fillRect(14, 13, 40, 3);
  ctx.fillStyle = pal[COLOR.YELLOW];
  ctx.fillRect(14, 13, Math.ceil((40 * power) / POWER_SECS), 3);
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

function draw() {
  const pal = night ? PALETTES.night : PALETTES.day;
  if (stageBg !== pal.bg) { // around the game in full screen, and the phone's bars
    document.documentElement.style.setProperty('--game-bg', stageBg = pal.bg);
    document.querySelector('meta[name=theme-color]').content = pal.bg;
  }
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);

  if (night) {
    for (const s of stars) if (Math.sin(blinkT * 2 + s.p) > -0.6) { ctx.fillStyle = pal[COLOR.INK]; ctx.fillRect(s.x, s.y, 1, 1); }
    moon.draw(ctx, W - 60, 10, pal);
  }
  // far hills
  ctx.fillStyle = pal[COLOR.FAINT];
  for (let x = 0; x < W; x++) {
    const u = x + hillX, h = 7 + 4 * Math.sin(u * 0.021) + 3 * Math.sin(u * 0.057 + 1.3);
    ctx.fillRect(x, Math.round(GROUND - h), 1, Math.round(h));
  }
  for (const c of clouds) cloud.draw(ctx, c.x, c.y, pal);

  // the ground
  ctx.fillStyle = pal[COLOR.INK];
  ctx.fillRect(0, GROUND, W, 1);
  for (const b of groundBits) {
    const x = Math.round(((b.x - groundX) % GROUND_LOOP + GROUND_LOOP) % GROUND_LOOP);
    if (x >= W) continue;
    if (b.kind === 'dot') ctx.fillRect(x, GROUND + b.y, 1, 1);
    else if (b.kind === 'dash') ctx.fillRect(x, GROUND + b.y, 3, 1);
    else { ctx.fillRect(x, GROUND - 1, 1, 1); ctx.fillRect(x + 2, GROUND - 2, 1, 2); ctx.fillRect(x + 4, GROUND - 1, 1, 1); }
  }

  if (board) { // the high scores, in place of the run
    drawBoard(pal);
    drawButtons(pal);
    return present();
  }

  const meal = FOOD[ANIMALS[kind].food];
  for (const f of food) meal.draw(ctx, f.x, f.y + Math.round(Math.sin(blinkT * 5 + f.x * 0.1)), pal);
  if (gold) { // golden, with a glint going round it
    const y = gold.y + Math.round(Math.sin(blinkT * 5));
    meal.draw(ctx, gold.x, y, golden(pal));
    const a = blinkT * 6;
    ctx.fillStyle = pal[COLOR.YELLOW];
    ctx.fillRect(Math.round(gold.x + meal.w / 2 + Math.cos(a) * (meal.w / 2 + 3)), Math.round(y + meal.h / 2 + Math.sin(a) * (meal.h / 2 + 3)), 1, 1);
    ctx.fillStyle = pal[COLOR.WHITE];
    ctx.fillRect(Math.round(gold.x + meal.w / 2 - Math.cos(a) * (meal.w / 2 + 3)), Math.round(y + meal.h / 2 - Math.sin(a) * (meal.h / 2 + 3)), 1, 1);
  }
  for (const o of obstacles) o.sprite.draw(ctx, o.x, o.y, pal);
  if (chase) chaser(kind === 'fox', Math.floor(chase.t * 10) % 2).draw(ctx, chase.x - 4, GROUND - 19, pal);

  if (state === 'title') playable().forEach((k, i) => standing(k, i, k === kind, pal));
  else {
    if (state === 'ko') dizzyBirds(pal, true);
    ctx.globalAlpha = safe > 0 && state === 'run' && Math.floor(safe * 10) % 2 ? 0.35 : 1;
    const flashing = power > 0 && Math.floor(power / (power > 2 ? 0.1 : 0.25)) % 2 === 0; // slower in the last two seconds
    animalSprite().draw(ctx, RUN_X, animalY(), flashing ? golden(pal) : pal);
    ctx.globalAlpha = 1;
    if (state === 'ko') dizzyBirds(pal, false);
  }
  for (const p of parts) { ctx.fillStyle = pal[p.color]; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
  for (const f of floats) {
    if (f.sprite) f.sprite.draw(ctx, f.x, Math.round(f.y), pal);
    else text(ctx, f.text, f.x, Math.round(f.y), pal[COLOR.INK]);
  }

  // the energy, the score (blinking at every hundred)
  if (state === 'run' || state === 'paused') { energyBar(pal); powerBar(pal); }
  const pad = (n) => String(n).padStart(5, '0');
  if (!(flash > 0 && Math.floor(flash * 8) % 2)) text(ctx, pad(score()), W - 6, 5, pal[COLOR.INK], 'right');
  if (best(kind)) text(ctx, `HI ${pad(best(kind))}`, W - 30, 5, pal[COLOR.DIM], 'right');

  if (state === 'title') {
    text(ctx, 'LOP EAR RUN', W / 2, 14, pal[COLOR.INK], 'center');
    if (TOUCH) {
      text(ctx, 'TAP AN ANIMAL TO PICK IT - TAP AGAIN TO RUN', W / 2, 25, pal[COLOR.INK], 'center');
      text(ctx, 'HOLD LEFT: DUCK      TAP RIGHT: JUMP', W / 2, GROUND + 6, pal[COLOR.DIM], 'center');
    } else text(ctx, '< > PICK - SPACE OR TAP TO RUN', W / 2, 25, pal[COLOR.INK], 'center');
  } else if (state === 'ko') {
    text(ctx, koWhy, W / 2, 24, pal[COLOR.INK], 'center');
    if (koT > 0.8) text(ctx, TOUCH ? 'TAP TO RUN AGAIN' : 'SPACE OR TAP TO RUN AGAIN', W / 2, 36, pal[COLOR.INK], 'center');
  } else if (state === 'paused') {
    text(ctx, TOUCH ? 'PAUSED - TAP TO GO ON' : 'PAUSED - SPACE OR TAP', W / 2, 30, pal[COLOR.INK], 'center');
  }

  drawButtons(pal);
  present();
}
// up to the screen, in whole pixels
function present() {
  vctx.imageSmoothingEnabled = false;
  vctx.drawImage(world, 0, 0, view.width, view.height);
}

function fit() {
  const scale = Math.max(1, Math.round((view.clientWidth * devicePixelRatio) / W));
  if (view.width !== W * scale) { view.width = W * scale; view.height = H * scale; }
}
new ResizeObserver(fit).observe(view);
fit();

// fixed steps, so a slow frame never lets the animal pass through a cactus; at most a quarter second caught up
const STEP = 1 / 120;
let last = performance.now(), behind = 0;
function frame(now) {
  behind = Math.min(0.25, behind + (now - last) / 1000);
  last = now;
  for (; behind >= STEP; behind -= STEP) if (state !== 'paused') { update(STEP); updateBits(STEP); }
  draw();
  requestAnimationFrame(frame);
}
updateMood();
requestAnimationFrame(frame);

// offline, and installable: a service worker keeps the game's files (not on localhost, where files change all the time)
if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(location.hostname)) navigator.serviceWorker.register('sw.js');
