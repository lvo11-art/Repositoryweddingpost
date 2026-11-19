/* ================= app ================= */
const D=JATO,SP=D.specs;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const I=n=>'<svg class="i"><use href="#i-'+n+'"/></svg>';
const KEY='jato-lab-v1';
const S=Object.assign({screen:'garage',sel:null,hover:null,body:'on',exT:0,labels:true,ptab:'over',paintMode:false,paint:{},installed:[],wish:[],gear:{pin:14,sp:50,cells:4},maint:{},builds:[],filter:'all',sort:'fit',fits:true,q:''},(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){return {};}})());
S.sel=null;S.hover=null;S.paintMode=false;S.exT=0;
function save(){try{const {screen,body,labels,paint,installed,wish,gear,maint,builds,filter,sort,fits}=S;localStorage.setItem(KEY,JSON.stringify({screen,body,labels,paint,installed,wish,gear,maint,builds,filter,sort,fits}));}catch(e){}}
function toast(h){const t=$('#toast');t.innerHTML=h;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,2400);}

/* ---------- catalogue ---------- */
const UP=D.upgrades.map((u,i)=>Object.assign({key:u.part_number||('n'+i+':'+u.name)},u));
const UPK=Object.fromEntries(UP.map(u=>[u.key,u]));
const SLOT={tires_wheels:['Tires & wheels','tire'],gearing:['Gearing','gear'],power:['Motor & ESC','bolt'],battery:['Battery & charging','batt'],servo:['Servo','steer'],suspension:['Suspension','spring'],
  driveline:['Driveline','shaft'],armor_durability:['Durability','shield'],body_aero:['Body & wing','car'],electronics_telemetry:['Telemetry','chip'],lights:['Lights','bolt']};
const SLOTPARTS={tires_wheels:['wheels_tires','wheel_hex'],gearing:['pinion','spur'],power:['motor','esc'],battery:['battery','battery_hold_down'],servo:['servo'],
  suspension:['shocks','caster_blocks','steering_blocks','hub_carriers','shock_tower_front','shock_tower_rear','suspension_arms'],driveline:['driveshaft_front','driveshaft_rear','center_driveshaft','center_diff','diff_front_rear'],
  armor_durability:['bulkhead_tie_bars','battery_hold_down','suspension_arms','driveshaft_front','driveshaft_rear'],body_aero:['body','wing','wing_mounts'],electronics_telemetry:['receiver','esc','motor'],lights:['body']};
const KW={shocks:['shock','spring','oil'],caster_blocks:['caster'],steering_blocks:['steering block'],hub_carriers:['stub axle','carrier'],shock_tower_front:['tower','camber'],shock_tower_rear:['tower'],
  suspension_arms:['arm','heavy-duty upgrade'],driveshaft_front:['front driveshaft','rebuild','extreme heavy'],driveshaft_rear:['rear driveshaft','rebuild','extreme heavy'],center_driveshaft:['centre driveshaft','center cvd'],
  center_diff:['centre diff'],diff_front_rear:['differential oil'],bulkhead_tie_bars:['tie bar'],battery_hold_down:['hold-down'],body:['body','led'],wing:['wing'],wing_mounts:['wing'],
  esc:['esc','power system','link'],motor:['motor','power system','fan','rpm','temperature'],receiver:['link','telemetry','gps','voltage','sensor'],pinion:['pinion'],spur:['spur'],battery:['lipo','charger']};
function upgradesFor(p){return UP.filter(u=>(SLOTPARTS[u.slot]||[]).includes(p.id)&&(!KW[p.id]||KW[p.id].some(k=>(u.name+' '+u.what_it_changes).toLowerCase().includes(k))));}
function fitInfo(u){const f=u.fits_stock;if(f===true)return ['ok','Fits stock'];if(f===false)return ['bad','Doesn\'t fit'];const s=String(f||'');
  if(s.startsWith('already'))return ['blue','Already on your Jato'];return ['warn',s.replace(/^needs_(check|x):?\s*/,'Check: ').slice(0,80)||'Check fit'];}
const price=u=>u.approx_price_usd?'$'+(+u.approx_price_usd).toFixed(2).replace(/\.00$/,''):null;
const isInst=k=>S.installed.includes(k),inWish=k=>S.wish.includes(k);
function stores(u){const q=encodeURIComponent((u.brand&&u.brand!=='None'?u.brand+' ':'')+(u.part_number||u.name)+(u.part_number?'':' Jato'));
  const tx=u.src&&/traxxas\.com/.test(u.src)&&!/\.pdf/.test(u.src)?u.src:'https://traxxas.com/catalogsearch/result/?q='+q;
  return [['Traxxas',tx],['AMain','https://www.amainhobbies.com/search?q='+q],['eBay','https://www.ebay.com/sch/i.html?_nkw='+q],['Amazon','https://www.amazon.com/s?k='+q]]
    .map(([n,h])=>'<a class="btn sm" href="'+esc(h)+'" target="_blank" rel="noopener">'+n+I('ext')+'</a>').join('');}
const PATCH={'9074-WHT':{wheels:'#e9edf2'},'9074-YLW':{wheels:'#f2d21a'},'9074-GRN':{wheels:'#45c12b'},'9071-GRAY':{wheels:'#6f7780'},'9073':{wheels:'#6f7780'},'9063-ORNG':{blocks:'#ff6a1a'},'7462X':{shocks:'#2b2e33'},'9060-BLUE':{body:'#1f5fd6'}};
function look(){const P={};S.installed.forEach(k=>Object.assign(P,PATCH[k]||{}));return Object.assign({},PAINT_DEF,P,S.paint);}
function toggleInst(k){const u=UPK[k];if(!u)return;if(isInst(k)){S.installed=S.installed.filter(x=>x!==k);toast('<b>Removed</b> '+esc(u.name)+' from your build');}
  else{S.installed.push(k);S.wish=S.wish.filter(x=>x!==k);const m=/Pinion (\d+)T/i.exec(u.name);if(m)S.gear.pin=+m[1];const m2=/Spur gear (\d+)T/i.exec(u.name);if(m2)S.gear.sp=+m2[1];
    toast('<b>Installed</b> '+esc(u.name));}
  save();applyPaint(look());refreshAll();}
function toggleWish(k){const u=UPK[k];if(inWish(k)){S.wish=S.wish.filter(x=>x!==k);toast('Removed from wishlist');}else{S.wish.push(k);toast('<b>Added</b> to wishlist · '+esc(u.name));}save();refreshAll();}

