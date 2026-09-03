from PIL import Image
from pathlib import Path

scriptDir = Path(__file__).parent
image = Image.open(scriptDir / "icon.png")

image.save(
    scriptDir / "icon.ico",
    format="ICO",
    sizes=[
        (16, 16),
        (32, 32),
        (48, 48),
        (64, 64),
        (128, 128),
        (256, 256)
    ]
)