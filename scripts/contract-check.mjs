// The Contract level: the thing another repo consumes must hold. Run the
// `tokens` module's validate() over the JSON export of every preset.
//
// The module is not vendored — it lives in suite. Resolve it without hard-coding
// an absolute path (C-0003): an env override, then a sibling checkout, then the
// ecosystem's default checkout under the home directory (via os.homedir(), never
// a literal path). Missing module is exit 2 (escalate), not a pass.
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { BASE, PRESETS, derive } from "../src/tokens.js";
import { exportTokens } from "../src/export.js";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const candidates = [
  process.env.TOKENS_MODULE,
  resolve(repo, "..", "suite", "modules", "tokens", "index.js"),
  resolve(homedir(), "portfolio", "suite", "modules", "tokens", "index.js"),
].filter(Boolean);
const modulePath = candidates.find((p) => existsSync(p));

if (!modulePath) {
  console.error(
    "contract-check: the tokens module was not found. Set TOKENS_MODULE, or " +
    "check out suite beside this repo. Searched:\n  " + candidates.join("\n  ")
  );
  process.exit(2);
}

const { validate, VERSION } = await import(pathToFileURL(modulePath).href);

let bad = 0;
for (const [name, preset] of Object.entries(PRESETS)) {
  const S = { ...structuredClone(BASE), ...structuredClone(preset) };
  const json = JSON.parse(exportTokens(S, derive(S), "json", "oklch"));
  const problems = validate(json);
  if (problems.length) {
    bad++;
    console.error(`${name}: ${problems.length} problem(s)`);
    for (const p of problems) console.error(`  ${p.path}: ${p.message}`);
  }
}

if (bad) {
  console.error(`contract-check: ${bad}/${Object.keys(PRESETS).length} presets failed validation`);
  process.exit(1);
}
console.log(`contract-check: ${Object.keys(PRESETS).length} presets validate against tokens ${VERSION}`);
