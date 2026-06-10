import psycopg2
import json
import os

DB_CONFIG = {'host': '192.168.6.100', 'port': 3448, 'database': 'fieldofficesync', 'user': 'postgres', 'password': 'tcwddatabase'}
conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()
cur.execute("""
SELECT TRIM(q.accountnumber)
FROM public.qgis_main q
WHERE q.year = %s
  AND TRIM(UPPER(q.month)) = %s
  AND NOT EXISTS (
      SELECT 1 FROM public.tcwd_billing b
      WHERE TRIM(BOTH FROM b.accountnumber) = TRIM(BOTH FROM q.accountnumber)
        AND b.sync_year = %s
        AND TRIM(UPPER(b.sync_month)) = %s
  )
ORDER BY q.accountnumber
""", (2026, 'APRIL', '2026', 'APRIL'))
missing_accounts = [r[0] for r in cur.fetchall()]
print('missing_accounts_count', len(missing_accounts))
print('sample_missing', missing_accounts[:20])
cur.close()
conn.close()

path = os.path.abspath(r'.\\public\\data\\2026-04.geojson')
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)
features = data.get('features', [])
acc_map = {f.get('properties', {}).get('accountnumber'): f for f in features if f.get('properties', {}).get('accountnumber')}
found = [acc for acc in missing_accounts if acc in acc_map]
print('found_in_geojson', len(found))
for acc in found[:20]:
    p = acc_map[acc]['properties']
    print(acc, p.get('prvreading'), p.get('prsreading'), p.get('cumused'), p.get('year'), p.get('month'))
not_found = [acc for acc in missing_accounts if acc not in acc_map]
print('not_found_sample', not_found[:20])
