// The settings model: defaults, presets, and derive(S), which turns the knobs
// (plus any pinned fine-tune overrides in S.o) into every concrete token value.
import {r3,clamp,cs,hex2lch} from "./color.js";

export const BASE={mode:"light",depth:55,nh:240,nt:0.008,contrast:1,ah:195,ac:0.11,al:0.55,sc:0.14,
 fd:"Bricolage Grotesque",fb:"Atkinson Hyperlegible",fm:"JetBrains Mono",base:15,ratio:1.25,lab:"none",
 radius:10,bw:1,shadow:"soft",unit:8,dur:220,ease:"out",
 btn:"filled",card:"outline",input:"outline",chip:"soft",hover:"lift",pressS:"scale",focus:"glow",led:"dot",ledglow:"off",toggle:"pill",
 pattern:"none",grain:0,icSw:1.75,custom:[],o:{}};
export const PRESETS={
 "Graphite":{},
 "Terminal":{mode:"dark",depth:15,nh:150,nt:0.015,contrast:0.9,ah:145,ac:0.17,al:0.8,sc:0.16,fd:"VT323",fb:"JetBrains Mono",fm:"JetBrains Mono",base:14,ratio:1.15,lab:"upper",radius:0,bw:1,shadow:"none",unit:7,dur:0,ease:"steps",btn:"outline",input:"underline",chip:"outline",hover:"none",pressS:"none",focus:"solid",led:"square",ledglow:"on",toggle:"square",pattern:"lines",grain:0.05,icSw:1.5,o:{icCap:"square",patOp:0.04,patSize:4,lhB:1.6,fwD:400}},
 "Hardware panel":{depth:30,nh:85,nt:0.012,contrast:1.3,ah:42,ac:0.19,al:0.64,sc:0.15,fd:"Archivo",fb:"Archivo",fm:"IBM Plex Mono",base:14,ratio:1.2,lab:"upper",radius:6,shadow:"press",dur:160,ease:"spring",card:"filled",input:"filled",chip:"solid",hover:"none",pressS:"sink",focus:"offset",ledglow:"on",toggle:"slot",grain:0.06,icSw:2,o:{numF:"mono"}},
 "Cozy desk":{depth:70,nh:75,nt:0.03,ah:355,ac:0.11,al:0.6,sc:0.11,fd:"Fraunces",fb:"DM Sans",fm:"DM Mono",base:16,ratio:1.3,radius:18,unit:10,dur:380,ease:"spring",btn:"soft",input:"filled",pattern:"dots",grain:0.08,o:{dItal:"italic",fwD:600,patOp:0.06,patSize:20}},
 "Brutalist":{depth:100,nh:0,nt:0,contrast:1.6,ah:100,ac:0.2,al:0.9,sc:0.2,fd:"Syne",fb:"IBM Plex Mono",fm:"IBM Plex Mono",base:14,ratio:1.414,lab:"upper",radius:0,bw:3,shadow:"hard",dur:90,ease:"steps",chip:"solid",hover:"none",pressS:"sink",focus:"offset",led:"square",toggle:"square",icSw:2.5,o:{fwD:800,lsD:-0.03,icCap:"square"}},
 "Mission control":{mode:"dark",depth:10,nh:245,nt:0.03,contrast:1.1,ah:215,ac:0.1,al:0.8,sc:0.12,fd:"Chakra Petch",fb:"IBM Plex Sans",fm:"IBM Plex Mono",base:14,ratio:1.2,lab:"upper",radius:3,shadow:"none",dur:240,btn:"outline",chip:"outline",hover:"ring",focus:"solid",led:"ring",ledglow:"on",pattern:"grid",icSw:1.25,o:{patOp:0.05,patSize:22,numF:"mono"}},
 "Glassy":{depth:60,nh:220,nt:0.02,ah:200,ac:0.14,al:0.62,fd:"Outfit",fb:"Figtree",fm:"DM Mono",radius:20,shadow:"glow",unit:9,dur:320,ease:"spring",card:"elevated",input:"filled",ledglow:"on",pattern:"dots",o:{glass:14,cardA:60,patOp:0.14,patSize:16,a2:-60}},
 "Zine":{depth:85,nh:60,nt:0.02,contrast:1.2,ah:20,ac:0.18,al:0.6,sc:0.16,fd:"Caveat",fb:"Space Mono",fm:"Space Mono",ratio:1.333,radius:4,bw:2,shadow:"hard",dur:120,ease:"steps",btn:"inverted",input:"underline",chip:"outline",hover:"none",pressS:"sink",focus:"underline",led:"square",toggle:"square",pattern:"diagonal",grain:0.1,icSw:2.25,o:{patOp:0.05,patSize:10,lhH:1}},
 "Flames":{mode:"dark",depth:12,nh:20,nt:0.02,ah:27,ac:0.2,al:0.58,sc:0.17,fd:"Big Shoulders Display",fb:"Barlow",fm:"JetBrains Mono",ratio:1.3,lab:"upper",radius:4,dur:200,ease:"snappy",card:"filled",chip:"solid",focus:"solid",ledglow:"on",grain:0.04,icSw:2,o:{a2:55,fwD:800,lsD:0.01,hCase:"upper"}}
};
export const SH={none:{shX:0,shY:0,shBlur:0,shSpread:0,shOp:0,shHi:0,shTint:"neutral"},
 soft:{shX:0,shY:8,shBlur:24,shSpread:-6,shOp:0.12,shHi:0,shTint:"neutral"},
 hard:{shX:4,shY:4,shBlur:0,shSpread:0,shOp:1,shHi:0,shTint:"ink"},
 press:{shX:0,shY:2,shBlur:0,shSpread:0,shOp:0.18,shHi:0.6,shTint:"neutral"},
 glow:{shX:0,shY:0,shBlur:28,shSpread:-4,shOp:0.45,shHi:0,shTint:"accent"}};
