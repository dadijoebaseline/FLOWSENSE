import psycopg2
import json
DB_CONFIG = {'host':'192.168.6.100','port':3448,'database':'fieldofficesync','user':'postgres','password':'tcwddatabase'}
conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()
month_name = 'MAY'
year = 2026
cur.execute('''
    WITH latest_tcwd_database AS (
        SELECT DISTINCT ON (TRIM(BOTH FROM accountnumber))
            TRIM(BOTH FROM accountnumber) AS acct,
            lastsync
        FROM public.tcwd_database
        ORDER BY TRIM(BOTH FROM accountnumber), lastsync DESC
    )
    SELECT
        COALESCE(NULLIF(TRIM(BOTH FROM a.accountnumber), ''), TRIM(BOTH FROM b.accountnumber)) AS accountnumber,
        a.accountnumber AS a_account,
        b.accountnumber AS b_account,
        a.year AS a_year,
        a.month AS a_month,
        b.sync_year,
        b.sync_month,
        b.cumused
    FROM public.tcwd_billing b
    LEFT JOIN latest_tcwd_database d
        ON TRIM(BOTH FROM b.accountnumber) = d.acct
    LEFT JOIN public.all_data a
        ON TRIM(BOTH FROM a.accountnumber) = TRIM(BOTH FROM b.accountnumber)
        AND a.year = %s
        AND TRIM(UPPER(a.month)) = %s
    WHERE b.sync_year = %s
      AND TRIM(UPPER(b.sync_month)) = %s
      AND TRIM(BOTH FROM b.accountnumber) = %s
''', (year, month_name, str(year), month_name, '0321200294'))
rows = cur.fetchall()
print('rows', len(rows))
for r in rows:
    print(r)
cur.close()
conn.close()
