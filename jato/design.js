/* ================= Design Center =================
   Repaints the shell in the owner's own photo. Maps made from that photo (dz/*.png):
   maps1 R=shell outline, G=lighting (x1.5), B=gloss reflections · maps2 R=keep as photographed (windscreen, roof vent, clip holes),
   G=factory orange graphics, B=factory blue pinstripes · dist = distance in from the shell edge (for pinstripes).
   Paint = colour x lighting + reflections, so any colour sits on the shell like real paint; windows stay glass. */
(function(){
const DZ={X0:530,Y0:774,W:592,H:910,VX:380,VY:654,VW:892,VH:1190,ready:false,undo:[],redo:[],sel:null,drag:null};
const DZK='jato-dz-cur',DZS='jato-dz-saved';
const FINISHES={gloss:'Gloss',metallic:'Metallic',pearl:'Pearl',candy:'Candy',matte:'Matte',chrome:'Chrome'};
const SW=['#f4f4f2','#0d0e10','#ff6a1a','#d81e1e','#1f5fd6','#45c12b','#ffd21a','#7b2fd0','#ff4fb8','#12b5c9','#8f99a4','#c9a227'];
const LT={
 stripes:{n:'Racing stripes',f:[['color','Colour','color','#f4f4f2'],['w','Width','range',34,6,90],['gap','Gap','range',16,0,80],['off','Offset','range',0,-200,200],['oc','Outline','color','#0d0e10'],['ow','Outline width','range',0,0,12]]},
 fade:{n:'Fade',f:[['color','Colour','color','#0d0e10'],['from','Starts at','range',90,0,100],['to','Ends at','range',35,0,100],['dir','Direction','select','front',['front','rear','left','right']]]},
 split:{n:'Two-tone split',f:[['color','Colour','color','#0d0e10'],['pos','Position','range',55,0,100],['ang','Angle','range',0,-60,60],['side','Paint','select','rear',['rear','front']]]},
 shards:{n:'Shards',f:[['color','Colour','color','#0d0e10'],['count','How many','range',14,2,40],['size','Size','range',90,20,220],['seed','Shuffle','range',3,1,99]]},
 flames:{n:'Flames',f:[['color','Base colour','color','#ff6a1a'],['tip','Tip colour','color','#ffd21a'],['len','Length','range',60,15,100],['count','Tongues','range',7,3,14],['seed','Shuffle','range',5,1,99]]},
 camo:{n:'Camo',f:[['c1','Colour 1','color','#3b4a2f'],['c2','Colour 2','color','#6b7a4a'],['c3','Colour 3','color','#1d2418'],['scale','Scale','range',40,12,110],['seed','Shuffle','range',7,1,99]]},
 checker:{n:'Checker band',f:[['color','Colour','color','#0d0e10'],['color2','Colour 2','color','#f4f4f2'],['y','Position','range',70,0,100],['rows','Rows','range',2,1,6],['size','Square size','range',20,8,60]]},
 number:{n:'Number plate',f:[['num','Number','text','2'],['plate','Plate','color','#f4f4f2'],['ink','Number colour','color','#0d0e10'],['size','Size','range',70,30,160],['x','Left/right','range',50,0,100],['y','Front/back','range',78,0,100],['shape','Shape','select','circle',['circle','oval','box']]]},
 text:{n:'Text / name',f:[['text','Text','text','JATO'],['color','Colour','color','#f4f4f2'],['size','Size','range',48,12,140],['x','Left/right','range',50,0,100],['y','Front/back','range',12,0,100],['rot','Rotate','range',-90,-180,180],['font','Style','select','bold italic',['bold italic','bold','condensed','script']],['mirror','Both sides','check',false]]},
 pinstripe:{n:'Pinstripe outline',f:[['color','Colour','color','#ff6a1a'],['inset','Inset','range',10,1,50],['w','Width','range',3,1,12]]},
 brush:{n:'Freehand',f:[['color','Brush colour','color','#ff6a1a'],['size','Brush size','range',16,2,80],['mirror','Mirror strokes','check',true]]}};
const PRESETS=[
 ['Factory',{mode:'factory',base:'#0d0e10',fo:null,fb:null,fd:null,finish:'gloss',tint:'factory',layers:[]}],
 ['All white',{mode:'custom',base:'#f4f4f2',finish:'gloss',tint:'factory',layers:[]}],
 ['Race white',{mode:'custom',base:'#f4f4f2',finish:'gloss',tint:'dark',layers:[{t:'stripes',color:'#1f5fd6',w:30,gap:14,off:0,oc:'#0d0e10',ow:3},{t:'number',num:'2',plate:'#0d0e10',ink:'#f4f4f2',size:74,x:50,y:78,shape:'circle'}]}],
 ['Stealth',{mode:'custom',base:'#141518',finish:'matte',tint:'dark',layers:[{t:'pinstripe',color:'#ff6a1a',inset:9,w:3}]}],
 ['Hot rod',{mode:'custom',base:'#0d0e10',finish:'gloss',tint:'factory',layers:[{t:'flames',color:'#ff4a12',tip:'#ffd21a',len:66,count:8,seed:5}]}],
 ['Candy fade',{mode:'custom',base:'#d81e1e',finish:'candy',tint:'factory',layers:[{t:'fade',color:'#ffb020',from:100,to:40,dir:'front'}]}],
 ['Army',{mode:'custom',base:'#6b7a4a',finish:'matte',tint:'dark',layers:[{t:'camo',c1:'#3b4a2f',c2:'#8a8a5a',c3:'#1d2418',scale:44,seed:7}]}],
 ['Chrome',{mode:'custom',base:'#c9ced3',finish:'chrome',tint:'factory',layers:[{t:'stripes',color:'#ff6a1a',w:22,gap:10,off:0,oc:'#0d0e10',ow:0}]}],
 ['Blue factory',{mode:'factory',base:'#0d0e10',fo:'#1f5fd6',fb:'#ff6a1a',fd:null,finish:'gloss',tint:'factory',layers:[]}]];
let dzd=(()=>{try{return JSON.parse(localStorage.getItem(DZK)||'null');}catch(e){return null;}})()||JSON.parse(JSON.stringify(PRESETS[0][1]));
const dzSave=()=>{try{localStorage.setItem(DZK,JSON.stringify(dzd));}catch(e){}};
function commit(){DZ.undo.push(JSON.stringify(dzd));if(DZ.undo.length>60)DZ.undo.shift();DZ.redo=[];dzSave();}
/* ---------- load maps ---------- */
const loadImg=src=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src;});
function pix(img,w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,w,h);return x.getImageData(0,0,w,h).data;}
async function dzLoad(){if(DZ.loading)return DZ.loading;DZ.loading=(async()=>{
  const [ph,m1,m2,ds]=await Promise.all(['dz/photo.jpg','dz/maps1.png','dz/maps2.png','dz/dist.png'].map(loadImg));
  DZ.photo=ph;const {W,H,X0,Y0}=DZ;const N=W*H;
  const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(ph,-X0,-Y0);DZ.orig=x.getImageData(0,0,W,H).data;
  const a=pix(m1,W,H),b=pix(m2,W,H),d=pix(ds,W,H);
  DZ.mask=new Float32Array(N);DZ.S=new Float32Array(N);DZ.spec=new Float32Array(N);DZ.keep=new Float32Array(N);DZ.O=new Float32Array(N);DZ.B=new Float32Array(N);DZ.dist=new Float32Array(N);DZ.L=new Float32Array(N);DZ.noise=new Float32Array(N);
  let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(let i=0,j=0;i<N;i++,j+=4){DZ.mask[i]=a[j]/255;DZ.S[i]=a[j+1]/255*1.5;DZ.spec[i]=a[j+2]/255;DZ.keep[i]=b[j]/255;DZ.O[i]=b[j+1]/255;DZ.B[i]=b[j+2]/255;DZ.dist[i]=d[j]/255*60;
    const o=DZ.orig;DZ.L[i]=(0.2126*o[j]+0.7152*o[j+1]+0.0722*o[j+2])/255;DZ.noise[i]=rnd()-0.5;}
  // windscreen area (for tint) = keep pixels inside its box
  DZ.win=new Uint8Array(N);for(let y=455;y<710;y++)for(let x2=165;x2<410;x2++){const i=y*W+x2;if(DZ.keep[i]>0.5)DZ.win[i]=1;}
  DZ.lay=document.createElement('canvas');DZ.lay.width=W;DZ.lay.height=H;DZ.lx=DZ.lay.getContext('2d',{willReadFrequently:true});
  DZ.tmp=document.createElement('canvas');DZ.tmp.width=W;DZ.tmp.height=H;DZ.tx=DZ.tmp.getContext('2d');
  const out=$('#dzCv');out.width=DZ.VW;out.height=DZ.VH;DZ.ox=out.getContext('2d');DZ.ox.drawImage(ph,-DZ.VX,-DZ.VY);
  $('#dzBefore').src='dz/photo.jpg';DZ.ready=true;})();return DZ.loading;}
