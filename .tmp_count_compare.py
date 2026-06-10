import psycopg2
DB_CONFIG = {'host': '192.168.6.100', 'port': 3448, 'database': 'fieldofficesync', 'user': 'postgres', 'password': 'tcwddatabase'}
conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()
cur.execute("SELECT count(*) FROM public.qgis_main WHERE year=%s AND TRIM(UPPER(month))=%s", (2026, 'MAY'))
print('qgis_main_may', cur.fetchone()[0])
cur.execute("SELECT count(*) FROM public.all_data WHERE year=%s AND TRIM(UPPER(month))=%s", (2026, 'MAY'))
print('all_data_may', cur.fetchone()[0])
cur.close()
conn.close()
