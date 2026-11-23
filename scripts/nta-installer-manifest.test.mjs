import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createInstallerManifest } from './nta-installer-manifest.mjs';

test('records exact Linux installer bytes and rejects a symlink', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nta-installer-manifest-'));
  const deb = join(root, 'src-tauri/target/release/bundle/deb');
  const appimage = join(root, 'src-tauri/target/release/bundle/appimage');
  try {
    await mkdir(deb, { recursive: true });
    await mkdir(appimage, { recursive: true });
    await writeFile(join(deb, 'studio.deb'), 'deb bytes');
    await writeFile(join(appimage, 'studio.AppImage'), 'appimage bytes');
    const manifest = await createInstallerManifest(root, 'ubuntu-22.04', 'a'.repeat(40));
    assert.equal(manifest.sourceCommit, 'a'.repeat(40));
    assert.equal(manifest.referenceVerified, false);
    assert.equal(manifest.attestStatus, 'unattested');
    assert.deepEqual(manifest.artifacts.map(({ file }) => file), [
      'src-tauri/target/release/bundle/deb/studio.deb',
      'src-tauri/target/release/bundle/appimage/studio.AppImage',
    ]);
    assert.equal(manifest.artifacts[0].sha256, createHash('sha256').update('deb bytes').digest('hex'));
    await rm(join(deb, 'studio.deb'));
    await symlink(join(appimage, 'studio.AppImage'), join(deb, 'studio.deb'));
    await assert.rejects(createInstallerManifest(root, 'ubuntu-22.04', 'a'.repeat(40)), /Invalid installer file/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('requires exactly one installer for each Windows and macOS package', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nta-installer-manifest-'));
  try {
    for (const [platform, directory, name] of [
      ['windows-latest', 'src-tauri/target/release/bundle/nsis', 'studio.exe'],
      ['macos-15-intel', 'src-tauri/target/universal-apple-darwin/release/bundle/dmg', 'studio.dmg'],
    ]) {
      const path = join(root, directory);
      await mkdir(path, { recursive: true });
      await assert.rejects(createInstallerManifest(root, platform, 'b'.repeat(40)), /Expected one/);
      await writeFile(join(path, name), `${platform} bytes`);
      const manifest = await createInstallerManifest(root, platform, 'b'.repeat(40));
      assert.equal(manifest.platform, platform);
      assert.equal(manifest.artifacts.length, 1);
      assert.equal(manifest.artifacts[0].file, `${directory}/${name}`);
      await writeFile(join(path, `extra${name.slice(name.lastIndexOf('.'))}`), 'extra');
      await assert.rejects(createInstallerManifest(root, platform, 'b'.repeat(40)), /Expected one/);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
