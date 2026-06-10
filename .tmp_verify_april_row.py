import json, os
path = os.path.abspath(r'.\\public\\data\\2026-04.geojson')
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)
features = [feat for feat in data.get('features', []) if feat.get('properties', {}).get('accountnumber') == '0321200294']
print('matches', len(features))
for feat in features:
    props = feat['properties']
    print({
        'accountnumber': props.get('accountnumber'),
        'year': props.get('year'),
        'month': props.get('month'),
        'cumused': props.get('cumused'),
        'prvreading': props.get('prvreading'),
        'prsreading': props.get('prsreading'),
        'name': props.get('name'),
        'address': props.get('address')
    })
