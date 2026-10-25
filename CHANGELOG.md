# Changelog

## 0.6.2 — Energy Station editor selection

Use a versioned Home Assistant editor even if a legacy editor was previously registered. Route Energy Station settings directly by template and label its Connections section correctly. Existing entity bindings remain unchanged. Verified against pre-registered legacy card/editor constructors.


## 0.6.1 — Refresh stale shared runtime

Always initialize the bundled Energy Station renderer even when an older ANMA resource has already initialized global helpers. Verified Energy Station YAML retains its template with a preloaded legacy model. Existing entity mappings remain unchanged.

After updating, fully reload Home Assistant and keep only one ANMA JavaScript resource registered.


## 0.6.0 — Three-phase telemetry and configurable flow colors

- Select single-phase or three-phase inverter telemetry, with separate L1/L2/L3 voltage and current entities and shared frequency.
- Customize solar, grid, inverter, load, GEN/AUX and battery colors, including separate charging/discharging colors.
- Device-colored labels, larger readings and compact units beside the corresponding node; remove redundant labels and purchase price from the diagram.
- Show usable battery energy above reserve SOC and estimated autonomy at the current backup load, assuming battery-only supply. Capacity inputs remain total kWh; estimates exclude conversion losses and future load changes.
- Demo mode exposes optional telemetry without requiring entity bindings. Live missing data remains unknown.
- Existing layouts and single-phase bindings remain supported.

Validation: 14 Energy Station tests passed; JavaScript syntax and package validation passed.

