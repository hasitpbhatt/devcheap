import subprocess, json, pathlib
# load git base
git_data = subprocess.check_output(['git','show','71b7176:data/deals.jsonl'])
base_lines = git_data.decode('utf-8').splitlines()
base_deals = {}
for l in base_lines:
    if not l.strip(): continue
    d = json.loads(l)
    base_deals[d['id']] = d

# load current
cur_path='C:/Users/Lenovo/daily/devcheap/data/deals.jsonl'
cur_data = pathlib.Path(cur_path).read_text(encoding='utf-8').splitlines()
cur_deals = {}
for l in cur_data:
    if not l.strip(): continue
    d = json.loads(l)
    cur_deals[d['id']] = d

# merge: prefer base if exists, else current
merged = []
seen=set()
# start with base deals in original order, but if current has newer version with rating etc, keep current? Let's prioritize base for existing ids to clean mojibake.
# We'll iterate over current order, and if id in base, use base deal (clean)
for l in cur_data:
    if not l.strip(): continue
    d = json.loads(l)
    id_ = d['id']
    if id_ in base_deals:
        merged.append(base_deals[id_])
    else:
        merged.append(d)
    # ensure unique
# Write merged
out_lines = [json.dumps(d, ensure_ascii=False) for d in merged]
pathlib.Path(cur_path).write_text('\n'.join(out_lines)+'\n', encoding='utf-8')
print('merged', len(merged))
