# Vacuum Robot Card

A frosted-glass ("Liquid Glass") styled vacuum widget for Home Assistant
(`custom:saugroboter-card`). Displays multiple `vacuum` entities as cards with control
buttons (start/pause, stop, locate, dock, optional skip-next-run) and an optional map/camera
preview.

![Vacuum Robot Card with two robots and status lines](asset/vacuum-robot-card.png)

## Installation

### HACS (custom repository)

1. HACS → the "⋮" menu (top right) → **Custom repositories**.
2. Add this repository's URL, category **Dashboard**.
3. Install **Vacuum Robot Card**, then add the resource if HACS doesn't do it automatically:
   - Settings → Dashboards → Resources → **+ Add resource**
   - URL: `/hacsfiles/liquid-glass-vacuum-roboter-card/saugroboter-card.js`
   - Type: **JavaScript Module**

### Manual

1. Copy `saugroboter-card.js` into `<config>/www/`.
2. Settings → Dashboards → Resources → **+ Add resource**
   - URL: `/local/saugroboter-card.js`
   - Type: **JavaScript Module**

## Configuration

```yaml
type: custom:saugroboter-card
entities:
  - entity: vacuum.roborock_s7
    name: Roborock S7 (Basement)
    map_camera: camera.roborock_map
    skip_boolean: input_boolean.roborock_skip_next_run
```

### Card-level options

| Option | Type | Default | Description |
|---|---|---|---|
| `entities` | list | — | **Required.** List of robots (see below) |
| `look` | string | theme / `glass` | `solid` switches to calm solid surfaces and flat buttons without glass, blur or glows, `glass` forces glass; unset = theme's `lg-look`, see *Solid look* |

### Per-entity options (inside `entities`)

| Option | Type | Description |
|---|---|---|
| `entity` | string (required) | Vacuum entity ID |
| `name` | string | Overrides the friendly name |
| `map_camera` | string | Camera entity showing a live map/snapshot image, rendered inline |
| `map_rotate` | boolean | Rotates the map image 90° to better fit the available space |
| `skip_boolean` | string | `input_boolean` entity toggled by an optional "skip next run" button |
| `status_entity` | string | Optional sensor shown as a status line under the robot (e.g. room, progress or a maintenance hint). One line, tap to expand; text starting with ⚠ is shown in orange, and while the robot runs the line is shown in teal |

## Features

- Play/pause toggles between `vacuum.start` and `vacuum.pause` based on live state
- Stop, locate, and return-to-base buttons call the corresponding `vacuum` services
- Status text (Docked/Cleaning/Paused/Returning to Dock/Idle/Error/Unavailable) reflects the
  entity's current state, in German when Home Assistant runs in German
- The map area only appears when a `map_camera` is configured
- Icon + border glow around the avatar activates automatically while the vacuum is running
  (`cleaning`/`returning`)
- Icons are theme-adaptive (`currentColor` + `var(--primary-text-color)`), so they render
  correctly in both light and dark Home Assistant themes

## Solid look

`look: solid` replaces the glass with quiet, solid surfaces — for dashboards whose page background already does the visual work:

- **Panel:** solid surface (`--surface`, default the theme's card colour at 88 %), thin 1 px edges, `--lg-radius` corners (default 20 px), no blur, no gradient, no shadow.
- **Robot icon:** a plain round circle — neutral while docked, filled teal while the robot is cleaning or returning (no glow).
- **Buttons:** flat, fully round 44 px buttons without glass edges; the skip-next-run button is filled orange while the next run is skipped.
- **Map:** sits on a solid inner tile (`--lg-tile-bg`) with rounded corners.
- Text sizes follow the other solid cards (name 15 px, status 13 px); `prefers-reduced-motion` is respected.

```yaml
type: custom:saugroboter-card
look: solid
entities:
  - entity: vacuum.roborock_s7
    map_camera: camera.roborock_map
```

The look can also come from your theme, for all Liquid Glass cards at once: set `lg-look: solid` in the Home Assistant theme (the CSS variable `--lg-look`, value `solid` or `glass`). `look:` on a single card overrides the theme; without either the card stays glass. The card picks up theme switches on its own.

```yaml
# in your Home Assistant theme
lg-look: solid
```

## Theme variables

Like the other Liquid Glass cards, this card reads two optional CSS variables, so one theme can align all of them:

```yaml
# in your Home Assistant theme
lg-radius: 22px                          # corner radius of the glass panel
lg-backdrop: blur(22px) saturate(180%)   # blur/saturation behind the panel
```

Without them nothing changes. Options set on the card itself (e.g. `blur`) still win.

## Changelog

### 1.3.1
- Solid look: the panel reads its own variables (`--lg-panel-bg`, `--lg-panel-edge`, `--lg-panel-shadow`), so a theme can style panels inside pop-ups differently from cards on the page.

### 1.3.0
- Solid look: round buttons take edge and shadow from the theme too.
- Solid look: the panel takes its fill from `--lg-tile-bg` when the theme sets it (glass solid look).
- Solid look: the card's own panel takes edge, shadow and blur from the theme (`--lg-tile-edge`, `--lg-tile-shadow`, `--lg-panel-backdrop`).
- Solid look: inner surfaces take their edge and shadow from the theme (`--lg-tile-edge`, `--lg-tile-shadow`), so a glass theme can give them a light glass edge.

### 1.2.0
- The look can come from the theme: `lg-look: solid` (CSS variable `--lg-look`) switches all Liquid Glass cards to the solid look; `look:` on the card overrides it (see *Solid look*).
- New option `look: solid`: calm solid surfaces, a filled robot icon while running, flat round buttons, no glass, blur or glows. Uses the optional design tokens `--surface` and `--lg-tile-bg` (see *Solid look*). Without the option the card looks exactly as before.

### 1.1.0
- Reads the optional theme variables `--lg-radius` and `--lg-backdrop` (see *Theme variables*).
- New `status_entity` option: a one-line status under each robot (tap to expand), orange for ⚠ hints, teal while running.
- Status texts follow the Home Assistant language (German/English).
- No empty "Map" placeholder when no `map_camera` is set.
- Renders into its own Shadow DOM, so its styles can't clash with other cards.
- Version banner in the browser console.

## License

MIT.

## Credits

Built iteratively in conversation with Claude (Anthropic) against a real Home Assistant dashboard,
then cleaned up for public release.
