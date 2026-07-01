$jsonl = Get-Content "$PSScriptRoot\..\data\deals.jsonl" -Encoding UTF8
$items = @()

foreach ($line in $jsonl) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  $deal = $line | ConvertFrom-Json

  $title = [System.Security.SecurityElement]::Escape($deal.name + ' — ' + $deal.deal)
  $link = 'https://devcheap.click/' + $deal.id
  $desc = [System.Security.SecurityElement]::Escape($deal.why + ' ' + $deal.desc)
  $guid = $deal.id
  $cat = [System.Security.SecurityElement]::Escape($deal.category)

  if ($deal.expires) {
    $pubDate = [DateTime]::Parse($deal.expires).ToString('r')
  } else {
    $pubDate = 'Mon, 01 Jul 2026 00:00:00 GMT'
  }

  $items += @"
    <item>
      <title>$title</title>
      <link>$link</link>
      <description>$desc</description>
      <pubDate>$pubDate</pubDate>
      <guid isPermaLink="false">$guid</guid>
      <category>$cat</category>
    </item>
"@
}

$feed = @"
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DevCheap — Verified Developer Deals</title>
    <link>https://devcheap.click/</link>
    <description>Verified deals on APIs, hosting, databases, and AI tools. Free credits, lifetime discounts, and limited offers curated weekly.</description>
    <language>en-us</language>
    <lastBuildDate>$([DateTime]::UtcNow.ToString('r'))</lastBuildDate>
    <atom:link href="https://devcheap.click/feed.xml" rel="self" type="application/rss+xml"/>
$($items -join "`n")
  </channel>
</rss>
"@

$feed | Out-File "$PSScriptRoot\..\feed.xml" -Encoding UTF8
Write-Host "Generated feed.xml with $($items.Count) items"
