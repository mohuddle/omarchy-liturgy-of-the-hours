# Liturgy of the Hours for Omarchy

An Omarchy Quattro bar widget for the canonical hours. A Jerusalem Cross sits in the bar; click it for today’s Scripture, the office of the current hour, and the remaining schedule. Desktop reminders fire at Morning Prayer, Evening Prayer, and the little hours of Prime, Terce, Sext, and None.

![Plugin preview](preview.png)

Plugin id: `io.github.mohuddle.liturgy-of-the-hours`

## What it does

- Shows a theme-colored Jerusalem Cross in the Omarchy bar (accent-colored while an hour is current).
- Rotates a curated public-domain Scripture passage once per local calendar day (sequential or deterministic random).
- Lists today’s hours with local times, and opens the invitatory, hymn, hour-Scripture, and collect for the selected office.
- Sends one Omarchy notification at each enabled hour (with a five-minute grace window, so a brief lock or sleep still catches it; missed hours are not dumped later).
- Caches fetched verse text and reminder state at `~/.local/state/omarchy/settings/liturgy-of-the-hours.json`.

The plugin does not overwrite `~/.config/omarchy/shell.json` except to add or update its own bar-widget entry when you enable it or change its settings. No sudo or pkexec is required.

## Hours and default times

| Hour | Latin | Traditional | Default |
|------|-------|-------------|---------|
| Morning Prayer | Laudes | Dawn | 06:00 |
| Prime | Prima | First Hour | 07:00 |
| Terce | Tertia | Third Hour | 09:00 |
| Sext | Sexta | Sixth Hour | 12:00 |
| None | Nona | Ninth Hour | 15:00 |
| Evening Prayer | Vesperae | Sunset | 18:00 |

Prime is 07:00 by default so it does not collide with Morning Prayer. Every hour can be enabled, disabled, or retimed from the panel gear.

## Sources and attribution

- Daily English (and optional Latin Vulgate) verse text comes from [bible-api.com](https://bible-api.com/), defaulting to the public-domain World English Bible. The selected translation is named beneath each passage.
- Hour prayers, hymns, and invitatories are traditional public-domain office texts bundled with the plugin. They are not fetched.

Neither source needs an API key; this repository contains none.

## Install

```bash
omarchy plugin add https://github.com/mohuddle/omarchy-liturgy-of-the-hours.git --enable
```

The widget is added to the right bar section. To move it:

```bash
omarchy bar move io.github.mohuddle.liturgy-of-the-hours --section center
```

## Usage

- **Left click:** open or close the panel.
- **Middle click:** refresh today’s Scripture (ignores the daily cache).
- **Right click:** send today’s Scripture as a desktop notification.
- With the popup open: `Esc` closes it, `r` refreshes, `Tab`/`Shift+Tab` switches to the neighboring bar panel.
- Gear in the panel: times, which hours to keep, translation, sequential/random Scripture, and reminder on/off.

On first open the panel offers suggested hours. There is no install-time wizard.

## Network, cache, and privacy

The plugin runs commands through Omarchy’s unsandboxed shell integration to make HTTPS `curl` requests to bible-api.com for uncached verses only. Hour reminders are local and do not need the network. If the API is unreachable, the last cached verse stays visible with an error note. No account, API key, telemetry, or personal content is sent.

The hours themselves always work offline.

## Dependencies

- Omarchy Quattro (`omarchy-shell`)
- `curl`, invoked as a subprocess to fetch verse text
- Network access to `bible-api.com` (no API key). If unreachable, the last cached verse remains visible.

No extra packages are installed. No sudo or pkexec is required.

## Remove

```bash
omarchy plugin remove io.github.mohuddle.liturgy-of-the-hours
```

That disables the widget and deletes the plugin checkout. Optional: remove only this plugin’s cache and reminder state:

```bash
rm -f ~/.local/state/omarchy/settings/liturgy-of-the-hours.json
```

Removal does not touch other Omarchy configuration.

## Development checks

```bash
omarchy plugin validate .
node tests/model.test.js
```

## License

MIT. See [LICENSE](LICENSE).
