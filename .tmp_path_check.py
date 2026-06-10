import os
print('cwd', os.getcwd())
path = os.path.abspath(r'.\\public\\data\\2026-05.geojson')
print('path', path)
print('exists', os.path.exists(path))
print('size', os.path.getsize(path) if os.path.exists(path) else 'missing')
