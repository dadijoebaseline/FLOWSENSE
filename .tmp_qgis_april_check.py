import psycopg2
DB_CONFIG = {'host': '192.168.6.100', 'port': 3448, 'database': 'fieldofficesync', 'user': 'postgres', 'password': 'tcwddatabase'}
conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()
cur.execute("SELECT year, month, accountnumber, name, address, meterno FROM public.qgis_main WHERE TRIM(BOTH FROM accountnumber) = %s ORDER BY year, month", ('0321200294',))
rows = cur.fetchall()
print('rows', len(rows))
for r in rows:
    print(r)
cur.close()
conn.close()
