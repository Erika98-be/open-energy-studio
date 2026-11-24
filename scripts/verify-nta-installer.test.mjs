import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createInstallerManifest } from './nta-installer-manifest.mjs';
import { verifyInstallerManifest } from './verify-nta-installer.mjs';

test('verifies both Linux installers and rejects changed bytes and source commit', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nta-installer-verify-'));
  const deb = join(root, 'src-tauri/target/release/bundle/deb/studio.deb');
  const appimage = join(root, 'src-tauri/target/release/bundle/appimage/studio.AppImage');
  const manifestPath = join(root, 'installer-build.json');
  const commit = 'a'.repeat(40);
  try {
    await mkdir(join(root, 'src-tauri/target/release/bundle/deb'), { recursive: true });
    await mkdir(join(root, 'src-tauri/target/release/bundle/appimage'), { recursive: true });
    await writeFile(deb, 'deb bytes');
    await writeFile(appimage, 'appimage bytes');
    const manifest = await createInstallerManifest(root, 'ubuntu-22.04', commit);
    await writeFile(manifestPath, JSON.stringify(manifest));
    assert.equal((await verifyInstallerManifest(root, manifestPath, commit)).artifacts.length, 2);
    await assert.rejects(verifyInstallerManifest(root, manifestPath, 'b'.repeat(40)), /source commit mismatch/);
    await writeFile(appimage, 'changed bytes');
    await assert.rejects(verifyInstallerManifest(root, manifestPath, commit), /bytes differ/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('rejects forged status, traversal, and symlinked installer', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nta-installer-verify-'));
  const directory = join(root, 'src-tauri/target/release/bundle/nsis');
  const installer = join(directory, 'studio.exe');
  const manifestPath = join(root, 'installer-build.json');
  try {
    await mkdir(directory, { recursive: true });
    await writeFile(installer, 'installer bytes');
    const manifest = await createInstallerManifest(root, 'windows-latest', 'c'.repeat(40));
    const save = async (value) => writeFile(manifestPath, JSON.stringify(value));
    await save({ ...manifest, referenceVerified: true });
    await assert.rejects(verifyInstallerManifest(root, manifestPath), /must not claim/);
    await save({ ...manifest, artifacts: [{ ...manifest.artifacts[0], file: '../studio.exe' }] });
    await assert.rejects(verifyInstallerManifest(root, manifestPath), /Invalid installer path/);
    await save(manifest);
    await rm(installer);
    await symlink(join(root, 'installer-build.json'), installer);
    await assert.rejects(verifyInstallerManifest(root, manifestPath), /escapes or aliases/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
