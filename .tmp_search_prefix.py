path = r'.\\public\\data\\2026-05.geojson'
for prefix in ['0321', '032120', '0321200294']:
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    print(prefix, text.count(prefix))
