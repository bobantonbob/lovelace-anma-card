# Validation — 0.7.0

- 30 automated tests cover Cloud Flow weather sources, unavailable data, forecast capabilities, energy units, grid outages, configuration persistence and YAML export, plus existing Power Flow and Energy Station behavior.
- JavaScript syntax and Django system checks passed.
- Isolated Edge browser checks rendered all six templates at 1440px desktop and 375 × 812 phone viewport sizes, with no JavaScript errors or horizontal overflow.
- All six templates were also checked after a legacy `anma-card` was pre-registered.
- Cloud Flow's separate forecast source, settings drawer persistence, light/dark theme and grid-offline behavior were exercised in the browser.
- Gallery images are fresh screenshots of the actual 0.7.0 standalone card. They use synthetic Home Assistant states, forecast events and history responses. The fixture is `tests/card-gallery.html` in the platform source.
- Root `anma-card.js` is the same build as the platform distribution; checksums are recorded in `SHA256SUMS.txt`.
- The manual-install ZIP contains the 0.7.0 resource and resource-version manifest.

## Scope

Phone screenshots are browser viewport previews, not physical iPhone/Safari tests. Live forecasts require a weather integration that supports the requested type; charts need recorded history. The local test's mocked HA connection cannot certify an individual provider or device integration.

Cloud Flow's source assets are generated architectural illustrations. Their readings, conditions and animation are live code elements, not numbers painted into the images.

HACS custom-repository installation uses one resource: `/hacsfiles/lovelace-anma-card/anma-card.js`. Default HACS catalog acceptance remains a separate process.
