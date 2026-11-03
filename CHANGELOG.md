# Jurnal de modificări — FreeDetect Hub

Format: [SemVer](https://semver.org/lang/ro/) (MAJOR.MINOR.PATCH). Istoricul complet al versiunilor anterioare este în secțiunea „Istoric / Changelog” din [README.ro.md](README.ro.md).

## 2.2.3 — 2026-11-03

Etapa 7 (audit axe): butonul A/B al motorului comun are acum numele accesibil „A/B — …”, care conține textul vizibil (regula label-content-name-mismatch).

## 2.2.2 — 2026-11-03

Etapa 4: motorul A/B comun («Ce variantă e mai bună?», clasament Elo, rezultat în plicul experiment/ab)

## 2.2.1 — 2026-11-02 (reîmprospătare kit)

- Nou (kit): **Sincronizare între dispozitive** (`FFF.sync`) — în dialogul «Transparență» (clic pe versiune → Copie de siguranță): conectezi două dispozitive direct (WebRTC, cod/QR, fără server și fără cont) și își schimbă datele aplicației; cea mai recentă valoare câștigă, secretele (chei API, parole) nu se trimit, ștergerile nu se propagă. Aplicarea trece prin importul kitului (confirmare, chei permise, rollback).
- Nou (kit): **Istoric local — «mașina timpului»** (`FFF.history`) — instantanee automate ale datelor (IndexedDB, fără secrete), diferență față de starea curentă și restaurare reversibilă; «Șterge datele aplicației» șterge și istoricul.
- Module adăugate: `qr`, `p2p`, `sync`, `history` (+~140 KB). Versiunea aplicației nu se schimbă.

## 2.2.1 — 2026-11-02 (anterior: 2.2.0)

- Surse actualizate (2026-11-02), în toate cele 16 limbi ale descrierilor: TinEye — 100 de căutări gratuite pe zi (nu 150) pentru uz necomercial, plus limita de 300/săptămână (help.tineye.com); Quetext — verificare gratuită până la 1000 de cuvinte (nu 500) (quetext.com/pricing); OpenAlex — peste 470 M de lucrări (477 M, blog.openalex.org).

## 2.2.0 — 2026-11-01

- Corectat: adaptorul «Trimite la…» nu mai aruncă eroare când kitul FFF lipsește (gardian pe fiecare bloc; găsit de testul «fără kit» din CI).

Nou: «Trimite la…» (fff-kit, modulul FFF.bridge) — după orice export de fișier (GPX, ICS, CSV, Markdown) apare butonul «Trimite la…» către aplicațiile compatibile, iar importul de fișiere al aplicației primește plicuri .fff.json trimise de ele, cu confirmare înainte de import. Fără rețea, fără telemetrie.

## 2.1.0 — 2026-10-27

### Adăugat
- Panou de avertizare, deschis implicit, despre nefiabilitatea detectoarelor AI (8 limbi; celelalte 8 limbi ale interfeței afișează engleza), cu recomandări pentru a evita acuzațiile nedrepte. Sursele (Liang et al. 2023; retragerea clasificatorului OpenAI) sunt citate în README.
- Buton „Verifică DOI-urile online” în panoul Verificarea referințelor: Crossref, apoi doi.org pentru DOI din alte registre; compară titlul și anul; max. 100 de DOI per rulare; la cerere, fără trimiterea textului.
- „Scanează textul”: DOI-urile înregistrate în afara Crossref (DataCite etc.) sunt marcate ca neverificate, nu ca „posibil inventate”.
- Rapoartele `.md` (profil, referințe) arată versiunea reală (înainte era scrisă fix, v1.3.2 / v2.0.0).
- CSP `connect-src`: adăugat `https://doi.org` (doar pentru DOI necunoscute în Crossref).
- Texte noi în 8 limbi (traducerile fr/it/es/pt/de/hu sunt automate, neverificate de vorbitori nativi).
- Test nou `tests/doi-ai.test.mjs` (30 de verificări, rețea simulată).

### Nu s-a implementat
- Verificarea online a ISBN-urilor (OpenLibrary nu acoperă toate cărțile; o lipsă n-ar dovedi nimic) - rămâne doar cifra de control.
- Comportamentul real al `doi.org/api/handles` (CORS) nu a putut fi testat pe rețea reală; testele folosesc răspunsuri simulate. La eșec, rezultatul este „neconcludent”, nu „inexistent”.
- Validarea de către un specialist (integritate academică / juridic) a textelor din panoul de avertizare: de făcut.

## 2.0.0 — 2026-10-26

Versiunea anterioară; vezi README.ro.md.
