import csv
import os
import psycopg2

DB_CONFIG = {
    'host': '192.168.6.100',
    'port': 3448,
    'database': 'fieldofficesync',
    'user': 'postgres',
    'password': 'tcwddatabase',
}

OUTPUT_DIR = os.path.dirname(__file__)
OUTPUT_CSV = os.path.join(OUTPUT_DIR, 'unmatched_accounts.csv')

SQL_QGIS_ONLY = """
SELECT DISTINCT TRIM(q.accountnumber) AS accountnumber,
       q.year,
       q.month,
       q.cumused,
       'qgis_main_only' AS source
FROM qgis_main q
WHERE q.year = '2026'
  AND TRIM(UPPER(q.month)) = 'MAY'
  AND q.cumused IS NOT NULL
  AND TRIM(q.cumused) <> ''
  AND NOT EXISTS (
      SELECT 1
      FROM tcwd_billing b
      WHERE TRIM(b.accountnumber) = TRIM(q.accountnumber)
        AND b.sync_year = '2026'
        AND TRIM(UPPER(b.sync_month)) = 'MAY'
  )
ORDER BY accountnumber
"""

SQL_BILLING_ONLY = """
SELECT DISTINCT TRIM(b.accountnumber) AS accountnumber,
       b.sync_year AS year,
       b.sync_month AS month,
       NULL AS cumused,
       'tcwd_billing_only' AS source
FROM tcwd_billing b
WHERE b.sync_year = '2026'
  AND TRIM(UPPER(b.sync_month)) = 'MAY'
  AND NOT EXISTS (
      SELECT 1
      FROM qgis_main q
      WHERE TRIM(q.accountnumber) = TRIM(b.accountnumber)
        AND q.year = '2026'
        AND TRIM(UPPER(q.month)) = 'MAY'
        AND q.cumused IS NOT NULL
        AND TRIM(q.cumused) <> ''
  )
ORDER BY accountnumber
"""


def fetch_rows(query):
    with psycopg2.connect(**DB_CONFIG) as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return cur.fetchall()


def write_csv(rows):
    header = ['accountnumber', 'year', 'month', 'cumused', 'source']
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(header)
        writer.writerows(rows)


if __name__ == '__main__':
    qgis_only = fetch_rows(SQL_QGIS_ONLY)
    billing_only = fetch_rows(SQL_BILLING_ONLY)
    all_rows = qgis_only + billing_only
    write_csv(all_rows)
    print(f'Wrote {len(all_rows)} unmatched accounts to {OUTPUT_CSV}')
