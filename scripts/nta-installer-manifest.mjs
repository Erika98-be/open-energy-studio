#!/usr/bin/env node
/** Record the exact installer bytes produced by one NTA desktop CI build. */

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, resolve, relative, dirname, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const formats = {
  'ubuntu-22.04': [
    ['src-tauri/target/release/bundle/deb', '.deb'],
    ['src-tauri/target/release/bundle/appimage', '.AppImage'],
  ],
  'windows-latest': [['src-tauri/target/release/bundle/nsis', '.exe']],
  'macos-15-intel': [['src-tauri/target/universal-apple-darwin/release/bundle/dmg', '.dmg']],
};

async function digest(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

export async function createInstallerManifest(root, platform, sourceCommit) {
  if (!Object.hasOwn(formats, platform)) throw new Error(`Unknown build platform: ${platform}`);
  if (!/^[0-9a-f]{40}$/.test(sourceCommit)) throw new Error('Invalid source commit');
  const artifacts = [];
  for (const [directory, extension] of formats[platform]) {
    const fullDirectory = join(root, directory);
    const files = (await readdir(fullDirectory)).filter((name) =>
      name.toLowerCase().endsWith(extension.toLowerCase()));
    if (files.length !== 1) throw new Error(`Expected one ${extension} installer in ${directory}, found ${files.length}`);
    if (!files[0].endsWith(extension)) throw new Error(`Installer extension must be ${extension} in ${directory}`);
    const path = join(fullDirectory, files[0]);
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size === 0) {
      throw new Error(`Invalid installer file: ${path}`);
    }
    artifacts.push({
      file: relative(root, path).split(sep).join('/'),
      bytes: info.size,
      sha256: await digest(path),
    });
  }
  return {
    schemaVersion: 1,
    sourceCommit,
    platform,
    nodeVersion: process.version,
    rustcVersion: execFileSync('rustc', ['--version'], { encoding: 'utf8' }).trim(),
    artifacts,
    referenceVerified: false,
    attestStatus: 'unattested',
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [platform, sourceCommit, output] = process.argv.slice(2);
  if (!platform || !sourceCommit || !output) {
    process.stderr.write('Usage: node scripts/nta-installer-manifest.mjs PLATFORM COMMIT OUTPUT\n');
    process.exitCode = 2;
  } else {
    try {
      const manifest = await createInstallerManifest(process.cwd(), platform, sourceCommit);
      await mkdir(dirname(resolve(output)), { recursive: true });
      await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    } catch (error) {
      process.stderr.write(`NTA installer manifest failed: ${error.message}\n`);
      process.exitCode = 1;
    }
  }
}
