/* ================= Upgrades (Forza-style) =================
   Category tiles -> part types -> option cards (Stock / Street / Sport / Race). Previewing an option shows green/red
   deltas on the stat bars and the class + RC PI change before you install. Quick Upgrade climbs to a target class.
   RC PI is this app's own estimate (100-999), not a Traxxas number. */
const TIER={stock:['Stock','#8C9AB3'],spare:['Stock spare','#8C9AB3'],street:['Street','#22C55E'],sport:['Sport','#00B8FF'],race:['Race','#A855F7']};
const CLASSES=[['E',300,'#8C9AB3'],['D',400,'#3fd6c6'],['C',500,'#f2d21a'],['B',600,'#ff9a1f'],['A',700,'#ff4d4d'],['S',800,'#b06cff'],['R',900,'#3f8cff'],['P',998,'#ff5fb8'],['X',999,'#22C55E']];
const clsOf=pi=>CLASSES.find(c=>pi<=c[1])||CLASSES[CLASSES.length-1];
function grpOf(u){const n=u.name.toLowerCase(),s=u.slot;
  if(s==='tires_wheels')return 'tires';if(s==='gearing')return /spur/.test(n)?'spur':'pinion';
  if(s==='power'){if(/power system/.test(n))return 'power';if(/fan/.test(n))return null;if(/esc/.test(n))return 'esc';return 'motor';}
  if(s==='battery')return /charger/.test(n)?null:'battery';if(s==='servo')return 'servo';
  if(s==='suspension'){if(/spring/.test(n))return 'springs';if(/oil/.test(n))return 'shockoil';if(/caster/.test(n))return 'caster';if(/steering block/.test(n))return 'steerblk';if(/stub axle|carrier/.test(n))return 'carrier';
    if(/brace/.test(n))return 'brace';if(/camber/.test(n))return 'camber';if(/tower/.test(n))return 'tower';if(/arm/.test(n))return 'arms';if(/shock/.test(n))return 'shocks';return null;}
  if(s==='driveline'){if(/front driveshaft/.test(n))return 'dsF';if(/rear driveshaft/.test(n))return 'dsR';if(/centre driveshaft|center cvd/.test(n))return 'cds';if(/centre differential/.test(n))return 'cdiff';return null;}
  if(s==='body_aero')return /wing/.test(n)?'wing':'body';return null;}
/* estimated effect of each part on the six stats (0-10 scale) */
function fxOf(u){const n=(u.name+' '+u.part_number).toLowerCase(),g=u.grp;const f={};const a=(k,v)=>f[k]=(f[k]||0)+v;
  if(g==='tires'){if(/belted/.test(n)){a('offroad',1.2);a('speed',0.2);a('durability',0.4);a('handling',-0.2);}else if(/sledgehammer/.test(n)){a('offroad',1.0);a('handling',-0.1);}else if(/badlands/.test(n)){a('offroad',1.5);a('launch',0.3);a('handling',-0.4);}}
  if(/fan kit/.test(n))a('durability',0.4);
  if(g==='servo'){if(/2255|400/.test(n)){a('handling',0.5);a('durability',0.1);}else if(/2275|347/.test(n)){a('handling',0.45);a('durability',0.2);}else if(/2250|330/.test(n))a('handling',0.3);else a('handling',0.35);}
  if(g==='shocks'){a('handling',0.5);a('durability',0.3);a('offroad',0.3);}if(g==='springs')a('handling',0.3);if(g==='shockoil'&&/60/.test(n)){a('handling',0.2);a('offroad',-0.2);}
  if(['caster','steerblk','carrier'].includes(g)){a('durability',0.6);a('handling',0.15);}if(g==='brace')a('durability',0.5);if(g==='camber'){a('handling',0.2);a('durability',0.2);}if(g==='tower')a('durability',0.6);
  if(g==='cds')a('durability',/4140|makx/.test(n)?0.6:0.2);if(/differential oil/.test(n))a('handling',0.2);if(/tie bar/.test(n))a('durability',0.3);if(/7075/.test(n)&&/hold-down/.test(n))a('durability',0.2);
  if(g==='wing'&&/low-profile/.test(n)){a('speed',0.2);a('handling',-0.1);}
  return f;}
function tierOf(u){const n=(u.name+' '+u.brand).toLowerCase(),fx=u.fx;if(!Object.keys(fx).length&&!/pinion|spur/.test(n))return 'spare';
  if(/7075|hard-anodised|brushless|4140|gpm|pnw|400/.test(n))return 'race';if(/aluminium|6061|belted|330|347|steel|hardened/.test(n))return 'sport';return 'street';}
