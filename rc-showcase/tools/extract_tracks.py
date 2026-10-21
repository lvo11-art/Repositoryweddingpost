"""Extract simulator tracks from aerial photos: python3 extract_tracks.py <folder with images/> -> tracks.js"""
import cv2, numpy as np, json, base64
import sys
D = sys.argv[1] if len(sys.argv) > 1 else './'   # folder holding images/5.webp (Cory's) and images/6.webp (Templink)
ASPH, CONC, DIRT, GRASS, WATER, UNK = 0, 1, 2, 3, 4, 9
COLORS = {ASPH:(60,60,60), CONC:(200,200,200), DIRT:(80,110,170), GRASS:(60,150,60), WATER:(220,160,40)}

def majority(cls, k, classes=(0,1,2,3,4)):
    best = np.full(cls.shape, -1.0); out = cls.copy()
    for c in classes:
        f = cv2.boxFilter((cls == c).astype(np.float32), -1, (k, k), normalize=False)
        upd = f > best; out[upd] = c; best[upd] = f[upd]
    return out

def ground(im, mapname):
    b, g, r = [im[..., i].astype(int) for i in range(3)]
    lum = (r + g + b) / 3
    cls = np.full(b.shape, UNK, np.uint8)
    water = (b > 150) & (g > 130) & (r < 135) & (g - r > 45)
    green = (g > r + 8) & (g > b + 3)
    if mapname == 'cory':
        dirt = (r - b > 18)
        asph = (b - r > 8) & (lum < 140)
        conc = ~dirt & ~asph & (lum >= 120)
    else:
        dirt = (r - b > -4) & (lum < 172)
        asph = (b - r > 12) & (lum < 178)
        conc = ~dirt & ~asph & (lum >= 150)
    cls[conc] = CONC; cls[asph] = ASPH; cls[dirt] = DIRT; cls[green] = GRASS; cls[water] = WATER
    cls[lum < 55] = UNK
    # fill unknowns (shadows) from neighbours, then smooth
    for k in (5, 9, 17, 33, 65):
        if not (cls == UNK).any(): break
        m = majority(cls, k)
        sel = cls == UNK
        cls[sel] = m[sel]
    cls = majority(cls, 5)
    return cls

def poly_list(mask, eps, min_area):
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    out = []
    for c in cnts:
        if cv2.contourArea(c) < min_area: continue
        ap = cv2.approxPolyDP(c, eps, True).reshape(-1, 2)
        if len(ap) >= 3: out.append(ap)
    return out

def trees_from(cls, mpp, min_r_m=0.7):
    m = (cls == GRASS).astype(np.uint8)
    # tree canopies are compact, darker green blobs; grass lawns are large flat areas
    dist = cv2.distanceTransform(m, cv2.DIST_L2, 5)
    trees = []
    # local maxima of the distance field give canopy centres
    dil = cv2.dilate(dist, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    ys, xs = np.where((dist == dil) & (dist * mpp >= min_r_m))
    taken = np.zeros_like(m)
    order = np.argsort(-dist[ys, xs])
    for i in order:
        x, y = xs[i], ys[i]
        if taken[y, x]: continue
        rad = dist[y, x]
        trees.append([int(x), int(y), round(float(rad), 1)])
        cv2.circle(taken, (int(x), int(y)), int(rad * 1.6) + 1, 1, -1)
    return trees

def local_std(gray, k=7):
    g = gray.astype(np.float32)
    m = cv2.blur(g, (k, k)); m2 = cv2.blur(g * g, (k, k))
    return np.sqrt(np.maximum(0, m2 - m * m))

def tree_list(im, cls, mpp, min_r_m=0.6):
    gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    tm = ((cls == GRASS) & (local_std(gray) > 11)).astype(np.uint8)
    tm = cv2.morphologyEx(tm, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    dist = cv2.distanceTransform(tm, cv2.DIST_L2, 5)
    dil = cv2.dilate(dist, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    ys, xs = np.where((dist >= dil - 1e-3) & (dist * mpp >= min_r_m))
    taken = np.zeros_like(tm); out = []
    for i in np.argsort(-dist[ys, xs]):
        x, y = int(xs[i]), int(ys[i])
        if taken[y, x]: continue
        rad = float(dist[y, x]) * 1.25
        out.append([x, y, round(rad, 1)])
        cv2.circle(taken, (x, y), int(rad * 1.3) + 1, 1, -1)
    return out

def paint_lines(im, cls):
    gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    th = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7)))
    near_asph = cv2.blur((cls == ASPH).astype(np.float32), (9, 9)) > 0.6
    p = (th > 28) & near_asph & (gray > 120)
    return p