/* ---------- drawing the design layers (crop coordinates; nose points down, rear up) ---------- */
const CX=296,TOPY=14,BOTY=896;
function rng(s){let v=s*9301+49297;return ()=>((v=(v*9301+49297)%233280)/233280);}
const fontOf=f=>({'bold italic':'italic 800 ','bold':'800 ','condensed':'700 ','script':'italic 600 '}[f]||'800 ')+'PX '+(f==='condensed'?'"Rajdhani","Arial Narrow",sans-serif':f==='script'?'"Brush Script MT","Segoe Script",cursive':'"Inter","Arial Black",sans-serif');
function drawLayer(x,L,W,H){x.save();x.globalAlpha=L.op==null?1:L.op/100;const t=L.t;
  if(t==='stripes'){const half=L.gap/2;[-1,1].forEach(s=>{const x0=CX+L.off+s*(half+L.w/2)-L.w/2;if(L.ow>0){x.fillStyle=L.oc;x.fillRect(x0-L.ow,0,L.w+L.ow*2,H);}x.fillStyle=L.color;x.fillRect(x0,0,L.w,H);});}
  if(t==='fade'){const v={front:[0,BOTY,0,TOPY],rear:[0,TOPY,0,BOTY],left:[60,0,540,0],right:[540,0,60,0]}[L.dir];const lerp=(a,b,u)=>a+(b-a)*u;
    const p0=[lerp(v[0],v[2],1-L.from/100),lerp(v[1],v[3],1-L.from/100)],p1=[lerp(v[0],v[2],1-L.to/100),lerp(v[1],v[3],1-L.to/100)];
    const gr=x.createLinearGradient(p0[0],p0[1],p1[0],p1[1]);gr.addColorStop(0,L.color);gr.addColorStop(1,L.color+'00');x.fillStyle=gr;x.fillRect(0,0,W,H);}
  if(t==='split'){const yy=TOPY+(BOTY-TOPY)*(1-L.pos/100);const a=L.ang*PI/180;x.translate(CX,yy);x.rotate(a);x.fillStyle=L.color;if(L.side==='rear')x.fillRect(-W*2,-H*2,W*4,H*2);else x.fillRect(-W*2,0,W*4,H*2);}
  if(t==='shards'){const r=rng(L.seed);x.fillStyle=L.color;for(let i=0;i<L.count;i++){const px=CX+30+r()*250,py=TOPY+r()*(BOTY-TOPY),s=L.size*(0.5+r()),a=r()*PI*2;
      const pts=[[0,-s*0.6],[s*0.18,s*0.5],[-s*0.12,s*0.35]].map(([u,v])=>[u*Math.cos(a)-v*Math.sin(a),u*Math.sin(a)+v*Math.cos(a)]);
      [1,-1].forEach(m=>{x.beginPath();pts.forEach(([u,v],k)=>{const X=CX+m*(px-CX+u),Y=py+v;k?x.lineTo(X,Y):x.moveTo(X,Y);});x.closePath();x.fill();});}}
  if(t==='flames'){const r=rng(L.seed);const len=(BOTY-TOPY)*L.len/100;const gr=x.createLinearGradient(0,BOTY,0,BOTY-len);gr.addColorStop(0,L.color);gr.addColorStop(1,L.tip);x.fillStyle=gr;
    x.beginPath();x.moveTo(0,H);x.lineTo(0,BOTY-len*0.15);const n=L.count;
    for(let i=0;i<n;i++){const xa=(i/n)*W,xb=((i+1)/n)*W,mid=(xa+xb)/2,tip=BOTY-len*(0.55+0.45*r()),bend=(r()-0.5)*90;
      x.quadraticCurveTo(xa+(mid-xa)*0.3,BOTY-len*0.35,mid+bend,tip);x.quadraticCurveTo(xb-(xb-mid)*0.1,BOTY-len*0.3,xb,BOTY-len*0.12*r());}
    x.lineTo(W,H);x.closePath();x.fill();}
  if(t==='camo'){const r=rng(L.seed);[[L.c1,0.38],[L.c2,0.3],[L.c3,0.22]].forEach(([c,f])=>{x.fillStyle=c;const n=Math.round(W*H/(L.scale*L.scale)*f);
      for(let i=0;i<n;i++){const px=r()*W,py=r()*H;x.beginPath();for(let k=0;k<5;k++){x.ellipse(px+(r()-0.5)*L.scale,py+(r()-0.5)*L.scale,L.scale*(0.3+r()*0.4),L.scale*(0.2+r()*0.3),r()*PI,0,PI*2);}x.fill();}});}
  if(t==='checker'){const yy=TOPY+(BOTY-TOPY)*(1-L.y/100);const s=L.size;for(let rI=0;rI<L.rows;rI++)for(let c=0;c*s<W;c++){x.fillStyle=(rI+c)%2?L.color2:L.color;x.fillRect(c*s,yy+rI*s-L.rows*s/2,s,s);}}
  if(t==='number'||t==='text'){const px=40+(W-80)*L.x/100,py=TOPY+(BOTY-TOPY)*(1-L.y/100);const one=(mx)=>{x.save();x.translate(mx,py);
      if(t==='number'){const s=L.size;x.fillStyle=L.plate;x.beginPath();if(L.shape==='circle')x.arc(0,0,s/2,0,PI*2);else if(L.shape==='oval')x.ellipse(0,0,s*0.42,s*0.56,0,0,PI*2);else{x.roundRect?x.roundRect(-s*0.45,-s*0.55,s*0.9,s*1.1,8):x.rect(-s*0.45,-s*0.55,s*0.9,s*1.1);}x.fill();
        x.fillStyle=L.ink;x.font='italic 800 '+Math.round(s*0.62)+'px "Inter","Arial Black",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(String(L.num).slice(0,3),0,s*0.04);}
      else{x.rotate((L.rot||0)*PI/180);x.fillStyle=L.color;x.font=fontOf(L.font).replace('PX',Math.round(L.size)+'px');x.textAlign='center';x.textBaseline='middle';x.fillText(String(L.text).slice(0,24),0,0);}
      x.restore();};one(px);if(t==='text'&&L.mirror)one(2*CX-px);}
  if(t==='pinstripe'){const img=x.getImageData(0,0,W,H);const d=img.data;const c=hex(L.color);const a=(L.op==null?1:L.op/100);
    for(let i=0,j=0;i<DZ.dist.length;i++,j+=4){const dv=DZ.dist[i];const k=1-Math.min(1,Math.abs(dv-L.inset)/(L.w/2+0.5));if(k>0&&DZ.mask[i]>0.5){const kk=k*a;d[j]=d[j]*(1-kk)+c[0]*kk;d[j+1]=d[j+1]*(1-kk)+c[1]*kk;d[j+2]=d[j+2]*(1-kk)+c[2]*kk;d[j+3]=Math.max(d[j+3],255*kk);}}
    x.putImageData(img,0,0);}
  if(t==='brush'){const tx=DZ.tx;tx.clearRect(0,0,W,H);tx.lineCap='round';tx.lineJoin='round';
    (L.strokes||[]).forEach(s=>{const draw=m=>{tx.globalCompositeOperation=s.e?'destination-out':'source-over';tx.strokeStyle=s.c;tx.lineWidth=s.s;tx.beginPath();s.p.forEach(([px,py],k)=>{const X=m?2*CX-px:px;k?tx.lineTo(X,py):tx.moveTo(X,py);});if(s.p.length===1){const [px,py]=s.p[0];tx.lineTo((m?2*CX-px:px)+0.1,py);}tx.stroke();};draw(false);if(s.m)draw(true);});
    tx.globalCompositeOperation='source-over';x.drawImage(DZ.tmp,0,0);}
  x.restore();}
const hex=h=>{h=String(h||'#000').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];};
/* ---------- render ---------- */
let dzQueued=false;
function dzRender(){if(!DZ.ready||dzQueued)return;dzQueued=true;requestAnimationFrame(()=>{dzQueued=false;dzPaint();});}
function dzPaint(full){const {W,H}=DZ,N=W*H,x=DZ.lx;x.clearRect(0,0,W,H);
  if(dzd.mode==='custom'){x.fillStyle=dzd.base;x.fillRect(0,0,W,H);}
  (dzd.layers||[]).forEach(L=>{if(L.hide)return;if(L.t==='pinstripe'){drawLayer(x,L,W,H);return;}drawLayer(x,L,W,H);});
  const lay=x.getImageData(0,0,W,H).data,o=DZ.orig,out=new ImageData(W,H),q=out.data;
  const fin=dzd.finish||'gloss';const G={gloss:0.9,metallic:1.0,pearl:0.95,candy:1.05,matte:0.12,chrome:1.1}[fin];
  const fo=dzd.mode==='factory'&&dzd.fo?hex(dzd.fo):null,fb=dzd.mode==='factory'&&dzd.fb?hex(dzd.fb):null,fd=dzd.mode==='factory'&&dzd.fd?hex(dzd.fd):null;
  const tint={factory:null,light:[0.35,0.38,0.42,0.35],dark:[0.05,0.06,0.07,0.75],blue:[0.1,0.35,0.85,0.45],gold:[0.85,0.62,0.18,0.5]}[dzd.tint||'factory'];
  const lit=(r,g,b,i,res)=>{let S=DZ.S[i],sp=DZ.spec[i]*G;
    if(fin==='matte')S=0.62+0.38*S;
    if(fin==='metallic'){const f=1+DZ.noise[i]*0.16;r*=f;g*=f;b*=f;S=Math.pow(S,1.25)*1.05;}
    if(fin==='candy'){r=Math.pow(r,1.35);g=Math.pow(g,1.35);b=Math.pow(b,1.35);S*=1.12;}
    if(fin==='chrome'){const e=0.18+1.25*Math.pow(S,3)+DZ.noise[i]*0.04;r=r*0.35+e*0.75*r+e*0.18;g=g*0.35+e*0.75*g+e*0.18;b=b*0.35+e*0.75*b+e*0.2;S=1;}
    let R=r*S,Gc=g*S,B=b*S;if(fin==='pearl'){const k=(S-0.8)*0.35;R+=k*0.9;Gc+=k*0.75;B+=k*1.1;}
    res[0]=R+sp;res[1]=Gc+sp;res[2]=B+sp;};
  const tmp=[0,0,0];
  for(let i=0,j=0;i<N;i++,j+=4){let R=o[j]/255,Gg=o[j+1]/255,B=o[j+2]/255;const m=DZ.mask[i];
    if(m>0.002){let br=R,bg=Gg,bb=B;
      if(dzd.mode==='factory'){const Ov=DZ.O[i],Bv=DZ.B[i],Dv=Math.max(0,1-Ov-Bv),Lr=DZ.L[i];
        if(fo&&Ov>0){const k=Math.sqrt(Lr/0.43);br=br*(1-Ov)+fo[0]/255*k*Ov;bg=bg*(1-Ov)+fo[1]/255*k*Ov;bb=bb*(1-Ov)+fo[2]/255*k*Ov;}
        if(fb&&Bv>0){const k=Math.sqrt(Lr/0.29);br=br*(1-Bv)+fb[0]/255*k*Bv;bg=bg*(1-Bv)+fb[1]/255*k*Bv;bb=bb*(1-Bv)+fb[2]/255*k*Bv;}
        if(fd&&Dv>0){const rel=Math.min(2.2,Math.max(0.5,Lr/0.2));const k=DZ.S[i]*(0.72+0.28*rel);br=br*(1-Dv)+(fd[0]/255*k+DZ.spec[i]*0.9)*Dv;bg=bg*(1-Dv)+(fd[1]/255*k+DZ.spec[i]*0.9)*Dv;bb=bb*(1-Dv)+(fd[2]/255*k+DZ.spec[i]*0.9)*Dv;}}
      const a=lay[j+3]/255;
      if(a>0){lit(lay[j]/255,lay[j+1]/255,lay[j+2]/255,i,tmp);br=br*(1-a)+tmp[0]*a;bg=bg*(1-a)+tmp[1]*a;bb=bb*(1-a)+tmp[2]*a;}
      const k=DZ.keep[i];if(k>0){let wr=R,wg=Gg,wb=B;if(tint&&DZ.win[i]){wr=wr*(1-tint[3])+tint[0]*tint[3]*(0.4+wr);wg=wg*(1-tint[3])+tint[1]*tint[3]*(0.4+wg);wb=wb*(1-tint[3])+tint[2]*tint[3]*(0.4+wb);}br=br*(1-k)+wr*k;bg=bg*(1-k)+wg*k;bb=bb*(1-k)+wb*k;}
      R=R*(1-m)+br*m;Gg=Gg*(1-m)+bg*m;B=B*(1-m)+bb*m;}
    q[j]=R>1?255:R*255;q[j+1]=Gg>1?255:Gg*255;q[j+2]=B>1?255:B*255;q[j+3]=255;}
  DZ.last=out;DZ.ox.putImageData(out,DZ.X0-DZ.VX,DZ.Y0-DZ.VY);}
