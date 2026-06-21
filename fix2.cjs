const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('C:/dev/alertup/app');
files.forEach(file => {
  if (!file.endsWith('.ts') && !file.endsWith('.tsx')) return;
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/\.Response\.json\(/g, '.json(');

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed .Response.json in ' + file);
  }
});
