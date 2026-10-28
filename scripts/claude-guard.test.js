// Quick check of the guard: node scripts/claude-guard.test.js
const { spawnSync } = require('child_process');
const path = require('path');

const guard = path.join(__dirname, 'claude-guard.js');
const cases = [
  ['git commit -m "docs: mention the no-verify flag" -m "--no-verify"', 0],
  ['git commit --no-verify -m x', 2],
  ['git push -n origin main', 2],
  ['HUSKY=0 git commit -m x', 2],
  ['git config core.hooksPath', 0],
  ['git config core.hooksPath /dev/null', 2],
  ["git commit -F- <<'EOF'\nmsg --no-verify\nEOF", 0],
  ['git status', 0],
];

let failed = 0;
for (const [command, expected] of cases) {
  const r = spawnSync('node', [guard], { input: JSON.stringify({ tool_input: { command } }) });
  const ok = r.status === expected;
  if (!ok) failed++;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} exit=${r.status} expected=${expected}  ${JSON.stringify(command)}`
  );
}
process.exit(failed ? 1 : 0);
