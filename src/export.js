// Turns derived tokens into the export formats. FL holds the axis spec each
// Google font loaded with, so the @import asks for the same weights.
import {cs} from "./color.js";
import {stack} from "./fonts.js";
import {CK,kebab} from "./tokens.js";

export function fontImport(S,FL={}){const fs=[...new Set([S.fd,S.fb,S.fm])];return "https://fonts.googleapis.com/css2?"+fs.map(f=>"family="+f.replace(/ /g,"+")+(FL[f]&&FL[f]!=="fail"&&FL[f]!=="loading"?FL[f]:"")).join("&")+"&display=swap"}
export function exportTokens(S,E,FMT,CF,FL={}){const C=E.C,c=k=>cs(C[k],CF),rad=v=>v>=40?"999px":v+"px";let s="";
 const comp=`buttons: ${S.btn}, hover ${E.hover}, press ${E.pressS} · cards: ${S.card} · inputs: ${S.input} · chips: ${S.chip} · focus: ${E.focus} · lights: ${E.led}${E.ledglow==="on"?" with glow":""} · toggle: ${E.toggle}`;
 if(FMT==="css"){
  s=`@import url("${fontImport(S,FL)}");\n\n/* ${comp} */\n:root {\n  color-scheme: ${S.mode};\n`;
  for(const[k]of CK)s+=`  --color-${kebab(k)}: ${c(k)};\n`;
  s+=`\n  --font-display: ${stack(S.fd)};\n  --font-body: ${stack(S.fb)};\n  --font-mono: ${stack(S.fm)};\n  --font-numeric: var(--font-${E.numF==="mono"?"mono":E.numF});\n`;
  s+=`  --font-weight-display: ${E.fwD};\n  --font-weight-body: ${E.fwB};\n  --font-weight-strong: ${E.fwS};\n  --font-style-display: ${E.dItal};\n  --tracking-display: ${E.lsD}em;\n  --tracking-body: ${E.lsB}em;\n  --leading-heading: ${E.lhH};\n  --leading-body: ${E.lhB};\n  --heading-transform: ${E.hCase};\n`;
  s+=`  --text-sm: ${E.fs[-1]}px;\n  --text-base: ${E.fs[0]}px;\n  --text-lg: ${E.fs[1]}px;\n  --text-xl: ${E.fs[2]}px;\n  --text-2xl: ${E.fs[3]}px;\n  --text-3xl: ${E.fs[4]}px;\n`;
  s+=`  --label-size: ${E.fsLabel}px;\n  --label-transform: ${S.lab==="upper"?"uppercase":"none"};\n  --label-tracking: ${E.labLs}em;\n  --label-weight: ${E.labW};\n`;
  s+=`\n  --radius-card: ${E.rCard}px;\n  --radius-button: ${rad(E.rBtn)};\n  --radius-input: ${rad(E.rInput)};\n  --radius-chip: ${rad(E.rChip)};\n  --border-card: ${E.bwCard}px ${E.bStyle};\n  --border-control: ${E.bwCtl}px solid;\n`;
  s+=`  --shadow-card: ${E.shadow};\n  --shadow-button: ${E.shadowBtn};\n`;
  s+=`\n  --space-unit: ${S.unit}px;\n  --space-card: ${E.pad}px;\n  --space-gap: ${E.gap}px;\n  --space-control-y: ${E.ctlPy}px;\n  --space-control-x: ${E.ctlPx}px;\n  --space-row: ${E.rowPy}px;\n`;
  s+=`\n  --motion-duration: ${S.dur}ms;\n  --motion-easing: ${E.easing};\n  --motion-hover-lift: ${E.lift}px;\n  --motion-press-scale: ${E.press};\n  --motion-pulse: ${E.pulse}s;\n`;
  s+=`\n  --icon-stroke: ${S.icSw};\n  --icon-linecap: ${E.icCap};\n  --icon-scale: ${E.icScale};\n`;
  s+=`\n  --texture-pattern: ${S.pattern};\n  --texture-pattern-size: ${E.patSize}px;\n  --texture-pattern-strength: ${E.patOp};\n  --texture-grain: ${S.grain};\n  --card-blur: ${E.glass}px;\n  --card-opacity: ${E.cardA}%;\n}`;
 }else if(FMT==="tw"){
  s=`@import url("${fontImport(S,FL)}");\n@import "tailwindcss";\n\n@theme {\n`;
  for(const[k]of CK)s+=`  --color-${kebab(k)}: ${c(k)};\n`;
  s+=`\n  --font-display: ${stack(S.fd)};\n  --font-sans: ${stack(S.fb)};\n  --font-mono: ${stack(S.fm)};\n`;
  ["sm","base","lg","xl","2xl","3xl"].forEach((n,i)=>s+=`  --text-${n}: ${E.fs[i-1]}px;\n`);
  s+=`  --tracking-display: ${E.lsD}em;\n  --leading-body: ${E.lhB};\n\n  --radius-card: ${E.rCard}px;\n  --radius-button: ${rad(E.rBtn)};\n  --radius-input: ${rad(E.rInput)};\n  --radius-chip: ${rad(E.rChip)};\n`;
  s+=`  --spacing: ${S.unit/2}px;\n  --shadow-card: ${E.shadow};\n  --shadow-button: ${E.shadowBtn};\n  --ease-brand: ${E.easing};\n  --default-transition-duration: ${S.dur}ms;\n  --default-transition-timing-function: ${E.easing};\n}\n\n/* ${comp} */`;
 }else if(FMT==="json"){
  const col={};CK.forEach(([k])=>col[kebab(k)]={$type:"color",$value:c(k)});
  s=JSON.stringify({$description:"Made in Token Forge",mode:S.mode,color:col,
   font:{display:{$value:stack(S.fd)},body:{$value:stack(S.fb)},mono:{$value:stack(S.fm)}},
   size:Object.fromEntries([-1,0,1,2,3,4].map(i=>[String(i),{$type:"dimension",$value:E.fs[i]+"px"}])),
   radius:{card:{$value:E.rCard+"px"},button:{$value:rad(E.rBtn)},input:{$value:rad(E.rInput)},chip:{$value:rad(E.rChip)}},
   shadow:{card:{$value:E.shadow},button:{$value:E.shadowBtn}},motion:{duration:{$value:S.dur+"ms"},easing:{$value:E.easing}},
   components:{button:S.btn,hover:E.hover,press:E.pressS,card:S.card,input:S.input,chip:S.chip,focus:E.focus,lights:E.led,lightGlow:E.ledglow,toggle:E.toggle},
   $forge:S},null,2);
 }else{
  s=`# Design system\n\nUse these tokens for every screen. Do not fall back to library defaults (Inter, Lucide defaults, gray-200 borders, rounded-xl cards).\nThe full token list lives in tokens.css; this is the intent behind it.\n\n## Feel\n- Mode: ${S.mode} first. Background depth ${S.depth}%, neutrals tinted toward hue ${S.nh}°.\n- Accent: ${c("accent")} (text on it: ${c("onAccent")}). Second accent for charts: ${c("accent2")}.\n- Status: ok ${c("ok")}, warning ${c("warn")}, problem ${c("bad")}. Quiet when fine, loud only when broken.\n\n## Type\n- Display: ${S.fd}, weight ${E.fwD}${E.dItal==="italic"?", italic":""}${E.hCase!=="none"?", "+E.hCase+" headings":""}, tracking ${E.lsD}em.\n- Body: ${S.fb}, weight ${E.fwB}, line height ${E.lhB}. Base ${S.base}px, scale ratio ${S.ratio}.\n- Mono: ${S.fm}. Big numbers use the ${E.numF} face with tabular figures.\n- Labels: ${S.lab==="upper"?"uppercase":"sentence case"}, ${E.fsLabel}px, tracking ${E.labLs}em, weight ${E.labW}.\n\n## Shape\n- Radius: cards ${E.rCard}px, buttons ${rad(E.rBtn)}, inputs ${rad(E.rInput)}, chips ${rad(E.rChip)}.\n- Borders: cards ${E.bwCard}px ${E.bStyle}, controls ${E.bwCtl}px.\n- Shadow: ${S.shadow} (${E.shadow}).\n- Spacing unit ${S.unit}px, card padding ${E.pad}px, gaps ${E.gap}px.\n\n## Components\n- ${comp.replace(/ · /g,"\n- ")}\n\n## Texture, icons, motion\n- Pattern: ${S.pattern}${S.pattern!=="none"?` (${E.patSize}px, ${Math.round(E.patOp*100)}%)`:""}. Grain ${Math.round(S.grain*100)}%. Card blur ${E.glass}px at ${E.cardA}% opacity.\n- Icons: outline, ${S.icSw}px stroke, ${E.icCap} line ends.\n- Motion: ${S.dur}ms, ${E.easing}. Hover lifts ${E.lift}px, press scales to ${E.press}. Respect prefers-reduced-motion.\n`;
 }
 return s;
}
