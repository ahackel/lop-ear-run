# Lop Hop

A little endless runner: a lop-eared rabbit hops over cacti, rocks and logs, ducks under branches and crows, and eats to keep its energy up. Every bump costs energy; with none left, it is knocked out (birds circle its head). The next animal chases it, and reaching night unlocks that one: fifteen in all, the rabbit the easy start, each after it clearly harder (faster, hungrier, bumps cost more, crows sooner, obstacles closer and in packs) and worth more points (×1 to ×4). Now and then golden food floats high over an obstacle: catching it gives a super power for 8 seconds, each animal its own. One table of ten high scores, kept in the browser. Everything, the buttons and the high scores too, is drawn in the game's own low-res pixels.

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
| dino (×4) | fern | chrome mode: the world turns Google-grey, it runs through everything for double points (the rabbit chases it) |

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
| title, knocked out | `setMood('relaxed')` |
| the first stretch, crows from 300, fast from 700 | `exploring`, `tension`, `action` |
| the next animal gives chase (from 500, every 1000) | `danger` |
| night falls (every 900) | `wonder` |
| a super power (golden food, 8 s) | `power`, with `sting('power')` and `sting('powerdown')` |
| jump, food, a bump, the fox left behind, knocked out | `sting('jump')`, `reward`, `bump`, `discovery`, `alert` |

## Working on it

Plain files, no build step: GitHub Pages serves the repo as it is.

```bash
npm run dev        # http://localhost:8323 (the audio needs http://, not file://)
npm test           # the song plays every mood and stinger; every animal is tall enough to hit a branch and ducks under it
npm run engine     # copies the engine from ../stardrift-engine into engine/ (or: node tools/engine.mjs <path>)
npm run icons      # draws icons/ from the game's own pixel art
```

| Path | |
|---|---|
| `index.html` | the page: the game and the music panel; on phones and installed, only the game |
| `game.js` | the game: input, the run, energy, its buttons, the high scores, the calls to the music |
| `art.js` | the pixel art, drawn from shapes: animals (with swinging ears and tails), obstacles, food, a 3×5 font |
| `song.json` | the music |
| `engine/` | a copy of the Stardrift engine (`engine/VERSION` says which commit); `npm run engine` refreshes it |
| `sw.js`, `manifest.webmanifest`, `icons/` | the installable app: offline files, name, icons, landscape |

## License

MIT (see `LICENSE`), the engine copy in `engine/` too. Its sample library is CC0 (public domain) recordings by Versilian Studios.
