import json
from pathlib import Path

path = Path(r'\\192.168.6.100\Programs\FLOWSENSE\public\data\2026-03.geojson')
account = '0141201418'
with path.open('r', encoding='utf-8') as f:
    doc = json.load(f)
matches = [feat.get('properties', {}) for feat in doc.get('features', []) if str(feat.get('properties', {}).get('accountnumber', '')).strip() == account]
print('matches', len(matches))
for props in matches:
    print(props)
