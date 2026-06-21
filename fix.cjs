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

  content = content.replace(/import\s*\{([^}]*)\}\s*from\s*['"]react-router['"];?/g, (match, p1) => {
    let imports = p1.split(',').map(s => s.trim()).filter(s => s !== 'json' && s !== '');
    if (imports.length === 0) return '';
    return `import { ${imports.join(', ')} } from 'react-router';`;
  });

  content = content.replace(/\bjson\(/g, 'Response.json(');
  content = content.replace(/isEmbeddedApp=\{[^\}]+\}/g, '');
  content = content.replace(/isEmbeddedApp/g, '');

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
