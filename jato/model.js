/* ================= 3D model =================
   Units mm. +X forward, +Y up, +Z to the right. Sizes from Traxxas: 517 long, 305 wide, 179 tall, 320 wheelbase.
   Every part is a THREE.Group registered with part(); its id matches JATO.stock_parts so the panels can describe it. */
const $=s=>document.querySelector(s);
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const PI=Math.PI;
THREE.ColorManagement.legacyMode=false;   // colours below are written as sRGB hex
const AX=160,WZ=125,TR=58,TW=54,RIM=38;            // axle x, wheel centre z, tyre radius, tyre width, rim radius
const stage=$('#stage');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=0.82;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
stage.prepend(renderer.domElement);
const scene=new THREE.Scene();
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new THREE.RoomEnvironment(),0.04).texture;
const camera=new THREE.PerspectiveCamera(32,1,5,6000);camera.position.set(560,330,-520);
const controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=0.08;controls.target.set(0,55,0);controls.minDistance=120;controls.maxDistance=2200;controls.maxPolarAngle=PI*0.98;
scene.add(new THREE.HemisphereLight(0xdfe9ff,0x0b0f16,0.35));
const key=new THREE.DirectionalLight(0xffffff,1.35);key.position.set(320,700,-260);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-420,right:420,top:420,bottom:-420,near:100,far:1600});key.shadow.bias=-0.0004;scene.add(key);
const rim1=new THREE.DirectionalLight(0x6fd3ff,0.55);rim1.position.set(-500,260,420);scene.add(rim1);
const rim2=new THREE.DirectionalLight(0xb67cff,0.15);rim2.position.set(500,200,520);scene.add(rim2);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),new THREE.ShadowMaterial({opacity:0.45}));ground.rotation.x=-PI/2;ground.receiveShadow=true;scene.add(ground);
const floorGlow=new THREE.Mesh(new THREE.CircleGeometry(420,96),new THREE.MeshBasicMaterial({color:0x0f2a44,transparent:true,opacity:0.35,depthWrite:false}));floorGlow.rotation.x=-PI/2;floorGlow.position.y=0.3;scene.add(floorGlow);
const root=new THREE.Group();scene.add(root);

/* materials */
const M={};
function mat(c,o){return new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:0.55,metalness:0,envMapIntensity:0.6},o||{}));}
const plastic=c=>mat(c,{roughness:0.62});
const alu=c=>mat(c,{roughness:0.32,metalness:0.85});
const anod=c=>mat(c,{roughness:0.28,metalness:0.75});
const steel=()=>mat(0xc9ced3,{roughness:0.22,metalness:1});
const rubber=()=>mat(0x161718,{roughness:0.92});

/* part registry */
const parts=[],byId={};
function part(id,name,cat){const g=new THREE.Group();g.name=id;root.add(g);const p={id,name,cat,g,meshes:[],home:null,ex:V(0,0,0)};parts.push(p);byId[id]=p;return p;}
function add(p,geo,m,pos,rot,scl){const mesh=new THREE.Mesh(geo,m);if(pos)mesh.position.copy(pos);if(rot)mesh.rotation.set(rot[0],rot[1],rot[2]);if(scl)mesh.scale.set(scl[0],scl[1],scl[2]);
  mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.part=p.id;p.g.add(mesh);p.meshes.push(mesh);return mesh;}