export const EASE={spring:[0.34,1.56,0.64,1],out:[0.2,0.7,0.2,1],snappy:[0.7,0,0.2,1],linear:[0,0,1,1],steps:[0,0,1,1]};
export const CK=[["bg","Page"],["surface","Card"],["surface2","Raised"],["fg","Text"],["muted","Muted text"],["border","Border"],["accent","Accent"],["onAccent","On accent"],["accentSoft","Accent tint"],["accentInk","Accent text"],["accent2","Second accent"],["ok","OK"],["warn","Warning"],["bad","Problem"]];
export const kebab=k=>k.replace(/([A-Z0-9]+)/g,m=>"-"+m.toLowerCase()).replace("surface-2","surface-2");

export function derive(S){
 const o=S.o,p=(k,v)=>k in o?o[k]:v,E={},u=S.unit,r=S.radius,dark=S.mode==="dark",sh=SH[S.shadow]||SH.soft;
 Object.assign(E,{okH:p("okH",150),warnH:p("warnH",80),badH:p("badH",27),a2:p("a2",150),
  fwD:p("fwD",700),lsD:p("lsD",S.lab==="upper"?0:-0.015),lhH:p("lhH",1.15),dItal:p("dItal","normal"),hCase:p("hCase","none"),
  fwB:p("fwB",400),fwS:p("fwS",700),lsB:p("lsB",0),lhB:p("lhB",1.5),
  labScale:p("labScale",0.85),labLs:p("labLs",S.lab==="upper"?0.08:0.01),labW:p("labW",700),numF:p("numF","display"),
  rCard:p("rCard",r),rBtn:p("rBtn",Math.round(r*0.6)),rInput:p("rInput",Math.round(r*0.6)),rChip:p("rChip",r===0?0:40),
  bwCard:p("bwCard",S.bw),bwCtl:p("bwCtl",S.bw),bStyle:p("bStyle","solid"),
  shX:p("shX",S.shadow==="hard"?S.bw+3:sh.shX),shY:p("shY",S.shadow==="hard"?S.bw+3:sh.shY),shBlur:p("shBlur",sh.shBlur),shSpread:p("shSpread",sh.shSpread),
  shOp:p("shOp",dark&&S.shadow==="soft"?0.35:sh.shOp),shHi:p("shHi",dark?sh.shHi*0.15:sh.shHi),shTint:p("shTint",sh.shTint),
  pad:p("pad",u*2),gap:p("gap",Math.round(u*1.5)),ctlPy:p("ctlPy",Math.round(u*0.7)),ctlPx:p("ctlPx",Math.round(u*1.4)),rowPy:p("rowPy",Math.round(u*0.8)),
  hover:p("hover",S.hover),pressS:p("pressS",S.pressS),focus:p("focus",S.focus),led:p("led",S.led),ledglow:p("ledglow",S.ledglow),toggle:p("toggle",S.toggle),
  patSize:p("patSize",18),patOp:p("patOp",0.07),glass:p("glass",0),cardA:p("cardA",100),
  icCap:p("icCap","round"),icScale:p("icScale",1),
  stepsN:p("stepsN",3),lift:p("lift",S.ease==="spring"?2:1),press:p("press",0.96),pulse:p("pulse",1.6)});
 const ez=EASE[S.ease]||EASE.out;["bz1","bz2","bz3","bz4"].forEach((k,i)=>E[k]=p(k,ez[i]));
 E.easing=S.ease==="steps"?`steps(${E.stepsN}, end)`:`cubic-bezier(${E.bz1}, ${E.bz2}, ${E.bz3}, ${E.bz4})`;
 E.fs={};[-1,0,1,2,3,4].forEach(i=>E.fs[i]=Math.round(S.base*Math.pow(S.ratio,i)*10)/10);
 E.fsLabel=Math.round(S.base*E.labScale*10)/10;
 /* colours */
 const d=S.depth/100,k=S.contrast,N=l=>({l,c:S.nt,h:S.nh});let L;const C={};
 if(!dark){L=0.88+d*0.12;Object.assign(C,{bg:N(L),surface:N(L>0.99?1:clamp(L+0.025*k,0,1)),surface2:N(L>0.99?0.955:L-0.035*k),fg:N(0.2),muted:N(0.48),border:N(L-0.11*k)})}
 else{L=0.1+d*0.16;Object.assign(C,{bg:N(L),surface:N(L+0.04*k),surface2:N(L+0.08*k),fg:N(0.94),muted:N(0.7),border:N(L+0.13*k)})}
 const ov=kk=>o["c_"+kk]?hex2lch(o["c_"+kk]):null;
 for(const kk of ["bg","surface","surface2","fg","muted","border"])C[kk]=ov(kk)||C[kk];
 C.accent=ov("accent")||{l:S.al,c:S.ac,h:S.ah};const A=C.accent;
 C.onAccent=ov("onAccent")||(A.l>0.68?{l:0.18,c:Math.min(A.c,0.05),h:A.h}:{l:0.99,c:0.005,h:A.h});
 C.accentSoft=ov("accentSoft")||(dark?{l:0.3,c:A.c*0.45,h:A.h}:{l:0.93,c:A.c*0.35,h:A.h});
 C.accentInk=ov("accentInk")||(dark?{l:0.85,c:A.c*0.7,h:A.h}:{l:0.4,c:A.c*0.9,h:A.h});
 C.accent2=ov("accent2")||{l:A.l,c:A.c,h:(A.h+E.a2+360)%360};
 const stL=dark?0.74:0.6;
 C.ok=ov("ok")||{l:stL,c:S.sc,h:E.okH};C.warn=ov("warn")||{l:dark?0.8:0.74,c:S.sc,h:E.warnH};C.bad=ov("bad")||{l:stL,c:S.sc,h:E.badH};
 E.C=C;
 /* shadows */
 const tint=a=>E.shTint==="accent"?`color-mix(in oklch, ${cs(C.accent)} ${Math.round(a*100)}%, transparent)`:E.shTint==="ink"?`color-mix(in oklch, ${cs(C.fg)} ${Math.round(a*100)}%, transparent)`:`rgb(0 0 0 / ${r3(a)})`;
 const parts=[];if(E.shHi>0)parts.push(`inset 0 1px 0 rgb(255 255 255 / ${r3(E.shHi)})`);
 if(E.shOp>0){if(E.shBlur>8&&E.shTint==="neutral")parts.push(`0 1px 2px ${tint(E.shOp*0.5)}`);parts.push(`${E.shX}px ${E.shY}px ${E.shBlur}px ${E.shSpread}px ${tint(E.shOp)}`)}
 E.shadow=parts.length?parts.join(", "):"none";
 const bp=[];if(E.shHi>0)bp.push(`inset 0 1px 0 rgb(255 255 255 / ${r3(E.shHi*0.6)})`);
 if(E.shOp>0)bp.push(`${Math.round(E.shX/2)}px ${Math.round(E.shY/2)}px ${Math.round(E.shBlur/2)}px ${Math.min(0,E.shSpread)}px ${tint(E.shOp*0.8)}`);
 E.shadowBtn=bp.length?bp.join(", "):"none";
 return E;
}
