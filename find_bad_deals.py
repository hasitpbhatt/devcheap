import pathlib, json
p='C:/Users/Lenovo/daily/devcheap/data/deals.jsonl'
lines=pathlib.Path(p).read_text(encoding='utf-8').splitlines()
for i,l in enumerate(lines):
    if '�' in l or ' -??? ' in l:
        try:
            d=json.loads(l)
            print(i, d['id'], repr(d.get('why','')[:100]))
        except:
            pass