/* ---------- UI ---------- */
function fieldHtml(L,[k,label,type,def,a,b]){const v=L[k]==null?def:L[k];const id='dzf-'+k;
  if(type==='color')return '<div class="dzfield"><label for="'+id+'">'+label+'</label><div class="dzcol"><input type="color" id="'+id+'" data-k="'+k+'" value="'+esc(v)+'"><div class="dzsw">'+SW.map(c=>'<button type="button" style="--c:'+c+'" data-k="'+k+'" data-c="'+c+'" aria-label="'+c+'"'+(String(v).toLowerCase()===c?' aria-pressed="true"':'')+'></button>').join('')+'</div></div></div>';
  if(type==='range')return '<div class="dzfield"><label for="'+id+'">'+label+' <b class="mono" id="'+id+'-v">'+v+'</b></label><input type="range" id="'+id+'" data-k="'+k+'" min="'+a+'" max="'+b+'" step="1" value="'+v+'"></div>';
  if(type==='text')return '<div class="dzfield"><label for="'+id+'">'+label+'</label><input type="text" id="'+id+'" data-k="'+k+'" maxlength="24" value="'+esc(v)+'"></div>';
  if(type==='select')return '<div class="dzfield"><label>'+label+'</label><div class="seg">'+a.map(o=>'<button type="button" data-k="'+k+'" data-v="'+o+'" aria-pressed="'+(v===o)+'">'+o[0].toUpperCase()+o.slice(1)+'</button>').join('')+'</div></div>';
  if(type==='check')return '<label class="dzchk"><input type="checkbox" id="'+id+'" data-k="'+k+'"'+(v?' checked':'')+'>'+label+'</label>';return '';}
