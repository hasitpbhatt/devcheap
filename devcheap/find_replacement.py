import pathlib, json
p='C:/Users/Lenovo/daily/devcheap/data/deals.jsonl'
data=pathlib.Path(p).read_bytes()
# find lines containing replacement char
lines=data.split(b'\n')
for i,l in enumerate(lines):
    if b'\xef\xbf\xbd' in l:
        print(i, l[:200])