/* ---------- numbers ---------- */
function mph(g){g=g||S.gear;return 60*(g.pin/14)*(50/g.sp)*(g.cells/4);}
function perf(){const g=S.gear;const ratio=g.sp/g.pin,ratio0=50/14;const heat=Math.pow(g.cells/4,1.6)*(ratio0/ratio);
  const dura=Math.min(100,58+S.installed.filter(k=>/durab|strong|heavy|steel|alumin|7075|hard/i.test(UPK[k].what_it_changes+' '+UPK[k].name)).length*7);
  const pack=S.installed.includes('2889X')?5000:5000;const minutes=pack/1000/(22*heat)*60*0.85;
  return {mph:mph(),punch:Math.round(70*(ratio/ratio0)*(g.cells/4)),heat,minutes,dura,cost:S.installed.reduce((a,k)=>a+(+UPK[k].approx_price_usd||0),0)};}

/* ---------- navigation ---------- */
function go(s){S.screen=s;document.querySelectorAll('.scr').forEach(e=>e.hidden=e.id!=='s-'+s);
  document.querySelectorAll('.nav [data-s],.tabs [data-s]').forEach(b=>b.toggleAttribute('aria-current',b.dataset.s===s));document.querySelectorAll('.nav [data-s],.tabs [data-s]').forEach(b=>{if(b.dataset.s===s)b.setAttribute('aria-current','page');});
  if(s==='build'){requestAnimationFrame(resize);}if(s==='garage')renderGarage();if(s==='shop')renderShop();if(s==='tune')renderTune();if(s==='mech')renderMech();save();window.scrollTo(0,0);}
document.querySelectorAll('[data-s]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.s)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));

/* ---------- 3D: interaction ---------- */
const VIEWS={iso:V(1,0.62,-1.05),left:V(0.0001,0.14,-1),front:V(1,0.16,0.0001),rear:V(-1,0.16,0.0001),top:V(0.0001,1,0.0001),bottom:V(0.0001,-1,0.0001)};
let fly=null;
function flyTo(t,dir,dist){fly={t0:performance.now(),p0:camera.position.clone(),c0:controls.target.clone(),c1:t.clone(),p1:t.clone().add(dir.clone().normalize().multiplyScalar(dist))};}
function fitDist(){const f=camera.fov*PI/180,fh=2*Math.atan(Math.tan(f/2)*camera.aspect);return 330/Math.sin(Math.min(f,fh)/2)*0.95;}
function setView(v){flyTo(V(0,60,0),VIEWS[v],fitDist());document.querySelectorAll('#views button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v));}
document.querySelectorAll('#views button').forEach(b=>b.onclick=()=>setView(b.dataset.v));
function focusPart(p){const b=new THREE.Box3().setFromObject(p.g);const c=b.getCenter(V(0,0,0)),r=Math.max(b.getSize(V(0,0,0)).length()/2,45);
  const dir=camera.position.clone().sub(controls.target).normalize();flyTo(c,dir,Math.min(900,Math.max(220,r*3.4)));}
function setBody(m){S.body=m;const p=byId.body;p.g.visible=m!=='off';const ghost=m==='ghost';
  p.meshes.forEach(x=>{const mm=x.material;mm.transparent=ghost;mm.opacity=ghost?0.22:1;mm.depthWrite=!ghost;mm.needsUpdate=true;});
  document.querySelectorAll('#bodyMode button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.b===m));save();}
document.querySelectorAll('#bodyMode button').forEach(b=>b.onclick=()=>setBody(b.dataset.b));
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
function pick(x,y){const r=renderer.domElement.getBoundingClientRect();ndc.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);
  const hits=ray.intersectObjects(root.children,true);for(const h of hits){let o=h.object;if(!o.visible)continue;let vis=true;for(let q=o;q;q=q.parent)if(!q.visible)vis=false;if(!vis)continue;
    const p=byId[o.userData.part];if(!p)continue;if(p.id==='body'&&S.body==='ghost')continue;return p;}return null;}
let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5){const p=pick(e.clientX,e.clientY);select(p,false);}down=null;});
renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const p=pick(e.clientX,e.clientY);if(p!==S.hover){S.hover=p;highlight();}
  const t=$('#tip');if(p){const r=stage.getBoundingClientRect();t.hidden=false;t.textContent=p.name;t.style.left=(e.clientX-r.left)+'px';t.style.top=(e.clientY-r.top)+'px';}else t.hidden=true;});
renderer.domElement.addEventListener('pointerleave',()=>{S.hover=null;highlight();$('#tip').hidden=true;});
controls.addEventListener('start',()=>{if(controls.autoRotate){controls.autoRotate=false;dockSync();}});
function highlight(){parts.forEach(p=>{const on=S.sel===p,hv=S.hover===p&&!on;p.meshes.forEach(m=>{const mm=m.material;if(!mm.emissive)return;if(mm.userData.e0===undefined)mm.userData.e0=mm.emissive.getHex();
  if(on){mm.emissive.set(0x00b8ff);mm.emissiveIntensity=0.35;}else if(hv){mm.emissive.set(0xa855f7);mm.emissiveIntensity=0.22;}else{mm.emissive.setHex(mm.userData.e0);mm.emissiveIntensity=1;}});});}
function select(p,focus){S.sel=p;S.paintMode=false;if(p&&S.ptab==='paint')S.ptab='over';if(p&&p.id==='body'&&S.body==='off')setBody('on');highlight();renderCats();renderCtx();if(p&&focus)focusPart(p);dockSync();}
/* dock */
function dockSync(){const q=k=>document.querySelector('.dock [data-k='+k+']');q('spin').setAttribute('aria-pressed',!!controls.autoRotate);q('explode').setAttribute('aria-pressed',S.exT>0);q('labels').setAttribute('aria-pressed',S.labels);q('paint').setAttribute('aria-pressed',S.paintMode);}
document.querySelector('.dock').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.k;
  if(k==='spin')controls.autoRotate=!controls.autoRotate;if(k==='fit')setView('iso');if(k==='explode')S.exT=S.exT>0?0:1;if(k==='labels'){S.labels=!S.labels;save();}
  if(k==='paint'){S.paintMode=!S.paintMode;if(S.paintMode){S.sel=null;highlight();renderCats();}renderCtx();}dockSync();});