const box=(x,y,z,r)=>r?new THREE.BoxGeometry(x,y,z,1,1,1):new THREE.BoxGeometry(x,y,z);
const cyl=(r1,r2,h,n)=>new THREE.CylinderGeometry(r1,r2,h,n||28);
function rbox(w,h,d,r){return new THREE.RoundedBoxGeometry?new THREE.RoundedBoxGeometry(w,h,d,3,r):new THREE.BoxGeometry(w,h,d);}
/* a rod between two points */
function rod(p,a,b,r,m,n){const d=b.clone().sub(a);const g=cyl(r,r,d.length(),n||12);const mesh=add(p,g,m,a.clone().add(b).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return mesh;}
/* flat plate from a 2D outline, extruded; plane = 'xz' (lying) or 'yz' (standing, faces x) */
function plate(p,pts,depth,m,plane,pos,holes,bevel){const s=new THREE.Shape(pts.map(([a,b])=>new THREE.Vector2(a,b)));
  (holes||[]).forEach(([cx,cy,r])=>{const h=new THREE.Path();h.absarc(cx,cy,r,0,PI*2,true);s.holes.push(h);});
  const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:!!bevel,bevelThickness:bevel||0,bevelSize:bevel||0,bevelSegments:2,curveSegments:16});
  if(plane==='xz'){g.rotateX(PI/2);}            // shape (x,y) -> world (x, -depth..0, y)
  else if(plane==='yz'){g.rotateY(-PI/2);}       // shape (x,y) -> world (depth.., y, x): stands facing x
  return add(p,g,m,pos||V(0,0,0));}

/* ---------- chassis ---------- */
{const p=part('chassis','Main chassis','chassis');const m=plastic(0x1b1d21);
  const pts=[[205,-34],[150,-52],[60,-58],[-60,-58],[-150,-50],[-200,-34],[-200,34],[-150,50],[-60,58],[60,58],[150,52],[205,34]];
  plate(p,pts,5,m,'xz',V(0,26,0),null,1.5);
  // raised side rails
  [-1,1].forEach(s=>{add(p,box(250,9,4),m,V(-5,32,s*57));});}
{const p=part('chassis_brace','Aluminium T-bar chassis brace','chassis');const m=alu(0x9aa3ad);
  plate(p,[[150,-7],[40,-7],[40,-32],[24,-32],[24,32],[40,32],[40,7],[150,7]],3,m,'xz',V(0,92,0),[[130,0,3],[90,0,3],[32,-22,3],[32,22,3]],0.6);
  rod(p,V(32,60,-22),V(32,90,-22),4,m);rod(p,V(32,60,22),V(32,90,22),4,m);}
/* bulkheads + diffs */
function bulk(id,name,x,dir){const p=part(id,name,'chassis');const m=plastic(0x232529);
  add(p,rbox(50,46,96,6),m,V(x,52,0));add(p,box(30,22,120),m,V(x+dir*8,34,0));
  return p;}
bulk('bulkhead_front','Front bulkhead & gearbox',AX-8,1);bulk('bulkhead_rear','Rear bulkhead & gearbox',-AX+8,-1);
{const p=part('bulkhead_tie_bars','Bulkhead tie bars','chassis');const m=alu(0x8e98a3);
  rod(p,V(AX-30,78,-36),V(AX+18,78,-36),3.2,m);rod(p,V(AX-30,78,36),V(AX+18,78,36),3.2,m);rod(p,V(-AX+30,78,-36),V(-AX-18,78,-36),3.2,m);rod(p,V(-AX+30,78,36),V(-AX-18,78,36),3.2,m);}
{const p=part('diff_front_rear','Front & rear differentials','drivetrain');const m=mat(0x34373c,{roughness:0.4,metalness:0.6});const g=mat(0xb08d57,{roughness:0.35,metalness:0.9});
  [AX,-AX].forEach(x=>{add(p,cyl(22,22,34,32),m,V(x,54,0),[PI/2,0,0]);add(p,cyl(25,25,4,40),g,V(x,54,-14),[PI/2,0,0]);
    [-1,1].forEach(s=>add(p,cyl(9,9,14,20),m,V(x,54,s*26),[PI/2,0,0]));});}
