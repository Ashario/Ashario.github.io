# Ashar Zafar — portfolio

Static site (plain HTML/CSS/JS, no build step) served by GitHub Pages at https://ashario.github.io/

## Add or change work
1. Put original images in `assets/raw/<category>/` (products, scenes, interiors, vehicles, characters, game, design, photo). File names become titles; a leading number sets the order (`01-cozy-cabin.jpg`). Optional `assets/raw/headshot.jpg`.
2. Run `python tools/build_assets.py` (needs `pip install pillow`; clips need ffmpeg). It writes compressed WebP files to `assets/work/`, `assets/works.js` and `assets/og-image.jpg`.
3. Commit and push. `assets/raw/` is not uploaded.

## Fiverr link
Set `FIVERR_URL` at the top of `site.js` to show a "Hire me on Fiverr" button.
