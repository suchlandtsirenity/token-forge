# Constraints

Standing lessons for this project. Each line has an id, a date, and where it came
from. A return packet cites the id when it hits a known one.

Written by `python3 -m loop learn`. Edit by hand if you must — the ids are the
interface, not the tool.

- **C-0001** (2026-11-22) Name the base format for what it is — "token-set JSON (DTCG-compatible)". Calling it "DTCG" makes every difference ($forge, $version, our key names) read as a defect. — from suite ruling 2026-11-21
- **C-0002** (2026-11-22) A set's identity is its canonical token set, not the file bytes. $forge's key order follows what the user pinned, so raw bytes give one set two identities — hash the parsed token set, keys in vocabulary order. — from token-forge review 2026-11-21
- **C-0003** (2026-11-22) Cite repo-relative, never absolute. — from ecosystem rule
- **C-0004** (2026-11-22) Before filing a bug against another component, check that component's own record. I read three identical deliveries as an ingest dedupe gap; the bus's log had no duplicate source ids, and the cause was the sender retrying. The symptom is not the location of the fault. — from token-forge, 2026-11-22 (my own error)
- **C-0005** (2026-11-23) A wrong diagnosis does not mean there is no bug. Keep the finding while you fix the diagnosis — C-0004 governs filing, this governs receiving a correction, and a lesson that prevents a bad report does not prevent a good one being discarded. — from token-forge, 2026-11-22 (via suite review)
