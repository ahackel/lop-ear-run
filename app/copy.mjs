// Copies the game's files into www/ (what the app ships): the page, its code, the animals, the engine's code, the song,
// the icons and the languages. Not the service worker (the app has its files already) nor the tools. Run before `cap sync ios`.
import fs from 'node:fs';
import path from 'node:path';

const game = path.resolve(import.meta.dirname, '..');
const www = path.resolve(import.meta.dirname, 'www');
const engine = JSON.parse(fs.readFileSync(path.join(game, 'engine/files.json'), 'utf8'));
const files = [
  'index.html', 'game.js', 'level.js', 'music.js', 'version.js', 'lang.js', 'art.js', 'song.zip', 'manifest.webmanifest',
  ...fs.readdirSync(path.join(game, 'lang')).map((f) => `lang/${f}`),
  ...fs.readdirSync(path.join(game, 'animals')).filter((f) => f.endsWith('.js')).map((f) => `animals/${f}`),
  ...fs.readdirSync(path.join(game, 'icons')).map((f) => `icons/${f}`),
  'engine/files.json', ...engine.map((f) => `engine/${f}`),
];

fs.rmSync(www, { recursive: true, force: true });
for (const f of files) {
  fs.mkdirSync(path.dirname(path.join(www, f)), { recursive: true });
  fs.copyFileSync(path.join(game, f), path.join(www, f));
}
// the app's version and build (from the Xcode project, which npm run testflight raises) for the credits: 1.0.1 (2)
const proj = fs.readFileSync(path.join(import.meta.dirname, 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8');
const app = `${proj.match(/MARKETING_VERSION = ([\d.]+);/)[1]} (${proj.match(/CURRENT_PROJECT_VERSION = (\d+);/)[1]})`;
const version = path.join(www, 'version.js');
fs.writeFileSync(version, fs.readFileSync(version, 'utf8').replace("APP_VERSION = ''", `APP_VERSION = '${app}'`));
console.log(`copied ${files.length} files into www/, the app's version ${app}`);
