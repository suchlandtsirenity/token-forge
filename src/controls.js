// The control tree: simple knobs per group, then folds nested to any depth.
// A fold is the one repeating unit, so a pin count and "Unpin" work the same at
// every level. No DOM here: app.js renders this, and tests run it in Node.
import {CK} from "./tokens.js";

export const pct=v=>Math.round(v*100)+"%";
const px=v=>v+"px",deg=v=>Math.round(v)+"°",em=v=>(+v).toFixed(3)+"em",x2=v=>(+v).toFixed(2),ms=v=>v+"ms",pill=v=>v>=40?"pill":px(v);
const R=(k,l,min,max,step,f)=>({k,l,t:"range",min,max,step,f});
const SG=(k,l,o)=>({k,l,t:"seg",o});
const FT=(k,l)=>({k,l,t:"font"});
const COL=ks=>({t:"colors",ks});
export const F=(id,l,c,open)=>({t:"fold",id,l,c,open:!!open});

// Every pin key anywhere inside a node. Colours pin as c_<name>.
export const keysUnder=n=>n.t==="fold"?n.c.flatMap(keysUnder):n.t==="colors"?n.ks.map(k=>"c_"+k):n.k?[n.k]:[];
export const pinCount=(n,o)=>keysUnder(n).filter(k=>k in o).length;
// path -> fold. A group's Fine-tune fold sits at the group's id; folds nest as a.b.c.
export function foldIndex(groups){const idx={};
 const add=(n,p)=>{idx[p]=n;n.c.forEach(c=>c.t==="fold"&&add(c,p+"."+c.id))};
 groups.forEach(g=>add(F(g.id,"Fine-tune",g.fine),g.id));return idx}

