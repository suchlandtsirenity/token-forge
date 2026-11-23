// The Full level, scripted: every preset must produce output in every export
// format. This covers "each export format produces output" headlessly; the
// visual browser pass (the page loads, a preset renders) stays a manual step —
// a check has to be a command, and a browser is not always present.
//
// Exit 0 all presets render in all formats; non-zero on the first failure.
import { BASE, PRESETS, derive } from "../src/tokens.js";
import { exportTokens } from "../src/export.js";

const FORMATS = ["css", "tw", "json", "md"];
const problems = [];

for (const [name, preset] of Object.entries(PRESETS)) {
  const S = { ...structuredClone(BASE), ...structuredClone(preset) };
  const E = derive(S);
  for (const fmt of FORMATS) {
    let out;
    try {
      out = exportTokens(S, E, fmt, "oklch");
    } catch (e) {
      problems.push(`${name} · ${fmt}: threw ${e.message}`);
      continue;
    }
    if (typeof out !== "string" || out.trim() === "") {
      problems.push(`${name} · ${fmt}: empty output`);
    }
  }
  // The JSON format must still be a valid, versioned token set.
  const json = JSON.parse(exportTokens(S, E, "json", "oklch"));
  if (json.$version !== "1.0") problems.push(`${name} · json: $version is ${json.$version}`);
  if (!json.$forge) problems.push(`${name} · json: no $forge`);
}

if (problems.length) {
  console.error(`full-check: ${problems.length} problem(s)`);
  for (const p of problems) console.error("  " + p);
  process.exit(1);
}
console.log(`full-check: ${Object.keys(PRESETS).length} presets × ${FORMATS.length} formats render`);