![Updated Energy Station with demonstration readings](https://raw.githubusercontent.com/bobantonbob/lovelace-anma-card/v0.6.0/docs/energy-station-telemetry.png)


## 0.5.0 — Energy Station telemetry beside devices

- Read individual battery SOC and decimal voltage directly beside each battery.
- Main battery readings include power, SOC, voltage, current, capacity, daily charge/discharge and estimated time to the configured reserve SOC.
- Grid import/export counters and purchase tariff appear beside the grid; daily home consumption beside backup loads.
- Inverter status, voltage, current, frequency and AC/DC temperatures appear beside the inverter.
- Desktop fit option and responsive telemetry placement; no separate telemetry panels.
- Existing layouts and entity bindings remain supported. Unknown readings stay unknown.

Capacity uses kWh. Runtime is an estimate based on current battery discharge power and available energy above reserve SOC; it is unavailable while charging or when required readings are missing.

Validation: 11 Energy Station tests and Django system checks passed. Real sensor mappings should be verified after installation.


## 0.4.1 — refreshed connections and Energy Station gallery

- Power Flow connections now meet measured node boundaries, including after resizing.
- Power Flow and Cloud Flow use matching Connections buttons and compact scrolling settings panels in the web editor.
- Energy Station leads the dashboard documentation with current desktop and phone captures.
- Refreshed Power Flow, Cloud Flow and analytics screenshots, installation instructions and feature guide.
- Existing entity bindings and layouts retained.


## 0.4.0 — Energy Station

- New Energy Station template: up to 10 PV fields and 5 batteries, daily solar energy and PV totals.
- Optional backup/non-backup groups, appliance icons and group assignment, GEN/AUX generator, microinverter or smart-load roles.
- Signed grid and battery readings, grid-outage states, unit conversion and explicit missing-data states.
- Responsive wide, square and phone layouts with light/dark themes.
- Visible PV, battery and appliance rows recenter when their count or visibility changes.
- Shared website and Home Assistant renderer, entity configuration and export support.
- Existing templates and entity bindings preserved.

Validation: 9 Energy Station tests, 19 platform dashboard tests, Django checks and JavaScript syntax checks passed. Live hardware validation remains installation-specific. Replace example entity IDs with your own entities.


## 0.3.0 â€” node backgrounds and reliable flow bindings (2026-10-16)

### Added
- Individual background photos for every Power Flow and Cloud Flow node: PV strings, inverter, batteries, grid, guaranteed and non-guaranteed loads, EV, and Cloud Flow totals.
- Independent panel opacity (40% by default, 0â€“100%) and photo visibility. Icons and readings remain opaque. Set both to zero for a background-free node.
- Photos use centered cover cropping without stretching or changing node geometry.
- Visible PV entity pickers next to each PV array in the Home Assistant equipment editor; expanded PV entity settings on the website.
- Explicit signed or split power meter selection for grid and battery in the Home Assistant editor.

### Fixed
- Editing equipment settings no longer restores stale configuration and discards recently assigned entities.
- Individual PV flow lines now respond to their own live power readings.
- Signed grid direction verified: positive import, negative export, optional sign inversion; zero and unavailable readings pause animation.

### Release alignment and compatibility
- Website release notes, runtime card and downloadable installation artifacts share version 0.3.0.
- Existing sensor bindings and layouts are preserved; no database migration is required.
- This builds on stable 0.2.0: responsive Power Flow / Cloud Flow, balanced PV rows, independent whole-card backgrounds and continuous animations.
- Validated node photos and unchanged geometry at 375, 768 and 1440 px, PV editing persistence, grid direction and Django system checks.

### Updating
Update ANMA Card through HACS after it detects this release, or replace anma-card.js manually and refresh the Home Assistant browser cache. Existing configurations remain usable. The new default panel opacity is 40%; set it to 100% for solid panels.


## 0.2.0 â€” stable release

- Promote the current card to the stable release channel.
- Include independent card backgrounds, opacity controls, balanced PV rows and the Home Assistant background positioning fix.
- Refresh desktop and iPhone 16-sized browser screenshots and explain compact mobile behavior.
- Preserve existing layouts and sensor bindings; no migration is needed.

## 0.2.0-beta.6 â€” background geometry fix

- Prevent Home Assistant widget styles from placing the background photo in the content flow.
- Cover cropping preserves image proportions and fills the card without moving its contents.
- Station, inverter and battery photos passed 48 geometry assertions across both flow templates and three viewport widths.
- Keep sensor bindings, device icons and opacity controls unchanged.

## 0.2.0-beta.5 â€” card backgrounds and balanced PV rows

- Fix Home Assistant widget CSS overriding background positioning: photos no longer shift content or consume layout space. Verified identical geometry before/after station and device photos with 48 additional assertions.
- Add independent whole-card background photos to Power Flow and Cloud Flow, with upload/URL, cover/contain, position and 0â€“100% visibility controls.
- Preserve existing device photos, sensor bindings and saved layouts.
- Balance 2â€“10 PV groups across two full-width rows: 3 = 2+1, 7 = 4+3, 8 = 4+4, 10 = 5+5. A single group fills the solar area.
- Validate 239 browser assertions across 360/768/1440px containers, five model tests and Django system checks.
- Update the installed card's console version to 0.2.0-beta.5.

### Licensing and project information

- Adopt the MIT license with owner approval.
- Add the ANMA Energy Platform website, equipment knowledge base, comparison tools, System Builder and dashboard overview.
- Publish beta.4 on GitHub; default HACS catalog review and clean-install testing remain pending.


## 0.2.0-beta.4 â€” block background photos

- Inverter and battery photos fill their blocks using centered cover cropping without changing aspect ratio.
- Keep the equipment icon over the background photo in desktop layouts.
- Add Photo visibility (0â€“100%) to the shared website/Home Assistant editor; existing photos default to 25% visibility.
- Preserve visibility, including zero, through layout normalization and export.

## 0.2.0-beta.3 â€” sensor input and immediate configuration updates

- Switching from manual watts to an HA sensor immediately creates a text entity input without relying on a parent editor redraw.
- Entity selection/input updates the preview immediately and shows the current HA state or a missing-entity message.
- Configuration events contain independent snapshots, preventing later edits from mutating earlier saved values.
- Regression checked: manual-to-sensor switch, immediate reading, consecutive battery edits, immutable events and saved JSON reload.

## 0.2.0-beta.2 â€” Home Assistant editor and continuous flows

- Power Flow and Cloud Flow open their complete equipment editor directly in Home Assistant: live entity search, manual watts, maximum-power border scales, battery SOC/voltage/temperature, charging source and MPPT grouping.
- Removed the unrelated legacy battery/PV list editor from these two card templates.
- Preserve text-field focus when Home Assistant echoes configuration changes.
- Preserve flow DOM nodes and animation timelines on telemetry updates instead of restarting them.
- Verified entity selection, manual 4500 W against a 9 kW scale (50%), and animation identity across repeated state updates in a local browser harness.

## 0.2.0-beta.1 â€” public distribution candidate

- ANMA Power Flow with individual PV/battery groups and screen-fitting layouts.
- ANMA Cloud Flow six-node directional diagram.
- Power-scaled border utilization and animation speed, signed flow inputs and inversion.
- Charging-source colors and explicit grid/inverter status mappings.
- Manual power input and sensor configuration with entity selection support.
- Responsive metric tiles, forecast tiles and compact chart legends.
- Full analytics composed from energy flows, metrics, weather, forecast and chart.
- Separate block controls and individual metric settings.
- Three-tab dashboard example, installation guides, screenshot gallery and HACS metadata.

Packaging status: local validation only. Public GitHub release, HACS installation and default catalog review remain pending. No open-source license selected.
