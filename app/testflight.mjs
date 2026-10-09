// npm run testflight [-- patch|minor|major] — builds the app and uploads it to App Store Connect for TestFlight.
// The version (MARKETING_VERSION) goes up by the part named, or stays the same without one (another build of the same
// version); the build number (CURRENT_PROJECT_VERSION) goes up by one every time, as App Store Connect wants. Runs the
// tests, copies the game's files in (npm run sync), archives (the archive lands in Xcode's Organizer), uploads with the
// account Xcode is signed in with, then commits the new numbers and tags the commit ios-<version>-<build>.
// The game's repo must have nothing uncommitted: a build is a commit.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const app = import.meta.dirname;
const game = path.resolve(app, '..');
const pbxproj = path.join(app, 'ios/App/App.xcodeproj/project.pbxproj');
const pkg = path.join(app, 'package.json');
const TEAM = 'C264MT23KT';

const run = (cmd, args, cwd = app) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });
const read = (cmd, args, cwd = app) => execFileSync(cmd, args, { cwd, encoding: 'utf8' }).trim();
const fail = (why) => { console.error(`testflight: ${why}`); process.exit(1); };

const part = process.argv[2];
if (part && !['patch', 'minor', 'major'].includes(part)) fail(`"${part}"? say patch, minor or major (or nothing: a new build of the same version)`);
if (read('git', ['status', '--porcelain'], game)) fail('the repo has uncommitted changes: commit them first, a build is a commit');

// the numbers, from the Xcode project (both configurations carry them)
const proj = fs.readFileSync(pbxproj, 'utf8');
const [, was] = proj.match(/MARKETING_VERSION = ([\d.]+);/);
const [, wasBuild] = proj.match(/CURRENT_PROJECT_VERSION = (\d+);/);
let [major, minor, patch] = [...was.split('.').map(Number), 0, 0, 0];
if (part === 'major') [major, minor, patch] = [major + 1, 0, 0];
if (part === 'minor') [minor, patch] = [minor + 1, 0];
if (part === 'patch') patch++;
const version = `${major}.${minor}.${patch}`, build = +wasBuild + 1;
console.log(`Lop Hop ${version} (${build})${part ? `, was ${was}` : ''}`);

fs.writeFileSync(pbxproj, proj
  .replace(/MARKETING_VERSION = [\d.]+;/g, `MARKETING_VERSION = ${version};`)
  .replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${build};`));
fs.writeFileSync(pkg, fs.readFileSync(pkg, 'utf8').replace(/"version": "[^"]*"/, `"version": "${version}"`));
const undo = () => run('git', ['checkout', '--', pbxproj, pkg], game);

try {
  run('npm', ['test'], game);
  run('npm', ['run', 'sync']);

  // where Xcode keeps its archives, so the Organizer lists this one too
  const day = new Date().toISOString().slice(0, 10);
  const archive = path.join(os.homedir(), 'Library/Developer/Xcode/Archives', day, `Lop Hop ${version} (${build}).xcarchive`);
  run('xcodebuild', ['archive', '-project', 'ios/App/App.xcodeproj', '-scheme', 'App', '-configuration', 'Release',
    '-destination', 'generic/platform=iOS', '-archivePath', archive, '-allowProvisioningUpdates', '-quiet']);

  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'lophop-'));
  fs.writeFileSync(path.join(out, 'ExportOptions.plist'), `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>upload</string>
  <key>teamID</key><string>${TEAM}</string>
  <key>signingStyle</key><string>automatic</string>
  <key>manageAppVersionAndBuildNumber</key><false/>
  <key>uploadSymbols</key><true/>
</dict></plist>
`);
  run('xcodebuild', ['-exportArchive', '-archivePath', archive, '-exportOptionsPlist', path.join(out, 'ExportOptions.plist'),
    '-exportPath', out, '-allowProvisioningUpdates']);
} catch {
  undo();
  fail('stopped; the numbers are back as they were');
}

run('git', ['add', pbxproj, pkg], game);
run('git', ['commit', '-m', `TestFlight ${version} (${build})`], game);
run('git', ['tag', `ios-${version}-${build}`], game);
console.log(`\nuploaded Lop Hop ${version} (${build}): App Store Connect processes it for TestFlight in about 10–30 minutes.`);
console.log(`committed and tagged ios-${version}-${build}; git push --follow-tags to share them.`);