controls.autoRotateSpeed=0.8;
/* callouts */
const CO=[['Power','Motor · battery','bolt','motor',V(-84,74,27)],['Electronics','ESC · receiver','chip','esc',V(78,72,40)],['Drivetrain','Centre diff · shafts','shaft','center_diff',V(-4,74,0)],
  ['Suspension','GTR shocks · towers','spring','shocks',V(AX-30,120,-64)],['Steering','Servo · blocks','steer','servo',V(132,72,22)],['Wheels & tires','Response Pro 3.0"','tire','wheels_tires',V(AX,TR,-WZ-20)],['Body & wing','Orange shell · wing','car','wing',V(-250,175,0)]];
const call=$('#call');CO.forEach(([t,s,ic,id])=>{const b=document.createElement('button');b.type='button';b.className='co';b.dataset.p=id;b.innerHTML=I(ic)+'<span><b>'+t+'</b><small>'+s+'</small></span>';b.onclick=()=>{S.ptab='ups';select(byId[id],true);};call.appendChild(b);});
const tv=V(0,0,0);
function placeCallouts(){const show=S.labels&&!S.sel&&!S.paintMode&&S.exT===0&&S.screen==='build';call.hidden=!show;if(!show)return;
  const w=stage.clientWidth,h=stage.clientHeight,cx=w/2,cy=h*0.48;let svg='';const els=[];
  call.querySelectorAll('.co').forEach((el,i)=>{tv.copy(CO[i][4]).project(camera);if(tv.z>1){el.hidden=true;return;}el.hidden=false;const ax=(tv.x+1)/2*w,ay=(1-tv.y)/2*h;let dx=ax-cx,dy=ay-cy;const L=Math.hypot(dx,dy)||1;
    const ew=el.offsetWidth/2,eh=el.offsetHeight/2;let lx=ax+dx/L*Math.max(110,w*0.12),ly=ay+dy/L*Math.max(70,h*0.14);lx=Math.max(ew+8,Math.min(w-ew-8,lx));ly=Math.max(eh+8,Math.min(h-eh-64,ly));el._r=[lx,ly,ew,eh];el._a=[ax,ay];els.push(el);});
  for(let it=0;it<5;it++)for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){const a=els[i]._r,b=els[j]._r;const ox=a[2]+b[2]+8-Math.abs(a[0]-b[0]),oy=a[3]+b[3]+6-Math.abs(a[1]-b[1]);if(ox>0&&oy>0){const s=(a[1]<b[1]?-1:1)*oy/2;a[1]+=s;b[1]-=s;}}
  els.forEach(el=>{const [lx,ly]=el._r,[ax,ay]=el._a;el.style.left=lx+'px';el.style.top=ly+'px';svg+='<line x1="'+ax+'" y1="'+ay+'" x2="'+lx+'" y2="'+ly+'"/><circle cx="'+ax+'" cy="'+ay+'" r="3.5"/>';});
  call.querySelector('svg').innerHTML=svg;}
/* loop */
function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);
let exNow=0;
function frame(now){requestAnimationFrame(frame);if(fly){const k=Math.min(1,(now-fly.t0)/650),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;camera.position.lerpVectors(fly.p0,fly.p1,e);controls.target.lerpVectors(fly.c0,fly.c1,e);if(k>=1)fly=null;}
  exNow+=(S.exT-exNow)*0.12;if(Math.abs(S.exT-exNow)<0.002)exNow=S.exT;parts.forEach(p=>p.g.position.copy(p.ex).multiplyScalar(exNow));
  controls.update();if(S.screen==='build'){renderer.render(scene,camera);placeCallouts();}}
/* garage picture */
function snapshot(){const w=1400,h=820;const cp=camera.position.clone(),ct=controls.target.clone(),asp=camera.aspect;const bodyVis=byId.body.g.visible;
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();camera.position.set(520,250,-470);camera.lookAt(0,62,0);
  parts.forEach(p=>p.g.position.set(0,0,0));const op=S.body;if(op!=='on'){byId.body.g.visible=true;byId.body.meshes.forEach(x=>{x.material.transparent=false;x.material.opacity=1;x.material.depthWrite=true;});}
  const hs=S.sel,hh=S.hover;S.sel=null;S.hover=null;highlight();renderer.render(scene,camera);const url=renderer.domElement.toDataURL('image/png');
  S.sel=hs;S.hover=hh;highlight();if(op!=='on')setBody(op);byId.body.g.visible=bodyVis||op!=='off';if(op==='off')byId.body.g.visible=false;
  camera.position.copy(cp);controls.target.copy(ct);camera.aspect=asp;camera.updateProjectionMatrix();resize();return url;}

/* ---------- parts list ---------- */
const CATS=[['chassis','Chassis','shield'],['power','Power','bolt'],['electronics','Electronics','chip'],['drivetrain','Drivetrain','shaft'],['suspension','Suspension','spring'],['steering','Steering','steer'],['wheels','Wheels & tires','tire'],['body','Body & wing','car']];
const open=new Set();
function partUpgraded(p){return upgradesFor(p).some(u=>isInst(u.key));}
function renderCats(){const q=$('#pFilter').value.trim().toLowerCase();let h='';
  CATS.forEach(([c,n,ic])=>{const list=parts.filter(p=>p.cat===c&&(!q||(p.name+' '+(dataFor(p).traxxas_pn||'')).toLowerCase().includes(q)));if(!list.length)return;const o=q||open.has(c)||(S.sel&&S.sel.cat===c);
    h+='<div class="cat"'+(o?' open-cat':'')+'><button type="button" data-c="'+c+'" aria-expanded="'+!!o+'"><i class="ci">'+I(ic)+'</i><span>'+n+'</span><small>'+list.length+'</small></button>'+
      (o?'<ul>'+list.map(p=>'<li><button type="button" data-p="'+p.id+'" aria-current="'+(S.sel===p)+'"><i class="'+(partUpgraded(p)?'up':'')+'"></i>'+esc(p.name)+'</button></li>').join('')+'</ul>':'')+'</div>';});
  $('#cats').innerHTML=h||'<p class="empty">No parts match.</p>';
  $('#cats').querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const c=b.dataset.c;open.has(c)?open.delete(c):open.add(c);renderCats();});
  $('#cats').querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>select(byId[b.dataset.p],true));}
$('#pFilter').addEventListener('input',renderCats);
const STOCK=Object.fromEntries(D.stock_parts.map(s=>[s.id,s]));
function dataFor(p){return STOCK[p.id]||{name:p.name,notes:p.id==='battery'?'Not included with the Jato. Traxxas lists the 5000 mAh 4S iD pack (2889X) as a fit; the 6700 mAh 2890X does not fit.':'',traxxas_pn:p.id==='battery'?'2889X (suggested)':null,confidence:'medium'};}
function breaksFor(p){const words=(p.name+' '+p.id).toLowerCase().replace(/[_()]/g,' ').split(/\W+/).filter(w=>w.length>3).map(w=>w.replace(/s$/,''));
  return D.common_breaks.filter(b=>{const t=(b.part+' '+b.symptom).toLowerCase();return words.some(w=>t.includes(w));});}
