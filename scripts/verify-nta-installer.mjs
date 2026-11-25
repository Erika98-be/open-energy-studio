#!/usr/bin/env node
/** Verify downloaded NTA installer bytes against their CI manifest. */

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import { isAbsolute, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const expectedFormats = {
  'ubuntu-22.04': [
    ['src-tauri/target/release/bundle/deb', '.deb'],
    ['src-tauri/target/release/bundle/appimage', '.AppImage'],
  ],
  'windows-latest': [['src-tauri/target/release/bundle/nsis', '.exe']],
  'macos-15-intel': [['src-tauri/target/universal-apple-darwin/release/bundle/dmg', '.dmg']],
};

async function sha256(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

export async function verifyInstallerManifest(root, manifestPath, expectedCommit) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest.schemaVersion !== 1 || !Object.hasOwn(expectedFormats, manifest.platform)) {
    throw new Error('Unsupported installer manifest schema or platform');
  }
  if (!/^[0-9a-f]{40}$/.test(manifest.sourceCommit) ||
      (expectedCommit && manifest.sourceCommit !== expectedCommit)) {
    throw new Error('Installer source commit mismatch');
  }
  if (manifest.referenceVerified !== false || manifest.attestStatus !== 'unattested') {
    throw new Error('Installer manifest must not claim reference verification or attestation');
  }
  const formats = expectedFormats[manifest.platform];
  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length !== formats.length) {
    throw new Error('Installer artifact count mismatch');
  }
  const realRoot = await realpath(root);
  for (const [index, [directory, extension]] of formats.entries()) {
    const entry = manifest.artifacts[index];
    if (!entry || typeof entry.file !== 'string' || isAbsolute(entry.file) ||
        entry.file.includes('\\') || posix.dirname(entry.file) !== directory ||
        !posix.basename(entry.file).endsWith(extension) || posix.basename(entry.file) === extension) {
      throw new Error(`Invalid installer path at index ${index}`);
    }
    if (!Number.isSafeInteger(entry.bytes) || entry.bytes <= 0 ||
        !/^[0-9a-f]{64}$/.test(entry.sha256)) {
      throw new Error(`Invalid installer digest at index ${index}`);
    }
    const installerNames = (await readdir(join(root, directory))).filter((name) =>
      name.toLowerCase().endsWith(extension.toLowerCase()));
    if (installerNames.length !== 1 || installerNames[0] !== posix.basename(entry.file)) {
      throw new Error(`Installer set differs from manifest in ${directory}`);
    }
    const path = join(root, entry.file);
    const resolved = await realpath(path);
    if (!resolved.startsWith(`${realRoot}${sep}`) || relative(realRoot, resolved) !== entry.file.split('/').join(sep)) {
      throw new Error(`Installer path escapes or aliases the artifact root: ${entry.file}`);
    }
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size !== entry.bytes ||
        await sha256(path) !== entry.sha256) {
      throw new Error(`Installer bytes differ from manifest: ${entry.file}`);
    }
  }
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [root, manifestPath, expectedCommit] = process.argv.slice(2);
  if (!root || !manifestPath) {
    process.stderr.write('Usage: node scripts/verify-nta-installer.mjs ARTIFACT_ROOT MANIFEST [COMMIT]\n');
    process.exitCode = 2;
  } else {
    try {
      const manifest = await verifyInstallerManifest(root, manifestPath, expectedCommit);
      process.stdout.write(`Verified ${manifest.artifacts.length} ${manifest.platform} installer(s) from ${manifest.sourceCommit}\n`);
    } catch (error) {
      process.stderr.write(`NTA installer verification failed: ${error.message}\n`);
      process.exitCode = 1;
    }
  }
}