UP.forEach(u=>{u.grp=grpOf(u);u.fx=fxOf(u);u.tier=tierOf(u);});
const EXCL={power:['motor','esc'],motor:['power'],esc:['power']};
const UCATS=[
  {id:'power',name:'Power',ic:'bolt',sub:'Motor · ESC · battery',slots:[['motor','Motor','motor'],['esc','ESC','esc'],['power','Motor + ESC combo','motor'],['battery','Battery','battery']],acc:['power','battery']},
  {id:'gearing',name:'Gearing',ic:'gear',sub:'Pinion · spur',slots:[['pinion','Pinion','pinion'],['spur','Spur gear','spur']]},
  {id:'drive',name:'Drivetrain',ic:'shaft',sub:'Driveshafts · diffs',slots:[['dsF','Front driveshafts','driveshaft_front'],['dsR','Rear driveshafts','driveshaft_rear'],['cds','Centre driveshaft','center_driveshaft'],['cdiff','Centre diff','center_diff']],acc:['driveline']},
  {id:'platform',name:'Platform & Handling',ic:'spring',sub:'Shocks · blocks · servo',slots:[['shocks','Shocks','shocks'],['springs','Springs','shocks'],['shockoil','Shock oil','shocks'],['caster','Caster blocks','caster_blocks'],['steerblk','Steering blocks','steering_blocks'],['carrier','Rear hub carriers','hub_carriers'],['arms','Suspension arms','suspension_arms'],['camber','Camber links','shock_tower_front'],['tower','Front shock tower','shock_tower_front'],['brace','Tower brace','shock_tower_front'],['servo','Steering servo','servo']],acc:['suspension']},
  {id:'tires',name:'Tires & Wheels',ic:'tire',sub:'Tread · compound · colour',slots:[['tires','Wheels & tyres','wheels_tires']]},
  {id:'aero',name:'Aero & Body',ic:'car',sub:'Shell · wing · lights',slots:[['body','Body shell','body'],['wing','Wing','wing']],acc:['body_aero','lights']},
  {id:'armor',name:'Durability',ic:'shield',sub:'Braces · hold-downs',slots:[],acc:['armor_durability']},
  {id:'elec',name:'Electronics',ic:'chip',sub:'Telemetry · sensors',slots:[],acc:['electronics_telemetry']}];
UCATS.forEach(c=>{c.slots=c.slots.filter(([g])=>UP.some(u=>u.grp===g));const accItems=UP.filter(u=>!u.grp&&(c.acc||[]).includes(u.slot));if(accItems.length)c.slots.push(['acc:'+c.id,'Add-ons & accessories',(c.slots[0]||[])[2]||'esc']);});
const STOCKNAME={motor:'Velineon 540XL 2400 kV',esc:'Velineon VXL-4s',power:'Stock motor + ESC',battery:'Your own 4S pack',pinion:'14T steel pinion',spur:'50T steel spur',dsF:'Extreme HD CVDs',dsR:'Extreme HD CVDs',cds:'Stock centre shafts',cdiff:'Torque-Biasing Center Drive',
  shocks:'GTR XX-Long (orange)',springs:'Stock GTR springs',shockoil:'50 wt front / 60 wt rear',caster:'Gray aluminium',steerblk:'Gray aluminium',carrier:'Gray aluminium',arms:'Stock arms',camber:'Stock camber links',tower:'Gray aluminium tower',brace:'No brace',servo:'2075X digital',tires:'Response Pro S1, black dished',body:'Orange 9060-ORNG',wing:'Stock wing 9517'};

/* ---------- stats ---------- */
const BASE={speed:0,accel:6.6,handling:5.6,launch:6.2,offroad:6.0,durability:5.0};
const SLABEL={speed:'Speed',accel:'Acceleration',handling:'Handling',launch:'Launch',offroad:'Off-road',durability:'Durability'};
const WEIGHT={speed:.27,accel:.22,handling:.22,launch:.1,offroad:.1,durability:.09};
function gearFor(inst,base){const g={...(base||S.gear)};inst.forEach(k=>{const u=UPK[k];if(!u)return;const m=/Pinion (\d+)T/i.exec(u.name);if(m)g.pin=+m[1];const m2=/Spur gear (\d+)T/i.exec(u.name);if(m2)g.sp=+m2[1];});return g;}
function statsFor(inst,gear){gear=gear||S.gear;const r=gear.sp/gear.pin,r0=50/14,cv=gear.cells/4;const st={...BASE};
  const m=mph(gear);st.speed=m/9.6;st.accel=BASE.accel*Math.pow(r/r0,0.5)*Math.pow(cv,0.8);st.launch=BASE.launch*Math.pow(r/r0,0.6)*Math.pow(cv,0.5);
  inst.forEach(k=>{const u=UPK[k];if(u)Object.entries(u.fx).forEach(([s,v])=>st[s]+=v);});
  Object.keys(st).forEach(k=>st[k]=Math.max(0,Math.min(10,st[k])));
  const avg=Object.entries(WEIGHT).reduce((a,[k,w])=>a+st[k]*w,0);const pi=Math.round(Math.min(999,100+Math.pow(avg/10,1.2)*899));
  const heat=Math.pow(cv,1.6)*(r0/r);const cost=inst.reduce((a,k)=>a+(+(UPK[k]||{}).approx_price_usd||0),0);
  return {st,pi,cls:clsOf(pi),mph:m,heat,cost,ratio:r,minutes:5/(22*heat)*60*0.85};}
