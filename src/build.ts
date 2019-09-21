import JSZip from 'node-zip';
import fs from 'fs';
import packageJson from '../package.json';

const FILES: string[] = ['manifest.json', 'dist/src/index.js', 'dist/src/auto-clicker.js'];

function run() {
  try {
    console.log('🔥 Starting build');
    if (!fs.existsSync('build')) {
      fs.mkdirSync('build');
    }
    const zip = new JSZip();
    for (let file of FILES) {
      zip.file(file, fs.readFileSync(file));
    }
    const data = zip.generate({ type: 'nodebuffer' });
    fs.writeFileSync(`build/${packageJson.name}.zip`, data);
    console.log('🚀 Build finished');
  } catch (error) {
    console.error(error.message);
  }
}

run();
