import json

path = r'.\\public\\data\\2026-05.geojson'
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)
features = data.get('features', [])
print('feature_count', len(features))
account = '0321200294'
matches = [f for f in features if f.get('properties', {}).get('accountnumber') == account]
print('matches', len(matches))
for m in matches[:5]:
    print(m.get('properties'))