function withOpt(inst,u){let L=inst.filter(k=>{const x=UPK[k];if(!x||!u)return true;if(u.grp&&(x.grp===u.grp||(EXCL[u.grp]||[]).includes(x.grp)))return false;return true;});if(u&&!L.includes(u.key))L.push(u.key);return L;}
function withStock(inst,grp){return inst.filter(k=>{const x=UPK[k];return !(x&&(x.grp===grp||(EXCL[grp]||[]).includes(x.grp)));});}
function gearOf(inst){const g={...S.gear};const had=gp=>S.installed.some(k=>UPK[k]&&UPK[k].grp===gp),has=gp=>inst.some(k=>UPK[k]&&UPK[k].grp===gp);
  if(had('pinion')&&!has('pinion'))g.pin=14;if(had('spur')&&!has('spur'))g.sp=50;return gearFor(inst,g);}

/* ---------- sound (off until the viewer turns it on) ---------- */
let AC=null;let SND=(()=>{try{return localStorage.getItem('jato-snd')==='1';}catch(e){return false;}})();
function blip(f,d,v,type){if(!SND)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.value=f;g.gain.value=v||0.03;
  o.connect(g);g.connect(AC.destination);const t=AC.currentTime;g.gain.setValueAtTime(v||0.03,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.start(t);o.stop(t+d);}catch(e){}}
const tick=()=>blip(1800,0.04,0.015,'square'),chime=()=>{blip(660,0.18,0.05);setTimeout(()=>blip(990,0.28,0.05),110);};

/* ---------- screen ---------- */
const U={cat:null,slot:null,opt:null,quick:null};
function piBadge(x,big){const c=x.cls;return '<span class="pib'+(big?' big':'')+'" style="--cc:'+c[2]+'"><b>'+c[0]+'</b><i>'+x.pi+'</i></span>';}
function renderUp(){const cur=statsFor(S.installed,S.gear);
  const left=$('#upLeft');
  if(!U.cat){left.innerHTML='<div class="uhead"><h2>Upgrades</h2><button type="button" class="btn ai sm" id="upQuickBtn">'+I('bolt')+'Quick upgrade</button></div>'+
      '<div class="utiles">'+UCATS.map(c=>{const n=S.installed.filter(k=>{const u=UPK[k];return u&&c.slots.some(([g])=>g===u.grp||(g==='acc:'+c.id&&!u.grp&&(c.acc||[]).includes(u.slot)));}).length;
        return '<button type="button" class="utile" data-c="'+c.id+'"><i>'+I(c.ic)+'</i><span><b>'+c.name+'</b><small>'+c.sub+'</small></span>'+(n?'<em>'+n+'</em>':'')+'</button>';}).join('')+'</div>';
    left.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{tick();U.cat=b.dataset.c;U.slot=null;U.opt=null;U.quick=null;renderUp();});$('#upQuickBtn').onclick=()=>{tick();U.quick={target:null,focus:'balanced'};U.cat=null;renderUp();};}
  else{const c=UCATS.find(x=>x.id===U.cat);
    left.innerHTML='<div class="uhead"><button type="button" class="btn sm" id="upBack" aria-label="Back to categories">'+I('x')+'</button><h2>'+c.name+'</h2></div><div class="uslots">'+c.slots.map(([g,n])=>{const cur1=curOpt(g);
      return '<button type="button" class="uslot" data-g="'+g+'" aria-current="'+(U.slot===g)+'"><span><b>'+n+'</b><small>'+esc(cur1)+'</small></span>'+(g.startsWith('acc:')?'':'<i class="tierdot" style="--tc:'+TIER[curTier(g)][1]+'"></i>')+'</button>';}).join('')+'</div>';
    $('#upBack').onclick=()=>{tick();U.cat=null;U.slot=null;U.opt=null;previewLook(null);setBody('on');S.sel=null;highlight();setView('iso');renderUp();};
    left.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>openSlot(b.dataset.g));}
  renderCards();renderStats(cur,U.opt?statsFor(U.opt.inst,U.opt.gear):null);$('#upSnd').setAttribute('aria-pressed',SND);}
