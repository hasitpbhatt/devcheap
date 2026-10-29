import json
from pathlib import Path
deals_path = Path("C:/Users/Lenovo/daily/devcheap/data/deals.jsonl")
existing = deals_path.read_text(encoding="utf-8").strip().splitlines()
new_deals = [
{"id":"appsignal-free","name":"AppSignal","category":"Monitoring","pricing":"free","deal":"Free Forever","code":"Automatic (Link)","url":"https://appsignal.com","affiliate_url":"","tracking_id":"appsignal","has_affiliate":False,"desc":"Application performance monitoring.","tags":"apm","why":"Generous free quota.","expires":None,"rating":7.5},
{"id":"honeycomb-free","name":"Honeycomb","category":"Monitoring","pricing":"free","deal":"Free Forever","code":"Automatic (Link)","url":"https://www.honeycomb.io","affiliate_url":"","tracking_id":"honeycomb","has_affiliate":False,"desc":"Observability for engineering teams.","tags":"observability","why":"Free plan available.","expires":None,"rating":7.0},
{"id":"fusionauth-free","name":"FusionAuth","category":"Auth","pricing":"free","deal":"Self-hosted Free","code":"Automatic (Link)","url":"https://fusionauth.io","affiliate_url":"","tracking_id":"fusionauth","has_affiliate":False,"desc":"Open-source identity platform.","tags":"auth","why":"Self-hosted free.","expires":None,"rating":7.3},
{"id":"supabase-free","name":"Supabase Free Tier","category":"Database","pricing":"free","deal":"Free Tier","code":"Automatic (Link)","url":"https://supabase.com","affiliate_url":"","tracking_id":"supabase","has_affiliate":False,"desc":"Postgres database, auth, storage.","tags":"postgres","why":"Generous free tier.","expires":None,"rating":8.2},
{"id":"meilisearch-free","name":"Meilisearch Cloud Free","category":"APIs & Search","pricing":"free","deal":"Free Forever","code":"Automatic (Link)","url":"https://www.meilisearch.com","affiliate_url":"","tracking_id":"meilisearch","has_affiliate":False,"desc":"Fast, lightweight search engine.","tags":"search","why":"Free cloud tier.","expires":None,"rating":7.8},
{"id":"qase-test-management","name":"Qase","category":"Testing & QA","pricing":"free","deal":"Free Starter","code":"Automatic (Link)","url":"https://qase.io","affiliate_url":"","tracking_id":"qase","has_affiliate":False,"desc":"Test case management platform.","tags":"qa","why":"Free starter plan.","expires":None,"rating":7.4},
{"id":"idrive-cloud-backup","name":"IDrive Cloud Backup","category":"Storage & Cloud","pricing":"free","deal":"5GB Free","code":"Automatic (Link)","url":"https://www.idrive.com","affiliate_url":"","tracking_id":"idrive","has_affiliate":False,"desc":"Cloud backup storage free tier.","tags":"backup","why":"5GB free.","expires":None,"rating":6.9},
{"id":"cloudflare-workers-free","name":"Cloudflare Workers","category":"Hosting & Cloud","pricing":"free","deal":"Free Tier","code":"Automatic (Link)","url":"https://workers.cloudflare.com","affiliate_url":"","tracking_id":"workers","has_affiliate":False,"desc":"Edge compute free tier.","tags":"edge","why":"100k requests free.","expires":None,"rating":8.1},
{"id":"vercel-edge-functions-free","name":"Vercel Edge Functions","category":"Hosting & Cloud","pricing":"free","deal":"Free Hobby","code":"Automatic (Link)","url":"https://vercel.com","affiliate_url":"","tracking_id":"vercel","has_affiliate":False,"desc":"Edge functions free tier.","tags":"edge","why":"Generous free hobby plan.","expires":None,"rating":8.0},
{"id":"railway-free","name":"Railway","category":"Hosting & Cloud","pricing":"free","deal":"Free Tier","code":"Automatic (Link)","url":"https://railway.app","affiliate_url":"","tracking_id":"railway","has_affiliate":False,"desc":"Deploy apps with $5 free credit.","tags":"deploy","why":"Free hosting credit.","expires":None,"rating":7.9}
]
output_lines = existing + [json.dumps(d, ensure_ascii=False) for d in new_deals]
deals_path.write_text("\n".join(output_lines) + "\n", encoding="utf-8")
print("Appended", len(new_deals))