/* centre drive, spur, pinion, motor */
{const p=part('center_diff','Torque-Biasing Center Drive (centre diff)','drivetrain');const m=mat(0x2d3036,{roughness:0.38,metalness:0.55});
  add(p,cyl(18,18,52,28),m,V(-4,54,0),[0,0,PI/2]);add(p,rbox(40,30,52,6),plastic(0x232529),V(-6,40,0));}
{const p=part('spur','50T steel spur gear','drivetrain');const m=steel();
  add(p,cyl(21,21,6,50),m,V(-34,54,0),[0,0,PI/2]);
  const t=new THREE.InstancedMesh(box(6,2.6,2.4),m,50);const o=new THREE.Object3D();
  for(let i=0;i<50;i++){const a=i/50*PI*2;o.position.set(-34,54+Math.cos(a)*21.6,Math.sin(a)*21.6);o.rotation.set(-a,0,0);o.updateMatrix();t.setMatrixAt(i,o.matrix);}
  t.castShadow=true;t.userData.part='spur';p.g.add(t);p.meshes.push(t);}
{const p=part('pinion','14T pinion (0.8 mod, 5 mm bore)','power');add(p,cyl(6.4,6.4,8,14),steel(),V(-34,54,27.5),[0,0,PI/2]);}
{const p=part('motor','Velineon 540XL 2400 kV motor','power');const can=mat(0x15171a,{roughness:0.35,metalness:0.7});const band=mat(0x1f6fff,{roughness:0.35,metalness:0.6});
  add(p,cyl(18,18,90,40),can,V(-84,54,27.5),[0,0,PI/2]);add(p,cyl(18.4,18.4,26,40),band,V(-70,54,27.5),[0,0,PI/2]);
  add(p,cyl(2.5,2.5,10,10),steel(),V(-36,54,27.5),[0,0,PI/2]);
  for(let i=0;i<6;i++){add(p,box(80,2,6),can,V(-84,54+Math.cos(i*PI/3)*19,27.5+Math.sin(i*PI/3)*19),[i*PI/3,0,0]);}
  [-1,0,1].forEach(k=>add(p,cyl(1.6,1.6,30,8),mat([0xd8352b,0x111111,0x2266ee][k+1]),V(-128,54+k*6,27.5+12),[0,0,0.9]));}
{const p=part('center_driveshaft','Centre driveshafts','drivetrain');const m=steel();rod(p,V(22,54,0),V(AX-30,54,0),4,m,14);rod(p,V(-40,54,-8),V(-AX+30,54,0),4,m,14);}
/* electronics */
{const p=part('esc','Velineon VXL-4s ESC','electronics');const m=mat(0x17191c,{roughness:0.45,metalness:0.3});const fin=alu(0x5b6470);
  add(p,rbox(56,30,44,4),m,V(78,48,40));for(let i=0;i<6;i++)add(p,box(54,6,2),fin,V(78,66,24+i*6.4));
  add(p,cyl(16,16,6,30),mat(0x0f1012),V(78,70,40));add(p,box(10,6,10),mat(0xd8352b),V(108,44,40));
  rod(p,V(50,50,30),V(-8,50,30),2.4,mat(0xd8352b));rod(p,V(50,54,34),V(-8,54,34),2.4,mat(0x111111));}
{const p=part('receiver','TQi receiver (6533)','electronics');const m=plastic(0x121315);
  add(p,rbox(34,22,26,3),m,V(118,44,-34));rod(p,V(118,55,-38),V(108,150,-46),1.8,mat(0x0b0c0d,{roughness:0.8}));add(p,cyl(2.6,2.6,4,10),mat(0xff6a1a),V(108,151,-46));}
{const p=part('servo','2075X digital servo','steering');const m=plastic(0x141518);
  add(p,rbox(22,36,40,3),m,V(132,52,22));add(p,box(4,4,20),steel(),V(146,70,22));rod(p,V(146,70,14),V(176,62,-6),2.2,steel());}
