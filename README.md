# Luca — Webdesign für KMU

Statischer Website-Entwurf, aus dem Design-Canvas als echtes Code-Projekt exportiert.

## Struktur

- `index.html` — die ganze Seite (eine Seite, mehrere Abschnitte)
- `styles.css` — alle Styles, Farben als CSS-Variablen in `:root` (leicht anpassbar: `--accent`, `--ink`, `--paper`, ...)
- `script.js` — die zwei kleinen Effekte: Scroll-Reveal (Abschnitte faden ein) und der schwebende Kontakt-Button
- Die FAQ nutzt natives `<details>/<summary>` — kein JavaScript nötig für das Auf-/Zuklappen

## Lokal ansehen

Einfach `index.html` im Browser öffnen, oder mit einem lokalen Server:

```bash
npx serve .
```

## Was noch offen ist (bewusst als Platzhalter markiert)

- `[DEINE E-MAIL]` und `[TELEFONNUMMER]` im Kontakt-Bereich
- `[Impressum]` / `[Datenschutz]` im Footer — für eine Schweizer Geschäftswebseite rechtlich nötig
- Der Header nutzt aktuell eine Zürich-Illustration statt eines echten Fotos — kann in `index.html` im ersten `<section>` ersetzt werden

## Farben ändern

Alle Kernfarben stehen in `styles.css` ganz oben unter `:root`. Zum Beispiel die Akzentfarbe:

```css
--accent: #0033A0;
```

## Deployment

Das ist eine reine statische Seite (kein Build-Schritt). Lässt sich direkt hochladen zu:

- Netlify / Vercel / GitHub Pages (Ordner-Inhalt hochladen)
- Oder als Referenz für eine Framer-Umsetzung (Layout, Texte, Farben sind hier schon final)
