import type { IProject } from '../energy/types';
import { sha256Hex } from '../nta/Evidence';
import type { ImportIssues, ImportResult } from './importIssues';

/** Lets the adviser pick one file; rejects when the dialog closes without one. */
export function pickFile(accept: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) resolve(file);
      else reject(new Error('Geen bestand geselecteerd'));
    };
    input.click();
  });
}

/**
 * Reads a picked file with `read`, and returns the project with the file's
 * name, its SHA-256 (of the exact bytes read) and the import issues, so the
 * import record can say what came from which file (BRL 9501 §4.3.1).
 */
export async function importFile(
  file: Pick<File, 'name' | 'arrayBuffer'>,
  read: (bytes: Uint8Array) => { project: IProject; issues: ImportIssues },
): Promise<ImportResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const sha256 = await sha256Hex(bytes);
  const { project, issues } = read(bytes);
  return { project, fileName: file.name, sha256, issues: issues.list };
}

/** Saves bytes as a download (browser build and the desktop webview). */
export function downloadBytes(bytes: Uint8Array, fileName: string): void {
  const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
