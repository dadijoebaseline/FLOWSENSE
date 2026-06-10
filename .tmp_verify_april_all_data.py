import psycopg2
DB_CONFIG = {'host': '192.168.6.100', 'port': 3448, 'database': 'fieldofficesync', 'user': 'postgres', 'password': 'tcwddatabase'}
conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()
cur.execute("""
SELECT TRIM(a.accountnumber)
FROM public.all_data a
WHERE a.year = %s
  AND TRIM(UPPER(a.month)) = %s
  AND NOT EXISTS (
      SELECT 1 FROM public.qgis_main q
      WHERE TRIM(BOTH FROM q.accountnumber) = TRIM(BOTH FROM a.accountnumber)
        AND q.year = %s
        AND TRIM(UPPER(q.month)) = %s
  )
  AND NOT EXISTS (
      SELECT 1 FROM public.tcwd_billing b
      WHERE TRIM(BOTH FROM b.accountnumber) = TRIM(BOTH FROM a.accountnumber)
        AND b.sync_year = %s
        AND TRIM(UPPER(b.sync_month)) = %s
  )
ORDER BY TRIM(a.accountnumber)
""", (2026, 'APRIL', 2026, 'APRIL', '2026', 'APRIL'))
all_data_only = [r[0] for r in cur.fetchall()]
print('all_data_only_count', len(all_data_only))
print('sample', all_data_only[:20])
cur.close()
conn.close()
