import fitz
doc = fitz.open(r"c:\Angular\MovieNetus\MovieNexus\Guía Paso a Paso #12.pdf")
for page in doc:
    print(page.get_text())
doc.close()
