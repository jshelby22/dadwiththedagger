# Dad With The Dagger

Personal, static food-and-fitness website for **dadwiththedagger.com**. No storefront, backend, account system, analytics, cookies, or paid hosting dependency. Designed for GitHub Pages.

## Edit and preview

Requires Node 24+ and Python 3 for the local preview.

```sh
npm ci
npm run build
npm test
npm run serve
```

Open `http://127.0.0.1:4178`.

- Homepage: `site/index.html`
- Design: `site/assets/styles.css`
- Small progressive enhancements: `site/assets/site.js`
- Recipe content: `content/recipes.json` (run `npm run build` after editing)
- Recipe/privacy/404 generation: `scripts/build-pages.mjs`
- Research: `docs/design-research.md`
- Content and image provenance: `docs/content-provenance.md`

Only `site/` is deployed. `docs/`, tests, source recipes and scripts are not part of the public website, but are visible in this public source repository.

## Verification

```sh
npx playwright install chromium
npm run test:browser
```

Tests cover required sections, preserved affiliate parameters, local links/assets, JSON metadata, mobile navigation, clipboard success/failure, print controls, no-JavaScript access, responsive overflow, image loading, browser errors and automated accessibility checks.

## Publication

Push `main` to run the GitHub Actions Pages workflow. The Pages source must be **GitHub Actions**, not branch publishing. Custom domain: `dadwiththedagger.com`. The GoDaddy apex should use GitHub's four A records; `www` should be a CNAME to `jshelby22.github.io`. Do not change nameservers or unrelated verification/mail records.

## Content boundaries

- Bio is initial copy based on James's stated working-dad context. No weight-loss numbers or professional credentials are invented.
- HTLT URL is exactly `https://www.htltsupps.com?sca_ref=10886340.d8RxKeL1BQC`. Code: `DADDAGGER`; offer: 15%, supplied by James. This is not a claim of checkout verification or universal eligibility.
- Individual HTLT product endorsements are deliberately absent until James supplies the products he actually uses.
- Chipotle sauce is an **incomplete ingredient-note page**, explicitly labeled. The original reel shows RO-TEL, absent from its caption; can sizes and exact written method need confirmation. Do not add estimated nutrition or Recipe rich-result markup until finalized.
- Other meal-prep recipes preserve recorded ingredients and portions from James's saved notes. Nutrition, prep times, ratings and claims of independent recipe testing are not fabricated.
- No source photographs of children, private weigh-in logs, exports, credentials or Shopify admin data are published.

## Ownership

James's content and original site design are not offered under an open-source reuse license. HTLT owns its logo. Google Fonts are included under their SIL Open Font Licenses in `site/assets/licenses/`.