function curOpt(g){if(g.startsWith('acc:')){const c=UCATS.find(x=>'acc:'+x.id===g);const n=S.installed.filter(k=>{const u=UPK[k];return u&&!u.grp&&(c.acc||[]).includes(u.slot);}).length;return n?n+' fitted':'None fitted';}
  const k=S.installed.find(k=>UPK[k]&&UPK[k].grp===g);if(k)return UPK[k].name;if(EXCL[g]&&S.installed.some(k=>UPK[k]&&EXCL[g].includes(UPK[k].grp)))return 'Replaced by '+(g==='power'?'separate parts':'the combo');return 'Stock · '+(STOCKNAME[g]||'');}
function curTier(g){const k=S.installed.find(k=>UPK[k]&&UPK[k].grp===g);return k?UPK[k].tier:'stock';}
function openSlot(g){tick();U.slot=g;U.opt=null;U.quick=null;const c=UCATS.find(x=>x.id===U.cat);const s=c.slots.find(x=>x[0]===g);const p=byId[s[2]];if(p){S.sel=p;highlight();upFocus(p);}renderUp();}
function upFocus(p){const inside=!['body','wing','wing_mounts','wheels_tires','wheel_hex','bumpers'].includes(p.id);setBody(inside?'ghost':'on');
  const b=new THREE.Box3().setFromObject(p.g);const c=b.getCenter(V(0,0,0));const dir=camera.position.clone().sub(controls.target).normalize();dir.y=Math.max(dir.y,0.35);flyTo(c.lerp(V(0,60,0),0.5),dir,Math.max(560,b.getSize(V(0,0,0)).length()*2.6));}
function optionsFor(g){if(g.startsWith('acc:')){const c=UCATS.find(x=>'acc:'+x.id===g);return UP.filter(u=>!u.grp&&(c.acc||[]).includes(u.slot));}return UP.filter(u=>u.grp===g);}
function renderCards(){const el=$('#upCards'),hd=$('#upCardsH');el.classList.toggle('quick',!!U.quick);
  if(U.quick){hd.innerHTML='<b>Quick upgrade</b><small>Pick a target class. Only parts that fit a stock Jato are used.</small>';el.innerHTML=quickHtml();wireQuick(el);return;}
  if(!U.slot){hd.innerHTML='<b>'+(U.cat?'Choose a part type':'Choose a category')+'</b><small>'+(U.cat?'Each part shows Stock, Street, Sport and Race options.':'Or tap a part on the buggy.')+'</small>';el.innerHTML='';return;}
  const g=U.slot,acc=g.startsWith('acc:'),opts=optionsFor(g);const c=UCATS.find(x=>x.id===U.cat);const nm=(c.slots.find(x=>x[0]===g)||[,''])[1];
  hd.innerHTML='<b>'+esc(nm)+'</b><small>'+(acc?'Add-ons stack: fit as many as you like.':'One option fits at a time. Preview, then install.')+'</small>';
  const cur=statsFor(S.installed,S.gear);let h='';
  if(!acc){const isStock=!S.installed.some(k=>UPK[k]&&(UPK[k].grp===g||(EXCL[g]||[]).includes(UPK[k].grp)));
    h+='<button type="button" class="ucard'+(isStock?' inst':'')+'" data-k="__stock" style="--tc:'+TIER.stock[1]+'"><span class="tier">Stock</span><b>'+esc(STOCKNAME[g]||'Stock part')+'</b><small>Comes on your Jato</small><span class="uf">'+(isStock?'<em>'+I('check')+'Installed</em>':'<span>Free</span>')+'</span></button>';}
  opts.forEach(u=>{const on=isInst(u.key),[fk,ft]=fitInfo(u),pr=price(u);const nx=statsFor(withOpt(S.installed,u),gearOf(withOpt(S.installed,u)));const d=nx.pi-cur.pi;
    h+='<button type="button" class="ucard'+(on?' inst':'')+(u.fits_stock===false?' nofit':'')+'" data-k="'+esc(u.key)+'" style="--tc:'+TIER[u.tier][1]+'"><span class="tier">'+TIER[u.tier][0]+'</span><b>'+esc(u.name)+'</b><small>'+esc(u.brand||'')+(u.part_number?' · #'+esc(u.part_number):'')+'</small>'+
      '<span class="ufit tag '+fk+'">'+esc(ft)+'</span><span class="uf">'+(on?'<em>'+I('check')+'Installed</em>':'<span>'+(pr||'Price n/a')+'</span>')+(d?'<i class="'+(d>0?'up':'dn')+'">'+(d>0?'+':'')+d+' PI</i>':'')+'</span></button>';});
  el.innerHTML=h;
  el.querySelectorAll('.ucard').forEach(b=>{const pv=()=>{const k=b.dataset.k;const u=k==='__stock'?null:UPK[k];
      const inst=k==='__stock'?withStock(S.installed,g):acc?(isInst(k)?S.installed.filter(x=>x!==k):[...S.installed,k]):withOpt(S.installed,u);
      U.opt={k,inst,gear:gearOf(inst)};el.querySelectorAll('.ucard').forEach(x=>x.classList.toggle('pv',x===b));renderStats(statsFor(S.installed,S.gear),statsFor(inst,U.opt.gear));previewLook(inst);detail(u,g);};
    b.onmouseenter=()=>{if(matchMedia('(hover:hover)').matches){tick();pv();}};b.onfocus=pv;b.onclick=()=>{pv();};});
  if(!U.opt){const first=el.querySelector('.ucard.inst')||el.querySelector('.ucard');first&&first.focus({preventScroll:true});}}
