# Most Mabia Akther — Academic Portfolio

A responsive, accessible static portfolio for educator and researcher Most Mabia Akther. The site uses plain HTML, CSS and JavaScript, so it can be published directly with GitHub Pages—no build step or dependencies required.

## Project structure

```text
.
├── index.html
├── styles.css
├── script.js
├── favicon.svg            # monogram favicon
├── apple-touch-icon.png   # 180×180 home-screen icon
├── site.webmanifest
├── fonts/                 # self-hosted Fraunces + Instrument Sans (woff2, latin, SIL OFL)
├── images/                # original JPGs + responsive WebP copies + og-share.jpg
├── .nojekyll
└── README.md
```

## Publish with GitHub Pages

1. Upload the files and the complete `images` folder to the root of a GitHub repository.
2. Open the repository’s **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select the `main` branch and `/ (root)`, then save.
5. Wait for GitHub to display the live site URL.

All asset paths are relative, so the site works both on a project Pages URL and a custom domain.

## Preview locally

Opening `index.html` directly works. For the closest match to GitHub Pages, run any simple static server in this folder, for example:

```bash
npx serve .
```

## Before publishing

- Confirm that every photograph and document is approved for public display, especially images showing students or third-party signatures/contact information.
- After GitHub Pages provides the final URL, add it as a canonical URL and use an absolute URL for the social-sharing image in `index.html`. For example (replace the placeholder with the real address):
  `<link rel="canonical" href="https://YOUR-USER.github.io/YOUR-REPO/">`, `<meta property="og:url" content="https://YOUR-USER.github.io/YOUR-REPO/">` and `<meta property="og:image" content="https://YOUR-USER.github.io/YOUR-REPO/images/og-share.jpg">` (also update `twitter:image`).
- Test the live email link and review the portfolio text for any future academic or role updates.

## Features

- Responsive layouts for phone, tablet and desktop (checked at 360, 768, 1024 and 1440 px)
- Refined two-family type system (Fraunces display serif + Instrument Sans), self-hosted woff2 with `font-display: swap` and a fluid `clamp()` type scale
- One consistent inline SVG icon set (Lucide style) for navigation, section headers, timeline, experience, research, honours, contact and lightbox controls
- Motion: hero entrance, staggered scroll reveals, hover depth on cards and a count-up on the 3.90 grade. All of it is switched off under `prefers-reduced-motion`
- Redesigned academic timeline, experience cards, research feature card, honours medallions and contact block
- Photo bento for "In the field", a framed certificate grid for Evidence and a separate dark mosaic for the Gallery
- Lightbox with previous/next buttons, arrow keys, Home/End, Escape, touch swipe, an image counter, a visible title and caption, a focus trap and focus return. Each section is its own image sequence
- Optimised images: responsive WebP (`<picture>` + `srcset`/`sizes`) with the original JPEGs as fallback, explicit dimensions, lazy loading below the fold and a high-priority hero image
- Keyboard-accessible navigation (skip link, visible focus rings, 44 px targets, mobile menu with `aria-expanded`, Escape and focus handling)
- No-JavaScript fallback: all content stays visible, and animations only run once JavaScript is active
- Print-friendly styles
- Search and social-sharing metadata, a 1200×630 share image, a favicon, an apple-touch-icon, a web manifest and JSON-LD `Person` structured data built only from facts already on the page
- No public home address or personal phone number
