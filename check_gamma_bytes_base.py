import subprocess
out=subprocess.check_output(['git','show','71b7176:data/deals.jsonl'])
i=out.find(b'"id":"gamma"')
print(out[i:i+500])
