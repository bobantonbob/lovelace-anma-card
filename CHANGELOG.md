# Changelog

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