function maintFor(p){const words=(p.name+' '+p.id).toLowerCase().replace(/[_()]/g,' ').split(/\W+/).filter(w=>w.length>3).map(w=>w.replace(/s$/,''));
  return D.maintenance.filter(m=>words.some(w=>(m.item+' '+m.spec).toLowerCase().includes(w)));}
function upCard(u,compact){const [fk,ft]=fitInfo(u),pr=price(u),k=esc(u.key);
  return '<div class="up'+(isInst(u.key)?' inst':'')+'"><div class="t"><b>'+esc(u.name)+'</b><span>'+(pr||'')+'</span></div><div class="tags"><span class="tag">'+esc(u.brand||'—')+(u.part_number?' · '+esc(u.part_number):'')+'</span><span class="tag '+fk+'">'+esc(ft)+'</span>'+(isInst(u.key)?'<span class="tag vi">On your Jato</span>':'')+'</div>'+
    '<p>'+esc(u.what_it_changes)+'</p><div class="a"><button type="button" class="btn sm '+(inWish(u.key)?'':'pri')+'" data-wish="'+k+'">'+(inWish(u.key)?I('check')+'In wishlist':I('plus')+'Wishlist')+'</button><button type="button" class="btn sm" data-inst="'+k+'">'+(isInst(u.key)?'Remove from build':'Mark installed')+'</button></div>'+
    (compact?'':'<div class="a">'+stores(u)+'</div>')+'</div>';}
function wireUps(el){el.querySelectorAll('[data-wish]').forEach(b=>b.onclick=()=>toggleWish(b.dataset.wish));el.querySelectorAll('[data-inst]').forEach(b=>b.onclick=()=>toggleInst(b.dataset.inst));}
const CONF={high:['ok','Confirmed'],medium:['blue','Likely'],low:['warn','Unconfirmed'],none:['warn','Part # unknown']};
function renderCtx(){const H=$('#ctxHead'),B=$('#ctxBody'),p=S.sel;
  if(S.paintMode){H.innerHTML='<h2>Paint & colours</h2><div class="meta"><span class="tag">Changes the 3D buggy and the garage picture</span></div>';B.innerHTML=paintHtml();wirePaint(B);return;}
  if(!p){const P=perf();H.innerHTML='<h2>Your Jato</h2><div class="meta"><span class="tag ok">Stock</span><span class="tag">'+parts.length+' parts</span><span class="tag vi">'+S.installed.length+' upgrades</span></div>';
    B.innerHTML='<div class="sec"><h3>'+I('cube')+'Explore the buggy</h3><p class="fine">Tap any part on the 3D buggy, a label, or a part in the list. You get what it is, the Traxxas part number, upgrades that fit, and common problems with fixes.</p></div>'+
      '<div class="sec"><h3>'+I('speed')+'Right now</h3><dl class="kv"><dt>Top speed</dt><dd>≈ '+P.mph.toFixed(0)+' mph</dd><dt>Gearing</dt><dd>'+S.gear.pin+'T / '+S.gear.sp+'T on '+S.gear.cells+'S</dd><dt>Upgrades spent</dt><dd>$'+P.cost.toFixed(0)+'</dd><dt>Wishlist</dt><dd>'+S.wish.length+' items</dd></dl></div>'+
      '<div class="sec"><h3>'+I('wrench')+'Most common fixes</h3>'+D.common_breaks.slice(0,3).map(b=>'<p class="fine"><b style="color:var(--ink)">'+esc(b.part)+':</b> '+esc(b.symptom)+'</p>').join('')+'</div>';return;}
  const d=dataFor(p),[ck,ct]=CONF[d.confidence]||['','Source'],ups=upgradesFor(p),br=breaksFor(p),mt=maintFor(p);
  H.innerHTML='<h2>'+esc(p.name)+'</h2><div class="meta">'+(d.traxxas_pn?'<span class="tag blue mono">#'+esc(d.traxxas_pn)+'</span>':'')+'<span class="tag '+ck+'">'+ct+'</span>'+(partUpgraded(p)?'<span class="tag vi">Upgraded</span>':'<span class="tag">Stock</span>')+'</div>'+
    '<div class="ptabs" role="tablist"><button type="button" role="tab" data-t="over">Overview</button><button type="button" role="tab" data-t="ups">Upgrades '+(ups.length?'('+ups.length+')':'')+'</button><button type="button" role="tab" data-t="fix">Fix & care</button><button type="button" role="tab" data-t="ask">Ask AI</button></div>';
  H.querySelectorAll('[data-t]').forEach(b=>{b.setAttribute('aria-selected',b.dataset.t===S.ptab);b.onclick=()=>{S.ptab=b.dataset.t;renderCtx();};});
  let h='';
  if(S.ptab==='over'){h+='<div class="sec"><h3>'+I('cube')+'What it is</h3><p class="fine" style="color:#d4dceb">'+esc(d.notes||'Part of the stock Jato.')+'</p>'+
      '<dl class="kv"><dt>Category</dt><dd>'+esc((CATS.find(c=>c[0]===p.cat)||[,p.cat])[1])+'</dd><dt>Traxxas #</dt><dd>'+esc(d.traxxas_pn||'not confirmed yet')+'</dd><dt>Upgrades</dt><dd>'+ups.length+' that fit here</dd></dl>'+
      (d.src?'<a class="btn sm" href="'+esc(d.src)+'" target="_blank" rel="noopener">Source'+I('ext')+'</a>':'')+'</div>'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn sm" id="cFocus">Zoom to part</button><button type="button" class="btn sm" id="cClear">Close</button></div>';}
  if(S.ptab==='ups')h+=ups.length?ups.map(u=>upCard(u)).join(''):'<p class="empty">No upgrades listed for this part yet. Ask the AI mechanic for options.</p>';
  if(S.ptab==='fix'){h+=br.length?br.map(b=>'<div class="sec"><h3>'+I('wrench')+esc(b.symptom)+'</h3><p class="fine" style="color:#d4dceb">'+esc(b.fix)+'</p><p class="fine">Evidence: '+esc(b.frequency_evidence||'forum reports')+'</p></div>').join(''):'';
    h+=mt.length?mt.map(m=>'<div class="sec"><h3>'+I('gear')+esc(m.item)+'</h3><p class="fine" style="color:#d4dceb">'+esc(m.spec)+'</p><p class="fine">'+esc(m.interval||'')+'</p></div>').join(''):'';
    if(!br.length&&!mt.length)h+='<p class="empty">No known problems or service items for this part. Ask the AI mechanic if something seems off.</p>';}
  if(S.ptab==='ask'){h+='<div class="sec"><h3>'+I('chat')+'Ask about the '+esc(p.name)+'</h3><div class="sugg" style="padding:0">'+[
      'How do I remove and install the '+p.name+'?','What usually breaks on the '+p.name+' and how do I spot it?','Is the best upgrade for the '+p.name+' worth it for bashing?'].map(q=>'<button type="button" data-q="'+esc(q)+'">'+esc(q)+'</button>').join('')+'</div></div>';}
  B.innerHTML=h;wireUps(B);
  const f=$('#cFocus');if(f)f.onclick=()=>focusPart(p);const c=$('#cClear');if(c)c.onclick=()=>select(null);
  B.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{go('mech');ask(b.dataset.q);});}
