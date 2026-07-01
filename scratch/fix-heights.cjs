const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src');

function processDir(dirPath) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            // replace min-h-screen
            if (content.includes('min-h-screen')) {
                content = content.replace(/\bmin-h-screen\b/g, 'min-h-[100dvh]');
                modified = true;
            }
            
            // replace h-screen
            if (content.includes('h-screen')) {
                content = content.replace(/\bh-screen\b/g, 'h-[100dvh]');
                modified = true;
            }
            
            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated:', fullPath);
            }
        }
    }
}

processDir(dir);
console.log('Done!');