function detail(u,g){const D2=$('#upDetail');if(!u){D2.innerHTML='<p class="fine">The part your Jato came with.</p>'+(U.opt.k==='__stock'&&S.installed.some(k=>UPK[k]&&(UPK[k].grp===g||(EXCL[g]||[]).includes(UPK[k].grp)))?'<button type="button" class="btn pri" id="upGo">'+I('check')+'Back to stock</button>':'');wireGo();return;}
  const on=isInst(u.key);D2.innerHTML='<p class="fine" style="color:#d4dceb">'+esc(u.what_it_changes)+'</p>'+(u.requires&&u.requires.length?'<p class="fine">Needs: '+esc(u.requires.join(', '))+'</p>':'')+
    '<div class="a" style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn pri" id="upGo"'+(u.fits_stock===false?' disabled':'')+'>'+(on?'Remove':I('check')+'Install')+'</button><button type="button" class="btn" id="upWish">'+(inWish(u.key)?'In wishlist':I('plus')+'Wishlist')+'</button>'+stores(u)+'</div>';
  $('#upWish').onclick=()=>{toggleWish(u.key);detail(u,g);};wireGo();}
function wireGo(){const b=$('#upGo');if(!b)return;b.onclick=()=>commit();}
function commit(){if(!U.opt)return;const before=statsFor(S.installed,S.gear);const k=U.opt.k;
  S.installed=U.opt.inst.slice();S.gear={...S.gear,...U.opt.gear};save();applyPaint(look());const after=statsFor(S.installed,S.gear);
  const u=UPK[k];banner(u?(isInst(k)?'Installed':'Removed'):'Back to stock',u?u.name:STOCKNAME[U.slot]||'',before,after);chime();U.opt=null;refreshAll();renderUp();}
function banner(t,n,b,a){const el=$('#upBanner');el.innerHTML='<span class="bt">'+esc(t)+'</span><b>'+esc(n)+'</b><span class="bpi">'+piBadge(b)+'<span class="arr">→</span>'+piBadge(a,true)+'</span>'+(b.cls[0]!==a.cls[0]?'<span class="bcls" style="color:'+a.cls[2]+'">Class '+a.cls[0]+'!</span>':'');
  el.hidden=false;el.classList.remove('go');void el.offsetWidth;el.classList.add('go');clearTimeout(banner.t);banner.t=setTimeout(()=>el.hidden=true,2600);}
function previewLook(inst){const P={};(inst||S.installed).forEach(k=>Object.assign(P,PATCH[k]||{}));applyPaint(Object.assign({},PAINT_DEF,P,S.paint));}
function renderStats(cur,pv){const show=pv||cur;const R=$('#upRight');const d=pv?pv.pi-cur.pi:0;
  let h='<div class="upi">'+piBadge(show,true)+'<div><small>RC Performance Index</small><span class="'+(d>0?'up':d<0?'dn':'')+'">'+(pv&&d?(d>0?'▲ ':'▼ ')+Math.abs(d)+' from '+cur.cls[0]+' '+cur.pi:'Your Jato now')+'</span></div></div>';
  h+='<div class="ubars">'+Object.keys(SLABEL).map(k=>{const a=cur.st[k],b=show.st[k],lo=Math.min(a,b),hi=Math.max(a,b);const dd=Math.round((b-a)*10)/10;
    return '<div class="ubar"><span>'+SLABEL[k]+'</span><i><b class="f" style="width:'+lo*10+'%"></b>'+(b>a?'<b class="g" style="left:'+a*10+'%;width:'+(b-a)*10+'%"></b>':b<a?'<b class="r" style="left:'+b*10+'%;width:'+(a-b)*10+'%"></b>':'')+'</i><em class="'+(dd>0?'up':dd<0?'dn':'')+'">'+b.toFixed(1)+'</em></div>';}).join('')+'</div>';
  const num=(l,a,b,f,u,good)=>{const ch=Math.abs(b-a)>0.05;return '<div><small>'+l+'</small><b>'+f(b)+'<u>'+u+'</u></b>'+(ch?'<em class="'+((b>a)===good?'up':'dn')+'">'+(b>a?'▲':'▼')+f(Math.abs(b-a))+'</em>':'')+'</div>';};
  h+='<div class="unums">'+num('Top speed',cur.mph,show.mph,x=>x.toFixed(0),' mph',true)+num('Gear ratio',cur.ratio,show.ratio,x=>x.toFixed(2),':1',true)+num('Motor heat',cur.heat*100,show.heat*100,x=>x.toFixed(0),'%',false)+num('Build cost',cur.cost,show.cost,x=>'$'+x.toFixed(0),'',false)+'</div>'+
    '<p class="fine">RC PI blends speed, acceleration, handling, launch, off-road and durability. It is this app\'s estimate to compare builds, not a lap time.</p>';
  R.innerHTML=h;}
