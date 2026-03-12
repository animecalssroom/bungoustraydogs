# BungouArchive UI Worldbuilding Spec

## Core Principle
Every interface element should feel like it belongs inside Yokohama's world. This is not a website about BSD. It is the city rendered in a browser.

The product tone is:
- archival
- literary
- rain-soaked
- classified
- physical

The UI should feel like:
- case files
- intercepted reports
- field records
- stamped assignments
- faction dossiers

## Global Design Language

### Permanent Base Layer
This layer exists across all themes:
- paper grain texture under all surfaces
- faint ink wash and bleed marks
- subtle rain or moisture presence in major hero areas
- physical document feeling instead of flat digital panels

### Typography
Use exactly three type roles:
- `Cinzel`: official headers, faction names, permanent labels
- `Cormorant Garamond italic`: quotes, atmospheric copy, ability names, reflective text
- `Space Mono`: timestamps, AP, rank, case ids, status labels, technical metadata

Load these in `layout.tsx`. No substitutes:
- `Cinzel`
- `Cormorant Garamond`
- `Space Mono`

Japanese support can layer on top, but these three remain the locked core identity fonts.

### Locked Color Tokens
These tokens must exist globally so components do not invent their own palette:
- `--color-agency: #8B6020`
- `--color-mafia: #CC1A1A`
- `--color-guild: #C8A020`
- `--color-dogs: #4A6A8A`
- `--color-special: #4A5A6A`
- `--color-bg-light: #F5EFE3`
- `--color-bg-dark: #080406`
- `--color-bg-neutral: #0C0E18`
- `--color-accent: #8B2500`
- `--color-paper: #EDE3CC`

These sit beside the existing theme variables. They do not replace theme toggling.

### Shape Language
Avoid perfect rectangles as the dominant visual language.
Use:
- diagonal clipped corners
- seal overlays
- layered borders
- inset lines like dossier dividers
- faction-colored corner bleeds

The BSD version is restrained, not punk-chaotic.

### Color Logic
Global themes remain:
- `light`
- `neutral`
- `dark`

Faction moods sit inside that system:
- Agency: warm amber, aged paper, detective office
- Mafia: deep crimson, shadow, velvet-black document room
- Guild: navy and gold, executive briefing room
- Hunting Dogs: steel blue, white, military records
- Special Division: desaturated slate-green, classified intelligence file

## Motion Rules

### Fast Motion
Use instant or near-instant transitions for:
- normal page navigation
- hovering simple buttons
- opening ordinary lists
- switching tabs/filters

### Meaningful Motion
Use theatrical motion only for moments that matter:
- faction assignment reveal
- character assignment reveal
- rank up
- duel resolution
- special notifications
- accepted featured lore

### Signature Transition
Meaningful events use an `InkTransition`:
- dark ink expands from interaction origin
- screen briefly fills
- new state reveals beneath

Do not use this on every route change.

## Core Primitives

### `PaperSurface`
Use for all cards, panels, modals, and major containers.
Must include:
- subtle paper grain
- layered surface tint from theme vars
- thin outer border
- slight inset highlight or edge shadow

### `CaseHeader`
Top header block for pages and sections.
Contains:
- eyebrow in Space Mono
- title in Cinzel
- optional JP line
- thin divider
- optional quote or case subtitle

### `FactionSeal`
Small visual identity chip for faction.
Contains:
- kanji
- faction color
- optional role/rank line

### `InkStamp`
Used for:
- accepted
- featured
- queued
- classified
- observed

Should feel stamped, not badge-like.

### `DiagonalCard`
Primary card surface for interactive blocks.
Features:
- clipped corner
- corner bleed color
- layered hover lift
- optional watermark background

### `CaseMetaRow`
For showing:
- timestamps
- case ids
- AP
- rank
- event metadata

Always `Space Mono`.

### `FieldRecordLog`
Scrollable record feed used in profile and activity views.
Each item should feel like a filed note, not a chat bubble.

### `FactionBanner`
Atmospheric full-width header surface for faction pages.
Built from illustration/texture/layout, not generic hero image.