/* paint */
const ZONES=[['body','Body shell',['#ff6a1a','#1f5fd6','#45c12b','#ff4fb8','#c4161c','#ffd21a','#f2f2f0','#0b0c0e']],['accent','Side stripes',['#111316','#f2f2f0','#1f5fd6','#ffd21a','#ff6a1a']],
  ['wing','Wing',['#15171a','#f2f2f0','#ffd21a','#ff6a1a']],['wheels','Wheels',['#17181b','#e9edf2','#f2d21a','#45c12b','#6f7780','#ff6a1a']],['shocks','Shock bodies',['#ff6a1a','#2b2e33','#1f5fd6','#c4161c','#8f99a4']],['blocks','Aluminium blocks',['#8f99a4','#ff6a1a','#1f5fd6','#2b2e33']]];
function paintHtml(){const L=look();return ZONES.map(([k,n,cs])=>'<div class="sec"><div class="zone"><span>'+n+'</span><input type="color" data-z="'+k+'" value="'+L[k]+'" aria-label="'+n+' custom colour"></div><div class="swrow" role="radiogroup" aria-label="'+n+'">'+
    cs.map(c=>'<button type="button" class="sw" role="radio" style="--c:'+c+'" data-z="'+k+'" data-c="'+c+'" aria-checked="'+(L[k].toLowerCase()===c)+'" aria-label="'+c+'"></button>').join('')+'</div></div>').join('')+
  '<div class="sec"><h3>Finish</h3><div class="seg" role="radiogroup">'+Object.keys(FIN).map(f=>'<button type="button" role="radio" data-f="'+f+'" aria-checked="'+(L.finish===f)+'">'+f[0].toUpperCase()+f.slice(1)+'</button>').join('')+'</div></div>'+
  '<button type="button" class="btn" id="pReset">Back to stock orange</button>';}
function setPaint(k,v){S.paint[k]=v;applyPaint(look());save();renderCtx();heroDirty=true;}
function wirePaint(B){B.querySelectorAll('.sw').forEach(b=>b.onclick=()=>setPaint(b.dataset.z,b.dataset.c));B.querySelectorAll('input[type=color]').forEach(i=>i.onchange=()=>setPaint(i.dataset.z,i.value));
  B.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>setPaint('finish',b.dataset.f));$('#pReset').onclick=()=>{S.paint={};applyPaint(look());save();renderCtx();heroDirty=true;toast('Back to <b>stock orange</b>');};}

/* ---------- garage ---------- */
let heroDirty=true;
function renderGarage(){const P=perf();if(heroDirty){heroDirty=false;try{$('#heroImg').src=snapshot();}catch(e){}}
  $('#heroCls').textContent='≈ '+P.mph.toFixed(0)+' mph · '+S.gear.cells+'S';
  const sv=(k,d)=>(SP[k]&&SP[k].value!=null)?SP[k].value:d;
  const sp=[[sv('length_mm')+' mm','Length'],[sv('wheelbase_mm')+' mm','Wheelbase'],['2.54 kg','Weight, no pack'],['2400 kV','Velineon 540XL'],['VXL-4s','ESC, 2S–4S'],[S.gear.pin+'T/'+S.gear.sp+'T','Pinion / spur'],['3.0"','Response Pro tyres'],['TBCD','Centre diff']];
  $('#gSpecs').innerHTML=sp.map(([b,s])=>'<div><b>'+esc(b)+'</b><span>'+esc(s)+'</span></div>').join('');
  const bar=(l,v,max,t)=>'<div class="bar"><span>'+l+'</span><i><b style="width:'+Math.max(3,Math.min(100,v/max*100))+'%"></b></i><span>'+t+'</span></div>';
  $('#gBars').innerHTML=bar('Top speed',P.mph,80,P.mph.toFixed(0)+' mph')+bar('Punch',P.punch,120,P.punch)+bar('Runtime',P.minutes,20,P.minutes.toFixed(0)+' min')+bar('Durability',P.dura,100,P.dura)+bar('Motor heat',P.heat*50,100,Math.round(P.heat*100)+'%');
  const Q=[['build','See every part in 3D','Tap a part for specs, upgrades and fixes','cube',''],['shop','Shop upgrades','Part numbers, prices, what fits','cart',''],['tune','Gearing & battery fit','Speed vs heat, will my pack fit?','gear',''],
    ['mech','Ask the AI mechanic','Repairs, setup, what to buy','chat','ai'],['speed','Speed run','GPS speed dash (opens a new page)','speed','']];
  $('#gQuick').innerHTML=Q.map(([k,t,s,ic,c])=>'<button type="button" class="row" data-q="'+k+'"><i class="ri '+c+'">'+I(ic)+'</i><span><b>'+t+'</b><small>'+s+'</small></span></button>').join('');
  $('#gQuick').querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{if(b.dataset.q==='speed')location.href='speed-dash.html';else go(b.dataset.q);});
  $('#gUpCount').textContent=S.installed.length?S.installed.length+' installed · $'+P.cost.toFixed(0):'';
  $('#gUps').innerHTML=S.installed.length?S.installed.map(k=>{const u=UPK[k];return u?'<div class="row"><i class="ri ai">'+I((SLOT[u.slot]||[,'cube'])[1])+'</i><span><b>'+esc(u.name)+'</b><small>'+esc(u.brand)+(u.part_number?' · '+esc(u.part_number):'')+'</small></span><button type="button" class="btn sm" data-inst="'+esc(k)+'">Remove</button></div>':'';}).join(''):
    '<p class="empty">Everything is stock. Mark parts "installed" in the Shop or on the 3D build and they show up here.</p>';wireUps($('#gUps'));
  $('#gMaint').innerHTML=D.maintenance.map((m,i)=>{const d=S.maint[m.item];return '<label class="chk"><input type="checkbox" data-m="'+esc(m.item)+'"'+(d?' checked':'')+'><span><b>'+esc(m.item)+'</b><small>'+esc(m.spec)+'</small>'+(d?'<em>Done '+esc(new Date(d).toLocaleDateString())+'</em>':'')+'</span></label>';}).join('');
  $('#gMaint').querySelectorAll('input').forEach(c=>c.onchange=()=>{if(c.checked)S.maint[c.dataset.m]=Date.now();else delete S.maint[c.dataset.m];save();renderGarage();});
  $('#gBuilds').innerHTML=S.builds.length?S.builds.map((b,i)=>'<div class="row"><i class="ri">'+I('save')+'</i><span><b>'+esc(b.name)+'</b><small>'+b.installed.length+' upgrades · '+b.gear.pin+'T/'+b.gear.sp+'T '+b.gear.cells+'S</small></span><button type="button" class="btn sm" data-bl="'+i+'">Load</button><button type="button" class="btn sm" data-bx="'+i+'" aria-label="Delete '+esc(b.name)+'">'+I('x')+'</button></div>').join(''):'<p class="empty">Save a setup to switch between bashing and speed runs.</p>';
  $('#gBuilds').querySelectorAll('[data-bl]').forEach(b=>b.onclick=()=>{const x=S.builds[+b.dataset.bl];S.installed=[...x.installed];S.gear={...x.gear};S.paint={...x.paint};save();applyPaint(look());heroDirty=true;refreshAll();toast('<b>Loaded</b> '+esc(x.name));});
  $('#gBuilds').querySelectorAll('[data-bx]').forEach(b=>b.onclick=()=>{const [x]=S.builds.splice(+b.dataset.bx,1);save();renderGarage();toast('Deleted '+esc(x.name));});}