/* battery (owner's pack, not included in the box) */
{const p=part('battery','4S LiPo pack (yours, not in the box)','power');const m=mat(0x101215,{roughness:0.45,metalness:0.2});
  add(p,rbox(150,44,46,5),m,V(46,52,-34));add(p,box(110,1.5,40),mat(0x1f6fff,{roughness:0.4}),V(46,74.8,-34));
  add(p,box(60,1.6,30),mat(0xe9eef4,{roughness:0.5}),V(70,75.2,-34));}
{const p=part('battery_hold_down','Battery hold-down','chassis');const m=plastic(0x26292e);
  add(p,box(14,4,58),m,V(10,78,-34));add(p,box(14,4,58),m,V(96,78,-34));[10,96].forEach(x=>{rod(p,V(x,30,-64),V(x,78,-64),2.4,steel());});}
/* bumpers */
{const p=part('bumpers','Front & rear bumpers','chassis');const m=plastic(0x1a1c1f);
  plate(p,[[0,-80],[22,-70],[30,0],[22,70],[0,80],[-8,40],[-8,-40]],10,m,'xz',V(200,40,0),null,2);
  plate(p,[[0,-62],[-16,-56],[-22,0],[-16,56],[0,62],[8,30],[8,-30]],10,m,'xz',V(-200,44,0),null,2);}
