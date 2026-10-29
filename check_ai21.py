import pathlib, json
p='C:/Users/Lenovo/daily/devcheap/data/deals.jsonl'
lines=pathlib.Path(p).read_text(encoding='utf-8').splitlines()
for l in lines:
    if '"id":"ai21"' in l:
        deal=json.loads(l)
        print(deal['desc'])
        break
