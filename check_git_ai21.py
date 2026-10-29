import subprocess, json
out=subprocess.check_output(['git','show','71b7176:data/deals.jsonl'])
lines=out.decode('utf-8').splitlines()
for l in lines:
    if '"id":"ai21"' in l:
        d=json.loads(l)
        print(d['desc'])
        break
