#!/usr/bin/python3 -I
"""Descriptor-bound reads for bundled office data and reminder state."""

from __future__ import annotations

import json
import os
import re
import select
import stat
import sys
import time
from pathlib import Path

MAX_CACHE_BYTES = 65536
MAX_DATA_BYTES = 262144
MAX_STDERR = 200
MAX_REFERENCE = 200
MAX_VERSE = 4096
MAX_VERSES = 250
READ_DEADLINE_S = 8.0
CACHE_PARTS = (".local", "state", "omarchy", "settings")
CACHE_NAME = "liturgy-of-the-hours.json"
HOUR_IDS = ("morning", "prime", "terce", "sext", "none", "evening")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
COMPONENT_RE = re.compile(r"^[A-Za-z0-9._-]+$")
DATA_FILES = {"verses.json": MAX_DATA_BYTES, "office.json": MAX_DATA_BYTES}


class StoreError(RuntimeError):
    def __init__(self, message: str, code: int = 1) -> None:
        super().__init__(message)
        self.code = code


def die(message: str, code: int = 1) -> None:
    sys.stderr.write(message[:MAX_STDERR] + "\n")
    raise SystemExit(code)


def open_dir_chain(parts: tuple[str, ...], *, private_leaf: bool, create: bool = True) -> int:
    home = os.path.expanduser("~")
    if not home or not os.path.isabs(home):
        raise StoreError("HOME is not an absolute path")
    fd = os.open(home, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_CLOEXEC)
    try:
        last = len(parts) - 1
        for i, name in enumerate(parts):
            if not COMPONENT_RE.fullmatch(name) or name in (".", ".."):
                raise StoreError("bad path component")
            try:
                nfd = os.open(
                    name,
                    os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_CLOEXEC,
                    dir_fd=fd,
                )
            except FileNotFoundError:
                if not create:
                    raise
                os.mkdir(name, 0o700, dir_fd=fd)
                nfd = os.open(
                    name,
                    os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_CLOEXEC,
                    dir_fd=fd,
                )
            os.close(fd)
            fd = nfd
            st = os.fstat(fd)
            if not stat.S_ISDIR(st.st_mode) or st.st_uid != os.geteuid():
                raise StoreError("untrusted directory")
            if i == last and private_leaf and (st.st_mode & 0o077):
                os.fchmod(fd, 0o700)
        return fd
    except BaseException:
        os.close(fd)
        raise


def read_bounded(dirfd: int, name: str, max_bytes: int) -> bytes | None:
    try:
        fd = os.open(
            name,
            os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK | os.O_CLOEXEC,
            dir_fd=dirfd,
        )
    except FileNotFoundError:
        return None
    try:
        st = os.fstat(fd)
        if not stat.S_ISREG(st.st_mode) or st.st_nlink != 1:
            raise StoreError("refusing state file")
        if st.st_size > max_bytes:
            raise StoreError("state file exceeds size limit")
        if st.st_mode & 0o077:
            os.fchmod(fd, 0o600)
        os.set_blocking(fd, True)
        data = b""
        while len(data) <= max_bytes:
            chunk = os.read(fd, min(65536, max_bytes + 1 - len(data)))
            if not chunk:
                break
            data += chunk
        if len(data) > max_bytes:
            raise StoreError("state file grew past the limit")
        return data
    finally:
        os.close(fd)


def write_atomic(dirfd: int, name: str, data: bytes) -> None:
    if len(data) > MAX_CACHE_BYTES:
        raise StoreError("payload too large", 3)
    tmp = f".{name}.{os.urandom(8).hex()}.tmp"
    fd = os.open(
        tmp,
        os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_CLOEXEC,
        0o600,
        dir_fd=dirfd,
    )
    try:
        os.fchmod(fd, 0o600)
        view = memoryview(data)
        while view:
            n = os.write(fd, view)
            if n <= 0:
                raise StoreError("short write")
            view = view[n:]
        os.fsync(fd)
        os.rename(tmp, name, src_dir_fd=dirfd, dst_dir_fd=dirfd)
        tmp = ""
        os.fsync(dirfd)
    except BaseException:
        if tmp:
            try:
                os.unlink(tmp, dir_fd=dirfd)
            except OSError:
                pass
        raise
    finally:
        os.close(fd)


def clip(value: object, limit: int) -> str:
    text = str(value or "")
    return text if len(text) <= limit else text[:limit]


