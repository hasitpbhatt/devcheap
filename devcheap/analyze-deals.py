import json

with open('data/deals.jsonl', 'r') as f:
    deals = [json.loads(line) for line in f if line.strip()]

print(f'Total deals in data/deals.jsonl: {len(deals)}')
print(f'Categories: {set(d["category"] for d in deals)}')
print(f'Category count: {len(set(d["category"] for d in deals))}')
print(f'Average rating: {sum(d["rating"] for d in deals) / len(deals):.2f}')
print(f'Pricing types: {set(d["pricing"] for d in deals)}')

# Count by category
category_counts = {}
for deal in deals:
    category_counts[deal["category"]] = category_counts.get(deal["category"], 0) + 1

print("\nDeal counts by category:")
for category, count in sorted(category_counts.items()):
    print(f"  {category}: {count}")

# Check for expired deals
from datetime import datetime
now = datetime.now()
expired_deals = []
for deal in deals:
    if deal["expires"] and deal["expires"] != "null":
        expiry_date = datetime.strptime(deal["expires"], "%Y-%m-%d")
        if expiry_date < now:
            expired_deals.append(deal)

print(f"\nExpired deals: {len(expired_deals)}")
for deal in expired_deals[:5]:
    print(f"  - {deal['name']}")