$('#gSaveF').onsubmit=e=>{e.preventDefault();const n=$('#gSaveN').value.trim()||'Setup '+(S.builds.length+1);S.builds.unshift({name:n,installed:[...S.installed],gear:{...S.gear},paint:{...S.paint}});$('#gSaveN').value='';save();renderGarage();toast('<b>Saved</b> '+esc(n));};

/* ---------- shop ---------- */
function renderShop(){const chips=['all',...Object.keys(SLOT).filter(s=>UP.some(u=>u.slot===s))];
  $('#shopChips').innerHTML=chips.map(c=>'<button type="button" data-f="'+c+'" aria-pressed="'+(S.filter===c)+'">'+(c==='all'?'All':SLOT[c][0])+'</button>').join('');
  $('#shopChips').querySelectorAll('button').forEach(b=>b.onclick=()=>{S.filter=b.dataset.f;save();renderShop();});
  document.querySelectorAll('[data-sort]').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.sort===S.sort);b.onclick=()=>{S.sort=b.dataset.sort;save();renderShop();};});
  $('#shopFits').checked=S.fits;const q=S.q.toLowerCase();
  let L=UP.filter(u=>(S.filter==='all'||u.slot===S.filter)&&(!S.fits||u.fits_stock===true)&&(!q||(u.name+' '+u.part_number+' '+u.brand+' '+u.what_it_changes).toLowerCase().includes(q)));
  const fr=u=>u.fits_stock===true?0:String(u.fits_stock).startsWith('needs')?1:2;
  L.sort(S.sort==='price'?(a,b)=>(+a.approx_price_usd||1e9)-(+b.approx_price_usd||1e9):(a,b)=>fr(a)-fr(b)||(!!b.approx_price_usd-!!a.approx_price_usd));
  $('#shopCount').textContent=L.length+' of '+UP.length;
  $('#shopGrid').innerHTML=L.length?L.map(u=>{const [fk,ft]=fitInfo(u),pr=price(u),k=esc(u.key);return '<article class="prod"><div class="t"><i>'+I((SLOT[u.slot]||[,'cube'])[1])+'</i><div><b>'+esc(u.name)+'</b><small>'+esc(u.brand||'')+(u.part_number?' · #'+esc(u.part_number):'')+'</small></div></div>'+
    '<div style="display:flex;gap:5px;flex-wrap:wrap"><span class="tag '+fk+'">'+esc(ft)+'</span>'+(isInst(u.key)?'<span class="tag vi">On your Jato</span>':'')+'</div><p>'+esc(u.what_it_changes)+'</p>'+
    '<div class="f">'+(pr?'<strong>'+pr+'</strong>':'<strong class="na">Price not listed</strong>')+'<button type="button" class="btn sm '+(inWish(u.key)?'':'pri')+'" data-wish="'+k+'">'+(inWish(u.key)?I('check')+'Saved':I('plus')+'Wishlist')+'</button></div>'+
    '<div class="f"><button type="button" class="btn sm" data-inst="'+k+'">'+(isInst(u.key)?'Remove from build':'Mark installed')+'</button><button type="button" class="btn sm" data-see="'+k+'">'+I('cube')+'See on 3D</button></div><div class="stores">'+stores(u)+'</div></article>';}).join(''):
    '<p class="empty">Nothing matches. Clear the search or untick "Fits stock only".</p>';
  wireUps($('#shopGrid'));$('#shopGrid').querySelectorAll('[data-see]').forEach(b=>b.onclick=()=>{const u=UPK[b.dataset.see];const id=(SLOTPARTS[u.slot]||[])[0];go('build');if(byId[id]){S.ptab='ups';select(byId[id],true);}});
  renderWish();}
