// Types for scripts/nta-github-release.mjs, used by its Vitest test.
import type { ReleaseIdentity } from './nta-leveringsdocument.mjs';

export function releasedItems(
  notesText: string,
  kernelVersion: string,
): { section: string; items: string[] };
export function renderGithubRelease(values: {
  identity: ReleaseIdentity;
  tag: string;
  commit: string;
  notesText: string;
  assets: { name: string; sha256: string }[];
  repoUrl?: string;
}): string;
export function githubUrl(remote: string): string;
export function shortCommit(commit: string): string;
