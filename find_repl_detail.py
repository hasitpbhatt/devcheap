import pathlib
p='C:/Users/Lenovo/daily/devcheap/data/deals.jsonl'
data=pathlib.Path(p).read_bytes()
lines=data.split(b'\n')
out=[]
for i,l in enumerate(lines):
    if b'\xef\xbf\xbd' in l:
        idx=l.find(b'\xef\xbf\xbd')
        snippet=l[max(0,idx-100):idx+100]
        out.append(f"Line {i}:\n{snippet.decode('utf-8', errors='replace')}\n")
pathlib.Path('C:/temp/repl_detail.txt').write_text('\n'.join(out), encoding='utf-8')
print('done')