/* quick upgrade */
function quickHtml(){const cur=statsFor(S.installed,S.gear);const ci=CLASSES.findIndex(c=>c[0]===cur.cls[0]);const tgts=CLASSES.slice(ci,ci+3);
  const q=U.quick;if(!q.target)q.target=(CLASSES[ci+1]||CLASSES[ci])[0];const plan=quickPlan(q.target,q.focus);
  return '<div class="uq"><div class="seg" role="radiogroup" aria-label="Target class">'+tgts.map(c=>'<button type="button" role="radio" data-t="'+c[0]+'" aria-checked="'+(q.target===c[0])+'" style="color:'+c[2]+'">Class '+c[0]+'</button>').join('')+'</div>'+
    '<div class="seg" role="radiogroup" aria-label="Focus">'+[['balanced','Balanced'],['speed','Speed'],['bash','Bashing']].map(([k,l])=>'<button type="button" role="radio" data-f="'+k+'" aria-checked="'+(q.focus===k)+'">'+l+'</button>').join('')+'</div></div>'+
    (plan.keys.length?'<div class="uqlist">'+plan.keys.map(k=>{const u=UPK[k];return '<div class="ucard inst" style="--tc:'+TIER[u.tier][1]+'"><span class="tier">'+TIER[u.tier][0]+'</span><b>'+esc(u.name)+'</b><small>'+esc(u.brand||'')+(u.part_number?' · #'+esc(u.part_number):'')+'</small><span class="uf"><span>'+(price(u)||'Price n/a')+'</span></span></div>';}).join('')+'</div>'+
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn pri" id="uqGo">'+I('check')+'Install all '+plan.keys.length+'</button><span class="fine">'+piBadge(cur)+' → '+piBadge(plan.after,true)+' · ≈ $'+plan.cost.toFixed(0)+(plan.unk?' + '+plan.unk+' unpriced':'')+(plan.reached?'':' · the stock-fit parts can\'t quite reach Class '+q.target)+'</span></div>':
      '<p class="fine">Nothing to add: your build is already at Class '+q.target+' for this focus.</p>');}
function quickPlan(target,focus){const want=CLASSES.find(c=>c[0]===target);const minPi=(CLASSES[CLASSES.indexOf(want)-1]||[0,99])[1]+1;let inst=S.installed.slice(),gear={...S.gear};const added=[];
  const wf=focus==='speed'?{speed:2,accel:1.4}:focus==='bash'?{durability:2,offroad:1.8}:{};
  for(let it=0;it<20&&statsFor(inst,gear).pi<minPi;it++){let best=null,bs=0;const base=statsFor(inst,gear);
    UP.forEach(u=>{if(u.fits_stock!==true||inst.includes(u.key))return;if(u.grp==='pinion'){const t=+(/(\d+)T/.exec(u.name)||[])[1];if(!t||t>17)return;}
      const ni=u.grp?withOpt(inst,u):[...inst,u.key];const g=gearOf(ni);const s=statsFor(ni,g);if(s.heat>1.3)return;
      let sc=s.pi-base.pi;Object.entries(wf).forEach(([k,w])=>sc+=(s.st[k]-base.st[k])*10*(w-1));sc/=Math.max(15,+u.approx_price_usd||30)/30;if(sc>bs){bs=sc;best={u,ni,g};}});
    if(!best)break;inst=best.ni;gear=best.g;added.push(best.u.key);}
  const keys=added.filter(k=>inst.includes(k));const after=statsFor(inst,gear);
  return {keys,inst,gear,after,reached:after.pi>=minPi,cost:keys.reduce((a,k)=>a+(+UPK[k].approx_price_usd||0),0),unk:keys.filter(k=>!UPK[k].approx_price_usd).length};}
function wireQuick(el){el.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tick();U.quick.target=b.dataset.t;renderCards();prevQuick();});el.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{tick();U.quick.focus=b.dataset.f;renderCards();prevQuick();});
  const g=$('#uqGo');if(g)g.onclick=()=>{const p=quickPlan(U.quick.target,U.quick.focus);const before=statsFor(S.installed,S.gear);S.installed=p.inst;S.gear={...p.gear};save();applyPaint(look());chime();
    banner('Quick upgrade',p.keys.length+' parts installed',before,statsFor(S.installed,S.gear));U.quick=null;refreshAll();renderUp();};prevQuick();}
