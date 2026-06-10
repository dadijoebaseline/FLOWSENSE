import psycopg2
DB_CONFIG = {
    'host': '192.168.6.100',
    'port': 3448,
    'database': 'fieldofficesync',
    'user': 'postgres',
    'password': 'tcwddatabase',
}
acct = '0141201418'
conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()
cur.execute("SELECT year, month, accountnumber, ogc_fid FROM public.qgis_main WHERE TRIM(BOTH FROM accountnumber)=%s ORDER BY year, month", (acct,))
print('qgis_main rows:', cur.fetchall())
cur.execute("SELECT sync_year, sync_month, cumused FROM public.tcwd_billing WHERE TRIM(BOTH FROM accountnumber)=%s AND TRIM(BOTH FROM sync_year)='2026' AND TRIM(UPPER(sync_month))='MARCH'", (acct,))
print('billing march rows:', cur.fetchall())
cur.execute("SELECT count(*) FROM public.tcwd_billing WHERE TRIM(BOTH FROM accountnumber)=%s AND TRIM(BOTH FROM sync_year)='2026' AND TRIM(UPPER(sync_month))='MARCH'", (acct,))
print('billing march count:', cur.fetchone()[0])
conn.close()