Faction banner definitions:
- Agency banner: warm amber gradient + typewriter text overlay + case file grid lines
- Mafia banner: near black base + crimson bleed from the left + shadow texture
- Guild banner: navy base + gold geometric border + financial district silhouette
- Hunting Dogs banner: steel blue base + white horizontal rule system + military grid
- Special Division banner: desaturated slate + redacted text blocks + surveillance grid

### `RainLayer`
Reusable atmospheric layer for hero sections and selected faction views.

### `InkTransition`
Reusable motion component for meaningful state changes.

## Page Specifications

## 1. Navigation
The nav should look like a case file header, not a startup nav bar.

Desktop:
- left: BungouArchive mark + literary subtitle
- center: route links in lowercase `Space Mono`
- separators between items like dossier dividers
- theme toggles as small lantern controls
- right: faction seal, rank, AP, account state

Mobile:
- collapse into minimal bottom or compact header control system
- preserve faction identity indicator

Always include:
- a slight physical-header feel
- thin borders
- high polish
- no generic hamburger-first desktop behavior

## 2. Landing Page
Goal: cinematic briefing document.

Must have:
- Yokohama skyline or district silhouette
- rain presence
- oversized kanji watermark
- asymmetrical CTA placement
- faction war strip integrated into the scene

The CTAs should feel stamped into the page, not centered SaaS buttons.

## 3. Quiz
Goal: interrogation, not form.

Rules:
- one question at a time
- minimal chrome
- options appear as dossier cards
- staggered entry
- hover = slight lift + corner bleed
- click = seal/stamp feeling
- progress shown as a thin top line, not pips

Mobile fallback:
- no card slide-in
- no stagger
- simple fade-in only
- preserve responsiveness over theatrics

Most important animation:
- faction kanji brushstroke reveal on result

## 4. Result Screen
Goal: assignment order, not personality test result.

Must feel:
- official
- final
- severe

Needs:
- faction kanji dominant
- philosophy line
- single action
- no noisy explanatory UI

## 5. Profile Page
Goal: case dossier.

Structure:
- left column: identity plate, faction seal, portrait/silhouette, rank title
- right column: field record log
- AP shown as physical progress bar toward next title

Rank-up behavior:
- full-screen faction flash
- kanji
- new rank title
- short, ceremonial, rare

## 6. Faction Pages
Goal: each faction feels like a place.

Public faction page:
- `FactionBanner`
- philosophy
- faction stats
- classified/public roster behavior depending on faction
- contributions framed as records

Private faction hub:
- chat/feed hybrid with report styling
- announcements
- events
- roster
- mod utilities

No generic “community dashboard” look.

## 7. Arena
Goal: confrontation and declaration.

Must include:
- opposing silhouettes
- central vertical divider
- vote influence shown through shifting balance
- faction consequence visible
- stamped vote confirmation

## 8. Duel Screen
Goal: most overtly game-like screen.

Should feel:
- black-room dramatic
- physical cards
- timed tension
- combat report aftermath

Use:
- low ambient clutter
- strong card interactions
- meaningful reveal timing

## 9. Lore Posts
Goal: documents, not blog entries.

Needs:
- case file number
- faction watermark
- header stamp system
- author presented as in-world identity
- comments as filed responses/addenda

Featured posts should receive a literal archival stamp.

## Expansion Model

### Phase 1
Only a small part of Yokohama feels open.

### Phase 2
Accepted lore and community records illuminate more of the city.

### Phase 3
Faction influence becomes visible geographically.

### Phase 4
The Yokohama Chronicle becomes the permanent historical scroll of the site.

## Implementation Order
Build in this exact order:

1. global texture + surface system
2. nav/header redesign
3. landing page atmosphere refinement
4. quiz and result redesign
5. profile dossier
6. faction page + hub identity pass
7. lore document system
8. arena confrontation system
9. duel screen language

## Non-Negotiables
- normal navigation stays fast
- theatrical motion is reserved for meaningful moments
- physicality beats flatness
- literary tone beats generic anime UI
- worldbuilding beats utility-only layouts
- every page must still function on mobile
