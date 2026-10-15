# Validation and release status

## Completed locally

- The packaged runtime is byte-for-byte identical to the current platform distribution  (SHA-256 recorded in SHA256SUMS.txt).
- JavaScript syntax checked with `node --check anma-card.js`.
- Existing platform Power Flow model tests: 3 passed, covering configuration persistence/export, limits, URL normalization and status mappings.
- Three-view and individual-card examples parsed as JSON-compatible YAML.
- English browser preview rendered Power Flow, Cloud Flow and full analytics using synthetic states. Mobile Flow screenshots captured with a 390×844 viewport request.
- Checked screenshot/document links and excluded private configuration, tokens, databases and Home Assistant backups from the package.

## Still required before a stable release

- Install the published repository through HACS on a clean Home Assistant instance.
- Verify live Recorder history, weather and solar forecast with the user's integrations.
- Verify complete mobile analytics scrolling, sign conventions and persistence on the target installation.
- Review any new third-party assets before including them.

No HACS approval or public installation success is claimed. This candidate is a packaging snapshot; it does not certify completion of the separate Pivdenne installation task.

## Known configuration pitfalls

Compact metric items need their own sensor/unit configuration. The included examples explicitly use W for raw power entities; the renderer can format those as kW. Changing a generic binding alone may leave older per-item settings in an imported layout.

Weather includes a forecast presentation, and adding a separate solar_forecast section can show a second forecast. Choose the widgets you want. Browser-only previews cannot verify server history subscriptions. Blank forecast and history states are expected in preview.html.

Beta.2: tested the actual HA editor with synthetic states and config-changed echoes. BAT search returned live-labelled values; selection retained focus; manual 4500 W and maximum 9 kW rendered 50%; repeated HA state updates preserved Power Flow and Cloud Flow animation objects. Target Home Assistant installation is still pending.


## Publication update

The public GitHub repository and beta.4 release are published. The owner selected the MIT license. The official HACS validation workflow is enabled; check its latest run for current results. Default catalog acceptance remains a separate review.
