import pathlib, json
p='C:/temp/deals_fixed.jsonl'
data=pathlib.Path(p).read_text(encoding='utf-8')
lines=data.split('\n')
count=0
bad=[]
for i,l in enumerate(lines):
    if not l.strip():
        continue
    try:
        json.loads(l)
        count+=1
    except Exception as e:
        bad.append((i,str(e),l[:100]))
print('count',count)
print('bad',len(bad))
if bad:
    print(bad[:5])
