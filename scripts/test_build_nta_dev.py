"""Checks that the NTA build writer preserves existing evidence."""

import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("build-nta-dev.py")
SPEC = importlib.util.spec_from_file_location("build_nta_dev", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class BuildWriterTests(unittest.TestCase):
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