$('#shopQ').addEventListener('input',e=>{S.q=e.target.value;renderShop();});$('#shopFits').addEventListener('change',e=>{S.fits=e.target.checked;save();renderShop();});
function renderWish(){const L=S.wish.map(k=>UPK[k]).filter(Boolean);const tot=L.reduce((a,u)=>a+(+u.approx_price_usd||0),0),unk=L.filter(u=>!u.approx_price_usd).length;
  $('#wishN').textContent=L.length?L.length+' item'+(L.length>1?'s':''):'';$('#wishTotal').textContent='$'+tot.toFixed(2).replace(/\.00$/,'');$('#wishUnk').textContent=unk?'+ '+unk+' without a listed price':'';
  $('#wishItems').innerHTML=L.length?L.map(u=>'<div class="wi"><div class="t"><b>'+esc(u.name)+'</b><span>'+(price(u)||'—')+'</span></div><div class="a">'+stores(u)+'</div><div class="a"><button type="button" class="btn sm" data-inst="'+esc(u.key)+'">'+I('check')+'Bought & installed</button><button type="button" class="btn sm" data-wish="'+esc(u.key)+'">Remove</button></div></div>').join(''):
    '<p class="empty">Tap "Wishlist" on any upgrade to plan a build and see the total.</p>';wireUps($('#wishItems'));
  const n=$('#navWish');n.hidden=!L.length;n.textContent=L.length;}

/* ---------- tune ---------- */
function renderTune(){const g=S.gear,m=mph();$('#tMph').textContent=m.toFixed(0);$('#gArc').style.strokeDashoffset=283*(1-Math.min(1,m/80));
  $('#tPin').textContent=g.pin+'T';$('#tSp').textContent=g.sp+'T';const P=perf();$('#tRat').textContent=(g.sp/g.pin).toFixed(2)+':1';$('#tPunch').textContent=P.punch;$('#tHeat').textContent=Math.round(P.heat*100)+'%';
  document.querySelectorAll('#tCells button').forEach(b=>b.setAttribute('aria-checked',+b.dataset.c===g.cells));
  const w=P.heat>1.2?'This runs about '+Math.round((P.heat-1)*100)+'% hotter than stock. Check the motor after each pack: if you cannot hold a finger on it for 5 seconds (about 160°F), gear down.':g.pin>18?'Big pinions can need the motor slid back; set gear mesh with a strip of paper.':'';
  $('#tWarn').textContent=w;$('#tWarn').style.color=w?'var(--warn)':'';
  $('#tNotes').innerHTML=D.maintenance.map(m=>'<div class="chk" style="display:block"><b>'+esc(m.item)+'</b><small>'+esc(m.spec)+'</small></div>').join('');fitCheck();
  $('#bPacks').innerHTML=UP.filter(u=>u.slot==='battery').map(u=>'<div class="row"><i class="ri">'+I('batt')+'</i><span><b>'+esc(u.name)+'</b><small>'+esc(fitInfo(u)[1])+(price(u)?' · '+price(u):'')+'</small></span><button type="button" class="btn sm" data-wish="'+esc(u.key)+'">'+(inWish(u.key)?'Saved':'Wishlist')+'</button></div>').join('');wireUps($('#bPacks'));}
document.querySelectorAll('.step button').forEach(b=>b.onclick=()=>{const k=b.dataset.g;S.gear[k]=Math.max(k==='pin'?11:46,Math.min(k==='pin'?20:54,S.gear[k]+(+b.dataset.d)));save();renderTune();heroDirty=true;});
document.querySelectorAll('#tCells button').forEach(b=>b.onclick=()=>{S.gear.cells=+b.dataset.c;save();renderTune();});
$('#tSave').onclick=()=>{save();toast('<b>Saved</b> '+S.gear.pin+'T / '+S.gear.sp+'T on '+S.gear.cells+'S as your gearing');};
$('#tShop').onclick=()=>{S.filter='gearing';S.fits=false;go('shop');};
function fitCheck(){const L=+$('#bL').value,W=+$('#bW').value,H=+$('#bH').value,v=$('#bV');
  if(!L||!W||!H){v.className='verdict warn';v.textContent='Enter all three sizes.';return;}
  if(L>165||W>50){v.className='verdict bad';v.textContent='Too big: the bay is about 160–165 mm long and 50 mm wide.';}
  else if(L>160){v.className='verdict warn';v.textContent='Tight: 160–165 mm long fits on some trucks. Measure your bay first.';}
  else if(H>47){v.className='verdict warn';v.textContent='Probably too tall: Traxxas 2889X (about 45 mm) is the tallest pack known to fit. Traxxas also sells a taller hold-down (7426X).';}
  else{v.className='verdict ok';v.textContent='Should fit. It is within the 160 × 50 mm bay and no taller than the 2889X pack.';}}
['bL','bW','bH'].forEach(id=>$('#'+id).addEventListener('input',fitCheck));

/* ---------- mechanic ---------- */
const QA={turns:[],sample:null,busy:false};
try{QA.turns=JSON.parse(localStorage.getItem('jato-qa-v1')||'[]').slice(-12);}catch(e){}
const qaSave=()=>{try{localStorage.setItem('jato-qa-v1',JSON.stringify(QA.turns.slice(-12)));}catch(e){}};
function truckFile(){const sp=Object.fromEntries(Object.entries(SP).map(([k,v])=>[k,v&&v.value!==undefined?v.value:v]));
  return JSON.stringify({vehicle:'Traxxas Jato 4X4 VXL 4S (#90386-4), orange, 1/8 4WD buggy, otherwise stock',specs:sp,stock_parts:D.stock_parts.map(p=>({id:p.id,name:p.name,pn:p.traxxas_pn})),
    installed_upgrades:S.installed.map(k=>UPK[k]&&UPK[k].name),wishlist:S.wish.map(k=>UPK[k]&&UPK[k].name),gearing:S.gear,selected_part:S.sel?S.sel.name:null,common_breaks:D.common_breaks.map(b=>b.part+': '+b.symptom+' -> '+b.fix),maintenance:D.maintenance.map(m=>m.item+': '+m.spec)});}
