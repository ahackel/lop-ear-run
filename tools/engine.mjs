// node tools/engine.mjs [path] — copies the Stardrift engine (src/ and its sample library) into engine/, from a checkout
// of github.com/ahackel/stardrift-engine (../stardrift-engine by default). The game imports it from there (an import
// map in index.html), so the site runs as plain files, on GitHub Pages too. engine/VERSION says which commit it is;
// engine/files.json lists its files, for the service worker to keep (offline play).
import { cpSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const from = path.resolve(process.argv[2] || '../stardrift-engine');
const to = path.resolve('engine');
if (!existsSync(path.join(from, 'src/index.js'))) throw new Error(`no engine at ${from}`);
rmSync(to, { recursive: true, force: true });
cpSync(path.join(from, 'src'), path.join(to, 'src'), { recursive: true });
cpSync(path.join(from, 'library'), path.join(to, 'library'), { recursive: true, filter: (f) => !f.endsWith('.DS_Store') });
cpSync(path.join(from, 'LICENSE'), path.join(to, 'LICENSE'));
const git = (...args) => execFileSync('git', ['-C', from, ...args], { encoding: 'utf8' }).trim();
const commit = git('rev-parse', '--short', 'HEAD') + (git('status', '--porcelain', '--', 'src', 'library') ? ' (with uncommitted changes)' : '');
writeFileSync(path.join(to, 'VERSION'), `stardrift-engine ${commit}\n`);
const files = readdirSync(to, { recursive: true, withFileTypes: true }).filter((f) => f.isFile() && f.name !== 'files.json')
  .map((f) => path.relative(to, path.join(f.parentPath, f.name)).split(path.sep).join('/')).sort();
writeFileSync(path.join(to, 'files.json'), JSON.stringify(files, null, 1) + '\n');
console.log(`engine/ ← ${from} at ${commit}`);
