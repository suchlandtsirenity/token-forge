// The page: builds the control rail, applies tokens to the preview, saves to localStorage.
import {FONTS,CAT,stack} from "./fonts.js";
import {r3,lch2rgb,rgb2hex,ratio,cs} from "./color.js";
import {BASE,PRESETS,SH,EASE,CK,kebab,derive} from "./tokens.js";
import {exportTokens} from "./export.js";

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

/* ---------- schema ---------- */
const pct=v=>Math.round(v*100)+"%";
const R=(k,l,min,max,step,f)=>({k,l,t:"range",min,max,step,f});
const SG=(k,l,o)=>({k,l,t:"seg",o});
const FT=(k,l)=>({k,l,t:"font"});
const SUB=l=>({t:"sub",l});
const px=v=>v+"px",deg=v=>Math.round(v)+"°",em=v=>(+v).toFixed(3)+"em",x2=v=>(+v).toFixed(2),ms=v=>v+"ms";

const GROUPS=[
 {id:"colour",title:"Colour",open:true,simple:[
   SG("mode","Mode",[["light","Light"],["dark","Dark"]]),
   R("depth","Background depth",0,100,1,v=>v+"%"),R("nh","Neutral hue",0,360,1,deg),R("nt","Neutral tint",0,0.05,0.001,v=>(+v).toFixed(3)),
   R("contrast","Layer contrast",0.4,2,0.05,v=>x2(v)+"×"),R("ah","Accent hue",0,360,1,deg),R("ac","Accent chroma",0,0.25,0.005,v=>(+v).toFixed(3)),
   R("al","Accent lightness",0.35,0.92,0.01,x2),R("sc","Status saturation",0.03,0.22,0.005,v=>(+v).toFixed(3))],
  adv:[SUB("Hues"),R("okH","OK hue",0,360,1,deg),R("warnH","Warning hue",0,360,1,deg),R("badH","Problem hue",0,360,1,deg),R("a2","Second accent offset",-180,180,1,deg),
   SUB("Every colour, individually"),{t:"colors"},SUB("Readability"),{t:"contrast"}]},
 {id:"type",title:"Typography",simple:[
   FT("fd","Display face"),FT("fb","Body face"),FT("fm","Mono face"),
   R("base","Base size",12,20,0.5,px),R("ratio","Scale ratio",1.067,1.618,0.001,v=>(+v).toFixed(3)),
   SG("lab","Labels",[["none","Sentence case"],["upper","Uppercase"]])],
  adv:[SUB("Load any Google font"),{t:"customfont"},
   SUB("Display"),R("fwD","Weight",100,900,100),R("lsD","Letter spacing",-0.08,0.2,0.005,em),R("lhH","Line height",0.8,1.6,0.01,x2),
   SG("dItal","Style",[["normal","Upright"],["italic","Italic"]]),SG("hCase","Heading case",[["none","As written"],["upper","Upper"],["lowercase","Lower"]]),
   SUB("Body"),R("fwB","Weight",100,900,100),R("fwS","Strong and button weight",100,900,100),R("lsB","Letter spacing",-0.04,0.1,0.005,em),R("lhB","Line height",1,2.1,0.05,x2),
   SUB("Labels and numbers"),R("labScale","Label size",0.6,1.2,0.01,v=>Math.round(v*100)+"% of body"),R("labLs","Label tracking",-0.02,0.3,0.005,em),R("labW","Label weight",100,900,100),
   SG("numF","Big numbers use",[["display","Display face"],["body","Body face"],["mono","Mono face"]])]},
 {id:"shape",title:"Shape",simple:[
   R("radius","Corner radius",0,28,1,px),R("bw","Border weight",0,4,0.5,px),
   SG("shadow","Shadow",[["none","Flat"],["soft","Soft"],["hard","Hard offset"],["press","Pressed metal"],["glow","Glow"]])],
  adv:[SUB("Radius per part"),R("rCard","Cards",0,40,1,px),R("rBtn","Buttons",0,40,1,v=>v>=40?"pill":px(v)),R("rInput","Inputs",0,40,1,v=>v>=40?"pill":px(v)),R("rChip","Chips and toggles",0,40,1,v=>v>=40?"pill":px(v)),
   SUB("Borders"),R("bwCard","Card border",0,6,0.5,px),R("bwCtl","Control border",0,6,0.5,px),SG("bStyle","Card border style",[["solid","Solid"],["dashed","Dashed"],["dotted","Dotted"],["double","Double"]]),
   SUB("Shadow, exactly"),R("shX","Offset x",-16,16,1,px),R("shY","Offset y",-16,24,1,px),R("shBlur","Blur",0,64,1,px),R("shSpread","Spread",-16,16,1,px),
   R("shOp","Strength",0,1,0.01,pct),R("shHi","Top highlight",0,1,0.05,pct),SG("shTint","Shadow colour",[["neutral","Neutral"],["accent","Accent"],["ink","Text colour"]])]},
 {id:"space",title:"Space and density",simple:[R("unit","Spacing unit",4,14,1,px)],
  adv:[R("pad","Card padding",4,48,1,px),R("gap","Gap between things",2,40,1,px),R("ctlPy","Control padding, vertical",2,20,1,px),R("ctlPx","Control padding, horizontal",4,32,1,px),R("rowPy","List row padding",0,20,1,px)]},
 {id:"comp",title:"Components",simple:[
   SG("btn","Primary button",[["filled","Filled"],["outline","Outline"],["soft","Soft"],["inverted","Inverted"]]),
   SG("card","Cards",[["outline","Outlined"],["filled","Filled"],["elevated","Shadow only"],["bare","Bare"]]),
   SG("input","Inputs",[["outline","Outlined"],["filled","Filled"],["underline","Underline"]]),
   SG("chip","Chips",[["soft","Soft"],["outline","Outline"],["solid","Solid"],["dot","Dot"]])],
  adv:[SG("hover","Button hover",[["none","Nothing"],["lift","Lift"],["dim","Dim"],["ring","Ring"]]),
   SG("pressS","Button press",[["none","Nothing"],["scale","Squish"],["sink","Sink"]]),
   SG("focus","Focus ring",[["glow","Glow"],["solid","Solid"],["offset","Offset"],["underline","Underline"]]),
   SG("led","Status lights",[["dot","Dot"],["square","Square"],["bar","Bar"],["ring","Ring"]]),
   SG("ledglow","Light glow",[["off","Off"],["on","On"]]),
   SG("toggle","Toggle",[["pill","Pill"],["square","Square"],["slot","Slot"]])]},
 {id:"tex",title:"Texture and depth",simple:[
   SG("pattern","Background pattern",[["none","None"],["grid","Grid"],["dots","Dots"],["lines","Lines"],["diagonal","Diagonal"]]),
   R("grain","Film grain",0,0.25,0.01,pct)],
  adv:[R("patSize","Pattern size",2,48,1,px),R("patOp","Pattern strength",0,0.3,0.005,pct),R("glass","Card blur (glass)",0,30,1,px),R("cardA","Card opacity",20,100,1,v=>v+"%")]},
 {id:"icons",title:"Icons",simple:[R("icSw","Stroke width",0.75,3,0.25,px)],
  adv:[SG("icCap","Line ends",[["round","Round"],["square","Square"],["butt","Flat"]]),R("icScale","Size",0.7,1.5,0.05,v=>Math.round(v*100)+"%")]},
 {id:"motion",title:"Motion",simple:[R("dur","Duration",0,800,10,ms),
   SG("ease","Easing",[["spring","Springy"],["out","Smooth"],["snappy","Snappy"],["linear","Linear"],["steps","Stepped"]])],
  adv:[SUB("Custom curve (ignored when stepped)"),R("bz1","x1",0,1,0.01,x2),R("bz2","y1",-1,2,0.01,x2),R("bz3","x2",0,1,0.01,x2),R("bz4","y2",-1,2,0.01,x2),
   R("stepsN","Steps when stepped",2,10,1),R("lift","Hover lift",0,8,0.5,px),R("press","Press squish",0.85,1,0.01,v=>Math.round(v*100)+"%"),R("pulse","Alert pulse speed",0.4,4,0.1,v=>(+v).toFixed(1)+"s")]}
];
const ADVKEYS={};GROUPS.forEach(g=>{ADVKEYS[g.id]=[];g.adv.forEach(c=>c.k&&ADVKEYS[g.id].push(c.k));if(g.id==="colour")CK.forEach(([k])=>ADVKEYS.colour.push("c_"+k))});