function rules(){return 'You are an experienced RC mechanic helping the owner of ONE Traxxas Jato 4X4 VXL 4S. Use the TRUCK FILE first, then solid Traxxas knowledge. Say plainly when a fact (oil weight, part number, gear ratio) is not confirmed and how to check it. Give beginner-friendly numbered steps, the tools and parts with Traxxas part numbers when known, and safety warnings for LiPo, spinning wheels and hot motors where relevant. Stay on RC topics.\nReply with ONLY one JSON object: {"title":string,"summary":string,"difficulty":"easy"|"medium"|"hard","time":string,"tools":[string],"parts":[{"name":string,"pn":string|null}],"steps":[{"title":string,"detail":string,"warning":string|null}],"tips":[string],"followup":string|null}\n\nTRUCK FILE:\n'+truckFile();}
function offline(q){const w=q.toLowerCase().split(/\W+/).filter(x=>x.length>3);const hit=t=>w.filter(x=>t.toLowerCase().includes(x)).length;
  const br=D.common_breaks.map(b=>[hit(b.part+' '+b.symptom+' '+b.fix),b]).filter(x=>x[0]).sort((a,b)=>b[0]-a[0]).slice(0,3).map(x=>x[1]);
  const mt=D.maintenance.map(m=>[hit(m.item+' '+m.spec),m]).filter(x=>x[0]).slice(0,3).map(x=>x[1]);
  const up=UP.map(u=>[hit(u.name+' '+u.what_it_changes),u]).filter(x=>x[0]).sort((a,b)=>b[0]-a[0]).slice(0,3).map(x=>x[1]);
  if(!br.length&&!mt.length&&!up.length)return null;
  return {title:'From your Jato file',summary:'Live answers are not available in this view, so here is what your Jato file says. Open this page in Claude for full answers.',steps:[...br.map(b=>({title:b.symptom,detail:b.fix})),...mt.map(m=>({title:m.item,detail:m.spec+(m.interval?' · '+m.interval:'')})),...up.map(u=>({title:u.name+(u.part_number?' (#'+u.part_number+')':''),detail:u.what_it_changes}))],tools:[],parts:[],tips:[]};}
function ansHtml(a){return '<article class="ans"><h3>'+esc(a.title||'Answer')+'</h3><div class="meta">'+(a.difficulty?'<span class="tag">'+esc(a.difficulty)+'</span>':'')+(a.time?'<span class="tag">'+esc(a.time)+'</span>':'')+'</div>'+(a.summary?'<p>'+esc(a.summary)+'</p>':'')+
  ((a.tools||[]).length?'<p class="fine"><b>Tools:</b> '+a.tools.map(esc).join(', ')+'</p>':'')+((a.parts||[]).length?'<p class="fine"><b>Parts:</b> '+a.parts.map(x=>esc(x.name)+(x.pn?' #'+esc(x.pn):'')).join(', ')+'</p>':'')+
  '<ol>'+(a.steps||[]).map(s=>'<li><b>'+esc(s.title)+'</b>'+esc(s.detail)+(s.warning?'<div class="w">'+esc(s.warning)+'</div>':'')+'</li>').join('')+'</ol>'+((a.tips||[]).length?'<p class="fine"><b>Tips:</b> '+a.tips.map(esc).join(' · ')+'</p>':'')+
  (a.followup?'<div class="sugg" style="padding:0"><button type="button" data-q="'+esc(a.followup)+'">'+esc(a.followup)+'</button></div>':'')+'</article>';}
function renderMech(){$('#mCtx').textContent='Knows your Jato: stock parts, '+S.installed.length+' installed upgrades, gearing '+S.gear.pin+'T/'+S.gear.sp+'T'+(S.sel?', and that you were looking at the '+S.sel.name:'')+'.';
  $('#mLog').innerHTML=QA.turns.length?QA.turns.map(t=>'<div class="q">'+esc(t.q)+'</div>'+(t.a?ansHtml(t.a):t.err?'<p class="err">'+esc(t.err)+'</p>':'<p class="wait">Thinking it through…</p>')).join(''):'<p class="empty">Ask anything about your Jato: a repair, gearing, which battery fits, what to upgrade first. Answers come as numbered steps with the parts and tools.</p>';
  $('#mLog').querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>ask(b.dataset.q));$('#mLog').scrollTop=1e9;
  const sg=(S.sel?['How do I replace the '+S.sel.name+'?']:[]).concat(['What should I upgrade first for bashing?','Which 4S batteries fit the Jato?','How do I set gear mesh on the Jato?','My Jato pulls to one side. What do I check?']);
  $('#mSugg').innerHTML=sg.slice(0,4).map(q=>'<button type="button">'+esc(q)+'</button>').join('');$('#mSugg').querySelectorAll('button').forEach(b=>b.onclick=()=>ask(b.textContent));
  $('#mBreaks').innerHTML=D.common_breaks.map(b=>'<button type="button" class="row" data-b="'+esc(b.part)+'"><i class="ri">'+I('wrench')+'</i><span><b>'+esc(b.part)+'</b><small>'+esc(b.symptom)+'</small></span></button>').join('');
  $('#mBreaks').querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>ask('How do I fix this on my Jato: '+b.dataset.b+' — '+b.querySelector('small').textContent+'?'));}
async function ask(q){q=(q||'').trim();if(!q||QA.busy)return;if(S.screen!=='mech')go('mech');const t={q};QA.turns.push(t);$('#mIn').value='';renderMech();
  if(!QA.sample){const a=offline(q);if(a)t.a=a;else t.err='Live answers are not available in this view. Open this page in Claude to ask, or check Common problems on the right.';qaSave();renderMech();return;}
  QA.busy=true;try{const hist=[];QA.turns.slice(0,-1).filter(x=>x.a).slice(-3).forEach(x=>{hist.push({role:'user',content:x.q});hist.push({role:'assistant',content:JSON.stringify(x.a)});});
    const a=await QA.sample.json([{role:'user',content:rules()},{role:'assistant',content:'{"title":"Ready","summary":"Ask your question.","steps":[]}'},...hist,{role:'user',content:q}],{cache:false});
    if(!a||!Array.isArray(a.steps))throw {code:'invalid'};t.a=a;}
  catch(e){const c=e&&e.code;if(c==='not_granted'||c==='capability_disabled'){QA.sample=null;const a=offline(q);if(a)t.a=a;else t.err='Claude is not allowed for this page, so live answers are off.';}
    else if(c==='rate_limited')t.err='Too many questions in a short time. Wait a minute, then ask again.';else t.err='The answer did not come through. Ask again.';}
  finally{QA.busy=false;qaSave();renderMech();}}
$('#mForm').onsubmit=e=>{e.preventDefault();ask($('#mIn').value);};
$('#mIn').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask($('#mIn').value);}});
(async()=>{try{const s=window.claude&&await window.claude.use('sample');QA.sample=s||null;}catch(e){QA.sample=null;}$('#mMode').textContent=QA.sample?'Live answers from Claude':'Offline: answers from your Jato file';})();

/* ---------- start ---------- */
function refreshAll(){renderCats();renderCtx();if(S.screen==='garage')renderGarage();if(S.screen==='shop')renderShop();if(S.screen==='tune')renderTune();renderWish();heroDirty=true;}
applyPaint(look());setBody(S.body||'on');resize();setView('iso');camera.position.copy(fly.p1);controls.target.copy(fly.c1);fly=null;
$('#loading').remove();renderCats();renderCtx();renderWish();dockSync();go(S.screen||'garage');requestAnimationFrame(frame);
