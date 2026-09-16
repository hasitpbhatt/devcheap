import pathlib
p='C:/Users/Lenovo/daily/devcheap/data/deals.jsonl'
data=pathlib.Path(p).read_bytes()
s=data.decode('utf-8')
# Reverse cp1252 mojibake
try:
    b_fixed=s.encode('cp1252', errors='replace')
    s_fixed=b_fixed.decode('utf-8', errors='replace')
except Exception as e:
    print('error', e)
    s_fixed=s
out_path='C:/temp/deals_fixed.jsonl'
pathlib.Path(out_path).write_text(s_fixed, encoding='utf-8')
print('done', out_path)
# check count of c3a2
print('c3a2 count before', data.count(b'\xc3\xa2'))
print('c3a2 count after', s_fixed.encode('utf-8').count(b'\xc3\xa2'))
