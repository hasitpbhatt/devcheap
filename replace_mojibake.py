import pathlib
p='C:/Users/Lenovo/daily/devcheap/data/deals.jsonl'
data=pathlib.Path(p).read_bytes()
# replace common mojibake patterns
replacements=[
(b'\xc3\xa2\xe2\x82\xac\xe2\x80\x9d', b'\xe2\x80\x94'),  # em dash
(b'\xc3\xa2\xe2\x82\xac\xe2\x80\x9c', b'\xe2\x80\x94'),
(b'\xc3\xa2\xe2\x82\xac\xe2\x80\x99', b'\xe2\x80\x94'),
]
for old,new in replacements:
    data=data.replace(old,new)
pathlib.Path(p).write_bytes(data)
print('done')
