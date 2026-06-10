import json
path = r'.\\public\\data\\2026-05.geojson'
account = '0321200294'
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)
features = [f for f in data['features'] if f.get('properties', {}).get('accountnumber') == account]
print('matches', len(features))
for f in features:
    print(f['properties'])
