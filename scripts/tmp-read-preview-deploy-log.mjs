import fs from 'node:fs';

const exitPath = '/tmp/copilot-preview-deploy.exit';
const logPath = '/tmp/copilot-preview-deploy.log';

const exitValue = fs.existsSync(exitPath) ? fs.readFileSync(exitPath, 'utf8').trim() : '';
const log = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : '';
const urls = [...log.matchAll(/https:\/\/[^\s]+vercel\.app/g)].map((match) => match[0]);

console.log(`exit=${exitValue || 'missing'}`);
console.log(`url_count=${urls.length}`);
for (const url of urls.slice(-5)) {
  console.log(url);
}
console.log('--- tail ---');
console.log(log.split(/\r?\n/).slice(-40).join('\n'));
