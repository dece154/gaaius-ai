```python
from fpdf import FPDF

class LovePoemPDF:
    def __init__(self):
        self.pdf = FPDF()
        self.pdf.add_page()
        self.pdf.set_font("Arial", size=24)

    def create_poem(self):
        poem = """
        I love you more with every breath,
        More with every beat of my heart.
        You are my everything, my reason,
        My soulmate, my shining star from the start.

        You light up my world, you make me whole,
        You are my forever, my always goal.
        I love you for who you are, and who you help me be,
        Forever and always, my love, you are the key.

        You are the missing piece I never knew I needed,
        The missing beat that makes my heart sing and proceed.
        You are my best friend, my partner, my guiding light,
        Forever and always, my love, you are my delight.
        """

        self.pdf.multi_cell(0, 10, txt=poem)

    def save_pdf(self, filename):
        self.pdf.output(filename)

if __name__ == "__main__":
    love_poem = LovePoemPDF()
    love_poem.create_poem()
    love_poem.save_pdf("I_Love_You_Poem.pdf")
```