function wireFields(root,obj,onChange){root.querySelectorAll('input[type=color][data-k]').forEach(i=>{i.oninput=()=>{obj[i.dataset.k]=i.value;onChange(false);};i.onchange=()=>onChange(true);});
  root.querySelectorAll('.dzsw button').forEach(b=>b.onclick=()=>{obj[b.dataset.k]=b.dataset.c;onChange(true,true);});
  root.querySelectorAll('input[type=range][data-k]').forEach(i=>{i.oninput=()=>{obj[i.dataset.k]=+i.value;const v=$('#'+i.id+'-v');if(v)v.textContent=i.value;onChange(false);};i.onchange=()=>onChange(true);});
  root.querySelectorAll('input[type=text][data-k]').forEach(i=>{i.oninput=()=>{obj[i.dataset.k]=i.value;onChange(false);};i.onchange=()=>onChange(true);});
  root.querySelectorAll('.seg button[data-k]').forEach(b=>b.onclick=()=>{obj[b.dataset.k]=b.dataset.v;onChange(true,true);});
  root.querySelectorAll('input[type=checkbox][data-k]').forEach(i=>i.onchange=()=>{obj[i.dataset.k]=i.checked;onChange(true);});}
function layerDefaults(t){const L={t,op:100};LT[t].f.forEach(([k,,, d])=>L[k]=d);if(t==='brush')L.strokes=[];return L;}
function renderDz(){
  const base=$('#dzBase');const f=dzd.mode==='factory';
  base.innerHTML='<div class="seg dzmode" role="group" aria-label="Paint mode"><button type="button" data-m="factory" aria-pressed="'+f+'">Factory livery</button><button type="button" data-m="custom" aria-pressed="'+!f+'">Custom paint</button></div>'+
    (f?'<p class="fine">Recolour the graphics that came on your shell. Leave one as is to keep the factory colour.</p>'+
      [['fo','Orange graphics','#ff6a1a'],['fb','Blue pinstripes','#1f5fd6'],['fd','Black & grey base','#0d0e10']].map(([k,l,d])=>'<div class="dzfield"><label>'+l+'</label><div class="dzcol"><input type="color" data-k="'+k+'" value="'+(dzd[k]||d)+'" aria-label="'+l+'"><div class="dzsw">'+SW.map(c=>'<button type="button" style="--c:'+c+'" data-k="'+k+'" data-c="'+c+'" aria-label="'+c+'"'+(String(dzd[k]||'').toLowerCase()===c?' aria-pressed="true"':'')+'></button>').join('')+'</div>'+(dzd[k]?'<button type="button" class="btn sm" data-reset="'+k+'">Factory</button>':'')+'</div></div>').join(''):
      fieldHtml(dzd,['base','Base colour','color','#f4f4f2']))+
    '<div class="dzfield"><label>Finish</label><div class="seg dzfin">'+Object.entries(FINISHES).map(([k,n])=>'<button type="button" data-k="finish" data-v="'+k+'" aria-pressed="'+((dzd.finish||'gloss')===k)+'">'+n+'</button>').join('')+'</div></div>'+
    '<div class="dzfield"><label>Window tint</label><div class="seg">'+['factory','light','dark','blue','gold'].map(k=>'<button type="button" data-k="tint" data-v="'+k+'" aria-pressed="'+((dzd.tint||'factory')===k)+'">'+k[0].toUpperCase()+k.slice(1)+'</button>').join('')+'</div></div>';
  base.querySelectorAll('.dzmode button').forEach(b=>b.onclick=()=>{dzd.mode=b.dataset.m;commit();renderDz();dzRender();});
  base.querySelectorAll('[data-reset]').forEach(b=>b.onclick=()=>{dzd[b.dataset.reset]=null;commit();renderDz();dzRender();});
  wireFields(base,dzd,(c,re)=>{if(c)commit();if(re)renderDz();dzRender();});
  // layers
  const Ls=dzd.layers||(dzd.layers=[]);
  $('#dzLayers').innerHTML=Ls.length?Ls.map((L,i)=>'<div class="dzl'+(DZ.sel===i?' on':'')+'" data-i="'+i+'"><button type="button" class="dzl-n" data-sel="'+i+'"><i style="--c:'+(L.color||L.c1||L.plate||'#888')+'"></i>'+esc(LT[L.t].n)+(L.t==='text'?' · '+esc(L.text):L.t==='number'?' · '+esc(L.num):'')+'</button>'+
      '<button type="button" class="dzi" data-up="'+i+'" aria-label="Move up"'+(i===Ls.length-1?' disabled':'')+'>↑</button><button type="button" class="dzi" data-hide="'+i+'" aria-label="'+(L.hide?'Show':'Hide')+'">'+(L.hide?'◌':'●')+'</button><button type="button" class="dzi" data-del="'+i+'" aria-label="Delete">'+I('x')+'</button></div>').reverse().join(''):
    '<p class="fine">No layers yet. Add stripes, a number, flames or draw freehand.</p>';
  $('#dzLayers').querySelectorAll('[data-sel]').forEach(b=>b.onclick=()=>{DZ.sel=+b.dataset.sel===DZ.sel?null:+b.dataset.sel;renderDz();});
  $('#dzLayers').querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const i=+b.dataset.up;[Ls[i],Ls[i+1]]=[Ls[i+1],Ls[i]];DZ.sel=i+1;commit();renderDz();dzRender();});
  $('#dzLayers').querySelectorAll('[data-hide]').forEach(b=>b.onclick=()=>{const L=Ls[+b.dataset.hide];L.hide=!L.hide;commit();renderDz();dzRender();});
  $('#dzLayers').querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{Ls.splice(+b.dataset.del,1);DZ.sel=null;commit();renderDz();dzRender();});
  $('#dzAdd').innerHTML=Object.entries(LT).map(([k,v])=>'<button type="button" class="btn sm" data-add="'+k+'">'+I('plus')+v.n+'</button>').join('');
  $('#dzAdd').querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{Ls.push(layerDefaults(b.dataset.add));DZ.sel=Ls.length-1;commit();renderDz();dzRender();});
  // selected layer properties
  const P=$('#dzProps');const L=DZ.sel!=null?Ls[DZ.sel]:null;
  if(!L){P.innerHTML='<p class="fine">Pick a layer to edit it, or add one. Drag on the photo to move numbers, text, splits and checker bands; with Freehand selected, draw right on the shell.</p>';}
  else{P.innerHTML='<h3>'+esc(LT[L.t].n)+'</h3>'+LT[L.t].f.map(f=>fieldHtml(L,f)).join('')+fieldHtml(L,['op','Opacity','range',100,5,100])+
      (L.t==='brush'?'<div class="dzrow"><div class="seg"><button type="button" id="dzPaintMode" aria-pressed="'+!DZ.erase+'">Paint</button><button type="button" id="dzEraseMode" aria-pressed="'+!!DZ.erase+'">Erase</button></div><button type="button" class="btn sm" id="dzClearBrush">Clear drawing</button></div>':'');
    wireFields(P,L,(c,re)=>{if(c)commit();if(re)renderDz();else if(c)renderDz();dzRender();});
    if(L.t==='brush'){$('#dzPaintMode').onclick=()=>{DZ.erase=false;renderDz();};$('#dzEraseMode').onclick=()=>{DZ.erase=true;renderDz();};$('#dzClearBrush').onclick=()=>{L.strokes=[];commit();dzRender();};}}
  $('#dzStage').classList.toggle('brush',!!(L&&L.t==='brush'));$('#dzStage').classList.toggle('move',!!(L&&['number','text','split','checker'].includes(L.t)));
  // presets + saved
  $('#dzPresets').innerHTML=PRESETS.map(([n],i)=>'<button type="button" class="btn sm" data-pre="'+i+'">'+esc(n)+'</button>').join('');
  $('#dzPresets').querySelectorAll('[data-pre]').forEach(b=>b.onclick=()=>{dzd=JSON.parse(JSON.stringify(PRESETS[+b.dataset.pre][1]));DZ.sel=null;commit();renderDz();dzRender();toast('<b>'+esc(PRESETS[+b.dataset.pre][0])+'</b> loaded');});
  const sv=dzSaved();$('#dzSaved').innerHTML=sv.length?sv.map((d,i)=>'<div class="row"><span><b>'+esc(d.name)+'</b><small>'+esc(d.when||'')+'</small></span><button type="button" class="btn sm" data-ld="'+i+'">Load</button><button type="button" class="btn sm" data-rm="'+i+'" aria-label="Delete '+esc(d.name)+'">'+I('x')+'</button></div>').join(''):'<p class="fine">Name a design and save it to come back to it.</p>';
  $('#dzSaved').querySelectorAll('[data-ld]').forEach(b=>b.onclick=()=>{dzd=JSON.parse(JSON.stringify(dzSaved()[+b.dataset.ld].d));DZ.sel=null;commit();renderDz();dzRender();});
  $('#dzSaved').querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{const l=dzSaved();const [x]=l.splice(+b.dataset.rm,1);try{localStorage.setItem(DZS,JSON.stringify(l));}catch(e){}renderDz();toast('Deleted '+esc(x.name));});
  $('#dzUndo').disabled=DZ.undo.length<2;$('#dzRedo').disabled=!DZ.redo.length;}
