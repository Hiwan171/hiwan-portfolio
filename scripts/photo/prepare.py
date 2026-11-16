"""Prepara o retrato para as partículas.

Uso: python scripts/photo/prepare.py <foto.jpg> <saida_dir> [--box x0,y0,x1,y1] [--erase x,y;x,y;...]

Passos: segmenta a pessoa (rembg, modelo u2net_human_seg) → recorta o busto → apaga objetos
(celular/mão) → espelha (selfie de espelho sai invertida; e assim o olhar aponta para a headline)
→ cinza com contraste → degradê na base → PNG RGBA (cinza + alfa) + prévia sobre papel.
Coordenadas de --box e --erase: pixels da foto ORIGINAL (antes de espelhar).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from rembg import new_session, remove


def arg(name, default):
    if name in sys.argv:
        return sys.argv[sys.argv.index(name) + 1]
    return default


src, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
out_dir.mkdir(parents=True, exist_ok=True)

box = tuple(int(v) for v in arg("--box", "0,280,440,840").split(","))
erase = [tuple(int(v) for v in p.split(",")) for p in arg("--erase", "").split(";") if p]
print(f"box={box} erase={len(erase)} pontos")

img = ImageOps.exif_transpose(Image.open(src)).convert("RGB")

# 1) Segmentação na foto inteira (mais contexto = máscara melhor), depois recorte.
mask = remove(img, session=new_session("u2net_human_seg"), only_mask=True, post_process_mask=True)
crop, mask = img.crop(box), mask.crop(box).convert("L")

# 2) Apaga objetos (polígono em coords da foto original → coords do recorte), com borda suave.
if erase:
    poly = [(x - box[0], y - box[1]) for x, y in erase]
    hole = Image.new("L", crop.size, 0)
    ImageDraw.Draw(hole).polygon(poly, fill=255)
    hole = hole.filter(ImageFilter.GaussianBlur(3))
    mask = Image.fromarray((np.asarray(mask, float) * (1 - np.asarray(hole, float) / 255)).astype(np.uint8))

# 3) Espelha.
crop, mask = ImageOps.mirror(crop), ImageOps.mirror(mask)

# 4) Cinza com contraste local (nitidez realça olhos, óculos, barba: os traços que sobrevivem
#    à conversão em partículas) e esticamento só dentro da pessoa.
gray_img = ImageOps.grayscale(crop).filter(ImageFilter.UnsharpMask(radius=7, percent=170, threshold=2))
gray = np.asarray(gray_img, float)
m = np.asarray(mask, float) / 255
inside = gray[m > 0.5]
lo, hi = np.percentile(inside, 2), np.percentile(inside, 98)
gray = np.clip((gray - lo) / max(hi - lo, 1), 0, 1) ** 0.9

# 5) Degradê na base (o busto se dissolve em vez de terminar num corte seco).
h = gray.shape[0]
y = np.arange(h)[:, None] / h
fade = np.clip((1.0 - y) / 0.3, 0, 1)
alpha = m * fade

g8 = (gray * 255).astype(np.uint8)
a8 = (alpha * 255).astype(np.uint8)
# Peso: cinza+alfa (LA, não RGBA) e metade da resolução. O WebGL amostra 1 ponto por pixel
# deste arquivo, então a densidade de partículas é a mesma de antes (passo 2 na resolução cheia).
la = Image.fromarray(np.dstack([g8, a8]), "LA")
la = la.resize((la.width // 2, la.height // 2), Image.LANCZOS)
la.save(out_dir / "portrait.png", optimize=True)

# Prévia para revisão (sobre o papel) fica FORA de public/, para não ir para o build.
preview_dir = Path("captures/photo")
preview_dir.mkdir(parents=True, exist_ok=True)
paper = np.full((*g8.shape, 3), (235, 231, 222), float)
prev = paper * (1 - alpha[..., None]) + np.dstack([g8] * 3) * alpha[..., None]
Image.fromarray(prev.astype(np.uint8)).save(preview_dir / "portrait-preview.png")
print(f"ok {crop.size} cobertura={alpha.mean():.2%} -> {out_dir / 'portrait.png'}")  # ASCII: console cp1252
