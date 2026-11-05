// The page: builds the control rail, applies tokens to the preview, saves to localStorage.
import {FONTS,CAT,stack} from "./fonts.js";
import {r3,lch2rgb,rgb2hex,ratio,cs} from "./color.js";
import {BASE,PRESETS,SH,EASE,CK,kebab,derive} from "./tokens.js";
import {exportTokens} from "./export.js";
import {GROUPS,FOLDS,CTL,keysUnder,pinCount} from "./controls.js";

/* ---------- fonts ---------- */
const FL={};
function ensureFont(n,cb){
 if(FL[n]&&FL[n]!=="loading"){cb&&cb(FL[n]!=="fail");return}
 if(FL[n]==="loading")return;
 FL[n]="loading";const specs=[":wght@100..900",":wght@300;400;500;600;700",":wght@400;700",""];let i=0;
 const next=()=>{if(i>=specs.length){FL[n]="fail";cb&&cb(false);return}
  const sp=specs[i++],l=document.createElement("link");l.rel="stylesheet";
  l.href="https://fonts.googleapis.com/css2?family="+n.trim().replace(/ /g,"+")+sp+"&display=swap";
  l.onload=()=>{FL[n]=sp;cb&&cb(true)};l.onerror=()=>{l.remove();next()};document.head.appendChild(l)};
 next();
}


/* ---------- state ---------- */
const KEY="token-forge-v2",SKEY="token-forge-saves";
let S;try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!S||typeof S!=="object")S=structuredClone(BASE);
S={...structuredClone(BASE),...S};S.o=S.o||{};S.custom=S.custom||[];
const setPreset=n=>{const p=structuredClone(PRESETS[n]);S={...structuredClone(BASE),...p,custom:S.custom,o:p.o||{}}};


/* ---------- build controls ---------- */
const groupsEl=document.getElementById("groups");
// Custom font names come from the user or an imported JSON file, so escape them.
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function fontOptions(){let h="";if(S.custom.length)h+=`<optgroup label="Custom">${S.custom.map(f=>`<option value="${esc(f)}">${esc(f)}</option>`).join("")}</optgroup>`;
 for(const[c,l]of Object.entries(FONTS))h+=`<optgroup label="${c}">${l.map(f=>`<option value="${f}">${f}</option>`).join("")}</optgroup>`;return h}
const allFonts=()=>[...S.custom,...Object.values(FONTS).flat()];
// One fold pattern at every depth: a pin count, an Unpin for everything inside, then its children.
function foldHTML(n,path){return `<details class="fold"${n.open?" open":""}><summary>${n.l}<span class="pins" data-pins="${path}"></span><button type="button" class="btn sm clr" data-clr="${path}" hidden>Unpin</button></summary><div class="fbody">${n.c.map(c=>ctlHTML(c,true,path)).join("")}</div></details>`}
function ctlHTML(c,adv,path){
 if(c.t==="fold")return foldHTML(c,path+"."+c.id);
 if(c.t==="colors")return `<div class="cgrid">${CK.filter(([k])=>c.ks.includes(k)).map(([k,l])=>`<label class="cw" data-cw="${k}"><input type="color" data-ck="${k}" aria-label="${l}"><span>${l}</span><button type="button" class="rst" data-rst="c_${k}" hidden>auto</button></label>`).join("")}</div>`;
 if(c.t==="contrast")return `<div class="chk" id="chk"></div>`;
 if(c.t==="customfont")return `<div class="flex" style="flex-wrap:nowrap"><input type="text" id="cfont" placeholder="Rethink Sans" aria-label="Google font family name"><button class="btn" id="cfontgo" type="button">Load</button></div><span class="note" id="cfnote">Type the exact family name from fonts.google.com. It joins every font picker under Custom.</span>`;
 const id="k_"+c.k,lab=c.t==="seg"?`<span class="lbl">${c.l}</span>`:`<label for="${id}">${c.l}</label>`;
 let ctrl="";
 if(c.t==="range")ctrl=`<input id="${id}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" data-k="${c.k}" data-adv="${adv?1:0}">`;
 else if(c.t==="seg")ctrl=`<div class="seg" role="group" aria-label="${c.l}" data-k="${c.k}" data-adv="${adv?1:0}">${c.o.map(([v,t])=>`<button type="button" data-v="${v}">${t}</button>`).join("")}</div>`;
 else if(c.t==="font")ctrl=`<div class="fontpick"><button class="btn sm" type="button" data-cycle="-1" data-for="${c.k}" aria-label="Previous font">‹</button><select id="${id}" data-k="${c.k}" data-adv="0" data-font>${fontOptions()}</select><button class="btn sm" type="button" data-cycle="1" data-for="${c.k}" aria-label="Next font">›</button></div>`;
 return `<div class="row" data-row="${c.k}">${lab}<span class="rv"><output id="o_${c.k}"></output>${adv?`<button type="button" class="rst" data-rst="${c.k}" hidden>auto</button>`:""}</span>${ctrl}</div>`;
}
groupsEl.innerHTML=GROUPS.map(g=>`<details class="grp" data-g="${g.id}"${g.open?" open":""}><summary>${g.title}<span class="pins" data-pins="${g.id}"></span></summary><div class="gbody">
 ${g.simple.map(c=>ctlHTML(c,false)).join("")}
 ${foldHTML(FOLDS[g.id],g.id)}
</div></details>`).join("");
function refreshFontSelects(){document.querySelectorAll("select[data-font]").forEach(s=>{const v=S[s.dataset.k];s.innerHTML=fontOptions();s.value=v})}

