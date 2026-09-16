import pathlib, re
p='C:/Users/Lenovo/daily/devcheap/data/deals.jsonl'
data=pathlib.Path(p).read_bytes()
pat=re.compile(b'\\xc3\\xa2\\xe2\\x82\\xac.{2}')
uniq=set()
for m in pat.finditer(data):
    uniq.add(data[m.start():m.start()+8].hex())
print('\n'.join(sorted(uniq)))
