import * as fs from 'fs';
import * as path from 'path';

function listRecursive(dir: string, depth = 0) {
  if (depth > 3) return;
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      console.log('  '.repeat(depth) + `- ${f} ${stat.isDirectory() ? '(dir)' : '(file)'}`);
      if (stat.isDirectory() && f !== 'node_modules') {
        listRecursive(full, depth + 1);
      }
    }
  } catch (e: any) {
    // console.log("Error readdir:", dir, e.message);
  }
}

console.log("=== Listing /opt ===");
listRecursive("/opt");
