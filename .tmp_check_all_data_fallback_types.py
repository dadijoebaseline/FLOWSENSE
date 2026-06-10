import psycopg2
DB_CONFIG = {'host': '192.168.6.100', 'port': 3448, 'database': 'fieldofficesync', 'user': 'postgres', 'password': 'tcwddatabase'}
conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()
cur.execute("""
WITH latest_tcwd_database AS (
    SELECT DISTINCT ON (TRIM(BOTH FROM accountnumber))
        TRIM(BOTH FROM accountnumber) AS acct,
        lastsync
    FROM public.tcwd_database
    ORDER BY TRIM(BOTH FROM accountnumber), lastsync DESC
),
latest_qgis_main AS (
    SELECT DISTINCT ON (TRIM(BOTH FROM q.accountnumber))
        TRIM(BOTH FROM q.accountnumber) AS acct
    FROM public.qgis_main q
    ORDER BY TRIM(BOTH FROM q.accountnumber), q.year DESC,
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
all_data_fallback AS (
    SELECT
        a.ogc_fid,
        a.wkb_geometry,
        a.fid,
        a.remarks,
        a.comments,
        a.type,
        TRIM(BOTH FROM a.accountnumber) AS accountnumber,
        a.area,
        a.longitude,
        a.latitude,
        a."nearest meter",
        a.name,
        a.address,
        a.meterno,
        a.bookno,
        a.ratecode,
        a.status,
        a.cellphone,
        a.seqno,
        d.lastsync,
        NULL::text AS prvreading,
        NULL::text AS prsreading,
        '0'::text AS cumused,
        NULL::numeric AS billamount,
        '2026' AS sync_year,
        'APRIL' AS sync_month
    FROM public.all_data a
    LEFT JOIN latest_tcwd_database d ON TRIM(BOTH FROM a.accountnumber)=d.acct
    LEFT JOIN latest_qgis_main q ON TRIM(BOTH FROM q.acct)=TRIM(BOTH FROM a.accountnumber)
    LEFT JOIN public.tcwd_billing b ON TRIM(BOTH FROM a.accountnumber)=TRIM(BOTH FROM b.accountnumber)
        AND b.sync_year='2026'
        AND TRIM(UPPER(b.sync_month))='APRIL'
    WHERE a.year=2026
      AND TRIM(UPPER(a.month))='APRIL'
      AND q.acct IS NULL
      AND b.accountnumber IS NULL
)
SELECT
    pg_typeof(ogc_fid), pg_typeof(wkb_geometry), pg_typeof(fid), pg_typeof(remarks), pg_typeof(comments), pg_typeof(type), pg_typeof(accountnumber), pg_typeof(area), pg_typeof(longitude), pg_typeof(latitude), pg_typeof("nearest meter"), pg_typeof(name), pg_typeof(address), pg_typeof(meterno), pg_typeof(bookno), pg_typeof(ratecode), pg_typeof(status), pg_typeof(cellphone), pg_typeof(seqno), pg_typeof(lastsync), pg_typeof(prvreading), pg_typeof(prsreading), pg_typeof(cumused), pg_typeof(billamount), pg_typeof(sync_year), pg_typeof(sync_month)
FROM all_data_fallback
LIMIT 1
""")
print('all_data_fallback', cur.fetchone())
cur.close()
conn.close()
