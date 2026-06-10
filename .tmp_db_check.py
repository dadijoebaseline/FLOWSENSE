import psycopg2
import os
DB_CONFIG = {'host':'192.168.6.100','port':3448,'database':'fieldofficesync','user':'postgres','password':'tcwddatabase'}
output_path = os.path.join(os.path.dirname(__file__), '.tmp_db_check_out.txt')
with open(output_path, 'w', encoding='utf-8') as out:
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("SELECT sync_year, sync_month, accountnumber, cumused FROM public.tcwd_billing WHERE trim(accountnumber) = %s ORDER BY sync_year, sync_month", ('0321200294',))
    rows = cur.fetchall()
    out.write(f'rows={len(rows)}\n')
    for r in rows:
        out.write(str(r) + '\n')
    cur.execute("SELECT count(*) FROM public.tcwd_billing WHERE trim(accountnumber)= %s AND sync_year=%s AND trim(upper(sync_month))=%s", ('0321200294','2026','MAY'))
    out.write('may_count=' + str(cur.fetchone()[0]) + '\n')
    cur.execute("SELECT count(*) FROM public.tcwd_billing WHERE trim(accountnumber)= %s AND sync_year=%s AND trim(upper(sync_month))=%s", ('0321200294','2026','APRIL'))
    out.write('april_count=' + str(cur.fetchone()[0]) + '\n')
    cur.close()
    conn.close()