/* suspension */
const armM=plastic(0x1c1e22);
function arm(p,x,s,front){const v=front?1:-1;const pts=s>0?[[-26,24],[26,24],[10,104],[-10,104]]:[[-26,-24],[-10,-104],[10,-104],[26,-24]];
  const sh=new THREE.Shape(pts.map(([a,b])=>new THREE.Vector2(a,b)));const g=new THREE.ExtrudeGeometry(sh,{depth:9,bevelEnabled:true,bevelThickness:1.2,bevelSize:1.2,bevelSegments:2});g.rotateX(PI/2);
  const mesh=add(p,g,armM,V(x,36,0));mesh.rotation.x=0;return mesh;}
{const p=part('suspension_arms','Suspension arms (3655)','suspension');[1,-1].forEach(f=>[-1,1].forEach(s=>{arm(p,f*(AX-6),s,f>0);
    rod(p,V(f*(AX-26),62,s*22),V(f*(AX-4),80,s*92),2.4,steel());}));}
{const p=part('shock_tower_front','Front shock tower (aluminium)','suspension');const m=alu(0x8f99a4);
  const pts=[[-78,0],[-82,18],[-70,84],[-30,100],[30,100],[70,84],[82,18],[78,0]];
  const msh=plate(p,pts,5,m,'yz',V(AX-34,48,0),[[-60,70,3],[60,70,3],[-40,80,3],[40,80,3],[0,40,14]],0.8);msh.rotation.z=-0.12;}
{const p=part('shock_tower_rear','Rear shock tower (aluminium)','suspension');const m=alu(0x8f99a4);
  const pts=[[-80,0],[-86,22],[-74,92],[-34,108],[34,108],[74,92],[86,22],[80,0]];
  const msh=plate(p,pts,5,m,'yz',V(-AX+30,48,0),[[-64,76,3],[64,76,3],[-44,88,3],[44,88,3],[0,44,15]],0.8);msh.rotation.z=0.12;}
{const p=part('shocks','GTR XX-Long shocks (orange)','suspension');p.bodyMats=[];
  [1,-1].forEach(f=>[-1,1].forEach(s=>{const top=V(f*(AX-38+(f>0?-6:6)),134,s*64),bot=V(f*(AX-4),40,s*90);const d=bot.clone().sub(top),len=d.length(),dir=d.clone().normalize();
    const q=new THREE.Quaternion().setFromUnitVectors(V(0,-1,0),dir);const at=t=>top.clone().add(d.clone().multiplyScalar(t));
    const body=mat(0xff6a1a,{roughness:0.28,metalness:0.75});p.bodyMats.push(body);
    let mm=add(p,cyl(8.5,8.5,len*0.52,24),body,at(0.28));mm.quaternion.copy(q);
    mm=add(p,cyl(9.5,9.5,6,24),body,at(0.04));mm.quaternion.copy(q);
    mm=add(p,cyl(2.8,2.8,len*0.45,12),steel(),at(0.74));mm.quaternion.copy(q);
    // spring
    const pts=[];const n=11*24;for(let i=0;i<=n;i++){const t=i/n,a=t*11*PI*2;pts.push(V(Math.cos(a)*11.5,-t*len*0.72,Math.sin(a)*11.5));}
    const sp=add(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),n,1.4,6,false),mat(0x2a2d33,{roughness:0.35,metalness:0.8}),at(0.14));sp.quaternion.copy(q);p.spring=(p.spring||[]).concat(sp);
  }));}
{const p=part('caster_blocks','Caster blocks (aluminium)','suspension');p.alu=[];[-1,1].forEach(s=>{const m=alu(0x8f99a4);p.alu.push(m);add(p,rbox(22,46,16,3),m,V(AX,58,s*84));});}
{const p=part('steering_blocks','Steering blocks (aluminium)','steering');p.alu=[];[-1,1].forEach(s=>{const m=alu(0x8f99a4);p.alu.push(m);add(p,rbox(30,40,14,3),m,V(AX,58,s*100));rod(p,V(AX+12,64,s*100),V(AX+26,64,s*86),3,m);});
  rod(p,V(AX+26,64,-86),V(AX+26,64,86),2.4,steel());}
{const p=part('hub_carriers','Rear hub carriers (aluminium)','suspension');p.alu=[];[-1,1].forEach(s=>{const m=alu(0x8f99a4);p.alu.push(m);add(p,rbox(32,48,16,3),m,V(-AX,58,s*98));});}
{const p=part('driveshaft_front','Front driveshafts (Extreme HD CVD)','drivetrain');const m=steel();[-1,1].forEach(s=>{rod(p,V(AX,54,s*30),V(AX,58,s*104),4.2,m,14);add(p,cyl(7,7,10,16),m,V(AX,56,s*34),[PI/2,0,0]);});}
{const p=part('driveshaft_rear','Rear driveshafts (Extreme HD CVD)','drivetrain');const m=steel();[-1,1].forEach(s=>{rod(p,V(-AX,54,s*30),V(-AX,58,s*104),4.2,m,14);add(p,cyl(7,7,10,16),m,V(-AX,56,s*34),[PI/2,0,0]);});}
/* wheels & tyres */
const wheelM=mat(0x17181b,{roughness:0.42,metalness:0.35}),tyreM=rubber();
function tyreGeo(){const pr=[];const w=TW/2;
  const prof=[[RIM,-w+2],[RIM+6,-w],[TR-6,-w],[TR-2,-w+3],[TR,-w+9],[TR,w-9],[TR-2,w-3],[TR-6,w],[RIM+6,w],[RIM,w-2]];
  prof.forEach(([r,y])=>pr.push(new THREE.Vector2(r,y)));const g=new THREE.LatheGeometry(pr,72);g.rotateX(PI/2);return g;}
function rimGeo(){const w=TW/2-3;const pr=[[8,-w+16],[RIM-6,-w+8],[RIM,-w],[RIM+1,-w+3],[RIM+1,w-3],[RIM,w],[RIM-4,w-4],[RIM-4,-w+10]].map(([r,y])=>new THREE.Vector2(r,y));
  const g=new THREE.LatheGeometry(pr,48);g.rotateX(PI/2);return g;}
