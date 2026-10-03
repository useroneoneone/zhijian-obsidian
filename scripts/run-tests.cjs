'use strict';

// Run each suite in its own process, with no shell glob expansion or npm dependencies.
// Sequential execution keeps the layout performance fixtures from competing for CPU.
const { readdirSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const pluginDirectory = path.resolve(__dirname, '../zhijian-obsidian');
const testDirectory = path.join(pluginDirectory, 'tests');
const tests = readdirSync(testDirectory)
  .filter(name => name.endsWith('.test.js'))
  .sort()
  .map(name => path.join(testDirectory, name));
tests.push(path.join(__dirname, 'verify-preview.cjs'));

console.log('Running local regression fixtures. Obsidian APIs and browser surfaces are mocked.');
console.log('Passing these checks does not confirm loading the plugin in a real Obsidian app.');
for (const file of tests) {
  console.log(`\nRunning ${path.relative(path.dirname(pluginDirectory), file)}`);
  const result = spawnSync(process.execPath, [file], { cwd: pluginDirectory, stdio: 'inherit' });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    if (result.signal) console.error(`Suite stopped by ${result.signal}.`);
    process.exit(result.status || 1);
  }
}
console.log(`\nPASS: ${tests.length} regression files completed.`);
