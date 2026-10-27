import pathlib, json
p='C:/Users/Lenovo/daily/devcheap/data/deals.jsonl'
lines=pathlib.Path(p).read_text(encoding='utf-8').splitlines()
for i,l in enumerate(lines):
    if '�' in l:
        print(i, l[:500])
