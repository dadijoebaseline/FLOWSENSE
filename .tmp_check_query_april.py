import psycopg2
DB_CONFIG = {'host': '192.168.6.100', 'port': 3448, 'database': 'fieldofficesync', 'user': 'postgres', 'password': 'tcwddatabase'}
conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()
year = '2026'
month = 'APRIL'
cur.execute("""
WITH latest_qgis_main AS (
    SELECT DISTINCT ON (TRIM(BOTH FROM q.accountnumber))
        TRIM(BOTH FROM q.accountnumber) AS acct,
        q.ogc_fid,
        q.wkb_geometry,
        q.fid,
        q.remarks,
        q.comments,
        q.type,
        q.area,
        q.longitude,
        q.latitude,
        q."nearest meter",
        q.name,
        q.address,
        q.meterno,
        q.bookno,
        q.ratecode,
        q.status,
        q.cellphone,
        q.seqno
    FROM public.qgis_main q
    ORDER BY TRIM(BOTH FROM q.accountnumber),
        q.year DESC,
        CASE TRIM(UPPER(q.month))
            WHEN 'JANUARY' THEN 1
            WHEN 'FEBRUARY' THEN 2
            WHEN 'MARCH' THEN 3
            WHEN 'APRIL' THEN 4
            WHEN 'MAY' THEN 5
            WHEN 'JUNE' THEN 6
            WHEN 'JULY' THEN 7
            WHEN 'AUGUST' THEN 8
            WHEN 'SEPTEMBER' THEN 9
            WHEN 'OCTOBER' THEN 10
            WHEN 'NOVEMBER' THEN 11
            WHEN 'DECEMBER' THEN 12
            ELSE 0
        END DESC
),
account_rows AS (
    SELECT q.acct AS accountnumber, q.ogc_fid, q.name, q.address, q.longitude, q.latitude,
           COALESCE(NULLIF(b.cumused, ''), '0') AS cumused,
           b.prvreading, b.prsreading, b.billamount
    FROM latest_qgis_main q
    LEFT JOIN public.tcwd_billing b
      ON q.acct = TRIM(BOTH FROM b.accountnumber)
      AND b.sync_year = %s
      AND TRIM(UPPER(b.sync_month)) = %s
)
SELECT * FROM account_rows WHERE accountnumber = '0321200294'
""", (year, month))
rows = cur.fetchall()
print('rows', len(rows))
for row in rows:
    print(row)
cur.close()
conn.close()