/* ---------- apply ---------- */
const stage=document.getElementById("stage");
let GRAIN="";(()=>{try{const c=document.createElement("canvas");c.width=c.height=160;const x=c.getContext("2d"),im=x.createImageData(160,160);
 for(let i=0;i<im.data.length;i+=4){const v=Math.random()*255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255}x.putImageData(im,0,0);GRAIN=c.toDataURL()}catch(e){}})();
let E,FMT="css",CF="oklch";
function apply(){
 E=derive(S);const st=stage.style,set=(k,v)=>st.setProperty("--ds-"+k,v),C=E.C;
 for(const[k]of CK)set(kebab(k),cs(C[k]));
 set("chip-on",C.ok.l>0.66?cs({l:0.2,c:0.02,h:C.ok.h}):"#fff");
 const rad=v=>v>=40?"999px":v+"px";
 set("r-card",E.rCard+"px");set("r-btn",rad(E.rBtn));set("r-input",rad(E.rInput));set("r-chip",rad(E.rChip));
 set("bw-card",E.bwCard+"px");set("bw-ctl",E.bwCtl+"px");set("bstyle",E.bStyle);
 set("shadow",E.shadow);set("shadow-btn",E.shadowBtn);
 set("f-display",stack(S.fd));set("f-body",stack(S.fb));set("f-mono",stack(S.fm));set("f-num",stack(E.numF==="mono"?S.fm:E.numF==="body"?S.fb:S.fd));
 set("fw-d",E.fwD);set("fw-b",E.fwB);set("fw-s",E.fwS);set("ls-d",E.lsD+"em");set("ls-b",E.lsB+"em");set("lh-b",E.lhB);set("lh-h",E.lhH);set("fst-d",E.dItal);set("h-tt",E.hCase);
 set("fs-m1",E.fs[-1]+"px");for(let i=0;i<=4;i++)set("fs-"+i,E.fs[i]+"px");
 set("fs-label",E.fsLabel+"px");set("label-tt",S.lab==="upper"?"uppercase":"none");set("label-ls",E.labLs+"em");set("label-w",E.labW);
 set("pad",E.pad+"px");set("gap",E.gap+"px");set("ctl-py",E.ctlPy+"px");set("ctl-px",E.ctlPx+"px");set("row-py",E.rowPy+"px");
 set("dur",S.dur+"ms");set("ease",E.easing);set("lift",E.lift);set("press",E.press);set("pulse",E.pulse+"s");
 set("ic-sw",S.icSw);set("ic-cap",E.icCap);set("ic-join",E.icCap==="round"?"round":E.icCap==="square"?"miter":"bevel");set("ic-scale",E.icScale);
 set("grain",S.grain);set("grain-img",GRAIN?`url(${GRAIN})`:"none");set("glass",E.glass+"px");set("card-a",E.cardA+"%");
 const pc=`color-mix(in oklch, ${cs(C.fg)} ${r3(E.patOp*100)}%, transparent)`,s=E.patSize;
 const pat={none:["none","auto"],grid:[`linear-gradient(${pc} 1px, transparent 1px), linear-gradient(90deg, ${pc} 1px, transparent 1px)`,`${s}px ${s}px`],
  dots:[`radial-gradient(${pc} 1.2px, transparent 1.6px)`,`${s}px ${s}px`],lines:[`linear-gradient(${pc} 1px, transparent 1px)`,`100% ${s}px`],
  diagonal:[`repeating-linear-gradient(45deg, ${pc} 0 1px, transparent 1px ${s}px)`,"auto"]}[S.pattern];
 st.backgroundImage=pat[0];st.backgroundSize=pat[1];
 stage.classList.toggle("isdark",S.mode==="dark");st.colorScheme=S.mode;
 for(const a of ["btn","card","input","chip"])stage.dataset[a]=S[a];
 for(const a of ["hover","focus","led","ledglow","toggle"])stage.dataset[a]=E[a];
 stage.dataset.press=E.pressS;
 [S.fd,S.fb,S.fm].forEach(f=>ensureFont(f,()=>status()));
 document.getElementById("pal").innerHTML=CK.map(([k,l])=>{const c=C[k],t=c.l>0.62?{l:0.18,c:0,h:0}:{l:0.98,c:0,h:0};return `<div style="background:${cs(c)};color:${cs(t)}">${l}</div>`}).join("");
 sync();renderExport();save();
}
function status(){const bad=[S.fd,S.fb,S.fm].filter(f=>FL[f]==="fail");document.getElementById("fontstatus").textContent=bad.length?`Couldn't load ${bad.join(", ")} from Google Fonts. Showing a fallback.`:""}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

