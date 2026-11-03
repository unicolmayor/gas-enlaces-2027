const esbuild = require('esbuild')
const fs = require('fs')

fs.mkdirSync('gas-dist', { recursive: true })
fs.copyFileSync('server/appsscript.json', 'gas-dist/appsscript.json')
esbuild.buildSync({
  entryPoints: ['server/apps-script-entrypoint.js'],
  outfile: 'gas-dist/Code.js',
  bundle: true,
  format: 'iife',
  platform: 'neutral',
  target: 'es2020',
  legalComments: 'none',
  minify: false
})
