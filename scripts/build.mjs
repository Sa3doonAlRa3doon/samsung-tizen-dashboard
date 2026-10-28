import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import archiver from 'archiver';

const root = resolve(import.meta.dirname, '..');
const source = resolve(root, 'src');
const outputDir = resolve(root, 'dist');
const outputPath = resolve(outputDir, 'tizen-dashboard.wgt');
const localConfig = resolve(source, 'js', 'config.local.js');

if (!existsSync(localConfig)) {
  writeFileSync(localConfig, '/* No local overrides. See config.local.example.js. */\n');
}

await import('./build-marks.mjs');
mkdirSync(outputDir, { recursive: true });

await new Promise((accept, reject) => {
  const output = createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  output.on('close', accept);
  output.on('error', reject);
  archive.on('warning', reject);
  archive.on('error', reject);
  archive.pipe(output);
  archive.glob('**/*', {
    cwd: source,
    dot: false,
    ignore: [
      'img/marks/**',
      'img/easter-egg/*.jpg',
      'img/easter-egg/runner.png',
      'img/easter-egg/obstacle.png',
      'img/easter-egg/obstacle-face.png',
      'author-signature.xml',
      'signature*.xml',
      '*.wgt'
    ]
  });
  archive.finalize();
});

console.log(`Built ${outputPath}`);
