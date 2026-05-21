import psycopg2
import json
import os
from datetime import datetime, timedelta
import calendar

# --- CONFIGURATION ---

def get_env(name, default=None, required=False):
    value = os.environ.get(name, default)
    if required and (value is None or value == ''):
        raise EnvironmentError(f"Missing required environment variable: {name}")
    return value

DB_CONFIG = {
    'host': get_env('DB_HOST', '192.168.6.100'),
    'port': int(get_env('DB_PORT', '3448')),
    'database': get_env('DB_NAME', 'fieldofficesync'),
    'user': get_env('DB_USER', 'postgres'),
    'password': get_env('DB_PASSWORD', ''),
}
OUTPUT_DIR = get_env('EXPORT_OUTPUT_DIR', r'd:/APPS/FLOWSENSE/public/data')

# --- DATE LOGIC ---

# --- GET AVAILABLE PERIODS FROM tcwd_billing ---
def get_available_periods():
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("""
            SELECT DISTINCT sync_year, sync_month FROM tcwd_billing
            WHERE sync_year IS NOT NULL AND sync_month IS NOT NULL AND sync_year <> '' AND sync_month <> ''
        """)
        periods = cur.fetchall()
        # Convert to (year, month) tuples, year as int, month as uppercase name
        result = []
        for y, m in periods:
            try:
                year = int(y)
                month_name = m.strip().upper()
                # Convert month name to month number (1-12)
                month_num = list(calendar.month_name).index(month_name.capitalize()) if month_name.capitalize() in calendar.month_name else None
                if month_num:
                    result.append((year, month_num, calendar.monthrange(year, month_num)[1]))
            except Exception:
                continue
        # Sort by year, month and get last 4 periods (last 3 months + current)
        # Ensure each tuple is (year, month, last_day_of_month)
        result = [(y, m, calendar.monthrange(y, m)[1]) for (y, m, _) in sorted(set((y, m, 1) for (y, m, _) in result))]
        return result[-4:]
    finally:
        if conn:
            conn.close()

def geojson_filename(year, month):
    return f"{year:04d}-{month:02d}.geojson"

# --- MAIN EXPORT FUNCTION ---
def export_geojson(year, month, day):
    print(f"[INFO] Exporting for {year}-{month:02d}-{day:02d}")
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        # Use year and month columns for filtering
                # Convert numeric month to uppercase month name (e.g., 2 -> 'FEBRUARY')
        month_name = calendar.month_name[month].upper()
        year_str = str(year)
        print(f"[DEBUG] Querying for year: {year_str}, month: {month_name}")
        # Join tcwd_billing (filtered by period) with latest qgis_main on accountnumber
        cur.execute("""
            SELECT 
                q.ogc_fid, q.wkb_geometry, q.fid, q.remarks, q.comments, q.type, q.accountnumber, q.area, q.longitude, q.latitude, q."nearest meter", q.name, q.address, q.meterno, q.bookno, q.ratecode, q.status, q.cellphone, q.seqno,
                b.prvreading, b.prsreading, b.cumused, b.billamount, b.sync_year, b.sync_month
            FROM tcwd_billing b
            JOIN qgis_main q ON q.accountnumber = b.accountnumber
            WHERE b.sync_year = %s AND TRIM(UPPER(b.sync_month)) = %s
        """, (year_str, month_name))
        rows = cur.fetchall()
        print(f"[INFO] Retrieved {len(rows)} rows.")
        # Build GeoJSON features
        features = []
        import decimal
        for row in rows:
            (
                ogc_fid, wkb_geometry, fid, remarks, comments, type_, accountnumber, area, longitude, latitude, nearest_meter, name, address, meterno, bookno, ratecode, status, cellphone, seqno,
                prvreading, prsreading, cumused, billamount, sync_year, sync_month
            ) = row
            geometry = {
                "type": "Point",
                "coordinates": [longitude, latitude]
            }
            properties = {
                "ogc_fid": ogc_fid,
                "wkb_geometry": str(wkb_geometry),
                "fid": fid,
                "remarks": remarks,
                "comments": comments,
                "type": type_,
                "accountnumber": accountnumber,
                "area": area,
                "nearest meter": nearest_meter,
                "name": name,
                "address": address,
                "meterno": meterno,
                "bookno": bookno,
                "ratecode": ratecode,
                "status": status,
                "cellphone": cellphone,
                "seqno": seqno,
                "prvreading": prvreading,
                "prsreading": prsreading,
                "cumused": cumused,
                "billamount": billamount,
                "year": sync_year,
                "month": sync_month
            }
            # Convert all Decimal values to float or int
            for k, v in properties.items():
                if isinstance(v, decimal.Decimal):
                    if v % 1 == 0:
                        properties[k] = int(v)
                    else:
                        properties[k] = float(v)
            features.append({
                "type": "Feature",
                "geometry": geometry,
                "properties": properties
            })
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        out_path = os.path.join(OUTPUT_DIR, geojson_filename(year, month))
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(geojson, f, ensure_ascii=False, separators=(',', ':'))
        print(f"[SUCCESS] Exported {len(features)} features to {out_path}")
    except Exception as e:
        print(f"[ERROR] Export failed: {e}")
    finally:
        if conn:
            conn.close()

# --- FILE MANAGEMENT ---
def manage_files():
    files = [f for f in os.listdir(OUTPUT_DIR) if f.endswith('.geojson')]
    files.sort()
    while len(files) > 4:
        to_delete = files.pop(0)
        try:
            os.remove(os.path.join(OUTPUT_DIR, to_delete))
            print(f"[INFO] Deleted old file: {to_delete}")
        except Exception as e:
            print(f"[ERROR] Failed to delete {to_delete}: {e}")

if __name__ == '__main__':
    try:
        target_dates = get_available_periods()
        for year, month, day in target_dates:
            export_geojson(year, month, day)
        manage_files()
        print("[DONE] GeoJSON sync complete.")
    except Exception as e:
        print(f"[FATAL ERROR] {e}")
    finally:
        input("\nProcess complete. Press Enter to exit...")
