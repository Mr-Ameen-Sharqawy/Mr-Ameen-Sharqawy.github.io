from pathlib import Path
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "public" / "course-images"
OUTPUT_DIR = SOURCE_DIR / "lessons"

OFFSETS = [
    (0.05, 0.05),
    (0.18, 0.08),
    (0.09, 0.16),
    (0.20, 0.18),
]


def create_cover(source_path: Path, output_path: Path, variation: int) -> None:
    with Image.open(source_path).convert("RGB") as source:
        width, height = source.size
        zoom = 1.0 + (variation * 0.055)
        crop_width = int(width / zoom)
        crop_height = int(height / zoom)
        offset_x, offset_y = OFFSETS[variation]
        left = int((width - crop_width) * offset_x / 0.20)
        top = int((height - crop_height) * offset_y / 0.20)
        left = min(max(left, 0), width - crop_width)
        top = min(max(top, 0), height - crop_height)
        cover = source.crop((left, top, left + crop_width, top + crop_height)).resize((width, height), Image.Resampling.LANCZOS)
        cover = ImageEnhance.Color(cover).enhance(1.0 + (variation * 0.035))
        cover = ImageEnhance.Brightness(cover).enhance(1.0 + (variation * 0.015))
        cover.save(output_path, "JPEG", quality=88, optimize=True)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for grade in (4, 5, 6):
        for lesson_number in range(1, 21):
            unit = ((lesson_number - 1) // 4) + 1
            variation = (lesson_number - 1) % 4
            source = SOURCE_DIR / f"grade{grade}-unit{unit}.png"
            output = OUTPUT_DIR / f"grade{grade}-lesson{lesson_number:02d}.jpg"
            create_cover(source, output, variation)


if __name__ == "__main__":
    main()
