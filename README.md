# Saugroboter Card

Vacuum-Widget im Liquid-Glass-Stil für Home Assistant (`custom:saugroboter-card`). Zeigt mehrere
`vacuum`-Entities als Karten mit Steuertasten (Start/Pause, Stop, Locate, Dock, optional Aussetzen)
und Karten-/Kamera-Vorschau.

**Status:** Bisher nur als Inline-Dashboard-Ressource in HA gepflegt, kein Git-Repo. Diese Datei
ist der Source-Stand vom 20.07.2026, inkl. zwei Fixes:
- Icon-Farben laufen jetzt theme-adaptiv über `currentColor` + `var(--primary-text-color)` statt
  hartcodiertem Weiß.
- Neuer Glow-Effekt (Icon-Glow + farbiger Border, Teal) am Avatar, aktiviert sich sobald der
  Roboter läuft (`cleaning`/`returning`).

## Installation

1. `saugroboter-card.js` als Lovelace-Ressource hinzufügen:
   - Settings → Dashboards → ⋮ → Resources → Add Resource
   - URL: z.B. `/local/saugroboter-card.js` (Datei nach `config/www/` kopieren)
   - Resource type: JavaScript Module

## Konfiguration

```yaml
type: custom:saugroboter-card
entities:
  - entity: vacuum.roborock_s7
    name: Roborock S7 (Keller)
    map_camera: camera.roborock_map
    skip_boolean: input_boolean.roborock_naechsten_lauf_aussetzen
```

| Option | Typ | Beschreibung |
|---|---|---|
| `entities` | list | Liste aus Objekten: `entity` (Pflicht), `name`, `map_camera` (Kartenbild-Entity), `map_rotate` (bool), `skip_boolean` (Helper für "Nächsten Lauf aussetzen") |

## License

MIT (analog zu den Schwester-Karten `liquid-glass-tile-card`, `liquid-lens-navbar-card`).
