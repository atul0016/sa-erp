# Free Hosting Guide For Portfolio Use
## Deployment Status ✅

| Platform | URL | Status |
|----------|-----|--------|
| **Netlify (Web Demo)** | https://nimble-capybara-f8ef90.netlify.app | Live |
| **GitHub Repository** | https://github.com/atul0016/sa-erp | Public |
| Netlify Dashboard | https://app.netlify.com/projects/nimble-capybara-f8ef90 | Active |

Demo credentials: `admin` / `admin123`

---


## Important Constraint

SA ERP is an Electron desktop app. That means the full application cannot be hosted as a normal free website without additional work, because the production app depends on desktop runtime capabilities and Electron APIs.

## Best Free Portfolio Strategy

Use a two-part presentation model:

1. Host a project showcase page for free
2. Offer the desktop build as a downloadable artifact

## Recommended Free Stack

### Option 1: GitHub Pages + GitHub Releases

Best when you want a no-cost public portfolio presentation.

- Host a project page on GitHub Pages
- Use the screenshots from this folder
- Use the descriptions and feature list from this folder
- Upload desktop installers or zipped builds to GitHub Releases
- Add a `Download Demo` button on your project page

### Option 2: Netlify or Vercel + GitHub Releases

Best when you want a more polished landing page.

- Create a small static landing page
- Deploy it to Netlify or Vercel for free
- Embed the screenshots and feature overview
- Link downloads from GitHub Releases or Google Drive

### Option 3: Portfolio Site Case Study Only

Best when you do not want to distribute builds yet.

- Add SA ERP as a case study on your portfolio site
- Use these screenshots
- Use the copy from `app-description.md`
- Use the grouped features from `features-list.md`
- Present it as a product concept + working prototype/demo

## If You Want A Real Browser Demo

That requires a separate web-safe deployment path because the current app assumes Electron APIs. To make a browser demo, you would need one of these approaches:

- Build a mocked front-end only demo for portfolio viewing
- Replace Electron-only dependencies with browser-safe mock services
- Build an API-backed web version for deployment on Vercel, Netlify, or Render

## Recommended Portfolio Copy For Hosting

Headline:

SA ERP: a modern desktop ERP system for finance, inventory, sales, purchase, GST, HRM, and reporting.

Subheadline:

Designed as a clean, business-focused operations platform for Indian companies with a desktop-first workflow and modular enterprise architecture.

## Suggested Portfolio CTA Buttons

- View Screenshots
- Explore Features
- Read Case Study
- Download Demo Build

## Recommended Folder Usage

Use this `portfolio-assets` folder directly as your source pack when building the portfolio page.