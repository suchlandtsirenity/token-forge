// OKLCH <-> sRGB conversion and WCAG 2 contrast. Pure functions.
export const r3=v=>Math.round(v*1000)/1000,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function lch2rgb({l,c,h}){const hr=h*Math.PI/180,a=c*Math.cos(hr),b=c*Math.sin(hr);
 const L=l+0.3963377774*a+0.2158037573*b,M=l-0.1055613458*a-0.0638541728*b,S_=l-0.0894841775*a-1.2914855480*b;
 const x=L**3,y=M**3,z=S_**3;
 const lin=[4.0767416621*x-3.3077115913*y+0.2309699292*z,-1.2684380046*x+2.6097574011*y-0.3413193965*z,-0.0041960863*x-0.7034186147*y+1.7076147010*z];
 return lin.map(v=>{v=clamp(v,0,1);return v<=0.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-0.055})}
export const rgb2hex=a=>"#"+a.map(v=>Math.round(clamp(v,0,1)*255).toString(16).padStart(2,"0")).join("");
export function hex2lch(hex){const n=parseInt(hex.slice(1),16),rgb=[(n>>16)&255,(n>>8)&255,n&255].map(v=>{v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4});
 const[r,g,b]=rgb;const l=Math.cbrt(0.4122214708*r+0.5363325363*g+0.0514459929*b),m=Math.cbrt(0.2119034982*r+0.6806995451*g+0.1073969566*b),s=Math.cbrt(0.0883024619*r+0.2817188376*g+0.6299787005*b);
 const L=0.2104542553*l+0.7936177850*m-0.0040720468*s,A=1.9779984951*l-2.4285922050*m+0.4505937099*s,B=0.0259040371*l+0.7827717662*m-0.8086757660*s;
 const C=Math.sqrt(A*A+B*B);let H=Math.atan2(B,A)*180/Math.PI;if(H<0)H+=360;return{l:L,c:C<1e-4?0:C,h:C<1e-4?0:H}}
export const lum=rgb=>{const f=v=>v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4;return 0.2126*f(rgb[0])+0.7152*f(rgb[1])+0.0722*f(rgb[2])};
export const ratio=(a,b)=>{const x=lum(lch2rgb(a)),y=lum(lch2rgb(b));return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)};
export const cs=(c,fmt)=>fmt==="hex"?rgb2hex(lch2rgb(c)):`oklch(${r3(clamp(c.l,0,1))} ${r3(c.c)} ${Math.round(((c.h%360)+360)%360)})`;
