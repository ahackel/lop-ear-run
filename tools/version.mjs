// node tools/version.mjs — writes version.js: when this build was made and which engine it plays (engine/VERSION), for
// the credits screen (the iOS app's version, APP, is filled in by app/copy.mjs in the app's copy). The pre-commit hook (tools/hooks/pre-commit) runs it at each commit; once per checkout:
// git config core.hooksPath tools/hooks
import { readFileSync, writeFileSync } from 'node:fs';

const now = new Date(), two = (n) => String(n).padStart(2, '0');
const engine = readFileSync(new URL('../engine/VERSION', import.meta.url), 'utf8').match(/stardrift-engine (\w+)( \(with uncommitted changes\))?/);
const built = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()} ${two(now.getHours())}:${two(now.getMinutes())}`;
writeFileSync(new URL('../version.js', import.meta.url), `// written by tools/version.mjs at each commit (tools/hooks/pre-commit): shown on the credits screen
export const BUILT = '${built}', ENGINE = '${engine ? engine[1] + (engine[2] ? '+' : '') : '?'}', APP = '';
`);
