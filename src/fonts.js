// Google Fonts catalogue, grouped by style, and the CSS fallback stack for each.
export const FONTS={
 "Grotesque":["Familjen Grotesk","Bricolage Grotesque","Hanken Grotesk","Schibsted Grotesk","Instrument Sans","Archivo","Inter Tight","Geist","Onest","Manrope","Barlow","Space Grotesk","Darker Grotesque"],
 "Geometric":["Outfit","Sora","Lexend","Urbanist","Plus Jakarta Sans","Red Hat Display","Jost","Unbounded","Syne","Poppins"],
 "Humanist":["Atkinson Hyperlegible","Source Sans 3","Fira Sans","IBM Plex Sans","Work Sans","Figtree","Nunito Sans","Recursive"],
 "Rounded":["Nunito","Quicksand","M PLUS Rounded 1c","Varela Round","Fredoka","Comfortaa"],
 "Serif":["Fraunces","Newsreader","Instrument Serif","Literata","Young Serif","DM Serif Display","Playfair Display","Crimson Pro","EB Garamond","Spectral","Bitter","Zilla Slab","Roboto Slab","Gloock"],
 "Display":["Chakra Petch","Big Shoulders Display","Bebas Neue","Anton","Archivo Black","Bungee","Rubik Mono One","Righteous","Bowlby One","Abril Fatface","Major Mono Display","Monoton","Climate Crisis"],
 "Pixel and retro":["VT323","Press Start 2P","Silkscreen","Pixelify Sans","Jersey 10","DotGothic16","Tiny5"],
 "Handwritten":["Caveat","Kalam","Gaegu","Patrick Hand","Architects Daughter","Shadows Into Light"],
 "Mono":["JetBrains Mono","IBM Plex Mono","Geist Mono","Space Mono","Fira Code","Source Code Pro","DM Mono","Martian Mono","Red Hat Mono","Azeret Mono","Victor Mono","Spline Sans Mono","Courier Prime","Xanh Mono","Anonymous Pro"]
};
export const CAT={};for(const[c,l]of Object.entries(FONTS))l.forEach(f=>CAT[f]=c);
export const stack=f=>{const c=CAT[f];const fb=(c==="Mono"||c==="Pixel and retro")?"ui-monospace, Menlo, monospace":c==="Serif"?"Georgia, serif":c==="Handwritten"?"cursive":"system-ui, sans-serif";return `"${f}", ${fb}`};
