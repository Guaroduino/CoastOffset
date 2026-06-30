import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Dynamically resolve GitHub Desktop's Git directory to support current and future versions
const getGitPath = () => {
  const baseDir = 'C:\\Users\\Guaroduino\\AppData\\Local\\GitHubDesktop';
  try {
    if (fs.existsSync(baseDir)) {
      const items = fs.readdirSync(baseDir);
      const appFolders = items.filter(name => name.startsWith('app-'));
      if (appFolders.length > 0) {
        // Sort to find the latest version directory
        appFolders.sort().reverse();
        const latestGitPath = path.join(baseDir, appFolders[0], 'resources', 'app', 'git', 'cmd');
        if (fs.existsSync(latestGitPath)) {
          console.log(`[Deploy] Git detectado en: ${latestGitPath}`);
          return latestGitPath;
        }
      }
    }
  } catch (err) {
    console.warn('[Deploy] Error al intentar autodetectar la ruta de Git de GitHub Desktop:', err);
  }
  // Fallback to standard path
  return 'C:\\Users\\Guaroduino\\AppData\\Local\\GitHubDesktop\\app-3.6.1\\resources\\app\git\\cmd';
};

// Add resolved git path to process environment PATH
const gitPath = getGitPath();
process.env.PATH = `${process.env.PATH};${gitPath}`;

console.log('[Deploy] Iniciando compilación de producción...');

// Run npm run build
const buildProcess = spawn('npm', ['run', 'build'], { 
  shell: true, 
  stdio: 'inherit',
  env: process.env 
});

buildProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`[Deploy] La compilación falló con código de salida: ${code}`);
    process.exit(code);
  }

  console.log('[Deploy] Compilación exitosa. Iniciando publicación en GitHub Pages...');

  // Run gh-pages deploy
  const deployProcess = spawn('npx', ['gh-pages', '-d', 'dist'], { 
    shell: true, 
    stdio: 'inherit',
    env: process.env 
  });

  deployProcess.on('close', (deployCode) => {
    if (deployCode !== 0) {
      console.error(`[Deploy] El despliegue falló con código de salida: ${deployCode}`);
      process.exit(deployCode);
    }
    console.log('[Deploy] ¡Publicado con éxito en GitHub Pages!');
  });
});
