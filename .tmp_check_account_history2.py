import json
import os
root = r'\\192.168.6.100\\Programs\\FLOWSENSE'
filenames = ['public/data/2026-04.geojson','public/data/2026-05.geojson']
account_number = '0321200294'
account_name = 'SILVA, MA. ABEGAIL L.'
for fn in filenames:
    path = os.path.join(root, fn)
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    acct_matches = []
    name_matches = []
    for feat in data.get('features', []):
        props = feat.get('properties', {}) or {}
        acct = (props.get('accountnumber') or props.get('accountNumber') or props.get('AccountNumber') or '')
        if isinstance(acct, str):
            acct = acct.strip()
        name = (props.get('name') or props.get('Name') or '')
        if isinstance(name, str):
            name = name.strip()
        if acct == account_number:
            acct_matches.append(props)
        if isinstance(name, str) and name.upper() == account_name.upper():
            name_matches.append(props)
    print(fn)
    print(' accountnumber matches:', len(acct_matches))
    for props in acct_matches[:3]:
        print('  acct', props.get('accountnumber'), props.get('name'), props.get('month'), props.get('year'))
    print(' exact name matches:', len(name_matches))
    for props in name_matches[:3]:
        print('  name', props.get('accountnumber'), props.get('name'), props.get('month'), props.get('year'))
    print('---')
