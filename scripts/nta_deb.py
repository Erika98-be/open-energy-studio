#!/usr/bin/env python3
"""Normalize an NTA desktop deb using the source commit time."""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import tempfile
from pathlib import Path


def normalize_deb(path: Path, source_date_epoch: int) -> None:
    """Repack the Tauri bundle with stable ownership, timestamps and compression."""
    with tempfile.TemporaryDirectory(prefix="oes-nta-deb-", dir=path.parent) as temporary:
        staging = Path(temporary)
        tree = staging / "tree"
        normalized = staging / "normalized.deb"
        env = {**os.environ, "SOURCE_DATE_EPOCH": str(source_date_epoch)}
        subprocess.run(["dpkg-deb", "-R", str(path), str(tree)], check=True)
        # Tauri may enumerate files in a different order even when their bytes match.
        md5sums = tree / "DEBIAN/md5sums"
        if md5sums.exists():
            lines = md5sums.read_text(encoding="utf-8").splitlines()
            if any("  " not in line for line in lines):
                raise ValueError("Malformed deb md5sums")
            paths = [line.split("  ", 1)[1] for line in lines]
            if len(paths) != len(set(paths)):
                raise ValueError("Duplicate path in deb md5sums")
            md5sums.write_text(
                "\n".join(line for _, line in sorted(zip(paths, lines))) + "\n",
                encoding="utf-8",
            )
        # SOURCE_DATE_EPOCH only caps newer mtimes; normalize older inputs too.
        for entry in tree.rglob("*"):
            os.utime(entry, (source_date_epoch, source_date_epoch), follow_symlinks=False)
        os.utime(tree, (source_date_epoch, source_date_epoch))
        subprocess.run(
            ["dpkg-deb", "--build", "--root-owner-group", "-Zgzip", "-z1", str(tree), str(normalized)],
            check=True, env=env,
        )
        normalized.replace(path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("deb", type=Path)
    parser.add_argument("source_commit")
    args = parser.parse_args()
    if not re.fullmatch(r"[0-9a-f]{40}", args.source_commit):
        parser.error("source_commit must be a full Git SHA-1")
    if not args.deb.is_file() or args.deb.is_symlink():
        parser.error("deb must be an ordinary file")
    epoch = int(subprocess.check_output(
        ["git", "show", "-s", "--format=%ct", args.source_commit], text=True,
    ).strip())
    normalize_deb(args.deb, epoch)


if __name__ == "__main__":
    main()
