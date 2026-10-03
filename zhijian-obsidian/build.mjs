// Development only. The installed plugin uses Obsidian's API and has no npm runtime dependencies.
import { build, version } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const directory = path.dirname(fileURLToPath(import.meta.url));
const packageFile = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'));
if (version !== packageFile.devDependencies.esbuild) {
  throw new Error(`Build requires esbuild ${packageFile.devDependencies.esbuild}; found ${version}. Run npm ci --ignore-scripts.`);
}

const iconLicense = await readFile(path.join(directory, 'icons/LICENSE'), 'utf8');
const result = await build({
  absWorkingDir: directory,
  entryPoints: ['src/plugin.js'],
  outfile: 'main.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2020',
  external: ['obsidian'],
  minify: false,
  sourcemap: false,
  legalComments: 'inline',
  metafile: true,
  write: false,
  banner: { js: '/* 知间 · Knowledge Studio — generated bundle. Sources: src/plugin.js, core.js, ui.js, fx.js, graph.js, fluid.js, carousel.js, icons.js. */\n/*\nBundled Phosphor Icons, regular subset.\n' + iconLicense.trim().replace(/\*\//g, '* /') + '\n*/' },
  logLevel: 'info',
});

// Confirm all local modules were bundled before replacing the installable file.
for (const output of Object.values(result.metafile.outputs)) {
  for (const imported of output.imports) {
    if (imported.external && imported.path !== 'obsidian') {
      throw new Error(`Unexpected runtime dependency: ${imported.path}`);
    }
  }
}
const output = result.outputFiles.find(file => path.basename(file.path) === 'main.js');
if (!output) throw new Error('The build produced no main.js.');
const requires = [...output.text.matchAll(/\brequire\s*\(\s*["']([^"']+)["']\s*\)/g)].map(match => match[1]);
if (requires.some(name => name !== 'obsidian')) {
  throw new Error(`Unexpected require() in bundle: ${requires.join(', ')}`);
}
await writeFile(path.join(directory, 'main.js'), output.contents);
console.log(`Built main.js (${output.contents.byteLength} bytes). Runtime dependency: obsidian only.`);
