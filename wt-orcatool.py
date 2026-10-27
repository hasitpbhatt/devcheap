"""Resolve git conflict markers in a file, keeping both sides (HEAD then incoming).

Usage: resolve.py <file> [<file> ...]
"""
import re
import sys

START = re.compile(r"^<{7}(?: .*)?$\n", re.MULTILINE)
SEP = re.compile(r"^={7}$\n", re.MULTILINE)
END = re.compile(r"^>{7}(?: .*)?$\n", re.MULTILINE)


def resolve(path: str) -> bool:
    src = open(path).read()
    if "<<<<<<<" not in src:
        return False
    pieces: list[str] = []
    pos = 0
    while True:
        m_start = START.search(src, pos)
        if m_start is None:
            pieces.append(src[pos:])
            break
        pieces.append(src[pos:m_start.start()])
        m_sep = SEP.search(src, m_start.end())
        if m_sep is None:
            raise SystemExit(f"{path}: conflict without ===== separator")
        m_end = END.search(src, m_sep.end())
        if m_end is None:
            raise SystemExit(f"{path}: conflict without >>>>>>> terminator")
        pieces.append(src[m_start.end():m_sep.start()])
        pieces.append(src[m_sep.end():m_end.start()])
        pos = m_end.end()
    open(path, "w").write("".join(pieces))
    return True


if __name__ == "__main__":
    for p in sys.argv[1:]:
        print(p, "resolved" if resolve(p) else "clean")