function valOf(k,adv){return adv?E[k]:S[k]}
function sync(){
 document.querySelectorAll("[data-k]").forEach(el=>{const k=el.dataset.k,adv=el.dataset.adv==="1",v=valOf(k,adv);
  if(el.classList.contains("seg"))el.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===String(v))));
  else if(String(el.value)!==String(v))el.value=v;
  const c=CTL[k],o=document.getElementById("o_"+k);if(o&&c&&c.t==="range")o.textContent=c.f?c.f(v):v;
  const row=el.closest(".row");if(row&&adv){const pinned=k in S.o;row.classList.toggle("pinned",pinned);const rb=row.querySelector(".rst");if(rb)rb.hidden=!pinned}});
 CK.forEach(([k])=>{const inp=document.querySelector(`[data-ck="${k}"]`);if(!inp)return;const hx=rgb2hex(lch2rgb(E.C[k]));if(inp.value!==hx)inp.value=hx;
  const pinned=("c_"+k) in S.o;inp.closest(".cw").classList.toggle("pinned",pinned);inp.parentNode.querySelector(".rst").hidden=!pinned});
 document.querySelectorAll("[data-pins]").forEach(el=>{const n=pinCount(FOLDS[el.dataset.pins],S.o);el.textContent=n?n+" pinned":"";const b=el.parentNode.querySelector(":scope>[data-clr]");if(b)b.hidden=!n});
 const C=E.C,pairs=[["Text on page",C.fg,C.bg,4.5],["Muted on card",C.muted,C.surface,4.5],["Button label",C.onAccent,C.accent,4.5],["Accent text on tint",C.accentInk,C.accentSoft,4.5],["Border vs card",C.border,C.surface,1.5]];
 const ch=document.getElementById("chk");if(ch)ch.innerHTML=pairs.map(([l,a,b,min])=>{const v=ratio(a,b);return `<span>${l}</span><b class="${v>=min?"pass":"fail"}">${v.toFixed(2)}:1 ${v>=min?"ok":"low"}</b>`}).join("");
}

