/**
 * Run every test file, and fail if any of them did.
 *
 * One file per process, so a file that sets `process.exitCode` cannot colour the
 * verdict of the next one, and every file runs even after an earlier failure —
 * one run reports the whole picture instead of stopping at the first red.
 *
 * stdio is *inherited*, not piped: the DSH file sandbox refuses a child spawned
 * with piped stdio (`spawn EPERM`), which is also why `node --test` is avoided —
 * it is a process that spawns the files.
 */
import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

/** Every `tests/*.test.mjs`, sorted for a stable order. */
const files = readdirSync('tests')
  .filter(name => name.endsWith('.test.mjs'))
  .sort()
  .map(name => join('tests', name))

if (files.length === 0) {
  console.error('no test files found in tests/')
  process.exit(1)
}

const failed = []
for (const file of files) {
  console.log(`\n=== ${file} ===`)
  const result = spawnSync(process.execPath, [file], { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) failed.push(file)
}

console.log(`\n${files.length - failed.length}/${files.length} test files passed`)
for (const file of failed) console.error(`  failed: ${file}`)
if (failed.length > 0) process.exit(1)
