# Changelog

## 0.2.0 — stable release

- Promote the current card to the stable release channel.
- Include independent card backgrounds, opacity controls, balanced PV rows and the Home Assistant background positioning fix.
- Refresh desktop and iPhone 16-sized browser screenshots and explain compact mobile behavior.
- Preserve existing layouts and sensor bindings; no migration is needed.

## 0.2.0-beta.6 — background geometry fix

- Prevent Home Assistant widget styles from placing the background photo in the content flow.
- Cover cropping preserves image proportions and fills the card without moving its contents.
- Station, inverter and battery photos passed 48 geometry assertions across both flow templates and three viewport widths.
- Keep sensor bindings, device icons and opacity controls unchanged.

## 0.2.0-beta.5 — card backgrounds and balanced PV rows

- Fix Home Assistant widget CSS overriding background positioning: photos no longer shift content or consume layout space. Verified identical geometry before/after station and device photos with 48 additional assertions.
- Add independent whole-card background photos to Power Flow and Cloud Flow, with upload/URL, cover/contain, position and 0–100% visibility controls.
- Preserve existing device photos, sensor bindings and saved layouts.
- Balance 2–10 PV groups across two full-width rows: 3 = 2+1, 7 = 4+3, 8 = 4+4, 10 = 5+5. A single group fills the solar area.
- Validate 239 browser assertions across 360/768/1440px containers, five model tests and Django system checks.
- Update the installed card's console version to 0.2.0-beta.5.

### Licensing and project information

- Adopt the MIT license with owner approval.
- Add the ANMA Energy Platform website, equipment knowledge base, comparison tools, System Builder and dashboard overview.
- Publish beta.4 on GitHub; default HACS catalog review and clean-install testing remain pending.


## 0.2.0-beta.4 — block background photos

- Inverter and battery photos fill their blocks using centered cover cropping without changing aspect ratio.
- Keep the equipment icon over the background photo in desktop layouts.
- Add Photo visibility (0–100%) to the shared website/Home Assistant editor; existing photos default to 25% visibility.
- Preserve visibility, including zero, through layout normalization and export.

## 0.2.0-beta.3 — sensor input and immediate configuration updates

- Switching from manual watts to an HA sensor immediately creates a text entity input without relying on a parent editor redraw.
- Entity selection/input updates the preview immediately and shows the current HA state or a missing-entity message.
- Configuration events contain independent snapshots, preventing later edits from mutating earlier saved values.
- Regression checked: manual-to-sensor switch, immediate reading, consecutive battery edits, immutable events and saved JSON reload.

## 0.2.0-beta.2 — Home Assistant editor and continuous flows

- Power Flow and Cloud Flow open their complete equipment editor directly in Home Assistant: live entity search, manual watts, maximum-power border scales, battery SOC/voltage/temperature, charging source and MPPT grouping.
- Removed the unrelated legacy battery/PV list editor from these two card templates.
- Preserve text-field focus when Home Assistant echoes configuration changes.
- Preserve flow DOM nodes and animation timelines on telemetry updates instead of restarting them.
- Verified entity selection, manual 4500 W against a 9 kW scale (50%), and animation identity across repeated state updates in a local browser harness.

## 0.2.0-beta.1 — public distribution candidate

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