/* ---------- build controls ---------- */
const groupsEl=document.getElementById("groups");
// Custom font names come from the user or an imported JSON file, so escape them.
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function fontOptions(){let h="";if(S.custom.length)h+=`<optgroup label="Custom">${S.custom.map(f=>`<option value="${esc(f)}">${esc(f)}</option>`).join("")}</optgroup>`;
 for(const[c,l]of Object.entries(FONTS))h+=`<optgroup label="${c}">${l.map(f=>`<option value="${f}">${f}</option>`).join("")}</optgroup>`;return h}
const allFonts=()=>[...S.custom,...Object.values(FONTS).flat()];
function ctlHTML(c,adv){
 if(c.t==="sub")return `<div class="sub">${c.l}</div>`;
 if(c.t==="colors")return `<div class="cgrid">${CK.map(([k,l])=>`<label class="cw" data-cw="${k}"><input type="color" data-ck="${k}" aria-label="${l}"><span>${l}</span><button type="button" class="rst" data-rst="c_${k}" hidden>auto</button></label>`).join("")}</div>`;
 if(c.t==="contrast")return `<div class="chk" id="chk"></div>`;
 if(c.t==="customfont")return `<div class="flex" style="flex-wrap:nowrap"><input type="text" id="cfont" placeholder="Rethink Sans" aria-label="Google font family name"><button class="btn" id="cfontgo" type="button">Load</button></div><span class="note" id="cfnote">Type the exact family name from fonts.google.com. It joins every font picker under Custom.</span>`;
 const id="k_"+c.k,lab=c.t==="seg"?`<span class="lbl">${c.l}</span>`:`<label for="${id}">${c.l}</label>`;
 let ctrl="";
 if(c.t==="range")ctrl=`<input id="${id}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" data-k="${c.k}" data-adv="${adv?1:0}">`;
 else if(c.t==="seg")ctrl=`<div class="seg" role="group" aria-label="${c.l}" data-k="${c.k}" data-adv="${adv?1:0}">${c.o.map(([v,t])=>`<button type="button" data-v="${v}">${t}</button>`).join("")}</div>`;
 else if(c.t==="font")ctrl=`<div class="fontpick"><button class="btn sm" type="button" data-cycle="-1" data-for="${c.k}" aria-label="Previous font">‹</button><select id="${id}" data-k="${c.k}" data-adv="0" data-font>${fontOptions()}</select><button class="btn sm" type="button" data-cycle="1" data-for="${c.k}" aria-label="Next font">›</button></div>`;
 return `<div class="row" data-row="${c.k}">${lab}<span class="rv"><output id="o_${c.k}"></output>${adv?`<button type="button" class="rst" data-rst="${c.k}" hidden>auto</button>`:""}</span>${ctrl}</div>`;
}
groupsEl.innerHTML=GROUPS.map(g=>`<details class="grp" data-g="${g.id}"${g.open?" open":""}><summary>${g.title}<span class="pins" id="pins_${g.id}"></span></summary><div class="gbody">
 ${g.simple.map(c=>ctlHTML(c,false)).join("")}
 <details class="fine"><summary>Fine-tune<button type="button" class="btn sm clr" data-clr="${g.id}">Unpin group</button></summary><div class="fbody">${g.adv.map(c=>ctlHTML(c,true)).join("")}</div></details>
</div></details>`).join("");
const CTL={};GROUPS.forEach(g=>[...g.simple,...g.adv].forEach(c=>c.k&&(CTL[c.k]=c)));
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
 GROUPS.forEach(g=>{const n=ADVKEYS[g.id].filter(k=>k in S.o).length;document.getElementById("pins_"+g.id).textContent=n?n+" pinned":""});
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
 if(b.dataset.clr){e.preventDefault();ADVKEYS[b.dataset.clr].forEach(k=>delete S.o[k]);apply();return}
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
