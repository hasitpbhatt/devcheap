import pathlib
p='C:/Users/Lenovo/daily/devcheap/data/deals.jsonl'
data=pathlib.Path(p).read_bytes()
i=data.find(b'"id": "gamma"')
print(data[i:i+500])
