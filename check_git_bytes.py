import subprocess
out=subprocess.check_output(['git','show','71b7176:data/deals.jsonl'])
data=out
i=data.find(b'"id":"ai21"')
print(data[i:i+600])
