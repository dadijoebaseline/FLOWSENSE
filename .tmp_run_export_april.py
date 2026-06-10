import os, sys
sys.path.insert(0, os.path.abspath('.\\.bat'))
import export_geojson_fresh
print('running export_geojson for 2026-04-30')
export_geojson_fresh.export_geojson(2026, 4, 30)
print('done')
