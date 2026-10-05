# Lop Hop

A little endless runner: a lop-eared rabbit hops over cacti, rocks and logs, ducks under branches and crows, and eats to keep its energy up. Every bump costs energy; with none left, it is knocked out (birds circle its head). A run is days and nights, and every day is harder than the one before (up to the fifth: faster, closer obstacles, more crows and packs, hungrier). At night the next animal chases it, closer with every bump; a second bump while it is close and it catches the animal. Getting away till dawn unlocks that one: fifteen in all, the rabbit the easy start, each after it clearly harder (faster, hungrier, bumps cost more, crows sooner, obstacles closer and in packs) and worth more points (×1 to ×4). Now and then golden food floats high over an obstacle: catching it gives a super power for 8 seconds, each animal its own. One table of ten high scores, kept in the browser. Everything, the buttons and the high scores too, is drawn in the game's own low-res pixels.

| Animal | Food | Power |
|---|---|---|
| rabbit (×1) | carrot | super hop: higher, and once more in the air |
| cat (×1.21) | fish | nine lives: bounces off what it hits |
| dog (×1.43) | bone | zoomies: faster, bowls everything over |
| fox (×1.64) | grapes | sly fox: food comes to it, the chaser loses its trail |
| hedgehog (×1.86) | apple | spike ball: rolls through everything |
| squirrel (×2.07) | acorn | glide: falls slowly, jumps again in the air |
| otter (×2.29) | shell | belly slide: under what hangs low, through the rest |
| skunk (×2.5) | beetle | stink: obstacles fade (it runs through them), crows and the chaser flee |
| wolf (×2.71) | sausage | howl: what is just ahead is blown away |
| boar (×2.93) | mushroom | tusk charge: faster, smashes everything (worth double) |
| bear (×3.14) | blueberries | berry rush: double points, food fills it twice as much |
| cheetah (×3.36) | drumstick | sprint: very fast, and untouchable |
| rhino (×3.57) | leaf | quake: stomps, everything on the screen flies off |
| sabre-tooth (×3.79) | ham | ice age: obstacles freeze and shatter |
| dino (×4) | roast leg | giant dino: twice as big, it tramples everything in its way, for double points (the rabbit chases it) |

**Play: https://andreashackel.de/lop-hop/** — on a computer, or on a phone held sideways. Add it to the home screen (Share → Add to Home Screen on an iPhone, Install app on Android) and it runs full screen, offline too (online, it always loads the latest version).

| | Keyboard | Touch |
|---|---|---|
| jump (hold to jump higher) | <kbd>Space</kbd> / <kbd>↑</kbd> | tap the right half |
| duck | <kbd>↓</kbd> | hold the left half |
| pick an animal | <kbd>←</kbd> <kbd>→</kbd> on the title | tap it on the title |
| sound, high scores, full screen | <kbd>M</kbd>, <kbd>H</kbd>, <kbd>F</kbd> | the buttons at the top left of the game |

The music is [Stardrift](https://github.com/ahackel/stardrift-engine), a procedural chiptune engine for games: the song (`song.json`) has a mood for each state of play and stingers for its events, and the page shows the calls as the game makes them (`?auto` lets the animal run by itself, to hear the moods come and go):

| Game | Music |
|---|---|
| title | `setMood('menu')` |
| high scores | `setMood('highscore')` |
| knocked out | `setMood('relaxed')` |
| the first stretch, crows from 300, fast from 700 | `exploring`, `tension`, `action` |
| night falls (after every 1000) | `wonder` |
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
npm test           # the song plays every mood and stinger; every animal is tall enough to hit a branch and ducks under it
npm run engine     # copies the engine from ../stardrift-engine into engine/ (or: node tools/engine.mjs <path>)
npm run icons      # draws icons/ from the game's own pixel art
npm run rigs       # writes every animal's build the way the workshop saves it
```

The animals are edited in the workshop: with `npm run dev` running, open http://localhost:8323/tools/workshop.html.
Drag the handles on the joints, shapes, legs, tails and ears, pick colors and layers in the list, watch the animal run in
the game's scene, and save: it writes the animal's build back into its file.

| Path | |
|---|---|
| `index.html` | the page: the game and the music panel; on phones and installed, only the game |
| `game.js` | the game: input, the run, energy, its buttons, the high scores, the calls to the music |
| `art.js` | the pixel art, drawn from shapes: the rigs that draw the animals, obstacles, food, a 3×5 font |
| `animals/` | an animal each: its build (joints, shapes, legs, chains, face: the data the workshop edits) and its moves; `kit.js`: what they share |
| `tools/workshop.html` | the animal workshop (through `npm run dev`, which saves for it) |
| `song.json` | the music |
| `engine/` | a copy of the Stardrift engine (`engine/VERSION` says which commit); `npm run engine` refreshes it |
| `sw.js`, `manifest.webmanifest`, `icons/` | the installable app: offline files, name, icons, landscape |

## License

MIT (see `LICENSE`), the engine copy in `engine/` too. Its sample library is CC0 (public domain) recordings by Versilian Studios.
