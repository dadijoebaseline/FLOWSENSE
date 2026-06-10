import json
import os
root = r'\\192.168.6.100\\Programs\\FLOWSENSE'
account_number = '0321200294'
filenames = ['public/data/2026-02.geojson','public/data/2026-03.geojson','public/data/2026-04.geojson','public/data/2026-05.geojson']
for fn in filenames:
    path = os.path.join(root, fn)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(fn, 'ERROR', e)
        continue
    matches = [feat for feat in data.get('features', []) if feat.get('properties', {}).get('accountnumber','').strip() == account_number]
    print(fn, len(matches), [m.get('properties', {}).get('name') for m in matches][:5], [m.get('properties', {}).get('month') for m in matches][:5])