const dzSaved=()=>{try{return JSON.parse(localStorage.getItem(DZS)||'[]');}catch(e){return [];}};
$('#dzSaveF').onsubmit=e=>{e.preventDefault();const n=$('#dzName').value.trim()||'Design '+(dzSaved().length+1);const l=dzSaved();l.unshift({name:n,when:new Date().toLocaleDateString(),d:JSON.parse(JSON.stringify(dzd))});try{localStorage.setItem(DZS,JSON.stringify(l.slice(0,30)));}catch(er){toast('Could not save: browser storage is full');return;}$('#dzName').value='';renderDz();toast('<b>Saved</b> '+esc(n));};
$('#dzUndo').onclick=()=>{if(DZ.undo.length<2)return;DZ.redo.push(DZ.undo.pop());dzd=JSON.parse(DZ.undo[DZ.undo.length-1]);DZ.sel=null;dzSave();renderDz();dzRender();};
$('#dzRedo').onclick=()=>{const s=DZ.redo.pop();if(!s)return;DZ.undo.push(s);dzd=JSON.parse(s);DZ.sel=null;dzSave();renderDz();dzRender();};
$('#dzCompare').oninput=e=>{$('#dzBefore').style.clipPath='inset(0 '+(100-e.target.value)+'% 0 0)';$('#dzSplitLine').style.left=e.target.value+'%';$('#dzSplitLine').hidden=+e.target.value===0;};
$('#dzTo3d').onclick=()=>{const f=dzd.mode==='factory';const body=f?(dzd.fo||'#ff6a1a'):dzd.base;const st=(dzd.layers||[]).find(L=>!L.hide&&['stripes','pinstripe','fade','split'].includes(L.t));
  S.paint=Object.assign({},S.paint,{body,accent:st?st.color:(f?(dzd.fd||'#111316'):'#111316'),finish:['gloss','metallic','matte','pearl'].includes(dzd.finish)?dzd.finish:'gloss'});save();applyPaint(look());heroDirty=true;toast('<b>Sent to 3D</b>: body '+esc(body)+(st?' with '+esc(LT[st.t].n.toLowerCase()):''));};
