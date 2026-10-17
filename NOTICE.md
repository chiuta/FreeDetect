# Componente terțe

Aplicația proprie (index.html) este sub licență MIT (vezi LICENSE). Directorul `vendor/` conține biblioteci terțe, care NU sunt acoperite de licența MIT și își păstrează licențele:

| Fișier | Proiect | Licență | Stare |
|---|---|---|---|
| `vendor/pdfjs/pdf.min.js`, `vendor/pdfjs/pdf.worker.min.js` | pdf.js (Mozilla Foundation, 3.x) | Apache-2.0 | Antetul de licență este păstrat în fișier. |
| `vendor/mammoth.browser.min.js` | mammoth.js (Michael Williamson, https://github.com/mwilliamson/mammoth.js) | BSD-2-Clause, conform proiectului sursă; build-ul „browser” încorporează și alte biblioteci (de ex. JSZip, underscore, bluebird), fiecare cu licența ei | Textul licenței nu este inclus în fișier. De completat din proiectul sursă (verificarea nu a putut fi făcută fără acces la rețea). |

Mărci: numele instrumentelor și serviciilor din catalog aparțin deținătorilor lor și sunt folosite descriptiv; aplicația nu este afiliată cu aceștia.
