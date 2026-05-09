## Plan d'amélioration

### 1. Vitrine – Thème au-dessus de la photo
- Ajouter une colonne `theme` (text, nullable) à la table `vitrine`.
- Page `/vitrine` : afficher au-dessus de l'image un titre **"Thème de la vitrine : {theme}"** (masqué si vide).
- Page admin `AdminVitrine` : nouveau champ `Input` "Thème de la vitrine" sauvegardé avec le reste.

### 2. Vitrine – Style d'écriture du texte sous la photo
- Ajouter trois colonnes à `vitrine` :
  - `description_font` (text) – ex. `serif`, `sans`, `mono`, `display`, `handwriting`
  - `description_size` (text) – `sm` | `base` | `lg` | `xl`
  - `description_style` (text[]) – combinaison de `bold` / `italic`
- Admin : sous le champ Description, ajouter :
  - Un `Select` police (6 options : Default sans, Serif élégante, Manuscrite, Display, Mono, Sans moderne)
  - Un `Select` taille (S / M / L / XL)
  - Deux `Toggle` Gras / Italique
  - Un aperçu en temps réel du rendu
- Page `/vitrine` : appliquer dynamiquement les classes Tailwind correspondantes au paragraphe `description`.
- Polices : utiliser celles déjà disponibles (font-serif, font-sans, font-mono) + ajouter 2 variables `--font-display` et `--font-handwriting` dans `index.css` / `tailwind.config.ts` (Google Fonts via `<link>` dans `index.html`, ex. *Playfair Display* et *Caveat*).

### 3. Actualités – Centrer les images dans le contenu
- Dans `ActualiteDetail.tsx`, le contenu est rendu via `dangerouslySetInnerHTML` dans une div `prose`.
- Ajouter une règle CSS ciblée (dans `index.css` ou via une classe sur le wrapper) :
  ```css
  .prose img { margin-left: auto; margin-right: auto; display: block; }
  ```
  Scoping : appliquer sur `.actualite-content img` pour ne pas affecter les autres `prose` du site.
- Aucun changement requis dans l'éditeur d'admin actualités ni en base.

### Détails techniques
- Migration SQL : `ALTER TABLE vitrine ADD COLUMN theme text, ADD COLUMN description_font text DEFAULT 'sans', ADD COLUMN description_size text DEFAULT 'base', ADD COLUMN description_style text[] DEFAULT '{}';`
- Helpers TS dans `Vitrine.tsx` qui mappent `description_font/size/style` → classes Tailwind (`font-serif`, `text-lg`, `font-bold`, `italic`, …).
- Aucune modification de RLS nécessaire (politiques existantes couvrent déjà `vitrine`).
- Les types Supabase seront régénérés automatiquement après migration.

### Fichiers touchés
- Migration : `supabase/migrations/<timestamp>_vitrine_theme_style.sql`
- `src/pages/Vitrine.tsx`
- `src/pages/admin/AdminVitrine.tsx`
- `src/pages/ActualiteDetail.tsx` (ajout d'une classe wrapper)
- `src/index.css` (règle img centrée + import polices si besoin)
- `tailwind.config.ts` + `index.html` (nouvelles familles de police)