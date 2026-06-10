# Exporting GeoJSON from PostgreSQL (qgis_main primary)

## Overview
For FlowSense exports, `qgis_main` is the canonical spatial source. Monthly billing should be joined to `qgis_main` per account, and if a billing row is missing for a given period the export must still include the account with `cumused=0`.

## Current export behavior
- The script `.bat/export_geojson_fresh.py` reads available billing periods from `public.tcwd_billing`.
- It uses `qgis_main` as the primary spatial source and joins the latest `tcwd_database` row for each normalized account.
- It then left-joins `public.tcwd_billing` on the target `sync_year` / `sync_month`.
- Missing billing rows are still exported as placeholder rows with `cumused=0`.
- `sync_year` in `tcwd_billing` is stored as text, so string comparison is required.
- Before exporting, the script scans `public/data` for the current month and the previous 3 months.
- If all 4 files already exist, no export is performed. If any file is missing, the script exports the missing month(s) for the latest 4-month window.

## What changed
- `all_data` is no longer the required source for GeoJSON export.
- The export now flows from `qgis_main` first; `all_data` may only be considered later as a fallback for accounts missing from `qgis_main`.
- Placeholder billing rows now preserve the target export period values and do not drop accounts simply because `tcwd_billing` lacks a row.
- The script now checks the `public/data` folder first and only exports the missing months in the current/latest 4-month window.

## Implementation details
1. Normalize account numbers with `TRIM(BOTH FROM accountnumber)`.
2. Use `qgis_main` as the base dataset:
   - `SELECT DISTINCT ON (TRIM(BOTH FROM q.accountnumber)) ... FROM public.qgis_main q`
3. Left-join `public.tcwd_billing` for the target period:
   - `TRIM(BOTH FROM b.sync_year) = %s`
   - `TRIM(UPPER(b.sync_month)) = %s`
4. Default missing usage values:
   - `COALESCE(NULLIF(b.cumused, ''), '0') AS cumused`
5. Export to `public/data/YYYY-MM.geojson`.

## Verification
- After export, confirm that a `qgis_main` account with no billing row still appears in the month file.
- Example: account `0321200294` appears in `2026-04.geojson` with `cumused=0`.

---
_Last updated: 2026-05-29 for qgis_main primary export and missing-billing placeholder behavior._
