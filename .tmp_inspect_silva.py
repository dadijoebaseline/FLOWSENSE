import json
import os
root = r'\\192.168.6.100\\Programs\\FLOWSENSE'
account_number = '0321200294'
account_name = 'SILVA, MA. ABEGAIL L.'
for fn in ['public/data/2026-04.geojson','public/data/2026-05.geojson']:
    path = os.path.join(root, fn)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print('ERROR opening', fn, e)
        continue
    print('FILE', fn)
    found = False
    for i, feat in enumerate(data.get('features', [])):
        props = feat.get('properties', {}) or {}
        acct = props.get('accountnumber') or props.get('accountNumber') or props.get('AccountNumber') or ''
        if isinstance(acct, str): acct = acct.strip()
        name = props.get('name') or props.get('Name') or ''
        if isinstance(name, str): name = name.strip()
        if acct == account_number or isinstance(name, str) and name.upper() == account_name.upper():
            found = True
            print(' index', i)
            print('  acct', repr(acct))
            print('  name', repr(name))
            print('  month', props.get('month'), 'year', props.get('year'))
            print('  cumused', props.get('cumused'), 'prsreading', props.get('prsreading'), 'prvreading', props.get('prvreading'))
            print('  status', props.get('status'))
            print('  keys', sorted(props.keys()))
            print('')
    if not found:
        print('  not found')
    print('---')
