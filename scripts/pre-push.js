// Runs the full E2E suite before push, only when runtime files changed.
// Git feeds "<local ref> <local sha> <remote ref> <remote sha>" lines on stdin.
const { execSync, spawnSync } = require('child_process');

const RUNTIME =
  /^(src\/|js\/|css\/|HTMLReport\/|lib\/|background\.js|popup\.html|tutorial\.html|manifest\.json|test\/e2e\/)/;
const ZERO = /^0+$/;
const git = (cmd) =>
  execSync(`git ${cmd}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

const lines = require('fs').readFileSync(0, 'utf8').split('\n').filter(Boolean);
const changed = new Set();
for (const line of lines) {
  const [, localSha, , remoteSha] = line.split(' ');
  if (ZERO.test(localSha)) continue; // branch deletion
  let from = remoteSha;
  if (ZERO.test(remoteSha)) {
    try {
      from = git(`merge-base ${localSha} origin/master`);
    } catch {
      from = null; // unknown history: assume everything changed
    }
  }
  if (!from) {
    changed.add('manifest.json');
    continue;
  }
  git(`diff --name-only ${from} ${localSha}`)
    .split('\n')
    .filter(Boolean)
    .forEach((f) => changed.add(f));
}

if (![...changed].some((f) => RUNTIME.test(f))) {
  console.log('pre-push: no runtime files changed, skipping E2E');
  process.exit(0);
}
console.log('pre-push: runtime files changed, running E2E (headless)...');
const r = spawnSync('npm', ['run', 'test:e2e:ci'], { stdio: 'inherit', shell: true });
process.exit(r.status === null ? 1 : r.status);
