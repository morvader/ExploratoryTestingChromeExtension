// Claude Code PreToolUse hook: stop agents from bypassing the git hooks.
let input = '';
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  let command = '';
  try {
    command = JSON.parse(input).tool_input.command || '';
  } catch {
    process.exit(0);
  }
  // Ignore heredoc bodies and quoted text (e.g. a commit message that mentions the flag)
  command = command
    .replace(/<<-?\s*['"]?(\w+)['"]?[\s\S]*?\n\s*\1\b/g, '')
    .replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, '""');
  const bypass =
    /\bgit\b[^|;&]*\b(commit|push)\b[^|;&]*(--no-verify|\s-n\b)/.test(command) ||
    /\bHUSKY\s*=\s*0\b/.test(command) ||
    /core\.hooksPath\s+[^\s;&|]/.test(command) || // sets a new hooks path
    /--unset\s+core\.hooksPath/.test(command);
  if (bypass) {
    console.error(
      'Blocked: do not bypass git hooks. Fix the lint/format/test failure instead (see "Definition of done" in AGENTS.md).'
    );
    process.exit(2);
  }
});
