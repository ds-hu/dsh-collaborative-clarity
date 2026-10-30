/**
 * Assert the *installed* shape of this package, not the checkout's.
 *
 * The harness never imports a plugin to draw its card: it resolves
 * `<package>/package.json`, `<package>/locale/en.json` and `<package>/icon`
 * through Node's ESM resolver and reads the manifest. Every one of those is a
 * way for the picture or the title to disappear *after* `dsh plugin add` while
 * the file sits right there in the checkout:
 *
 *   - a resource missing from `exports` throws `ERR_PACKAGE_PATH_NOT_EXPORTED`
 *     and the Plugins page falls back to a placeholder icon;
 *   - a resource missing from `files` resolves in the checkout and is simply not
 *     in the tarball;
 *   - one locale file whose name is not a language id invalidates the whole
 *     locale directory, because the reader scans it as a set.
 *
 * Resolution is done through a junction inside `.tmp/`, so the package name is
 * resolved the way an install resolves it rather than by path.
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync } from 'node:fs'
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const NAME = manifest.name

/** The shell accepts these four, keyed by extension. */
const ICON_TYPES = new Map([
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
])

/** The reader's language-id rule, verbatim: one bad filename discards the directory. */
const LANGUAGE_ID = /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/u

/** Does a `files` entry cover this package-relative path? */
function covered(path) {
  const normal = path.replace(/^\.\//, '')
  return manifest.files.some((entry) => {
    const pattern = entry.replace(/^\.\//, '')
    if (pattern === normal) return true
    if (!pattern.includes('*')) return false
    const [head, tail] = pattern.split('*')
    return normal.startsWith(head) && normal.endsWith(tail) && normal.length >= head.length + tail.length
  })
}

// --- the files an install must carry ------------------------------------------
const REQUIRED = ['index.js', 'artifacts.js', 'client.js', 'cordis.patch.yml']
for (const file of REQUIRED) {
  assert.ok(covered(file), `${file} is missing from \`files\`, so an install would not carry it`)
  assert.ok(statSync(join(ROOT, file)).isFile(), `${file} is not a file`)
}

// --- exports: resolve every resource the harness reads -------------------------
const linkRoot = join(ROOT, '.tmp', 'verify-install')
const linkPath = join(linkRoot, 'node_modules', ...NAME.split('/'))
rmSync(linkRoot, { recursive: true, force: true })
mkdirSync(dirname(linkPath), { recursive: true })
symlinkSync(ROOT, linkPath, 'junction')

const require = createRequire(join(linkRoot, 'probe.mjs'))

/** Resolve one specifier through the exports map, as the shell would. */
function resolveExport(specifier) {
  try {
    return require.resolve(specifier)
  } catch (error) {
    throw new Error(`cannot resolve ${specifier}: ${String(error)}`)
  }
}

const hostEntry = resolveExport(NAME)
assert.equal(hostEntry, join(ROOT, manifest.main), 'the package entry is the manifest\'s `main`')
const clientEntry = resolveExport(`${NAME}/client`)
assert.equal(clientEntry, join(ROOT, 'client.js'), '`./client` serves the browser half')
assert.match(readFileSync(clientEntry, 'utf8'), /__ModuleLoader__\.load\(/, 'the client half is a loader bundle')

const manifestPath = resolveExport(`${NAME}/package.json`)
assert.equal(manifestPath, join(ROOT, 'package.json'), '`./package.json` is exported, so a declared icon is read')

// --- bundle row ---------------------------------------------------------------
assert.equal(manifest.dsh?.bundle?.patch, './cordis.patch.yml', 'the manifest declares the bundle patch')
assert.equal(manifest.dsh?.client?.platform, 'web', 'the manifest declares the browser platform')
assert.ok(covered('cordis.patch.yml'), 'cordis.patch.yml is missing from `files`')

const patch = readFileSync(join(ROOT, manifest.dsh.bundle.patch), 'utf8')
assert.ok(patch.includes(`'${NAME}'`) || patch.includes(`"${NAME}"`), `cordis.patch.yml must name ${NAME}`)
const rowId = /-\s*id:\s*(\S+)/.exec(patch)?.[1]
assert.ok(rowId, 'cordis.patch.yml must give its row an id')

// --- icon ---------------------------------------------------------------------
const icon = manifest.icon
assert.equal(typeof icon, 'string', 'the manifest declares the icon the Plugins page draws')
assert.ok(!isAbsolute(icon) && !/^[A-Za-z][A-Za-z\d+.-]*:/u.test(icon), `the icon is a manifest-relative path (${icon})`)
assert.ok(covered(icon), 'the icon is missing from `files`, so an install would lose it')

const iconPath = resolveExport(`${NAME}/icon`)
assert.equal(iconPath, join(ROOT, icon), '`./icon` resolves to the declared icon')
const inside = relative(ROOT, iconPath)
assert.ok(!inside.startsWith('..') && !isAbsolute(inside), 'the icon remains inside the package directory')

const iconBytes = readFileSync(iconPath)
assert.ok(iconBytes.length <= 256 * 1024, 'the icon is within the 256 KiB the shell admits')
const iconType = ICON_TYPES.get(extname(iconPath).toLowerCase())
assert.ok(iconType, `the icon is SVG, PNG, JPEG or WebP (${icon})`)
if (iconType === 'image/svg+xml') {
  assert.match(iconBytes.toString('utf8'), /^<svg[\s>]/, 'the icon really is an SVG document')
}

// --- locale -------------------------------------------------------------------
assert.ok(covered('locale/en.json'), 'locale/en.json is missing from `files`')
const english = resolveExport(`${NAME}/locale/en.json`)
const localeDir = dirname(english)

const localeFiles = readdirSync(localeDir).filter((name) => name.endsWith('.json'))
assert.ok(localeFiles.length > 0, 'the locale directory carries at least the English dictionary')
for (const name of localeFiles) {
  const language = name.slice(0, -'.json'.length)
  assert.match(language, LANGUAGE_ID, `locale/${name} must be named after a language id`)
  const dictionary = JSON.parse(readFileSync(resolveExport(`${NAME}/locale/${name}`), 'utf8'))
  assert.equal(typeof dictionary.meta?.title, 'string', `locale/${name} must carry meta.title`)
  assert.ok(dictionary.meta.title.trim() !== '', `locale/${name} meta.title must not be empty`)
  assert.equal(typeof dictionary.meta?.description, 'string', `locale/${name} must carry meta.description`)
}

console.log(`install shape ✓  ${NAME}@${manifest.version}`)
console.log(`  entry ${relative(ROOT, hostEntry)} · client ${relative(ROOT, clientEntry)} · row ${rowId}`)
console.log(`  icon ${icon} (${iconType}) · locale ${localeFiles.join(', ')} · ${manifest.files.length} files entries`)

rmSync(linkRoot, { recursive: true, force: true })
