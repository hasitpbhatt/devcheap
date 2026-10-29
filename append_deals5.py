import json
from pathlib import Path
deals_path = Path("C:/Users/Lenovo/daily/devcheap/data/deals.jsonl")
existing = deals_path.read_text(encoding="utf-8").strip().splitlines()
new_deals = [
{"id":"sentry-free","name":"Sentry","category":"Monitoring","pricing":"free","deal":"Free Forever","code":"Automatic (Link)","url":"https://sentry.io","affiliate_url":"","tracking_id":"sentry","has_affiliate":False,"desc":"Error tracking and performance monitoring.","tags":"error","why":"Generous free tier.","expires":None,"rating":8.2},
{"id":"posthog-free","name":"PostHog","category":"Monitoring","pricing":"free","deal":"Free Tier","code":"Automatic (Link)","url":"https://posthog.com","affiliate_url":"","tracking_id":"posthog","has_affiliate":False,"desc":"Product analytics and session replay.","tags":"analytics","why":"Free self-hosted and cloud.","expires":None,"rating":8.0},
{"id":"logtail-free","name":"Logtail","category":"Monitoring","pricing":"free","deal":"Free Plan","code":"Automatic (Link)","url":"https://logtail.com","affiliate_url":"","tracking_id":"logtail","has_affiliate":False,"desc":"Log management for developers.","tags":"logs","why":"Free daily volume.","expires":None,"rating":7.3},
{"id":"betterstack-free","name":"Better Stack","category":"Monitoring","pricing":"free","deal":"Free Forever","code":"Automatic (Link)","url":"https://betterstack.com","affiliate_url":"","tracking_id":"betterstack","has_affiliate":False,"desc":"Uptime, logs, and error monitoring.","tags":"observability","why":"Free starter plan.","expires":None,"rating":7.6},
{"id":"airtable-free-tier","name":"Airtable","category":"Productivity","pricing":"free","deal":"Free Free Plan","code":"Automatic (Link)","url":"https://airtable.com","affiliate_url":"","tracking_id":"airtable","has_affiliate":False,"desc":"No-code database and app builder.","tags":"productivity","why":"Free collaborative base.","expires":None,"rating":7.5},
{"id":"figma-free","name":"Figma","category":"Design & Collaboration","pricing":"free","deal":"Free Plan","code":"Automatic (Link)","url":"https://figma.com","affiliate_url":"","tracking_id":"figma","has_affiliate":False,"desc":"Collaborative design and prototyping.","tags":"design","why":"Free for individuals.","expires":None,"rating":8.4},
{"id":"notion-free","name":"Notion","category":"Productivity","pricing":"free","deal":"Free Plan","code":"Automatic (Link)","url":"https://www.notion.so","affiliate_url":"","tracking_id":"notion","has_affiliate":False,"desc":"All-in-one workspace for notes and tasks.","tags":"productivity","why":"Free personal use.","expires":None,"rating":8.5},
{"id":"slack-free","name":"Slack","category":"Customer Support","pricing":"free","deal":"Free Forever","code":"Automatic (Link)","url":"https://slack.com","affiliate_url":"","tracking_id":"slack","has_affiliate":False,"desc":"Team messaging and collaboration.","tags":"collaboration","why":"Free basic plan.","expires":None,"rating":7.8},
{"id":"github-codespaces-free","name":"GitHub Codespaces","category":"Developer Tools","pricing":"free","deal":"Free Tier","code":"Automatic (Link)","url":"https://github.com/features/codespaces","affiliate_url":"","tracking_id":"codespaces","has_affiliate":False,"desc":"Cloud development environments.","tags":"dev","why":"60 core-hours free.","expires":None,"rating":7.9},
{"id":"docker-hub-free","name":"Docker Hub","category":"Developer Tools","pricing":"free","deal":"Free Plan","code":"Automatic (Link)","url":"https://hub.docker.com","affiliate_url":"","tracking_id":"docker","has_affiliate":False,"desc":"Container image registry free tier.","tags":"docker","why":"Private repos free tier.","expires":None,"rating":7.4}
]
output_lines = existing + [json.dumps(d, ensure_ascii=False) for d in new_deals]
deals_path.write_text("\n".join(output_lines) + "\n", encoding="utf-8")
print("Appended", len(new_deals))

