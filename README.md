# Lop Ear Run

A little endless runner: a lop-eared rabbit, a beagle puppy or a kitten hops over cacti, rocks and logs, ducks under branches and crows, and eats to keep its energy up. Every bump costs energy; with none left, it is knocked out (birds circle its head). Ten high scores per animal, kept in the browser. Everything, the buttons and the high scores too, is drawn in the game's own low-res pixels.

**Play: https://andreashackel.de/lop-ear-run/** — on a computer, or on a phone held sideways. Add it to the home screen (Share → Add to Home Screen on an iPhone, Install app on Android) and it runs full screen, offline too (online, it always loads the latest version).

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
| a fox gives chase (from 500, every 1000) | `danger` |
| night falls (every 900) | `wonder` |
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
