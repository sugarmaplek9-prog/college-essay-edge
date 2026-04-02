import fs from 'node:fs';

const exitPath = '/tmp/copilot-preview-deploy.exit';
const logPath = '/tmp/copilot-preview-deploy.log';

const exitValue = fs.existsSync(exitPath) ? fs.readFileSync(exitPath, 'utf8').trim() : 'missing';
const log = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : '';
const lines = log.split(/\r?\n/).filter(Boolean);
const urls = [...log.matchAll(/https:\/\/[^\s]+vercel\.app/g)].map((match) => match[0]);

console.log(`exit=${exitValue}`);
console.log(`lines=${lines.length}`);
console.log(`url_count=${urls.length}`);
for (const line of lines.slice(-8)) console.log(line);
