import { spawnSync } from 'node:child_process';

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(
  command,
  ['prisma', 'db', 'push', '--skip-generate', '--force-reset'],
  {
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
);

process.exit(result.status ?? 1);
