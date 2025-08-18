# Deploy Notes

A concise checklist to ship the MVP safely.

## 1) Commit

Use this conventional commit message:

- feat(ui): polish MVP — controls, legend, a11y, layout

## 2) Push

- Push to the `main` branch
- Ensure CI (if configured) is green

## 3) Verify Vercel auto-deploy

- Open the new Vercel deployment URL
- Verify pages render without errors
- Promote to Production if preview is healthy

## 4) Incognito sanity checks (Production URL)

- Load time under ~3s on typical broadband
- Sticky header visible; anchors jump to `#features`, `#map`, `#sources`, `#contact`
- Map renders inside a card; container is focusable and keyboard operable
- Controls panel has Indicator/Scale selects; changing them updates the URL without reload
- Legend updates with indicator/scale; shows five colour steps and a “No data” swatch when applicable
- Attribution chip or Sources section is present and readable
- Focus states are clearly visible on links, buttons, and selects

## 5) If OSM tiles rate-limit

Before production, switch to a tile provider with an API key/quota (e.g. MapTiler, Mapbox, Thunderforest). Update the raster tile URL in `components/Map.tsx` and keep correct attribution. Avoid shipping token-free public endpoints in production to prevent rate-limit incidents.

## 6) Optional: Lighthouse gate

- Run Lighthouse on the deployed URL (mobile emulation)
- Target scores: Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90
- Investigate major regressions before sharing

---
No secrets or keys in this repo or notes.