export const GROUPS=[
 {id:"colour",title:"Colour",open:true,simple:[
   SG("mode","Mode",[["light","Light"],["dark","Dark"]]),
   R("depth","Background depth",0,100,1,v=>v+"%"),R("nh","Neutral hue",0,360,1,deg),R("nt","Neutral tint",0,0.05,0.001,v=>(+v).toFixed(3)),
   R("contrast","Layer contrast",0.4,2,0.05,v=>x2(v)+"×"),R("ah","Accent hue",0,360,1,deg),R("ac","Accent chroma",0,0.25,0.005,v=>(+v).toFixed(3)),
   R("al","Accent lightness",0.35,0.92,0.01,x2),R("sc","Status saturation",0.03,0.22,0.005,v=>(+v).toFixed(3))],
  fine:[F("hues","Hues",[R("okH","OK hue",0,360,1,deg),R("warnH","Warning hue",0,360,1,deg),R("badH","Problem hue",0,360,1,deg),R("a2","Second accent offset",-180,180,1,deg)]),
   F("every","Every colour, individually",[
    F("base","Surfaces and text",[COL(["bg","surface","surface2","fg","muted","border"])]),
    F("accent","Accents",[COL(["accent","onAccent","accentSoft","accentInk","accent2"])]),
    F("status","Status",[COL(["ok","warn","bad"])])]),
   F("read","Readability",[{t:"contrast"}],true)]},
 {id:"type",title:"Typography",simple:[
   FT("fd","Display face"),FT("fb","Body face"),FT("fm","Mono face"),
   R("base","Base size",12,20,0.5,px),R("ratio","Scale ratio",1.067,1.618,0.001,v=>(+v).toFixed(3)),
   SG("lab","Labels",[["none","Sentence case"],["upper","Uppercase"]])],
  fine:[F("custom","Load any Google font",[{t:"customfont"}]),
   F("display","Display",[R("fwD","Weight",100,900,100),R("lsD","Letter spacing",-0.08,0.2,0.005,em),R("lhH","Line height",0.8,1.6,0.01,x2),
    SG("dItal","Style",[["normal","Upright"],["italic","Italic"]]),SG("hCase","Heading case",[["none","As written"],["upper","Upper"],["lowercase","Lower"]])]),
   F("body","Body",[R("fwB","Weight",100,900,100),R("fwS","Strong and button weight",100,900,100),R("lsB","Letter spacing",-0.04,0.1,0.005,em),R("lhB","Line height",1,2.1,0.05,x2)]),
   F("labels","Labels and numbers",[R("labScale","Label size",0.6,1.2,0.01,v=>Math.round(v*100)+"% of body"),R("labLs","Label tracking",-0.02,0.3,0.005,em),R("labW","Label weight",100,900,100),
    SG("numF","Big numbers use",[["display","Display face"],["body","Body face"],["mono","Mono face"]])])]},
 {id:"shape",title:"Shape",simple:[
   R("radius","Corner radius",0,28,1,px),R("bw","Border weight",0,4,0.5,px),
   SG("shadow","Shadow",[["none","Flat"],["soft","Soft"],["hard","Hard offset"],["press","Pressed metal"],["glow","Glow"]])],
  fine:[F("radius","Radius per part",[R("rCard","Cards",0,40,1,px),R("rBtn","Buttons",0,40,1,pill),R("rInput","Inputs",0,40,1,pill),R("rChip","Chips and toggles",0,40,1,pill)]),
   F("borders","Borders",[R("bwCard","Card border",0,6,0.5,px),R("bwCtl","Control border",0,6,0.5,px),SG("bStyle","Card border style",[["solid","Solid"],["dashed","Dashed"],["dotted","Dotted"],["double","Double"]])]),
   F("shadow","Shadow, exactly",[R("shX","Offset x",-16,16,1,px),R("shY","Offset y",-16,24,1,px),R("shBlur","Blur",0,64,1,px),R("shSpread","Spread",-16,16,1,px),
    R("shOp","Strength",0,1,0.01,pct),R("shHi","Top highlight",0,1,0.05,pct),SG("shTint","Shadow colour",[["neutral","Neutral"],["accent","Accent"],["ink","Text colour"]])])]},
 {id:"space",title:"Space and density",simple:[R("unit","Spacing unit",4,14,1,px)],
  fine:[F("layout","Layout",[R("pad","Card padding",4,48,1,px),R("gap","Gap between things",2,40,1,px),R("rowPy","List row padding",0,20,1,px)]),
   F("controls","Controls",[R("ctlPy","Control padding, vertical",2,20,1,px),R("ctlPx","Control padding, horizontal",4,32,1,px)])]},
 {id:"comp",title:"Components",simple:[
   SG("btn","Primary button",[["filled","Filled"],["outline","Outline"],["soft","Soft"],["inverted","Inverted"]]),
   SG("card","Cards",[["outline","Outlined"],["filled","Filled"],["elevated","Shadow only"],["bare","Bare"]]),
   SG("input","Inputs",[["outline","Outlined"],["filled","Filled"],["underline","Underline"]]),
   SG("chip","Chips",[["soft","Soft"],["outline","Outline"],["solid","Solid"],["dot","Dot"]])],
  fine:[F("button","Buttons",[SG("hover","Button hover",[["none","Nothing"],["lift","Lift"],["dim","Dim"],["ring","Ring"]]),
    SG("pressS","Button press",[["none","Nothing"],["scale","Squish"],["sink","Sink"]])]),
   F("inputs","Focus and toggles",[SG("focus","Focus ring",[["glow","Glow"],["solid","Solid"],["offset","Offset"],["underline","Underline"]]),
    SG("toggle","Toggle",[["pill","Pill"],["square","Square"],["slot","Slot"]])]),
   F("lights","Status lights",[SG("led","Status lights",[["dot","Dot"],["square","Square"],["bar","Bar"],["ring","Ring"]]),
    SG("ledglow","Light glow",[["off","Off"],["on","On"]])])]},
 {id:"tex",title:"Texture and depth",simple:[
   SG("pattern","Background pattern",[["none","None"],["grid","Grid"],["dots","Dots"],["lines","Lines"],["diagonal","Diagonal"]]),
   R("grain","Film grain",0,0.25,0.01,pct)],
  fine:[F("pattern","Pattern",[R("patSize","Pattern size",2,48,1,px),R("patOp","Pattern strength",0,0.3,0.005,pct)]),
   F("card","Card surface",[R("glass","Card blur (glass)",0,30,1,px),R("cardA","Card opacity",20,100,1,v=>v+"%")])]},
 {id:"icons",title:"Icons",simple:[R("icSw","Stroke width",0.75,3,0.25,px)],
  fine:[SG("icCap","Line ends",[["round","Round"],["square","Square"],["butt","Flat"]]),R("icScale","Size",0.7,1.5,0.05,v=>Math.round(v*100)+"%")]},
 {id:"motion",title:"Motion",simple:[R("dur","Duration",0,800,10,ms),
   SG("ease","Easing",[["spring","Springy"],["out","Smooth"],["snappy","Snappy"],["linear","Linear"],["steps","Stepped"]])],
  fine:[F("curve","Custom curve",[R("bz1","x1",0,1,0.01,x2),R("bz2","y1",-1,2,0.01,x2),R("bz3","x2",0,1,0.01,x2),R("bz4","y2",-1,2,0.01,x2),R("stepsN","Steps when stepped",2,10,1)]),
   F("interaction","Interaction",[R("lift","Hover lift",0,8,0.5,px),R("press","Press squish",0.85,1,0.01,v=>Math.round(v*100)+"%"),R("pulse","Alert pulse speed",0.4,4,0.1,v=>(+v).toFixed(1)+"s")])]}
];
export const FOLDS=foldIndex(GROUPS);
// Every control by key, for the value readouts.
export const CTL={};const walk=c=>c.t==="fold"?c.c.forEach(walk):c.k&&(CTL[c.k]=c);GROUPS.forEach(g=>[...g.simple,...g.fine].forEach(walk));