/* pointer: move layers or paint */
function toCrop(e){const r=$('#dzCv').getBoundingClientRect();return [(e.clientX-r.left)/r.width*DZ.VW+DZ.VX-DZ.X0,(e.clientY-r.top)/r.height*DZ.VH+DZ.VY-DZ.Y0];}
$('#dzCv').addEventListener('pointerdown',e=>{const L=DZ.sel!=null?dzd.layers[DZ.sel]:null;if(!L||!DZ.ready)return;const [x,y]=toCrop(e);e.preventDefault();$('#dzCv').setPointerCapture(e.pointerId);
  if(L.t==='brush'){DZ.drag={s:{c:L.color,s:L.size,m:!!L.mirror,e:!!DZ.erase,p:[[x,y]]},L};L.strokes.push(DZ.drag.s);dzRender();}
  else if(['number','text','split','checker'].includes(L.t))DZ.drag={L,move:true};});
$('#dzCv').addEventListener('pointermove',e=>{const d=DZ.drag;if(!d)return;const [x,y]=toCrop(e);
  if(d.s){d.s.p.push([Math.round(x),Math.round(y)]);dzRender();}
  else if(d.move){const L=d.L,yp=Math.max(0,Math.min(100,(1-(y-TOPY)/(BOTY-TOPY))*100));if('x' in L)L.x=Math.round(Math.max(0,Math.min(100,(x-40)/(DZ.W-80)*100)));if(L.t==='split')L.pos=Math.round(yp);else L.y=Math.round(yp);dzRender();}});
