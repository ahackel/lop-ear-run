# Lop Hop

A little endless runner: a lop-eared rabbit hops over bushes, cacti, rocks and logs, ducks under branches and crows, and eats to keep its energy up. Every bump costs energy; with none left, it is knocked out (birds circle its head). A run is days and nights, each day in a land of its own, with obstacles of its own (the meadow: bushes and sunflowers; the desert: cacti and tumbleweeds; the forest: toadstools, pines and stumps; the mountains: rocks and boulders; the canyon: red rock spires; the snow: snowmen, snowy pines and ice; then round again, its name shown at dawn), and it keeps getting harder, with no top: faster, closer obstacles, more crows, branches and packs, less food, more tiring, so even a player who never misses runs out of energy in the end. An animal's course is the same every run (what comes and where), and every obstacle can be got past: there is always room to land and jump, duck or stand up in time. A jump pressed just before landing jumps as the animal lands; one pressed while ducking does nothing (let go of the duck first). Food eaten one after another is worth more (25, 50, 75, 100), until a bump or a missed one. At night the next animal chases it, closer with every bump; a second bump while it is close and it catches the animal. Getting away till dawn unlocks that one: twenty-one in all, the rabbit the easy start, each after it a little harder (faster, hungrier, bumps cost more, crows sooner, obstacles closer and in packs, and a head start on the run's hardness) and worth more points (×1 to ×4). Now and then golden food floats high over an obstacle: catching it gives a super power for 8 seconds, each animal its own. Every animal has a song of its own: the game's song in its key, mode and pace, with its own voices and a motif of its own (the same three recordings). One table of ten high scores, kept in the browser. Everything, the buttons and the high scores too, is drawn in the game's own low-res pixels.

| Animal | Food | Power |
|---|---|---|
| rabbit (×1) | carrot | super hop: higher, and once more in the air |
| guinea pig (×1.1) | cucumber | popcorn: hops by itself over everything (and for joy), ducks under what hangs low |
| cat (×1.21) | fish | nine lives: bounces off what it hits |
| dog (×1.43) | bone | zoomies: faster, bowls everything over |
| pig (×1.53) | truffle | truffle snout: what is just ahead is dug up as truffles, to eat on the way |
| fox (×1.64) | grapes | sly fox: food comes to it, the chaser loses its trail |
| hedgehog (×1.86) | apple | spike ball: rolls through everything |
| squirrel (×2.07) | acorn | glide: falls slowly, jumps again in the air |
| otter (×2.29) | shell | belly slide: under what hangs low, through the rest |
| skunk (×2.5) | beetle | stink: obstacles fade (it runs through them), crows and the chaser flee |
| wolf (×2.71) | sausage | howl: what is just ahead is blown away |
| boar (×2.93) | mushroom | tusk charge: faster, smashes everything (worth double) |
| bear (×3.14) | blueberries | berry rush: double points, food fills it twice as much |
| yak (×3.21) | hay | stampede: a herd runs by again and again, trampling what is ahead; the chaser flees |
| ostrich (×3.29) | melon | fly: keeps flying, its wings beating, while the jump is held |
| cheetah (×3.36) | drumstick | sprint: very fast, and untouchable |
| dromedary (×3.46) | date | spit: knocks crows and branches away |
| rhino (×3.57) | leaf | quake: stomps, everything on the screen flies off |
| gorilla (×3.68) | fig | chest drum: ducking drums instead, and the next obstacle is knocked over |
| elephant (×3.79) | peanut | splash: sprays water from its raised trunk, what is just ahead is washed away |
| dino (×4) | roast leg | giant dino: twice as big, it tramples everything in its way, for double points (the rabbit chases it) |

**Play: https://andreashackel.de/lop-hop/** — on a computer, or on a phone held sideways. Add it to the home screen (Share → Add to Home Screen on an iPhone, Install app on Android) and it runs full screen, offline too (online, it always loads the latest version).

| | Keyboard | Touch |
|---|---|---|
| jump (hold to jump higher) | <kbd>Space</kbd> / <kbd>↑</kbd> | tap the right half |
| duck | <kbd>↓</kbd> | hold the left half |
| pick an animal | <kbd>←</kbd> <kbd>→</kbd> on the title | tap it on the title |
| sound, high scores, credits, full screen | <kbd>M</kbd>, <kbd>H</kbd>, <kbd>C</kbd>, <kbd>F</kbd> | the buttons at the top left of the game |

