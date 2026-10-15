# Validation and release status

## Stable 0.2.0

The owner has promoted the current card to the stable release channel. The package matches the platform distribution; checksums are recorded in SHA256SUMS.txt.

- Five Power Flow model tests cover persistence, export, safe image values, opacity and existing settings.
- 239 browser assertions cover PV counts 1–10 at 360/768/1440px and background controls.
- 48 additional real-card assertions verify identical geometry before/after station and device photos for Power Flow and Cloud Flow at 360/768/1200px.
- JavaScript syntax and package structure/documentation validation pass.
- New desktop and phone-sized previews use synthetic states and the actual renderer.
- HACS validation is run by the repository workflow. Default-catalog acceptance is separate.

## Compatibility scope

Phone screenshots are browser viewport previews, not physical iPhone/Safari testing. Live history, weather and forecasts depend on the user's Home Assistant integrations; a local preview cannot verify those services. Stable release status does not imply certification of every browser or inverter integration.

Compact metrics need their own sensor/unit settings. Keep only one ANMA JavaScript resource registered and reload the browser after upgrading.
