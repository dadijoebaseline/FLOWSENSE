import json, glob, os
path = '//192.168.6.100/Programs/FLOWSENSE/public/data'
for fn in sorted(glob.glob(os.path.join(path, '*.geojson'))):
    with open(fn, 'r', encoding='utf-8') as f:
        doc = json.load(f)
    matches = [feat.get('properties', {}) for feat in doc.get('features', []) if feat.get('properties', {}).get('accountnumber') == '0631201167']
    print(fn, len(matches))
    for props in matches:
        print(' ', props.get('year'), props.get('month'), 'cumused=', props.get('cumused'))