function prevQuick(){const p=quickPlan(U.quick.target,U.quick.focus);renderStats(statsFor(S.installed,S.gear),p.keys.length?p.after:null);previewLook(p.inst);$('#upDetail').innerHTML='';}
/* picking a part on the buggy jumps to its upgrades */
function upPick(p){if(!p)return;for(const c of UCATS){const s=c.slots.find(x=>x[2]===p.id&&!x[0].startsWith('acc:'));if(s){U.cat=c.id;U.quick=null;openSlot(s[0]);return;}}toast('<b>'+esc(p.name)+'</b> has no upgrades listed yet');}
/* keyboard: arrows move, Enter installs, Escape goes back */
document.addEventListener('keydown',e=>{if(S.screen!=='up'||/input|textarea/i.test(e.target.tagName))return;const cards=[...document.querySelectorAll('#upCards .ucard[data-k]')];const i=cards.indexOf(document.activeElement);
  if((e.key==='ArrowRight'||e.key==='ArrowLeft')&&cards.length){e.preventDefault();const n=cards[(Math.max(0,i)+(e.key==='ArrowRight'?1:cards.length-1))%cards.length];n.focus();tick();}
  else if(e.key==='Enter'&&i>=0){e.preventDefault();commit();}else if(e.key==='Escape'){if(U.slot){U.slot=null;U.opt=null;previewLook(null);renderUp();}else if(U.cat||U.quick){U.cat=null;U.quick=null;renderUp();}}});
$('#upSnd').onclick=()=>{SND=!SND;try{localStorage.setItem('jato-snd',SND?'1':'0');}catch(e){}$('#upSnd').setAttribute('aria-pressed',SND);if(SND)chime();};
$('#upStore').onclick=()=>go('shop');


/* ================= Tuning (Forza-style sliders) ================= */
const TUNE=[
 {k:'oilF',g:'Damping',n:'Front shock oil',min:20,max:80,step:5,stock:50,fmt:v=>v+' wt',lo:'Thinner',hi:'Thicker',tip:(v,s)=>v>s?'Thicker: calmer landings and less dive; slower over fast small bumps.':v<s?'Thinner: soaks up chatter; front bounces more off big jumps.':'Stock front oil.',fx:(v,s)=>({land:(v-s)/30,bump:-(v-s)/30,steer:(v-s)/60})},
 {k:'oilR',g:'Damping',n:'Rear shock oil',min:20,max:80,step:5,stock:60,fmt:v=>v+' wt',lo:'Thinner',hi:'Thicker',tip:(v,s)=>v>s?'Thicker: stays flat on landings; can skip over washboard.':v<s?'Thinner: more rear grip on rough ground; squats more under power.':'Stock rear oil.',fx:(v,s)=>({land:(v-s)/30,bump:-(v-s)/30,trac:-(v-s)/60})},
 {k:'sprF',g:'Springs',n:'Front springs',min:1,max:5,step:1,stock:3,fmt:v=>['Softest','Soft','Stock','Stiff','Stiffest'][v-1],lo:'Soft',hi:'Stiff',tip:(v,s)=>v>s?'Stiffer: sharper turn-in on smooth ground; less front grip on bumps.':v<s?'Softer: more front grip on loose dirt; more body roll.':'Stock GTR springs.',fx:(v,s)=>({steer:(v-s)/3,bump:-(v-s)/3,land:(v-s)/5})},
 {k:'sprR',g:'Springs',n:'Rear springs',min:1,max:5,step:1,stock:3,fmt:v=>['Softest','Soft','Stock','Stiff','Stiffest'][v-1],lo:'Soft',hi:'Stiff',tip:(v,s)=>v>s?'Stiffer: rotates more in corners; less rear grip on rough ground.':v<s?'Softer: more rear traction and stability; slower to turn.':'Stock GTR springs.',fx:(v,s)=>({steer:(v-s)/4,trac:-(v-s)/3})},
 {k:'diffF',g:'Differentials',n:'Front diff oil',min:5,max:100,step:5,stock:30,fmt:v=>v+'K',lo:'Thinner',hi:'Thicker',tip:(v,s)=>v>s?'Thicker: front pulls harder out of corners; less steering off throttle.':v<s?'Thinner: more steering into corners; front wheel spins more on power.':'About stock (reported 30K).',fx:(v,s)=>({steer:-(v-s)/90,trac:(v-s)/90})},
 {k:'diffR',g:'Differentials',n:'Rear diff',min:0,max:100,step:5,stock:0,fmt:v=>v?v+'K oil':'Grease (stock)',lo:'Free',hi:'Locked',tip:(v,s)=>v>s?'Oil instead of grease: rear drives straighter under power and holds a line; pushes wide when tight.':'Stock grease fill: rear rotates easily.',fx:(v,s)=>({trac:(v-s)/120,steer:-(v-s)/200})},
 {k:'camF',g:'Alignment',n:'Front camber',min:-4,max:0,step:0.5,stock:-1,fmt:v=>v.toFixed(1)+'°',lo:'More',hi:'Less',tip:(v,s)=>v<s?'More negative: more corner grip on pavement; tyres wear on the inside.':v>s?'Less: straighter-line grip, more even wear.':'Typical starting point.',fx:(v,s)=>({steer:-(v-s)/3})},
 {k:'toeR',g:'Alignment',n:'Rear toe-in',min:0,max:4,step:0.5,stock:2,fmt:v=>v.toFixed(1)+'°',lo:'Less',hi:'More',tip:(v,s)=>v>s?'More toe-in: very stable at speed and under power; turns less.':v<s?'Less: rotates more, can feel loose at full throttle.':'Typical starting point.',fx:(v,s)=>({trac:(v-s)/3,steer:-(v-s)/4})}];