const TYRE=tyreGeo(),RIMG=rimGeo();
{const p=part('wheels_tires','Response Pro tyres on 3.0" dished wheels','wheels');p.wheelMats=[];
  const tread=new THREE.InstancedMesh(box(5,7,11),tyreM,4*64*3);let k=0;const o=new THREE.Object3D();
  [[AX,-1],[AX,1],[-AX,-1],[-AX,1]].forEach(([x,s])=>{const c=V(x,TR,s*WZ);const wm=wheelM;
    let m=add(p,TYRE,tyreM,c);m=add(p,RIMG,wm,c);
    // dish spokes
    for(let i=0;i<6;i++){const a=i/6*PI*2;const sp=add(p,box(5,30,6),wm,V(x+Math.cos(a)*0,TR+Math.sin(a)*19,s*WZ+s*(TW/2-14)));
      sp.position.set(x+Math.cos(a)*19,TR+Math.sin(a)*19,s*WZ+s*(TW/2-14));sp.rotation.set(0,0,a+PI/2);}
    add(p,cyl(9,9,10,6),alu(0x8f99a4),V(x,TR,s*(WZ+TW/2-12)),[PI/2,0,0]);
    // tread: three staggered rows of blocks
    for(let r=0;r<3;r++)for(let i=0;i<64;i++){const a=(i+(r%2)*0.5)/64*PI*2,zz=s*WZ+(r-1)*15;o.position.set(x+Math.cos(a)*(TR+1.6),TR+Math.sin(a)*(TR+1.6),zz);o.rotation.set(0,0,a);o.updateMatrix();tread.setMatrixAt(k++,o.matrix);}
  });
  tread.castShadow=true;tread.userData.part='wheels_tires';p.g.add(tread);p.meshes.push(tread);p.wheelMat=wheelM;}
{const p=part('wheel_hex','17 mm wheel hexes','wheels');[[AX,-1],[AX,1],[-AX,-1],[-AX,1]].forEach(([x,s])=>add(p,cyl(10,10,8,6),alu(0x707a85),V(x,TR,s*(WZ-4)),[PI/2,0,0]));}
/* body: a loft of rounded cross-sections, cab-forward buggy shape */
const BODY_KEYS=[[0,30,12],[.06,62,28],[.14,82,42],[.22,90,62],[.32,92,92],[.44,98,92],[.56,104,74],[.68,100,58],[.8,84,50],[.9,66,46],[1,46,36]];
function lerpKeys(t,i){for(let k=1;k<BODY_KEYS.length;k++){const a=BODY_KEYS[k-1],b=BODY_KEYS[k];if(t<=b[0]){const u=(t-a[0])/(b[0]-a[0]),s=u*u*(3-2*u);return a[i]+(b[i]-a[i])*s;}}return BODY_KEYS[BODY_KEYS.length-1][i];}
const BX0=214,BX1=-176,BY=40,NS=72,NR=40;
function bodyGeo(){const pos=[],uv=[],idx=[],zone=[];
  for(let i=0;i<=NS;i++){const t=i/NS,x=BX0+(BX1-BX0)*t,w=lerpKeys(t,1),h=lerpKeys(t,2);
    for(let j=0;j<=NR;j++){const a=j/NR*PI;const c=Math.cos(a),s=Math.sin(a);const e=0.55;
      const z=-Math.sign(c)*Math.pow(Math.abs(c),e)*w,y=BY+Math.pow(s,e)*h;
      // nose drops toward the front
      const yy=y-(t<0.12?(0.12-t)*120*(1-s*0.3):0);
      pos.push(x,yy,z);uv.push(t,j/NR);
      // zones: 0 paint, 1 window, 2 black skirt, 3 accent stripe
      let zn=0;if(s<0.28)zn=2;else if(t>0.2&&t<0.44&&s>0.62&&Math.abs(c)<0.62)zn=1;else if(t>0.5&&t<0.95&&Math.abs(Math.abs(c)-0.55)<0.07)zn=3;zone.push(zn);}}
  for(let i=0;i<NS;i++)for(let j=0;j<NR;j++){const a=i*(NR+1)+j,b=a+NR+1;idx.push(a,b,a+1,b,b+1,a+1);}
  // tail cap
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  g.userData.zone=zone;g.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(zone.length*3),3));return g;}
const bodyMat=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:0.4,metalness:0.0,clearcoat:0.6,clearcoatRoughness:0.12,envMapIntensity:0.55,side:THREE.DoubleSide});
{const p=part('body','Orange body (9060-ORNG)','body');const g=bodyGeo();const m=add(p,g,bodyMat);p.bodyGeo=g;
  // side scoops
  [-1,1].forEach(s=>{const sc=add(p,rbox(90,16,8,4),mat(0x111316,{roughness:0.5}),V(-10,72,s*96));sc.rotation.y=s*0.05;});}
{const p=part('wing','Rear wing (9517)','body');const m=plastic(0x15171a);p.wingMat=m;
  const prof=[[0,0],[34,5],[62,7],[76,4],[78,2],[60,3],[30,2],[2,-2]];const sh=new THREE.Shape(prof.map(([a,b])=>new THREE.Vector2(a,b)));
  const g=new THREE.ExtrudeGeometry(sh,{depth:210,bevelEnabled:false});g.translate(0,0,-105);const w=add(p,g,m,V(-262,166,0));w.rotation.z=-0.08;
  [-1,1].forEach(s=>add(p,box(84,34,3),m,V(-226,158,s*106)));}
{const p=part('wing_mounts','Wing mounts','body');const m=plastic(0x1c1e22);[-1,1].forEach(s=>{rod(p,V(-AX+34,120,s*30),V(-232,166,s*34),4,m);});}
{const p=part('body_mounts','Body mounts & posts','body');const m=plastic(0x222428);[[AX-10,0],[-AX+40,-40],[-AX+40,40]].forEach(([x,z])=>rod(p,V(x,60,z),V(x,112,z),3,m));}

