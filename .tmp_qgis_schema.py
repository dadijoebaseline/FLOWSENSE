import psycopg2
DB_CONFIG = {'host':'192.168.6.100','port':3448,'database':'fieldofficesync','user':'postgres','password':'tcwddatabase'}
conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()
cur.execute("SELECT column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='qgis_main' ORDER BY ordinal_position")
for row in cur.fetchall():
    print(row)
print('---')
cur.execute("SELECT table_name FROM information_schema.views WHERE table_schema='public' AND table_name IN ('qgis_main','all_data')")
print('views', cur.fetchall())
cur.close()
conn.close()