/* ---------- events ---------- */
const rail=document.getElementById("rail");
rail.addEventListener("input",e=>{const el=e.target;
 if(el.dataset.ck){S.o["c_"+el.dataset.ck]=el.value;apply();return}
 if(!el.dataset.k)return;const k=el.dataset.k,adv=el.dataset.adv==="1",v=el.tagName==="SELECT"?el.value:parseFloat(el.value);
 if(adv)S.o[k]=v;else S[k]=v;apply()});
rail.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
 if(b.dataset.rst){e.preventDefault();delete S.o[b.dataset.rst];apply();return}
 if(b.dataset.clr){e.preventDefault();keysUnder(FOLDS[b.dataset.clr]).forEach(k=>delete S.o[k]);apply();return}
 if(b.dataset.cycle){const k=b.dataset.for,l=allFonts(),i=l.indexOf(S[k]);S[k]=l[(i+ +b.dataset.cycle+l.length)%l.length];apply();return}
 const seg=b.closest(".seg[data-k]");if(seg){const k=seg.dataset.k;if(seg.dataset.adv==="1")S.o[k]=b.dataset.v;else S[k]=b.dataset.v;apply()}});
document.getElementById("presets").innerHTML=Object.keys(PRESETS).map(p=>`<button class="btn" type="button" data-p="${p}">${p}</button>`).join("");
document.getElementById("presets").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;setPreset(b.dataset.p);apply()});
document.getElementById("clearpins").onclick=()=>{S.o={};apply()};
document.getElementById("shuffle").onclick=()=>{const pick=a=>a[Math.floor(Math.random()*a.length)],rn=(a,b,s)=>Math.round((a+Math.random()*(b-a))/s)*s;
 const f=Object.values(FONTS).flat(),body=[...FONTS.Grotesque,...FONTS.Geometric,...FONTS.Humanist,...FONTS.Rounded,...FONTS.Serif.slice(0,6),...FONTS.Mono];
 S={...structuredClone(BASE),custom:S.custom,mode:pick(["light","dark"]),depth:rn(0,100,1),nh:rn(0,360,1),nt:r3(rn(0,0.04,0.001)),contrast:Math.round(rn(0.6,1.8,0.05)*100)/100,
  ah:rn(0,360,1),ac:r3(rn(0.06,0.22,0.005)),al:Math.round(rn(0.5,0.85,0.01)*100)/100,sc:r3(rn(0.08,0.18,0.005)),
  fd:pick(f),fb:pick(body),fm:pick(FONTS.Mono),base:pick([13,14,15,16]),ratio:pick([1.125,1.2,1.25,1.333,1.414]),lab:pick(["none","upper"]),
  radius:pick([0,2,4,6,8,12,16,22]),bw:pick([0,1,1,1.5,2,3]),shadow:pick(Object.keys(SH)),unit:rn(6,12,1),dur:rn(0,500,10),ease:pick(Object.keys(EASE)),
  btn:pick(["filled","outline","soft","inverted"]),card:pick(["outline","filled","elevated"]),input:pick(["outline","filled","underline"]),chip:pick(["soft","outline","solid","dot"]),
  hover:pick(["none","lift","dim","ring"]),pressS:pick(["none","scale","sink"]),focus:pick(["glow","solid","offset","underline"]),led:pick(["dot","square","bar","ring"]),ledglow:pick(["off","on"]),toggle:pick(["pill","square","slot"]),
  pattern:pick(["none","none","grid","dots","lines","diagonal"]),grain:pick([0,0,0.04,0.08]),icSw:pick([1.25,1.5,1.75,2,2.5]),o:{}};apply()};