def parse_cache(raw: bytes) -> dict[str, object]:
    if not raw:
        return empty_cache()
    try:
        value = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise StoreError("could not parse reminder state") from exc
    if not isinstance(value, dict):
        raise StoreError("reminder state is not an object")
    date = str(value.get("date") or "")
    if date and not DATE_RE.fullmatch(date):
        raise StoreError("reminder date is invalid")
    position = value.get("verse_position", -1)
    try:
        position = int(position)
    except (TypeError, ValueError) as exc:
        raise StoreError("verse position is invalid") from exc
    if position < -1 or position > 10000:
        raise StoreError("verse position is out of range")
    notified_in = value.get("last_notified")
    notified: dict[str, str] = {}
    if isinstance(notified_in, dict):
        for key, item in list(notified_in.items())[:6]:
            kid = str(key)
            if kid not in HOUR_IDS:
                continue
            stamp = str(item or "")
            if DATE_RE.fullmatch(stamp):
                notified[kid] = stamp
    return {
        "date": date,
        "translation": "bsb" if value.get("translation") == "bsb" else "",
        "verse_position": position,
        "reference": clip(value.get("reference"), MAX_REFERENCE),
        "text": clip(value.get("text"), MAX_VERSE),
        "last_notified": notified,
    }


def empty_cache() -> dict[str, object]:
    return {
        "date": "",
        "translation": "",
        "verse_position": -1,
        "reference": "",
        "text": "",
        "last_notified": {},
    }


def serialize_cache(data: dict[str, object]) -> bytes:
    return (json.dumps(data, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def parse_verses(raw: bytes) -> None:
    try:
        value = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise StoreError("could not parse verses catalogue") from exc
    rows = value.get("verses") if isinstance(value, dict) else None
    if not isinstance(rows, list) or len(rows) > MAX_VERSES:
        raise StoreError("verses catalogue is invalid")
    for item in rows:
        if not isinstance(item, dict):
            raise StoreError("verse entry is invalid")
        if len(str(item.get("reference") or "")) > MAX_REFERENCE:
            raise StoreError("verse reference is too long")
        if len(str(item.get("text") or "")) > MAX_VERSE:
            raise StoreError("verse text is too long")


def parse_office(raw: bytes) -> None:
    try:
        value = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise StoreError("could not parse office book") from exc
    if not isinstance(value, dict):
        raise StoreError("office book is invalid")


def read_stdin_json() -> bytes:
    fd = sys.stdin.fileno()
    data = b""
    deadline = time.monotonic() + READ_DEADLINE_S
    while len(data) <= MAX_CACHE_BYTES:
        remain = deadline - time.monotonic()
        if remain <= 0:
            break
        ready, _, _ = select.select([fd], [], [], min(0.25, remain))
        if not ready:
            if data:
                break
            continue
        chunk = os.read(fd, min(65536, MAX_CACHE_BYTES + 1 - len(data)))
        if not chunk:
            break
        data += chunk
        try:
            json.loads(data.decode("utf-8"))
            break
        except (UnicodeDecodeError, json.JSONDecodeError):
            continue
    if len(data) > MAX_CACHE_BYTES:
        raise StoreError("payload too large", 3)
    return data


def open_data_dir() -> int:
    root = Path(__file__).resolve().parent.parent
    fd = os.open(str(root), os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC)
    try:
        nfd = os.open(
            "data",
            os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_CLOEXEC,
            dir_fd=fd,
        )
    finally:
        os.close(fd)
    st = os.fstat(nfd)
    if not stat.S_ISDIR(st.st_mode):
        os.close(nfd)
        raise StoreError("data is not a directory")
    return nfd


def cmd_read_data(name: str) -> None:
    max_bytes = DATA_FILES[name]
    dirfd = open_data_dir()
    try:
        raw = read_bounded(dirfd, name, max_bytes)
        if raw is None:
            raise StoreError(f"{name} is missing")
        if name == "verses.json":
            parse_verses(raw)
        else:
            parse_office(raw)
        sys.stdout.buffer.write(raw)
    finally:
        os.close(dirfd)


def cmd_read_cache() -> None:
    try:
        dirfd = open_dir_chain(CACHE_PARTS, private_leaf=False, create=False)
    except FileNotFoundError:
        return
    try:
        raw = read_bounded(dirfd, CACHE_NAME, MAX_CACHE_BYTES)
        if raw is None:
            return
        sys.stdout.buffer.write(serialize_cache(parse_cache(raw)))
    finally:
        os.close(dirfd)


def cmd_write_cache() -> None:
    payload = parse_cache(read_stdin_json())
    dirfd = open_dir_chain(CACHE_PARTS, private_leaf=False)
    try:
        write_atomic(dirfd, CACHE_NAME, serialize_cache(payload))
    finally:
        os.close(dirfd)


def main(argv: list[str]) -> int:
    if len(argv) != 2 or argv[1] not in {"read-cache", "write-cache", "read-verses", "read-office"}:
        die("usage: hours-store.py read-cache|write-cache|read-verses|read-office", 2)
    try:
        os.setsid()
    except OSError:
        pass
    try:
        op = argv[1]
        if op == "read-cache":
            cmd_read_cache()
        elif op == "write-cache":
            cmd_write_cache()
        elif op == "read-verses":
            cmd_read_data("verses.json")
        else:
            cmd_read_data("office.json")
    except StoreError as exc:
        die(str(exc), exc.code)
    except OSError as exc:
        die(str(exc) or "I/O error")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
