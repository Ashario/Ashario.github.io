"""Compress portfolio images and regenerate assets/works.js.

Put originals here (any size, JPG/PNG/WEBP, or MP4/MOV/WEBM clips):
    assets/raw/products|scenes|interiors|vehicles|characters/   Blender renders
    assets/raw/game/     Unity / game screenshots and clips (personal work only)
    assets/raw/design/   Graphic design
    assets/raw/photo/    Photography / photo edits
    assets/raw/headshot.jpg   (optional, square-ish photo of you)

File names become titles: "01-sci-fi-crate.png" -> "Sci Fi Crate" (the number sets the order).
Then run:  python tools/build_assets.py
"""
import json, re, shutil, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets" / "raw"
OUT = ROOT / "assets" / "work"
CATS = ["products", "scenes", "interiors", "vehicles", "characters", "game", "design", "photo"]
IMG = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}
VID = {".mp4", ".mov", ".webm", ".mkv", ".avi"}
FULL, THUMB = 1920, 760


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def title_of(stem):
    s = re.sub(r"^\d+[\s._-]*", "", stem)
    s = re.sub(r"[_\-.]+", " ", s).strip()
    if not s:
        return stem
    fixes = {"iphone": "iPhone", "bmw": "BMW", "m850i": "M850i", "sci": "Sci", "fi": "fi", "pro": "Pro", "max": "Max", "chiron": "Chiron"}
    words = [fixes.get(w.lower(), w) for w in s.split()]
    out = " ".join(words).replace("Sci fi", "Sci-fi")
    return out if out.startswith("iPhone") else out[:1].upper() + out[1:]


def save_img(im, path, width, quality):
    im = im.copy()
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(path, "WEBP", quality=quality, method=6)
    return im.size


def load(p):
    im = Image.open(p)
    im = ImageOps.exif_transpose(im)
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
    if im.mode == "RGBA":
        bg = Image.new("RGB", im.size, (21, 23, 26)); bg.paste(im, mask=im.split()[3]); im = bg
    return im


def video_poster(src, dst_jpg):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "1", "-i", str(src), "-frames:v", "1", str(dst_jpg)], check=True)


def video_encode(src, dst):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-an", "-vf", "scale='min(1280,iw)':-2",
                    "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dst)], check=True)


def font(size, bold=True):
    for name in (["segoeuib.ttf", "arialbd.ttf"] if bold else ["segoeui.ttf", "arial.ttf"]):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


def og_image(cover):
    W, H = 1200, 630
    base = Image.new("RGB", (W, H), (21, 23, 26))
    if cover is not None:
        img = ImageOps.fit(cover, (W, H), Image.LANCZOS)
        base.paste(img)
        shade = Image.new("L", (W, H))
        d = ImageDraw.Draw(shade)
        for x in range(W):
            d.line([(x, 0), (x, H)], fill=int(235 * max(0.0, 1 - x / (W * 0.75))))
        base = Image.composite(Image.new("RGB", (W, H), (16, 18, 20)), base, shade)
    d = ImageDraw.Draw(base)
    d.line([(72, 140), (132, 140)], fill=(214, 69, 90), width=6)
    d.line([(72, 140), (72, 80)], fill=(63, 127, 214), width=6)
    d.ellipse([(64, 132), (80, 148)], fill=(240, 138, 69))
    d.text((72, 250), "Ashar Zafar", font=font(96), fill=(240, 242, 245))
    d.text((76, 370), "Game Developer & 3D Artist", font=font(44, False), fill=(240, 138, 69))
    d.text((76, 450), "Blender  ·  Unity / C#  ·  Python automation", font=font(30, False), fill=(185, 190, 198))
    base.save(ROOT / "assets" / "og-image.jpg", "JPEG", quality=86, optimize=True, progressive=True)


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    works, cover = [], None
    for cat in CATS:
        folder = RAW / cat
        if not folder.is_dir():
            continue
        for p in sorted(folder.iterdir(), key=lambda q: q.name.lower()):
            ext = p.suffix.lower()
            if ext not in IMG | VID:
                continue
            name = f"{cat}-{slug(p.stem)}"
            item = {"cat": cat, "title": title_of(p.stem)}
            try:
                if ext in VID:
                    poster = OUT / f"{name}-poster.jpg"
                    video_poster(p, poster)
                    im = load(poster); poster.unlink()
                    video_encode(p, OUT / f"{name}.mp4")
                    item["video"] = f"assets/work/{name}.mp4"
                else:
                    im = load(p)
            except Exception as e:  # keep going on a bad file
                print(f"  skipped {p.name}: {e}", file=sys.stderr)
                continue
            save_img(im, OUT / f"{name}.webp", FULL, 82)
            tw, th = save_img(im, OUT / f"{name}-t.webp", THUMB, 74)
            item.update(full=f"assets/work/{name}.webp", thumb=f"assets/work/{name}-t.webp", tw=tw, th=th)
            works.append(item)
            if cover is None and cat == "scenes" and "video" not in item:
                cover = im
            print(f"  {cat:6} {p.name} -> {name}")

    headshot = ""
    for p in RAW.glob("headshot.*"):
        if p.suffix.lower() in IMG:
            im = ImageOps.fit(load(p), (240, 240), Image.LANCZOS, centering=(0.5, 0.35))
            im.save(ROOT / "assets" / "headshot.webp", "WEBP", quality=82)
            headshot = "assets/headshot.webp"
            break

    og_image(cover)
    js = "/* Generated by tools/build_assets.py — rerun it after adding files to assets/raw/ */\nwindow.PORTFOLIO = " + json.dumps({"headshot": headshot, "works": works}, indent=1) + ";\n"
    (ROOT / "assets" / "works.js").write_text(js, encoding="utf-8")
    print(f"{len(works)} works, headshot={'yes' if headshot else 'no'}, og-image written")


if __name__ == "__main__":
    main()
