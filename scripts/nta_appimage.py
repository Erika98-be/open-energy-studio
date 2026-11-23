#!/usr/bin/env python3
"""Repack an NTA desktop AppImage with stable payload timestamps."""

from __future__ import annotations

import argparse
import hashlib
import os
import re
import stat
import subprocess
import tempfile
from pathlib import Path


def _tree_entries(root: Path) -> dict[str, tuple[int, str]]:
    entries = {}
    for entry in root.rglob("*"):
        mode = entry.lstat().st_mode
        if stat.S_ISLNK(mode):
            identity = os.readlink(entry)
        elif stat.S_ISREG(mode):
            identity = hashlib.sha256(entry.read_bytes()).hexdigest()
        elif stat.S_ISDIR(mode):
            identity = "directory"
        else:
            raise ValueError(f"Unsupported AppImage entry: {entry}")
        entries[str(entry.relative_to(root))] = (mode, identity)
    return entries


def normalize_appimage(path: Path, appimagetool: Path, source_date_epoch: int) -> None:
    """Preserve the runtime and payload while appimagetool refreshes its digest."""
    with tempfile.TemporaryDirectory(prefix="oes-nta-appimage-", dir=path.parent) as temporary:
        staging = Path(temporary)
        original = staging / "original"
        repacked = staging / "repacked.AppImage"
        verified = staging / "verified"
        runtime = staging / "runtime"
        offset = int(subprocess.check_output([str(path), "--appimage-offset"], text=True).strip())
        if offset <= 0 or offset >= path.stat().st_size:
            raise ValueError("Invalid AppImage runtime offset")
        with path.open("rb") as source, runtime.open("wb") as destination:
            remaining = offset
            while remaining:
                chunk = source.read(min(1024 * 1024, remaining))
                if not chunk:
                    raise ValueError("Incomplete AppImage runtime")
                destination.write(chunk)
                remaining -= len(chunk)
        if runtime.stat().st_size != offset:
            raise ValueError("Incomplete AppImage runtime")
        subprocess.run(["unsquashfs", "-d", str(original), "-offset", str(offset), str(path)],
                       check=True, stdout=subprocess.DEVNULL)
        before = _tree_entries(original)
        # Older Tauri bundles may contain an absolute .DirIcon link to the CI
        # staging path; appimagetool replaces it with a usable relative link.
        original_icon = before.pop(".DirIcon", None)
        env = {**os.environ, "SOURCE_DATE_EPOCH": str(source_date_epoch),
               "ARCH": "x86_64", "APPIMAGE_EXTRACT_AND_RUN": "1"}
        subprocess.run([str(appimagetool), "-n", "--runtime-file", str(runtime),
                        str(original), str(repacked)], check=True, env=env,
                       stdout=subprocess.DEVNULL)
        new_offset = int(subprocess.check_output(
            [str(repacked), "--appimage-offset"], text=True).strip())
        if new_offset != offset:
            raise ValueError("AppImage runtime offset changed")
        subprocess.run(["unsquashfs", "-d", str(verified), "-offset", str(offset),
                        str(repacked)], check=True, stdout=subprocess.DEVNULL)
        after = _tree_entries(verified)
        new_icon = after.pop(".DirIcon", None)
        if original_icon is None or new_icon is None:
            raise ValueError("Repacked AppImage lost its icon entry")
        if new_icon != original_icon and not (
            stat.S_ISLNK(original_icon[0])
            and stat.S_ISLNK(new_icon[0])
            and os.path.isabs(original_icon[1])
            and not os.path.isabs(new_icon[1])
        ):
            raise ValueError("Repacked AppImage changed its icon entry unexpectedly")
        if after != before:
            raise ValueError("Repacked AppImage changed payload contents, links or modes")
        os.chmod(repacked, path.stat().st_mode & 0o777)
        repacked.replace(path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("appimage", type=Path)
    parser.add_argument("appimagetool", type=Path)
    parser.add_argument("source_commit")
    args = parser.parse_args()
    if not re.fullmatch(r"[0-9a-f]{40}", args.source_commit):
        parser.error("source_commit must be a full Git SHA-1")
    for label, path in [("appimage", args.appimage), ("appimagetool", args.appimagetool)]:
        if not path.is_file() or path.is_symlink():
            parser.error(f"{label} must be an ordinary file")
    epoch = int(subprocess.check_output(
        ["git", "show", "-s", "--format=%ct", args.source_commit], text=True,
    ).strip())
    normalize_appimage(args.appimage, args.appimagetool, epoch)


if __name__ == "__main__":
    main()
