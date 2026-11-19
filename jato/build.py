import json
h=open('app.html').read()
d=json.load(open('jato_data.json'))
h=h.replace('/*CSS*/',open('app.css').read()).replace('/*DATA*/',json.dumps(d,separators=(',',':')).replace('</','<\\/')).replace('/*JS*/',open('model.js').read()+'\n'+open('ui.js').read()+'\n'+open('upgrade.js').read())
h=h.replace('/*IMGIDX*/',open('img_index.json').read().replace('\n',''))
open('index.html','w').write(h)
print(len(h))