/* paint */
const PAINT_DEF={body:'#ff6a1a',accent:'#111316',wing:'#15171a',wheels:'#17181b',shocks:'#ff6a1a',blocks:'#8f99a4',finish:'gloss'};
const FIN={gloss:{roughness:0.4,metalness:0,clearcoat:0.6},metallic:{roughness:0.3,metalness:0.6,clearcoat:1},matte:{roughness:0.85,metalness:0,clearcoat:0},pearl:{roughness:0.28,metalness:0.2,clearcoat:1}};
function applyPaint(P){P=Object.assign({},PAINT_DEF,P||{});const p=byId.body,g=p.bodyGeo,col=g.attributes.color,z=g.userData.zone;
  const cs=[new THREE.Color(P.body),new THREE.Color('#0f141c'),new THREE.Color('#121315'),new THREE.Color(P.accent)];
  for(let i=0;i<z.length;i++){const c=cs[z[i]];col.setXYZ(i,c.r,c.g,c.b);}col.needsUpdate=true;Object.assign(bodyMat,FIN[P.finish]||FIN.gloss);bodyMat.needsUpdate=true;
  byId.wing.wingMat.color.set(P.wing);byId.wheels_tires.wheelMat.color.set(P.wheels);byId.shocks.bodyMats.forEach(m=>m.color.set(P.shocks));
  ['caster_blocks','steering_blocks','hub_carriers'].forEach(id=>byId[id].alu.forEach(m=>m.color.set(P.blocks)));}

/* layout helpers */
parts.forEach(p=>{p.box=new THREE.Box3().setFromObject(p.g);p.center=p.box.getCenter(V(0,0,0));const d=p.center.clone().sub(V(0,50,0));
  p.ex=V(d.x*0.55,Math.max(0,d.y)*1.2+30,d.z*1.1);if(p.cat==='body')p.ex.set(0,170,0);if(p.id==='chassis')p.ex.set(0,-30,0);if(p.id==='wheels_tires'||p.id==='wheel_hex')p.ex.set(0,0,0);});
// wheels explode outward per wheel would need per-mesh vectors; keep them in place for clarity
