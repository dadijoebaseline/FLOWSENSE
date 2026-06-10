path = r'.\\public\\data\\2026-05.geojson'
search = '0321200294'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()
print('raw_count', text.count(search))
