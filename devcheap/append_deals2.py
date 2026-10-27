import json
from pathlib import Path
deals_path = Path("C:/Users/Lenovo/daily/devcheap/data/deals.jsonl")
existing = deals_path.read_text(encoding="utf-8").strip().splitlines()
new_deals = [
{"id":"civo-free-credits","name":"Civo Free Credit","category":"Hosting & Cloud","pricing":"free","deal":"$250 Free Credit","code":"Automatic (Link)","url":"https://www.civo.com","affiliate_url":"","tracking_id":"civo","has_affiliate":False,"desc":"Sovereign Cloud and AI platform. $250 free credit for 1 month.","tags":"cloud-compute","why":"Immediate $250 to test.","expires":None,"rating":4.6},
{"id":"kamatera-free-trial","name":"Kamatera 30-Day Free Trial","category":"Hosting & Cloud","pricing":"free","deal":"Up to $100 Trial","code":"Automatic (Link)","url":"https://www.kamatera.com/free-trial/","affiliate_url":"","tracking_id":"kamatera","has_affiliate":False,"desc":"Enterprise IaaS with Cloud Servers, VPS.","tags":"vps","why":"Flexible server config.","expires":None,"rating":4.7},
{"id":"postman-free","name":"Postman","category":"Developer Tools","pricing":"free","deal":"Free Forever Plan","code":"Automatic (Link)","url":"https://www.postman.com","affiliate_url":"","tracking_id":"postman","has_affiliate":False,"desc":"API platform for building testing APIs.","tags":"api","why":"Free API client.","expires":None,"rating":8.5},
{"id":"stackblitz-free","name":"StackBlitz","category":"Developer Tools","pricing":"free","deal":"Free Personal Plan","code":"Automatic (Link)","url":"https://stackblitz.com","affiliate_url":"","tracking_id":"stackblitz","has_affiliate":False,"desc":"Instant dev environments in browser.","tags":"ide","why":"Zero-setup browser IDE.","expires":None,"rating":8.2},
{"id":"motherduck","name":"MotherDuck","category":"Database","pricing":"free","deal":"Free Lite Plan","code":"Automatic (Link)","url":"https://motherduck.com","affiliate_url":"","tracking_id":"motherduck","has_affiliate":False,"desc":"Managed DuckDB analytics warehouse.","tags":"duckdb","why":"Free analytics warehouse.","expires":None,"rating":7.5},
{"id":"clickhouse-cloud","name":"ClickHouse Cloud","category":"Database","pricing":"free","deal":"Start Free + $300 Credits","code":"Automatic (Link)","url":"https://clickhouse.com/cloud","affiliate_url":"","tracking_id":"clickhouse","has_affiliate":False,"desc":"Fully managed ClickHouse.","tags":"clickhouse","why":"$300 credits.","expires":None,"rating":7.8},
{"id":"uptimerobot","name":"UptimeRobot","category":"Monitoring","pricing":"free","deal":"Free Forever","code":"Automatic (Link)","url":"https://uptimerobot.com","affiliate_url":"","tracking_id":"uptimerobot","has_affiliate":False,"desc":"Uptime monitoring.","tags":"uptime","why":"Generous free tier.","expires":None,"rating":4.7},
{"id":"stytch","name":"Stytch","category":"Auth","pricing":"free","deal":"Free for 10,000 MAUs","code":"Automatic (Link)","url":"https://stytch.com","affiliate_url":"","tracking_id":"stytch","has_affiliate":False,"desc":"Modern authentication platform.","tags":"auth","why":"Free 10K MAU.","expires":None,"rating":7.8},
{"id":"workos","name":"WorkOS","category":"Auth","pricing":"free","deal":"Free for First 1M MAUs","code":"Automatic (Link)","url":"https://workos.com","affiliate_url":"","tracking_id":"workos","has_affiliate":False,"desc":"Enterprise-ready authentication.","tags":"auth","why":"1M MAU free.","expires":None,"rating":7.9}
]
output_lines = existing + [json.dumps(d, ensure_ascii=False) for d in new_deals]
deals_path.write_text("\n".join(output_lines) + "\n", encoding="utf-8")
print("done", len(new_deals))

