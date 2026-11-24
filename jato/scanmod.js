/* ===== Your scan: KIRI Engine photogrammetry of Cory's Jato =====
   The scan is one textured mesh. The spec-built parts stay in the scene as invisible
   proxies, so clicking, labels, explode, upgrades and shadows still work on top of it. */
(function(){
const D=window.JATO_SCAN;if(!D||!window.THREE)return;
const MKEY='jato-lab-model';let model='scan';try{model=localStorage.getItem(MKEY)||'scan';}catch(e){}
const u8=b=>Uint8Array.from(atob(b),c=>c.charCodeAt(0)).buffer;
const pos=new Int16Array(u8(D.pos)),uv=new Uint16Array(u8(D.uv)),idx=new Uint16Array(u8(D.idx));
const P=new Float32Array(pos.length);for(let i=0;i<pos.length;i++)P[i]=pos[i]*D.scale;
const UV=new Float32Array(uv.length);for(let i=0;i<uv.length;i++)UV[i]=uv[i]/65535;
const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('uv',new THREE.BufferAttribute(UV,2));g.setIndex(new THREE.BufferAttribute(idx,1));g.computeVertexNormals();
const cv=document.createElement('canvas');cv.width=cv.height=1024;const cx=cv.getContext('2d');
const tex=new THREE.CanvasTexture(cv);tex.encoding=THREE.sRGBEncoding;tex.anisotropy=4;
const sm=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,toneMapped:false,transparent:false});
const scan=new THREE.Mesh(g,sm);scan.name='scan';scan.visible=false;scan.renderOrder=0;scene.add(scan);
let ready=false,orig=null,mask=null,lastBody=null;
const img=new Image();img.onload=()=>{cx.drawImage(img,0,0,1024,1024);orig=cx.getImageData(0,0,1024,1024);
  // body-paint mask: the orange/yellow shell
  const d=orig.data;mask=new Float32Array(1024*1024);
  for(let i=0,j=0;i<d.length;i+=4,j++){const r=d[i]/255,gg=d[i+1]/255,b=d[i+2]/255,mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),s=mx?(mx-mn)/mx:0;
    let h=0;if(mx>mn){h=mx===r?((gg-b)/(mx-mn))%6:mx===gg?(b-r)/(mx-mn)+2:(r-gg)/(mx-mn)+4;h*=60;if(h<0)h+=360;}
    if(h>12&&h<55&&s>0.42&&mx>0.45)mask[j]=mx;}
  tex.needsUpdate=true;ready=true;recolor(look().body);key='';heroDirty=true;if(S.screen==='garage')renderGarage();};
img.src='scan.jpg';
function recolor(hex){if(!ready)return;hex=(hex||'').toLowerCase();if(hex===lastBody)return;lastBody=hex;
  if(!hex||hex===PAINT_DEF.body.toLowerCase()){cx.putImageData(orig,0,0);tex.needsUpdate=true;return;}
  const t=new THREE.Color(hex),hsl={};t.getHSL(hsl);const o=orig.data,out=new ImageData(new Uint8ClampedArray(o),1024,1024),d=out.data,c=new THREE.Color();
  for(let j=0,i=0;j<mask.length;j++,i+=4){const v=mask[j];if(!v)continue;const l=Math.min(1,hsl.l*(0.55+0.5*v));c.setHSL(hsl.h,hsl.s,l);d[i]=c.r*255;d[i+1]=c.g*255;d[i+2]=c.b*255;}
  cx.putImageData(out,0,0);tex.needsUpdate=true;}
const _ap=applyPaint;applyPaint=function(Pp){_ap(Pp);recolor(Object.assign({},PAINT_DEF,Pp||{}).body);};
/* proxy materials */
function mats(p){const s=new Set();p.meshes.forEach(m=>(Array.isArray(m.material)?m.material:[m.material]).forEach(x=>s.add(x)));return s;}
const SV=new Map();
function setM(mm,mode){if(mode==='normal'){const o=SV.get(mm);if(o){Object.assign(mm,o);SV.delete(mm);mm.needsUpdate=true;}return;}
  if(!SV.has(mm))SV.set(mm,{transparent:mm.transparent,opacity:mm.opacity,depthTest:mm.depthTest,depthWrite:mm.depthWrite,colorWrite:mm.colorWrite});
  if(mode==='hide')Object.assign(mm,{colorWrite:false,depthWrite:false});
  if(mode==='glow')Object.assign(mm,{colorWrite:true,transparent:true,opacity:0.62,depthTest:false,depthWrite:false});mm.needsUpdate=true;}
function apply(force){
  const on=ready&&model==='scan'&&S.body!=='off'&&exNow<0.02&&S.exT===0;
  const ghost=on&&S.body==='ghost';
  scan.visible=on;sm.transparent=ghost;sm.opacity=ghost?0.22:1;sm.depthWrite=!ghost;sm.needsUpdate=true;
  const want=new Map();
  parts.forEach(p=>{let m='normal';
    if(on&&!ghost)m=(p===S.sel||p===S.hover)?'glow':'hide';
    if(ghost&&p.id==='body')m='hide';
    const rank={hide:0,normal:1,glow:2};mats(p).forEach(mm=>{const cur=want.get(mm);if(!cur||rank[m]>rank[cur])want.set(mm,m);});});
  want.forEach((m,mm)=>setM(mm,m));
  // keep setBody's own see-through look for the spec body
  if(!on){const gh=S.body==='ghost';byId.body.meshes.forEach(x=>{const mm=x.material;if(SV.has(mm))return;mm.transparent=gh;mm.opacity=gh?0.22:1;mm.depthWrite=!gh;});}
  const n=document.querySelector('.note3d');if(n)n.textContent=model==='scan'?(ready?(on?'Your KIRI scan · tap any area to pick a part':'Spec parts shown · scan hides while '+(S.body==='off'?'the body is off':'exploded')):'Loading your scan…'):'Drawn from Traxxas specs';
  document.querySelectorAll('#modelMode button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===model));}
let key='';
(function watch(){requestAnimationFrame(watch);const k=[ready,model,S.body,exNow<0.02&&S.exT===0,S.sel&&S.sel.id,S.hover&&S.hover.id].join('|');if(k!==key){key=k;apply();}})();
/* toggle */
const vb=document.querySelector('.vbar .sp');
if(vb){const sg=document.createElement('div');sg.className='seg';sg.id='modelMode';sg.setAttribute('role','group');sg.setAttribute('aria-label','Model');
  sg.innerHTML='<button type="button" data-m="scan">Your scan</button><button type="button" data-m="spec">Spec model</button>';vb.before(sg);
  sg.onclick=e=>{const b=e.target.closest('button');if(!b)return;model=b.dataset.m;try{localStorage.setItem(MKEY,model);}catch(_){}key='';heroDirty=true;};}
/* garage hero renders the scan */
const _snap=snapshot;snapshot=function(){if(!(ready&&model==='scan'))return _snap();
  const b0=S.body,e0=S.exT,sel=S.sel,hov=S.hover;S.body='on';S.exT=0;S.sel=null;S.hover=null;const en=exNow;exNow=0;apply();
  const url=_snap();S.body=b0;S.exT=e0;S.sel=sel;S.hover=hov;exNow=en;key='';return url;};
const hi=document.getElementById('heroImg');if(hi)hi.alt='Your Jato, from your 3D scan';
window.JATO_SCAN_MESH=scan;
})();
