# FreeDetect Hub

Un panou unic pentru 42 de instrumente gratuite de detectare a plagiatului și a textului generat de AI, plus generator de citări.

**Live:** https://chiuta.github.io/FreeDetect/

![Captura de ecran](screenshot.png)

## Ce este

FreeDetect Hub („Paste once. Check everywhere.") este o aplicație HTML într-un singur fișier (cu bibliotecile PDF și DOCX incluse în directorul `vendor/`). Lipești sau încarci un text o singură dată, apoi alegi dintr-o grilă de 42 de instrumente externe selectate manual; textul este copiat în clipboard și instrumentul ales se deschide într-o filă nouă, unde îl lipești.

Aplicația nu face verificarea în sine: este un catalog și un ajutor de flux de lucru. Rezultatele detectoarelor pot fi eronate (false pozitive), mai ales pentru texte non-englezești, inclusiv română; aplicația avertizează explicit despre acest lucru.

## Funcții

- Zonă de text „Your Text" pentru lipire directă sau încărcare de fișiere `.txt`, `.md`, `.docx`, `.pdf`.
- Grilă de instrumente cu filtre pe nivel (Tier: începători / profesioniști) și pe categorie (AI, plagiat, bibliografie, imagine etc.).
- Buton „Check here" pe fiecare instrument: copiază textul în clipboard și arată un banner cu „Open in new tab".
- Panou „Workflow" (flux recomandat în 7 pași) și buton „Clear".
- Generator de citări: introduci un DOI, ISBN sau URL, „Fetch" aduce metadatele de la Crossref / OpenLibrary și produce APA, MLA, Chicago sau BibTeX, cu „Copy".
- „Scan input text": găsește DOI-urile din text și le verifică la Crossref, pentru a semnala referințe posibil inventate.
- Interfață în 15 limbi (selector 🌐): engleză, română, franceză, germană, spaniolă, portugheză, italiană, olandeză, poloneză, rusă, arabă, chineză, japoneză, coreeană, turcă.
- Pagini de confidențialitate/GDPR, cookies și impressum, link-uri Patreon și Buy Me a Coffee.

## Manual de utilizare

1. Deschide pagina și, dacă vrei, schimbă limba din selectorul 🌐 (opțiunea este reținută).
2. Lipește textul în „Your Text" sau încarcă un fișier `.txt`, `.md`, `.docx` ori `.pdf`.
3. Folosește filtrele Tier și Category pentru a restrânge grila de instrumente.
4. Apasă „Check here" pe 2-3 detectoare; textul este copiat automat în clipboard.
5. În bannerul care apare apasă „Open in new tab", apoi lipește textul (Ctrl+V / Cmd+V) în instrumentul deschis.
6. Compară rezultatele: un singur semnal nu este o dovadă.
7. Pentru referințe: deschide „Citation Generator", introdu un DOI/ISBN și apasă „Fetch", sau apasă „Scan input text" pentru a verifica DOI-urile din text.
8. „Clear" golește zona de text.

Tastatura: Enter este folosit în câmpul generatorului de citări; nu există alte scurtături documentate.

## Confidențialitate și rețea

- Local: în `localStorage` se reține doar limba interfeței (`fdh_lang`). Textul tău nu este salvat.
- Textul lipit nu este trimis nicăieri de aplicație. Singurele cereri de rețea ale paginii sunt cele ale generatorului de citări, la acționarea lui: `api.crossref.org` (DOI și scanare) și `openlibrary.org` (ISBN).
- Când folosești „Check here", textul ajunge, prin lipirea ta, la serviciul terț ales și intră sub politica acestuia.
- Pagina conține link-uri (nu cereri automate) către zeci de servicii terțe, către Patreon, Buy Me a Coffee și site-urile autorului.

## Rulare locală / offline

Descarcă repository-ul (fișierul `index.html` și directorul `vendor/`) și deschide `index.html` în browser. Interfața, filtrarea și citirea fișierelor locale funcționează fără internet. Au nevoie de internet: generatorul de citări (Crossref, OpenLibrary) și, desigur, instrumentele externe pe care le deschizi.

## Licență

Licența nu este încă declarată explicit în acest repository; vezi nota din aplicație. Aplicația însăși indică: „CC0 1.0 (Public Domain Dedication)".

## Autor

Alexio — Alexandru-Ionuț Chiuță, contact: alexio@trom.tf

## English summary

FreeDetect Hub is a single-file HTML dashboard linking to 42 hand-picked free plagiarism and AI-detection tools. Paste or upload text (.txt, .md, .docx, .pdf), click "Check here" to copy it to the clipboard and open the chosen tool. It includes a DOI/ISBN citation generator (Crossref, OpenLibrary) and a hallucinated-reference scanner. UI in 15 languages. Only the citation features contact the network; only the language choice is stored locally.
