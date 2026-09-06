from __future__ import annotations

import json
import os
import stat
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / "bin" / "hours-store.py"


def run_store(home: Path, op: str, stdin: bytes = b"") -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(
        ["/usr/bin/python3", "-I", "-S", str(HELPER), op],
        input=stdin,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env={"HOME": str(home), "PATH": "/usr/bin", "LC_ALL": "C"},
        timeout=8,
        check=False,
        cwd=str(ROOT),
    )


class HoursStoreTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.home = Path(self.tmp.name)
        self.addCleanup(self.tmp.cleanup)

    def cache_path(self) -> Path:
        return self.home / ".local" / "state" / "omarchy" / "settings" / "liturgy-of-the-hours.json"

    def test_read_verses_from_plugin_data(self) -> None:
        result = run_store(self.home, "read-verses")
        self.assertEqual(result.returncode, 0, result.stderr.decode())
        data = json.loads(result.stdout.decode())
        self.assertEqual(data["translation"], "BSB")
        self.assertGreaterEqual(len(data["verses"]), 120)

    def test_read_office_from_plugin_data(self) -> None:
        result = run_store(self.home, "read-office")
        self.assertEqual(result.returncode, 0, result.stderr.decode())
        data = json.loads(result.stdout.decode())
        self.assertIsInstance(data, dict)
        self.assertIn("chapters", data)

    def test_missing_cache_is_empty(self) -> None:
        result = run_store(self.home, "read-cache")
        self.assertEqual(result.returncode, 0, result.stderr.decode())
        self.assertEqual(result.stdout, b"")

    def test_write_then_read_cache(self) -> None:
        payload = json.dumps({
            "date": "2026-08-19",
            "translation": "bsb",
            "verse_position": 3,
            "reference": "John 14:27",
            "text": "Peace I leave with you",
            "last_notified": {"terce": "2026-08-19"},
        }).encode()
        written = run_store(self.home, "write-cache", payload)
        self.assertEqual(written.returncode, 0, written.stderr.decode())
        path = self.cache_path()
        self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)
        read = run_store(self.home, "read-cache")
        self.assertEqual(read.returncode, 0, read.stderr.decode())
        data = json.loads(read.stdout.decode())
        self.assertEqual(data["reference"], "John 14:27")
        self.assertEqual(data["last_notified"]["terce"], "2026-08-19")

    def test_write_replaces_symlink(self) -> None:
        run_store(self.home, "write-cache", b"{}")
        victim = Path(self.tmp.name) / "victim"
        victim.write_bytes(b"must survive\n")
        path = self.cache_path()
        path.unlink()
        path.symlink_to(victim)
        written = run_store(self.home, "write-cache", json.dumps({"date": "2026-08-19", "text": "new"}).encode())
        self.assertEqual(written.returncode, 0, written.stderr.decode())
        self.assertEqual(victim.read_bytes(), b"must survive\n")
        self.assertFalse(path.is_symlink())
        self.assertIn(b"new", path.read_bytes())

    def test_read_refuses_symlink_cache(self) -> None:
        run_store(self.home, "write-cache", b"{}")
        path = self.cache_path()
        path.unlink()
        path.symlink_to("/etc/passwd")
        read = run_store(self.home, "read-cache")
        self.assertNotEqual(read.returncode, 0)


if __name__ == "__main__":
    unittest.main()
