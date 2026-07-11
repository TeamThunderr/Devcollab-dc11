const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getFiles(path.join(process.cwd(), 'apps/web/src'));
const storePath = path.resolve('apps/web/src/store/useStore');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  content = content.replace(/import (.*?) from ['"](.*?)store\/useStore['"]/g, (match, imports, prefix) => {
    const absDir = path.dirname(path.resolve(file));
    let rel = path.relative(absDir, storePath).replace(/\\/g, '/');
    if (!rel.startsWith('.')) rel = './' + rel;
    return 'import ' + imports + ' from "' + rel + '"';
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed path in', file);
  }
}
