# Exporting GeoJSON from PostgreSQL (Unfiltered)

## Overview
To ensure the FlowSense dashboard receives complete, unfiltered GeoJSON data, export must be performed from the true base table containing all records—not from a filtered view.

## Steps

1. **Identify the Base Table**
   - If `qgis_full_inventory` is a view, inspect its definition to find the underlying table with all records (e.g., 3 million rows).
   - Use a query like:
     ```sql
     SELECT definition FROM pg_views WHERE viewname = 'qgis_full_inventory';
     ```
   - Or inspect in pgAdmin/DBeaver.

2. **Create an Unfiltered Copy**
   - Use the following SQL to create a full copy:
     ```sql
     DROP TABLE IF EXISTS all_data;
     CREATE TABLE all_data AS SELECT * FROM <base_table_name>;
     ```
   - Replace `<base_table_name>` with the actual table name.

3. **Update the Export Script**
   - Change the table name in `export_geojson.py` from `qgis_full_inventory` to `all_data`.
   - This ensures all exports use the complete, unfiltered dataset.

4. **Export GeoJSON**
   - Run the script as usual. It will now export all available records for each month.

## Notes
- If the base table changes, repeat the copy process to refresh `all_data`.
- Always verify the row count in `all_data` matches your expectations before exporting.

---
_Last updated: 2026-05-14 for full-data export protocol._
