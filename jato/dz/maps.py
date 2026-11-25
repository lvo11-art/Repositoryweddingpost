import sys,numpy as np
sys.path.insert(0,'dz')
from poly import *
from PIL import Image,ImageDraw,ImageFilter
im=Image.open('../images/20.jpg').convert('RGB');W,H=im.size
X0,Y0,X1,Y1=OX+80,OY+74,OX+672,OY+984   # crop around the shell
cw,ch=X1-X0,Y1-Y0
def poly_mask(P,blur=1.2):
    m=Image.new('L',(cw,ch),0);ImageDraw.Draw(m).polygon([(x+OX-X0,y+OY-Y0) for x,y in P],fill=255)
    return np.asarray(m.filter(ImageFilter.GaussianBlur(blur)),float)/255
body=poly_mask(BODY);win=poly_mask(WIN,1.5);vent=poly_mask(VENT,1)
rgb=np.asarray(im.crop((X0,Y0,X1,Y1)),float)/255
L=rgb@[0.2126,0.7152,0.0722]
mx=rgb.max(2);mn=rgb.min(2);sat=np.where(mx>0,(mx-mn)/np.maximum(mx,1e-6),0)
paint=(body>0.5)&(win<0.5)&(vent<0.5)
# k-means on chroma + luminance
X=np.stack([rgb[...,0],rgb[...,1],rgb[...,2]],-1)[paint]
rng=np.random.default_rng(1);C=X[rng.choice(len(X),6,replace=False)]
for it in range(25):
    d=((X[:,None,:]-C[None])**2).sum(-1);lab=d.argmin(1)
    C=np.array([X[lab==k].mean(0) if (lab==k).any() else C[k] for k in range(len(C))])
print(np.round(C*255).astype(int),np.bincount(lab))
labels=np.full(L.shape,255,np.uint8);labels[paint]=lab
np.save('dz/C.npy',C);np.save('dz/labels.npy',labels)
img=(C[np.minimum(labels,len(C)-1)]*255).astype(np.uint8);img[labels==255]=0
Image.fromarray(img).save('dz/clusters.png')
np.savez('dz/base.npz',body=body,win=win,vent=vent,rgb=rgb,L=L,sat=sat,box=np.array([X0,Y0,X1,Y1]))
