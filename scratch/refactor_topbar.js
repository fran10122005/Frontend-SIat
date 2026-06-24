import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = path.join(__dirname, '..', 'src', 'components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx') && f !== 'Topbar.jsx' && f !== 'Sidebar.jsx');

let updated = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  const headerRegex = /<header className="(?:sticky top-0|flex h-16)[^>]+>([\s\S]*?)<\/header>/g;
  
  if (headerRegex.test(content)) {
    content = content.replace(headerRegex, '<Topbar />');
    
    if (!content.includes('import Topbar from')) {
      const importMatches = [...content.matchAll(/^import .* from .*/gm)];
      if (importMatches.length > 0) {
        const lastImport = importMatches[importMatches.length - 1];
        const insertPos = lastImport.index + lastImport[0].length;
        content = content.substring(0, insertPos) + '\nimport Topbar from \'./Topbar\'' + content.substring(insertPos);
      } else {
        content = 'import Topbar from \'./Topbar\'\n' + content;
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    updated++;
    console.log('Updated ' + file);
  }
}

console.log('Total files updated: ' + updated);