document.addEventListener("click",e=>{if(e.target.id!=="cfontgo")return;const inp=document.getElementById("cfont"),n=inp.value.trim(),note=document.getElementById("cfnote");
 if(!n){note.textContent="Type a font family name first.";return}
 note.textContent="Loading "+n+"…";delete FL[n];
 ensureFont(n,ok=>{if(!ok){note.textContent=`Google Fonts didn't recognise "${n}". Check the spelling and capitals.`;return}
  if(!S.custom.includes(n))S.custom.unshift(n);CAT[n]=CAT[n]||"Custom";refreshFontSelects();note.textContent=`${n} loaded. Pick it from any font list under Custom.`;inp.value="";save()})});

const vw=document.getElementById("vw");vw.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
 vw.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));stage.classList.toggle("phone",b.dataset.v==="phone")});
const sw=document.getElementById("dssw");sw.onclick=()=>sw.setAttribute("aria-checked",String(sw.getAttribute("aria-checked")!=="true"));
document.getElementById("dsseg").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;b.parentNode.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)))});

/* ---------- saves ---------- */
function loadSaves(){try{return JSON.parse(localStorage.getItem(SKEY))||{}}catch(e){return {}}}
function renderSaves(){const s=loadSaves(),el=document.getElementById("saves"),names=Object.keys(s);
 el.innerHTML=names.length?names.map(n=>`<div><button class="btn" type="button" data-load="${n.replace(/"/g,"&quot;")}">${n.replace(/</g,"&lt;")}</button><button class="btn sm" type="button" data-del="${n.replace(/"/g,"&quot;")}" aria-label="Delete ${n.replace(/"/g,"")}">×</button></div>`).join(""):`<span class="note">Nothing saved yet. Name your current setup and save it to come back later.</span>`}
document.getElementById("save").onclick=()=>{const n=document.getElementById("savename").value.trim()||("System "+new Date().toLocaleString());const s=loadSaves();s[n]=structuredClone(S);
 try{localStorage.setItem(SKEY,JSON.stringify(s))}catch(e){}document.getElementById("savename").value="";renderSaves()};
document.getElementById("saves").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const s=loadSaves();
 if(b.dataset.load&&s[b.dataset.load]){S={...structuredClone(BASE),...structuredClone(s[b.dataset.load])};refreshFontSelects();apply()}
 if(b.dataset.del){delete s[b.dataset.del];try{localStorage.setItem(SKEY,JSON.stringify(s))}catch(e){}renderSaves()}});

/* ---------- export ---------- */
/* ---------- export ---------- */
function renderExport(){document.getElementById("out").textContent=exportTokens(S,E,FMT,CF,FL)}
document.getElementById("fmt").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;FMT=b.dataset.f;document.querySelectorAll("#fmt button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));renderExport()});
document.getElementById("cfmt").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;CF=b.dataset.v;document.querySelectorAll("#cfmt button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));renderExport()});
document.getElementById("copy").addEventListener("click",()=>{const txt=document.getElementById("out").textContent,note=document.getElementById("note");
 const fb=()=>{const r=document.createRange();r.selectNodeContents(document.getElementById("out"));const sel=getSelection();sel.removeAllRanges();sel.addRange(r);note.textContent="Selected. Press Ctrl+C to copy."};
 try{navigator.clipboard.writeText(txt).then(()=>{note.textContent="Copied."},fb)}catch(e){fb()}});
document.getElementById("impgo").onclick=()=>{const n=document.getElementById("impnote");try{const j=JSON.parse(document.getElementById("imp").value);const src=j.$forge||j;
 if(!src||typeof src!=="object"||!("mode" in src))throw 0;S={...structuredClone(BASE),...src,o:src.o||{},custom:Array.isArray(src.custom)?src.custom.filter(f=>typeof f==="string"):[]};refreshFontSelects();apply();n.textContent="Loaded."}
 catch(e){n.textContent="That isn't a Token Forge export. Copy the JSON tab and paste it here."}};

renderSaves();apply();
