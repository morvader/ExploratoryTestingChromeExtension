// Release gate: run before uploading a new version to the Chrome Web Store.
// Blocks on: version not bumped, package/manifest version drift, runtime files
// missing from the zip allowlist, and high/critical npm audit findings.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const run = (cmd) =>
  execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

// --staged (pre-commit): skip unless the staged manifest differs in content from
// HEAD, so formatting-only changes to manifest.json don't trigger the gate.
if (process.argv.includes('--staged')) {
  try {
    const staged = JSON.parse(run('git show :manifest.json'));
    const head = JSON.parse(run('git show HEAD:manifest.json'));
    if (JSON.stringify(staged) === JSON.stringify(head)) {
      console.log('release:check skipped (manifest.json content unchanged)');
      process.exit(0);
    }
  } catch {
    // no HEAD or unreadable manifest: fall through and run the full check
  }
}

const errors = [];
const warnings = [];

const parse = (v) => v.split('.').map((n) => parseInt(n, 10));
const compare = (a, b) => {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1;
  return 0;
};

const manifest = JSON.parse(read('manifest.json'));
const pkg = JSON.parse(read('package.json'));

// 1. Version must be higher than the one already on the base branch
function baseVersion() {
  for (const ref of ['origin/master', 'master', 'origin/main', 'main']) {
    try {
      return JSON.parse(run(`git show ${ref}:manifest.json`)).version;
    } catch {
      // try next ref
    }
  }
  return null;
}
const branch = run('git rev-parse --abbrev-ref HEAD').trim();
const base = baseVersion();
if (base && !['master', 'main'].includes(branch) && compare(manifest.version, base) <= 0) {
  errors.push(
    `manifest.json version ${manifest.version} must be higher than base branch version ${base}`
  );
}

// 2. package.json and manifest.json must agree
if (pkg.version !== manifest.version) {
  errors.push(`package.json version ${pkg.version} differs from manifest.json ${manifest.version}`);
}

// 3. Everything the manifest references must be in the zip allowlist
const ps1 = read('genetareZip.ps1');
const allow = [...ps1.matchAll(/^\s+"([^"]+)",?\s*$/gm)].map((m) => m[1]);
const referenced = new Set();
const collect = (v) => {
  if (typeof v === 'string' && /\.(js|html|css|png|jpg|svg)$/.test(v))
    referenced.add(v.replace(/^\//, ''));
  else if (Array.isArray(v)) v.forEach(collect);
  else if (v && typeof v === 'object') Object.values(v).forEach(collect);
};
collect(manifest);
for (const file of referenced) {
  if (!fs.existsSync(path.join(root, file)))
    errors.push(`manifest references missing file: ${file}`);
  else if (!allow.some((a) => file === a || file.startsWith(`${a}/`))) {
    errors.push(`manifest references ${file} but genetareZip.ps1 does not package it`);
  }
}
for (const item of allow) {
  if (!fs.existsSync(path.join(root, item)))
    errors.push(`zip allowlist entry missing on disk: ${item}`);
}

// 4. Dependency audit
try {
  const out = execSync('npm audit --json', {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  report(JSON.parse(out));
} catch (e) {
  try {
    report(JSON.parse(e.stdout));
  } catch {
    warnings.push('npm audit could not run (offline?) - skipped');
  }
}
function report(audit) {
  const v = (audit.metadata && audit.metadata.vulnerabilities) || {};
  const blocking = (v.high || 0) + (v.critical || 0);
  if (blocking)
    errors.push(`npm audit: ${v.high || 0} high, ${v.critical || 0} critical vulnerabilities`);
  const minor = (v.low || 0) + (v.moderate || 0);
  if (minor)
    warnings.push(`npm audit: ${v.low || 0} low, ${v.moderate || 0} moderate vulnerabilities`);
}

warnings.forEach((w) => console.warn(`warn: ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`error: ${e}`));
  process.exit(1);
}
console.log(`release:check ok (version ${manifest.version})`);
