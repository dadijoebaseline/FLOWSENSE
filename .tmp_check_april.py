import json
import os
path = os.path.abspath(r'.\\public\\data\\2026-04.geojson')
print('path', path)
print('exists', os.path.exists(path))
if os.path.exists(path):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    matches = [f for f in data.get('features', []) if f.get('properties', {}).get('accountnumber') == '0321200294']
    print('matches', len(matches))
    for m in matches:
        print(m.get('properties'))
