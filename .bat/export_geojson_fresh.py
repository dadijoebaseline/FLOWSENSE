import logging
import psycopg2
import json
import os
import sys
from datetime import datetime, timedelta, timezone
import calendar

# --- LOGGING ---
LOG_FILE = os.path.join(os.path.dirname(__file__), 'export_geojson_fresh.log')
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('export_geojson_fresh')

# --- CONFIGURATION ---

def get_env(name, default=None, required=False):
    value = os.environ.get(name, default)
    if required and (value is None or value == ''):
        raise EnvironmentError(f"Missing required environment variable: {name}")
    return value

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'export_geojson_config.json')
CONFIG = {}
if os.path.exists(CONFIG_PATH):
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            CONFIG = json.load(f)
    except Exception as e:
        raise EnvironmentError(f"Unable to load config file {CONFIG_PATH}: {e}")

def get_config(name, default=None):
    return CONFIG.get(name, default)

DB_CONFIG = {
    'host': get_env('DB_HOST', '192.168.6.100'),
    'port': int(get_env('DB_PORT', '3448')),
    'database': get_env('DB_NAME', 'fieldofficesync'),
    'user': get_env('DB_USER', 'postgres'),
    'password': get_env('DB_PASSWORD', 'tcwddatabase'),
}
OUTPUT_DIR = get_env('EXPORT_OUTPUT_DIR', r'\\192.168.6.100\Programs\FLOWSENSE\public\data')
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- DATE LOGIC ---

# --- GET AVAILABLE PERIODS FROM tcwd_billing ---

def parse_month_value(raw_month):
    if raw_month is None:
        return None
    try:
        return int(str(raw_month).strip())
    except Exception:
        month_name = str(raw_month).strip().upper()
        month_names = [m.upper() for m in calendar.month_name]
        month_abbrs = [m.upper() for m in calendar.month_abbr]
        if month_name in month_names:
            return month_names.index(month_name)
        if month_name in month_abbrs:
            return month_abbrs.index(month_name)
    return None


def get_available_periods():
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("""
            SELECT DISTINCT sync_year, sync_month, sync_date
            FROM public.tcwd_billing
            WHERE sync_year IS NOT NULL
              AND trim(sync_year) <> ''
              AND sync_month IS NOT NULL
              AND trim(sync_month) <> ''
        """)
        rows = cur.fetchall()
        logger.info('tcwd_billing candidate rows: %d', len(rows))
        period_map = {}
        invalid_periods = {}
        for raw_year, raw_month, updated_at in rows:
            try:
                year = int(raw_year)
            except Exception:
                invalid_periods.setdefault(('year', raw_year), 0)
                invalid_periods[('year', raw_year)] += 1
                continue
            month = parse_month_value(raw_month)
            if month is None or month < 1 or month > 12:
                invalid_periods.setdefault(('month', raw_month), 0)
                invalid_periods[('month', raw_month)] += 1
                continue
            period_date = updated_at if isinstance(updated_at, datetime) else datetime(year, month, 1)
            if isinstance(period_date, datetime) and period_date.tzinfo is not None:
                period_date = period_date.astimezone(timezone.utc).replace(tzinfo=None)
            key = (year, month)
            if key not in period_map or period_date > period_map[key]:
                period_map[key] = period_date
        if not period_map:
            logger.error('No usable billing periods found after parsing tcwd_billing rows.')
            if invalid_periods:
                logger.error('Invalid period values sample:')
                for (kind, value), count in sorted(invalid_periods.items(), key=lambda item: item[1], reverse=True)[:20]:
                    logger.error('  %s=%r (%d rows)', kind, value, count)
            raise RuntimeError('No available billing period found in tcwd_billing for export.')
        result = sorted(period_map.keys(), key=lambda k: period_map[k])
        result = [(y, m, calendar.monthrange(y, m)[1]) for (y, m) in result]
        logger.info('Available export periods: %s', result)
        return result[-1:]
    finally:
        if conn:
            conn.close()

def geojson_filename(year, month):
    return f"{year:04d}-{month:02d}.geojson"

def get_export_window(year, month, count=4):
    window = []
    for _ in range(count):
        window.append((year, month, calendar.monthrange(year, month)[1]))
        if month == 1:
            year -= 1
            month = 12
        else:
            month -= 1
    window.reverse()
    return window

def all_geojsons_exist(latest_year, latest_month, count=4):
    for year, month, _ in get_export_window(latest_year, latest_month, count):
        if not os.path.exists(os.path.join(OUTPUT_DIR, geojson_filename(year, month))):
            return False
    return True