def carport_rects(mask, min_area, mpp):
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    out = []
    for c in cnts:
        if cv2.contourArea(c) < min_area: continue
        (cx, cy), (w, h), ang = cv2.minAreaRect(c)
        if min(w, h) * mpp < 2.5: continue
        out.append([round(cx, 1), round(cy, 1), round(w, 1), round(h, 1), round(ang, 1)])
    return out

def encode(cls, paint):
    rgb = np.zeros(cls.shape + (3,), np.uint8)
    rgb[..., 0] = cls * 40           # class id
    rgb[..., 1] = paint.astype(np.uint8) * 255
    # curbs: the edge of the pavement wherever it meets landscaping or sidewalk
    asph = (cls == ASPH).astype(np.uint8)
    other = ((cls == DIRT) | (cls == GRASS) | (cls == CONC)).astype(np.uint8)
    rgb[..., 2] = ((cv2.dilate(asph, np.ones((3, 3), np.uint8)) > 0) & (other > 0)).astype(np.uint8) * 255
    ok, buf = cv2.imencode('.png', rgb[..., ::-1], [cv2.IMWRITE_PNG_COMPRESSION, 9])
    return 'data:image/png;base64,' + base64.b64encode(buf.tobytes()).decode()

def preview(name, im, cls, buildings, carports, trees, paint):
    v = np.zeros_like(im)
    for c, col in COLORS.items(): v[cls == c] = col
    v[paint] = (255, 255, 255)
    for b in buildings: cv2.fillPoly(v, [np.array(b['poly'], np.int32)], (60, 90, 200) if b['kind'] == 'tile' else (200, 170, 140))
    for cx, cy, w, h, a in carports:
        box = cv2.boxPoints(((cx, cy), (w, h), a)).astype(np.int32)
        cv2.polylines(v, [box], True, (255, 255, 0), 2)
    for x, y, r in trees: cv2.circle(v, (x, y), int(r), (0, 90, 0), 1)
    cv2.imwrite(f'prev_{name}.png', np.hstack([cv2.resize(im, None, fx=0.5, fy=0.5), cv2.resize(v, None, fx=0.5, fy=0.5)]) if False else v)

