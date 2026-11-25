import numpy as np
from PIL import Image,ImageDraw
z=np.load('dz/base.npz');body,win,vent,rgb,L,sat=z['body'],z['win'],z['vent'],z['rgb'],z['L'],z['sat'];H,W=L.shape
r,g,b=rgb[...,0],rgb[...,1],rgb[...,2];mx=rgb.max(2);mn=rgb.min(2);d=np.maximum(mx-mn,1e-6)
hue=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60
def soft(x,a,b):return np.clip((x-a)/(b-a),0,1)
def blur(a,r):
    if r<1:return a
    for _ in range(3):
        c=np.cumsum(np.pad(a,((0,0),(r+1,r)),mode='edge'),1);a=(c[:,2*r+1:]-c[:,:-2*r-1])/(2*r+1)
        c=np.cumsum(np.pad(a,((r+1,r),(0,0)),mode='edge'),0);a=(c[2*r+1:,:]-c[:-2*r-1,:])/(2*r+1)
    return a
O=soft(sat,0.35,0.55)*soft(mx,0.25,0.4)*((hue>2)&(hue<42))
B=soft(sat,0.3,0.5)*soft(mx,0.18,0.3)*((hue>190)&(hue<235))
holes=Image.new('L',(W,H),0);dr=ImageDraw.Draw(holes)
for cx,cy in [(67,240),(54,385),(511,278),(519,425)]:dr.ellipse((cx-15,cy-15,cx+15,cy+15),fill=255)
holes=np.asarray(holes,float)/255
keep=np.clip(np.maximum(np.maximum(win,vent),holes),0,1);paint=body*(1-keep)
# distance inside the outline
m=(body>0.5);dist=np.zeros(L.shape);cur=m.copy()
for i in range(90):
    nxt=cur.copy();nxt[1:,:]&=cur[:-1,:];nxt[:-1,:]&=cur[1:,:];nxt[:,1:]&=cur[:,:-1];nxt[:,:-1]&=cur[1:,:] if False else nxt[:,:-1]&cur[:,1:];dist+=nxt;cur=nxt
# height field: domed pods + a raised canopy spine (roof, windscreen, rear deck ridge)
can=Image.new('L',(W,H),0);ImageDraw.Draw(can).polygon([(262,40),(330,30),(392,70),(398,300),(402,470),(392,700),(330,730),(250,730),(182,700),(176,470),(190,300),(205,90)],fill=255)
can=blur(np.asarray(can,float)/255,14)
t=np.clip(dist/85,0,1);h=(1-(1-t)**2)*44+can*30+blur(win,6)*-4
h=blur(h,6)
gy,gx=np.gradient(h)
n=np.stack([-gx,-gy,np.ones_like(h)*1.6],-1);n/=np.linalg.norm(n,axis=-1,keepdims=True)
Ld=np.array([-0.25,0.45,0.86]);Ld/=np.linalg.norm(Ld)
dif=np.clip(n@Ld,0,1)
Hh=Ld+np.array([0,0,1]);Hh/=np.linalg.norm(Hh)
blinn=np.clip(n@Hh,0,1)**40*0.7
amb=0.40+0.16*n[...,2]
S=amb+0.5*dif
S=np.clip(S/np.median(S[paint>0.9])*0.9,0.25,1.15)
# real reflections from the photo: bright, colourless glare and chrome edges
glare=soft(L,0.62,0.95)*(1-soft(sat,0.15,0.4))
spec=np.clip(np.maximum(glare,blinn*0.9),0,1)*(paint>0.05)
u8=lambda a:np.clip(np.round(a),0,255).astype(np.uint8)
Image.fromarray(np.stack([u8(body*255),u8(S/1.5*255),u8(spec*255)],-1)).save('dz/maps1.png',optimize=True)
Image.fromarray(np.stack([u8(keep*255),u8(O*255),u8(B*255)],-1)).save('dz/maps2.png',optimize=True)
Image.fromarray(u8(np.clip(dist,0,60)/60*255)).save('dz/dist.png',optimize=True)
def prev(col,name,gloss=0.8):
    alb=np.ones(L.shape+(3,))*np.array(col)
    lit=np.clip(alb*S[...,None]+spec[...,None]*gloss,0,1);a=paint[...,None];out=rgb*(1-a)+lit*a
    return out
row=np.concatenate([prev([0.86,0.86,0.85],'w'),prev([0.08,0.08,0.09],'k'),prev([0.12,0.35,0.85],'b')],1)
Image.fromarray(u8(row*255)).save('dz/prev.png')