const TPRE={stock:['Stock',{}],bash:['Bashing',{oilF:40,oilR:50,sprF:2,sprR:2,diffF:20,diffR:0,camF:-1,toeR:2.5}],track:['Track',{oilF:60,oilR:70,sprF:4,sprR:4,diffF:50,diffR:30,camF:-2,toeR:2.5}],speed:['Speed run',{oilF:60,oilR:70,sprF:4,sprR:5,diffF:60,diffR:60,camF:-0.5,toeR:3.5}]};
S.tune=S.tune||{};
const tv2=k=>{const t=TUNE.find(x=>x.k===k);return S.tune[k]==null?t.stock:S.tune[k];};
function renderTuning(){if(!$('#tSliders'))return;
  $('#tPre').innerHTML=Object.entries(TPRE).map(([k,[n,v]])=>'<button type="button" data-p="'+k+'" aria-pressed="'+(TUNE.every(t=>(v[t.k]==null?t.stock:v[t.k])===tv2(t.k)))+'">'+n+'</button>').join('');
  $('#tPre').querySelectorAll('button').forEach(b=>b.onclick=()=>{S.tune={...TPRE[b.dataset.p][1]};save();tick();renderTuning();toast('<b>Tune</b> '+TPRE[b.dataset.p][0]);});
  $('#tSliders').innerHTML=TUNE.map(t=>{const v=tv2(t.k),pct=(t.stock-t.min)/(t.max-t.min)*100;return '<div class="tsl"><div class="th"><small>'+t.g+'</small><b>'+t.n+'</b><em class="'+(v!==t.stock?'ch':'')+'" id="tv-'+t.k+'">'+esc(t.fmt(v))+'</em></div>'+
    '<div class="rng"><input type="range" id="tr-'+t.k+'" min="'+t.min+'" max="'+t.max+'" step="'+t.step+'" value="'+v+'" aria-label="'+t.n+'"><span class="mk" style="left:calc('+pct+'% + '+(8-pct*0.16)+'px)" title="Stock"></span></div>'+
    '<div class="ends"><span>'+t.lo+'</span><span>Stock · '+esc(t.fmt(t.stock))+'</span><span>'+t.hi+'</span></div><p id="tt-'+t.k+'">'+esc(t.tip(v,t.stock))+'</p></div>';}).join('');
  TUNE.forEach(t=>{const r=$('#tr-'+t.k);r.oninput=()=>{const v=+r.value;S.tune[t.k]=v;$('#tv-'+t.k).textContent=t.fmt(v);$('#tv-'+t.k).className=v!==t.stock?'ch':'';$('#tt-'+t.k).textContent=t.tip(v,t.stock);feel();};r.onchange=()=>{save();renderTuning();};});
  feel();}
function feel(){const F={steer:0,bump:0,land:0,trac:0};TUNE.forEach(t=>{const e=t.fx(tv2(t.k),t.stock);Object.entries(e).forEach(([k,v])=>F[k]+=v);});
  const L={steer:'Steering response',bump:'Bump soaking',land:'Landing control',trac:'Power-down traction'};
  $('#tFeel').innerHTML=Object.entries(L).map(([k,l])=>{const v=Math.max(-1,Math.min(1,F[k]));const w=Math.abs(v)*50;return '<div><span>'+l+'</span><i><b class="'+(v<0?'n':'')+'" style="'+(v<0?'left:'+(50-w)+'%;':'')+'width:'+w+'%"></b></i></div>';}).join('');}
const _rt=renderTune;renderTune=function(){_rt();renderTuning();};

go(S.screen||'garage');requestAnimationFrame(frame);
