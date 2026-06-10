import psycopg2
DB_CONFIG = {'host': '192.168.6.100', 'port': 3448, 'database': 'fieldofficesync', 'user': 'postgres', 'password': 'tcwddatabase'}
conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()
cur.execute("SELECT sync_year, sync_month, accountnumber, cumused FROM public.tcwd_billing WHERE TRIM(BOTH FROM accountnumber) = %s AND sync_year = %s AND TRIM(UPPER(sync_month)) = %s", ('0321200294', '2026', 'APRIL'))
rows = cur.fetchall()
print('billing_rows', len(rows))
for r in rows:
    print(r)
cur.close()
conn.close()
