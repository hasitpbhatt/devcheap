import pathlib, re
p='C:/Users/Lenovo/daily/devcheap/data/deals.jsonl'
data=pathlib.Path(p).read_bytes()
pat=re.compile(b'\\xc3\\xa2')
uniq=set()
for m in pat.finditer(data):
    start=m.start()
    # get next 8 bytes
    seq=data[start:start+8].hex()
    uniq.add(seq)
print('\n'.join(sorted(uniq)[:30]))
print('count', len(uniq))
