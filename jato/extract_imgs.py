"""Pull the Traxxas product photos that match this app's parts out of the published traxxas.html page.
Writes parts-img.json ({sku: data-URI}) and img_index.json ({upgrade key or stock part id: sku}). Run: python3 -I extract_imgs.py path/to/traxxas.html"""
import sys,re,json
s=open(sys.argv[1]).read()
x=re.findall(r'<script[^>]*>(.*?)</script>',s,re.S)[0]
D=json.loads(re.search(r'const D=(\{.*?\});\s*(?:const|let|function)',x,re.S).group(1))
sku={}
for sec in 'ABP':
    for g in D[sec]:
        for it in g['items']:sku.setdefault(it['sku'].upper(),it)
def find(pn):
    if not pn:return None
    pn=pn.upper().split(' ')[0]
    base=re.sub(r'-?(ORNG|GRAY|GREY|BLK|BLUE|GRN|WHT|YLW|PINK|RED|ORANGE)$','',pn)
    for c in (pn,base):
        if c in sku:return sku[c]
    for k in sku:
        if k.startswith(base) and len(k)<=len(base)+2:return sku[k]
    return None
d=json.load(open('jato_data.json'))
idx,imgs={},{}
for i,u in enumerate(d['upgrades']):
    f=find(u.get('part_number'))
    if f and f.get('img') in D['IM']:k=u.get('part_number') or ('n%d:%s'%(i,u['name']));idx['u:'+k]=f['sku'];imgs[f['sku']]=D['IM'][f['img']]
for p in d['stock_parts']:
    f=find(p.get('traxxas_pn'))
    if f and f.get('img') in D['IM']:idx['p:'+p['id']]=f['sku'];imgs[f['sku']]=D['IM'][f['img']]
json.dump(imgs,open('parts-img.json','w'),separators=(',',':'))
json.dump(idx,open('img_index.json','w'),indent=0)
print(len(idx),'links',len(imgs),'photos',sum(len(v) for v in imgs.values())//1024,'KB')