const endDrag=()=>{if(DZ.drag){DZ.drag=null;commit();renderDz();}};
$('#dzCv').addEventListener('pointerup',endDrag);$('#dzCv').addEventListener('pointercancel',endDrag);
/* save a picture of the design */
let dzDl=null;(async()=>{try{dzDl=window.claude&&await window.claude.use('downloads');}catch(e){dzDl=null;}})();
$('#dzShot').onclick=async()=>{if(!DZ.ready)return;const c=document.createElement('canvas');c.width=DZ.VW;c.height=DZ.VH;c.getContext('2d').drawImage($('#dzCv'),0,0);
  const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',0.92));
  if(dzDl){try{await dzDl.save({filename:'jato-paint-design.jpg',data:blob});toast('<b>Saved</b> picture');return;}catch(e){if(e&&e.code==='declined')return;}}
  const u=URL.createObjectURL(blob);$('#dzShotImg').src=u;$('#dzShotBox').hidden=false;};
$('#dzShotX').onclick=()=>$('#dzShotBox').hidden=true;
async function dzOpen(){if(!DZ.undo.length)DZ.undo.push(JSON.stringify(dzd));renderDz();try{await dzLoad();dzRender();$('#dzLoading').hidden=true;}catch(e){$('#dzLoading').textContent='Could not load your photo. Reload the page and try again.';}}
const _goDz=go;go=function(s){_goDz(s);if(s==='design')dzOpen();};
})();
