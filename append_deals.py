import json
from pathlib import Path
deals_path = Path("C:/Users/Lenovo/daily/devcheap/data/deals.jsonl")
existing = deals_path.read_text(encoding="utf-8").strip().splitlines()
new_deals = [
{"id":"upcloud-startup-program","name":"UpCloud Startup Program","category":"Hosting & Cloud","pricing":"free","deal":"Up to $25,000 Startup Credits","code":"boost500","url":"https://upcloud.com/global/upcloud-startup-program/","affiliate_url":"","tracking_id":"upcloud-startup","has_affiliate":False,"desc":"High-performance European sovereign cloud.","tags":"cloud,vps","why":"Up to $25k credits.","expires":None,"rating":4.8}
]
output_lines = existing + [json.dumps(d, ensure_ascii=False) for d in new_deals]
deals_path.write_text("\n".join(output_lines) + "\n", encoding="utf-8")
print("done")
