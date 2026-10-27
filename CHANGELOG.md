# Jurnal de modificări — FreeDetect Hub

Format: [SemVer](https://semver.org/lang/ro/) (MAJOR.MINOR.PATCH). Istoricul complet al versiunilor anterioare este în secțiunea „Istoric / Changelog” din [README.ro.md](README.ro.md).

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
