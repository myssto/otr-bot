import type { ColorResolvable } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Recursively walks a directory for files.
 * @param dir Directory to walk.
 * @returns A list of paths to all files in the directory.
 */
export function walkDir(dir: string): string[] {
  let results: string[] = [];
  const fileNames = fs.readdirSync(dir);

  for (const fName of fileNames) {
    const fPath = path.resolve(dir, fName);
    const stat = fs.statSync(fPath);

    if (stat.isDirectory()) {
      results = results.concat(walkDir(fPath));
    } else {
      results.push(fPath);
    }
  }

  return results;
}

export const EmbedColors = {
  OtrBlue: '#4D94FF',
} satisfies Record<string, ColorResolvable>;
