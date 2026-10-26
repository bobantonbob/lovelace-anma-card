# ANMA Energy Dashboards 0.7.6

Cloud Flow Connections adds Names and captions. Rename or independently hide each
object title: solar, grid, inverter, house, battery, non-backup and EV. Values,
states, illustrations and flows remain visible. The footer legend follows the same
names and visibility switches.

Cloud Flow remains the fixed dashboard title. Its system caption can be edited
separately, or left empty to hide it, without renaming the outer dashboard.

General settings now include Show ANMA ELECTRIC header for all six templates.
Disable it to remove the complete outer brand bar and free screen space. The
platform preview and exported HA card use the same saved visibility setting.

Settings survive the unified `custom:anma-card` YAML export. Existing layouts keep
their current labels and header until changed. 35 JavaScript tests and Django
checks pass; the actual HA editor was checked for title visibility, custom names,
caption changes, all six header routes and phone viewport fit.
