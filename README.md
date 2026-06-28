# DevCheap

DevCheap is a lightweight GitHub Pages site with curated LLM and developer resources — prompts, tooling, quickstarts, and links that get you building quickly.

## Deploying to GitHub Pages
- I added a CNAME file with `devcheap.click`. After this repo is pushed, go to Settings → Pages and set the site source to the `main` branch (root). GitHub Pages will publish at https://devcheap.click (after DNS updates).

### DNS (apex domain)
Add these A records in your DNS provider for devcheap.click:
- 185.199.108.153
- 185.199.109.153
- 185.199.110.153
- 185.199.111.153

If you prefer www.devcheap.click, add a CNAME for `www` pointing to `hasitpbhatt.github.io` and consider redirecting the apex to `www`.

## Contributing
- Add resources under `/resources/` as Markdown files. Update `/resources/index.json` to include metadata (title, desc, url).
- Add prompts under `/prompts/` and update `/prompts/index.json`.

## License
This project is available under the MIT License (see LICENSE).