# ---------------- Cory's house (8501 Peace Way) ----------------
def cory():
    im = cv2.imread(D + 'images/5.webp'); H, W = im.shape[:2]; mpp = 0.24
    b, g, r = [im[..., i].astype(int) for i in range(3)]
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV).astype(int)
    salmon = ((r > 140) & (r - b > 35) & (r - g > 20) & (hsv[..., 1] > 40)).astype(np.uint8) * 255
    salmon = cv2.medianBlur(salmon, 5)
    op = cv2.morphologyEx(salmon, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (23, 23)))
    close = cv2.morphologyEx(salmon, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7)))
    roof = close & cv2.dilate(op, cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7)))
    roof = cv2.morphologyEx(roof, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5)))
    roof = cv2.morphologyEx(roof, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9)))
    roof[780:, :] = roof[780:, :] & op[780:, :]
    white = ((b > 185) & (g > 185) & (r > 165) & (b >= r)).astype(np.uint8) * 255
    white[770:, 1300:] = 0; white[:, :8] = 0          # map buttons / screen edge
    white = cv2.morphologyEx(white, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5)))
    carports = carport_rects(white, 250, mpp)
    cls = ground(im, 'cory')
    cls[792:, :] = ASPH                                 # Peace Way
    cls[(roof > 0)] = CONC
    for cx, cy, w, h, a in carports:
        cv2.fillPoly(cls, [cv2.boxPoints(((cx, cy), (w, h), a)).astype(np.int32)], ASPH)
    cls = majority(cls, 3)
    buildings = []
    for p in poly_list(roof, 2.2, 700):
        rect = cv2.minAreaRect(p.astype(np.float32))
        small = min(rect[1]) * mpp < 11
        buildings.append({'poly': p.tolist(), 'kind': 'tile', 'h': 3.0 if small else 6.6, 'roofH': 1.1 if small else 2.3, 'inset': 1.6 if small else 3.4})
    trees = tree_list(im, cls, mpp)
    paint = paint_lines(im, cls)
    paint[786:, :] = False; paint[760:, 1290:] = False                    # street-name label and map buttons
    water = cv2.dilate((cls == WATER).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
    fences = [p.tolist() for p in poly_list(water, 1.5, 30)]
    for bd in buildings:
        if cv2.pointPolygonTest(np.array(bd['poly'], np.int32), (790, 435), False) >= 0: bd['home'] = True
    preview('cory', im, cls, buildings, carports, trees, paint)
    return {'name': "Cory's house", 'mpp': mpp, 'W': W, 'H': H, 'png': encode(cls, paint), 'buildings': buildings,
            'carports': carports, 'trees': trees, 'fences': fences, 'start': {'px': [985, 650], 'yaw': 1.5708}, 'pin': [790, 435],
            # cars visible in open stalls of the photo [x, y, heading°]
            'cars': [[302, 742, 90], [316, 742, 90], [486, 746, 90], [681, 752, 90], [1036, 760, 90], [1216, 760, 90], [1241, 762, 90],
                     [1076, 697, 90], [1091, 697, 90], [1106, 697, 90], [1131, 697, 90], [1181, 697, 90], [955, 621, 0], [955, 641, 0],
                     [1018, 607, 0], [404, 60, 70], [417, 55, 70], [430, 49, 70], [443, 44, 70], [1212, 236, 0], [1273, 392, 0], [57, 128, 0], [338, 123, 95]],
            'wall': '#d8c2a2', 'trim': '#efe4d0'}

# ---------------- Templink office park (traced by hand: flat roofs are too close to concrete in colour) ----------------
def templink():
    im = cv2.imread(D + 'images/6.webp'); H, W = im.shape[:2]; mpp = 0.1
    R = lambda x0, y0, x1, y1: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
    buildings = [
        {'poly': [[92, 339], [293, 339], [293, 564], [347, 564], [347, 622], [694, 622], [694, 799], [345, 799], [345, 830], [145, 830], [145, 799], [90, 799]],
         'kind': 'flat', 'h': 8.5, 'name': 'Melton / Centerstone / Dinora Sharpe'},
        {'poly': [[933, 628], [1318, 628], [1318, 835], [933, 835]], 'kind': 'flat', 'h': 8.5, 'name': 'Philharmonic / Bolick & Hansen'},
        {'poly': R(1338, 348, 1362, 560), 'kind': 'flat', 'h': 8.5},
        {'poly': [[420, 0], [683, 0], [683, 95], [470, 100], [410, 45]], 'kind': 'hip', 'h': 4.2, 'roofH': 1.6, 'inset': 3.0, 'name': 'Selik Law Offices'},
        {'poly': R(686, 0, 722, 88), 'kind': 'flat', 'h': 3.6},
        {'poly': R(755, 225, 800, 265), 'kind': 'flat', 'h': 1.9},
    ]
    rooftop = [R(147, 489, 247, 608), R(300, 661, 419, 764), R(450, 661, 528, 727), R(1205, 668, 1300, 760)]
    carports = []
    for x0, y0, x1, y1 in [[462, 314, 631, 389], [665, 314, 797, 389], [832, 314, 963, 389], [462, 443, 630, 518], [667, 443, 797, 518], [832, 443, 963, 518]]:
        carports.append([(x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0, 0])
    cls = ground(im, 'templink')
    cls[835:, :] = np.where(cls[835:, :] == ASPH, DIRT, cls[835:, :])      # desert scrub behind the offices
    for bd in buildings: cv2.fillPoly(cls, [np.array(bd['poly'], np.int32)], CONC)
    for x0, y0, x1, y1 in [[462, 314, 631, 389], [665, 314, 797, 389], [832, 314, 963, 389], [462, 443, 630, 518], [667, 443, 797, 518], [832, 443, 963, 518]]:
        cls[y0:y1, x0:x1] = ASPH
    cls = majority(cls, 3)
    cls[825:, :95] = DIRT; cls[775:, 1305:] = DIRT                         # map widgets drawn over the photo
    trees = tree_list(im, cls, mpp, 0.5)
    paint = paint_lines(im, cls)
    paint[820:, :100] = False; paint[770:, 1300:] = False
    preview('templink', im, cls, buildings, carports, trees, paint)
    return {'name': 'Templink', 'mpp': mpp, 'W': W, 'H': H, 'png': encode(cls, paint), 'buildings': buildings, 'rooftop': rooftop,
            'carports': carports, 'trees': trees, 'fences': [], 'start': {'px': [420, 416], 'yaw': 0}, 'pin': [560, 640],
            'cars': [[1004, 352, 90], [1058, 352, 90], [1112, 470, 90], [1031, 480, 90], [880, 248, 90], [500, 248, 90], [258, 236, 90], [31, 470, 0], [31, 512, 0], [1245, 260, 0], [700, 590, 90], [905, 590, 90]],
            'wall': '#cfc5b4', 'trim': '#e9e4da'}

if __name__ == '__main__':
    out = {'cory': cory(), 'templink': templink()}
    for k, v in out.items():
        print(k, 'buildings', len(v['buildings']), 'carports', len(v['carports']), 'trees', len(v['trees']), 'png', len(v['png']) // 1024, 'KB')
    open('tracks.js', 'w').write('const TRACK_DATA = ' + json.dumps(out, separators=(',', ':')) + ';\n')
