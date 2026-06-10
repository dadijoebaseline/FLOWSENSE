path = r'.\\public\\data\\2026-05.geojson'
search = '0321200294'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()
idx = text.find(search)
print('idx', idx)
if idx != -1:
    start = max(0, idx-120)
    end = min(len(text), idx+120)
    print(text[start:end].replace('\n',' '))
