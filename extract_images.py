import fitz
import os

doc = fitz.open(r"c:\Angular\MovieNetus\MovieNexus\Guía Paso a Paso #12.pdf")
out_dir = r"c:\Angular\MovieNetus\MovieNexus\_guide12_imgs"
os.makedirs(out_dir, exist_ok=True)

img_count = 0
for page_num in range(len(doc)):
    page = doc[page_num]
    images = page.get_images(full=True)
    for img_idx, img_info in enumerate(images):
        xref = img_info[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        ext = base_image["ext"]
        fname = f"page{page_num}_img{img_idx}.{ext}"
        with open(os.path.join(out_dir, fname), "wb") as f:
            f.write(image_bytes)
        img_count += 1
        print(f"Saved: {fname}")

doc.close()
print(f"\nTotal images extracted: {img_count}")
