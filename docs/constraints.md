# Constraints

Standing lessons for this project. Each line has an id, a date, and where it came
from. A return packet cites the id when it hits a known one.

Written by `python3 -m loop learn`. Edit by hand if you must — the ids are the
interface, not the tool.

- **C-0001** (2026-11-22) Name the base format for what it is — "token-set JSON (DTCG-compatible)". Calling it "DTCG" makes every difference ($forge, $version, our key names) read as a defect. — from suite ruling 2026-11-21
- **C-0002** (2026-11-22) A set's identity is its canonical token set, not the file bytes. $forge's key order follows what the user pinned, so raw bytes give one set two identities — hash the parsed token set, keys in vocabulary order. — from token-forge review 2026-11-21
- **C-0003** (2026-11-22) Cite repo-relative, never absolute. — from ecosystem rule
