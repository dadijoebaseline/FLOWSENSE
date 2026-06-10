import json
path = r'.\\public\\data\\2026-05.geojson'
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)
feats = data.get('features', [])
count_notnull = 0
count_all = len(feats)
values = {}
for f in feats:
    acc = f.get('properties', {}).get('accountnumber')
    if acc is not None:
        count_notnull += 1
        values[acc] = values.get(acc, 0) + 1
print('features', count_all)
print('accountnumber not null', count_notnull)
print('sample accountnumbers', list(values.items())[:20])
print('0321200294 count', values.get('0321200294'))
print('0321200294 raw lookup', any(str(v)== '0321200294' for v in values.keys()))