# --- MAIN EXPORT FUNCTION ---
def export_geojson(year, month, day):
    logger.info('Exporting for %04d-%02d-%02d', year, month, day)
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        # Use billing sync year/month for filtering
        month_name = calendar.month_name[month].upper()
        year_str = str(year)
        logger.info('Querying billing data for year=%s, month=%s', year_str, month_name)
        # Join tcwd_billing with the latest tcwd_database row per accountnumber.
        # Use qgis_main as the primary spatial source, and fallback to all_data only
        # for accounts that are missing from qgis_main.
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
            billing_with_spatial AS (
                SELECT
                    q.ogc_fid,
                    q.wkb_geometry,
                    q.fid,
                    q.remarks,
                    q.comments,
                    q.type,
                    q.acct AS accountnumber,
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
                    q.seqno,
                    d.lastsync,
                    b.prvreading,
                    b.prsreading,
                    COALESCE(NULLIF(b.cumused, ''), '0') AS cumused,
                    b.billamount,
                    COALESCE(b.sync_year::text, %s) AS sync_year,
                    COALESCE(b.sync_month, %s) AS sync_month
                FROM latest_qgis_main q
                LEFT JOIN latest_tcwd_database d
                    ON q.acct = d.acct
                LEFT JOIN public.tcwd_billing b
                    ON q.acct = TRIM(BOTH FROM b.accountnumber)
                    AND TRIM(BOTH FROM b.sync_year) = %s
                    AND TRIM(UPPER(b.sync_month)) = %s
            )
            SELECT * FROM billing_with_spatial
        """, (
            year_str, month_name,
            year_str, month_name))
        rows = cur.fetchall()
        logger.info('Retrieved %d rows for export query.', len(rows))
        # Build GeoJSON features
        features = []
        import decimal
        for row in rows:
            (
                ogc_fid, wkb_geometry, fid, remarks, comments, type_, accountnumber, area, longitude, latitude, nearest_meter, name, address, meterno, bookno, ratecode, status, cellphone, seqno,
                lastsync, prvreading, prsreading, cumused, billamount, sync_year, sync_month
            ) = row
            if longitude is not None and latitude is not None:
                geometry = {
                    "type": "Point",
                    "coordinates": [longitude, latitude]
                }
            else:
                geometry = None
            if cumused is None or cumused == '':
                cumused_value = 0
            else:
                try:
                    if isinstance(cumused, str):
                        cumused_value = float(cumused)
                    elif isinstance(cumused, decimal.Decimal):
                        cumused_value = float(cumused)
                    else:
                        cumused_value = float(cumused)
                except Exception:
                    cumused_value = 0
                if isinstance(cumused_value, float) and cumused_value.is_integer():
                    cumused_value = int(cumused_value)

            properties = {
                "ogc_fid": ogc_fid,
                "wkb_geometry": str(wkb_geometry) if wkb_geometry is not None else None,
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
                "last_tcwd_sync": lastsync,
                "prvreading": prvreading,
                "prsreading": prsreading,
                "cumused": cumused_value,
                "billamount": billamount,
                "year": sync_year,
                "month": sync_month
            }
            # Convert non-JSON-safe types
            for k, v in properties.items():
                if isinstance(v, decimal.Decimal):
                    if v % 1 == 0:
                        properties[k] = int(v)
                    else:
                        properties[k] = float(v)
                elif isinstance(v, datetime):
                    properties[k] = v.isoformat()
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
            json.dump(geojson, f, ensure_ascii=False, separators=(',', ':'), default=str)
        logger.info('Exported %d features to %s', len(features), out_path)
    except Exception as e:
        logger.exception('Export failed: %s', e)
        raise
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
            logger.info('Deleted old file: %s', to_delete)
        except Exception as e:
            logger.exception('Failed to delete %s: %s', to_delete, e)

if __name__ == '__main__':
    try:
        logger.info('Starting export_geojson_fresh.py')
        target_dates = get_available_periods()
        if not target_dates:
            raise RuntimeError('No available billing period found in tcwd_billing for export.')
        latest_year, latest_month, _ = target_dates[-1]
        if all_geojsons_exist(latest_year, latest_month, 4):
            logger.info('All current and previous 3 month geojson files already exist. No export needed.')
        else:
            window_dates = get_export_window(latest_year, latest_month, 4)
            for year, month, day in window_dates:
                out_path = os.path.join(OUTPUT_DIR, geojson_filename(year, month))
                if not os.path.exists(out_path):
                    export_geojson(year, month, day)
                else:
                    logger.info('Skipping existing geojson: %s', out_path)
        manage_files()
        logger.info('GeoJSON sync complete.')
    except Exception as e:
        logger.exception('FATAL ERROR: %s', e)
