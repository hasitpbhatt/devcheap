import pathlib
p='C:/Users/Lenovo/daily/devcheap/data/deals.jsonl'
data=pathlib.Path(p).read_bytes()
lines=data.split(b'\n')
out=[]
for i,l in enumerate(lines):
    if b'\xef\xbf\xbd' in l:
        out.append(f"{i}:{l.decode('utf-8', errors='replace')[:200]}")
pathlib.Path('C:/temp/repl.txt').write_text('\n'.join(out), encoding='utf-8')
print('written')