The music is [Stardrift](https://github.com/ahackel/stardrift-engine), a procedural chiptune engine for games: the song (`song.zip`: the song and the recordings it plays, as the editor's *Export for a game* writes it) has a mood for each state of play and stingers for its events, and the page shows the calls as the game makes them (with `?music`, on a computer; `?auto` lets the animal run by itself, to hear the moods come and go):

| Game | Music |
|---|---|
| title | `setMood('menu')` |
| high scores | `setMood('highscore')` |
| knocked out | `setMood('relaxed')` |
| the first stretch, crows from 300, fast from 700 | `exploring`, `tension`, `action` |
| night falls (after every day's 1000) | `wonder` |
| the next animal gives chase (through the night) | `danger` |
| a super power (golden food, 8 s) | `power`, with `sting('power')` and `sting('powerdown')` |
| a run starts, a jump, food, a bump, a smash | `sting('go')`, `jump`, `reward`, `bump`, `smash` |
| night falls, and the chaser comes | `sting('dusk')`, `chased` |
| dawn: the chaser is left behind (unlocked the first time: `discovery`; already lost: `dawn`) | `sting('escape')` |
| past the best score so far | `sting('record')` |
| knocked out (into the high scores) | `sting('alert')` (`fanfare`) |

## Working on it

Plain files, no build step: GitHub Pages serves the repo as it is.

```bash
npm run dev        # http://localhost:8323 (the audio needs http://, not file://)
npm test           # the song plays every mood and stinger; every animal is tall enough to hit a branch and ducks under it;
                   # every course is the same every run and can be got past (played through, six days); it gets harder
                   # every day and with every animal; nothing newer than Safari 15 without a fallback
node tools/course.mjs  # the courses, day by day: how fast, how close, food against tiredness, where energy runs out
npm run engine     # copies the engine from ../stardrift-engine into engine/ (or: node tools/engine.mjs <path>)
npm run icons      # draws icons/ from the game's own pixel art
npm run rigs       # writes every animal's build the way the workshop saves it
```

Once per checkout, `git config core.hooksPath tools/hooks`: at each commit the hook writes `version.js` (when the build
was made, and which engine it plays), which the credits screen shows.

In the address: `?music` shows the music's moods and calls under the game, `?all` opens every animal for a visit, `?auto` runs by itself, `?fps` shows the frames a second and the
work of a frame (on average and at most, in ms: a frame has 16.7 at 60) and the canvas's size, `?scale=3` draws the game
3 screen pixels an art pixel (fewer than the screen has: the page scales it up).

The animals are edited in the workshop: with `npm run dev` running, open http://localhost:8323/tools/workshop.html.
Drag the handles on the joints, shapes, legs, tails and ears, pick colors and layers in the list, watch the animal run in
the game's scene, and save: it writes the animal's build back into its file. Its moves are on a timeline, with the frames
before and after faded: a jump, hurt or knocked-out pose can be set by hand (drag the joints, paws, head, tail and ears of
each keyframe), a run or a crawl tuned by its gait's settings. In the game, an animal eases from one move into the next
and squashes as it lands.

| Path | |
|---|---|
| `index.html` | the page: only the game, on every screen (`?music` on a computer: the music's moods and calls under it) |
| `game.js` | the game: input, the run, energy, its buttons, the high scores, the calls to the music |
| `music.js` | a song for every animal: the song in its key, mode, pace and swing, with its own voices and a motif (the rabbit's: the song as it is) |
| `level.js` | the course: what comes where (the same every run, for an animal), how fast, how it gets harder, why it is fair |
| `art.js` | the pixel art, drawn from shapes: the rigs that draw the animals, obstacles, food, a 3×5 font |
| `animals/` | an animal each: its build (joints, shapes, legs, chains, face: the data the workshop edits) and its moves; `kit.js`: what they share |
| `tools/workshop.html` | the animal workshop (through `npm run dev`, which saves for it) |
| `version.js` | when the build was made, and its engine (written at each commit, `tools/version.mjs`) |
| `song.zip` | the music: the song and its recordings, loaded as it is (`music.loadZip`); a new version comes from the [editor](https://github.com/ahackel/stardrift)'s *Export for a game*, saved over it |
| `engine/` | a copy of the Stardrift engine's code (`engine/VERSION` says which commit; its recordings come in `song.zip`); `npm run engine` refreshes it |
| `sw.js`, `manifest.webmanifest`, `icons/` | the installable app: offline files, name, icons, landscape |

## License

MIT (see `LICENSE`), the engine copy in `engine/` too. The recordings in `song.zip` are CC0 (public domain), by Versilian Studios.
