"""Checks that the NTA build writer preserves existing evidence."""

import importlib.util
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("build-nta-dev.py")
SPEC = importlib.util.spec_from_file_location("build_nta_dev", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class BuildWriterTests(unittest.TestCase):
    @unittest.skipUnless(shutil.which("dpkg-deb"), "dpkg-deb unavailable")
    def test_normalize_deb_stabilizes_package_timestamps(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            package_tree = root / "package"
            (package_tree / "DEBIAN").mkdir(parents=True)
            (package_tree / "usr/share/test").mkdir(parents=True)
            (package_tree / "DEBIAN/control").write_text(
                "Package: test-repro\nVersion: 1.0\nArchitecture: all\n"
                "Maintainer: Test <test@example.invalid>\nDescription: Test package\n",
                encoding="utf-8",
            )
            (package_tree / "usr/share/test/file").write_bytes(b"same content")
            (package_tree / "usr/share/test/link").symlink_to("file")
            results = []
            for index, stamp in enumerate((1500000000, 1800000000)):
                for path in package_tree.rglob("*"):
                    os.utime(path, (stamp, stamp))
                package = root / f"package-{index}.deb"
                subprocess.run(
                    ["dpkg-deb", "--build", "--root-owner-group", str(package_tree), str(package)],
                    check=True, capture_output=True,
                )
                MODULE.normalize_deb(package, 1600000000)
                results.append(package.read_bytes())
            self.assertEqual(results[0], results[1])

    def test_copy_exclusive_rejects_existing_file_and_dangling_symlink(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "source"
            source.write_bytes(b"new")
            target = root / "artifact"

            MODULE.copy_exclusive(source, target)
            self.assertEqual(target.read_bytes(), b"new")
            with self.assertRaises(FileExistsError):
                MODULE.copy_exclusive(source, target)
            self.assertEqual(target.read_bytes(), b"new")

            target.unlink()
            outside = root / "missing"
            target.symlink_to(outside)
            with self.assertRaises(FileExistsError):
                MODULE.copy_exclusive(source, target)
            self.assertFalse(outside.exists())


if __name__ == "__main__":
    unittest.main()
