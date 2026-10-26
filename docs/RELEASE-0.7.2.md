# ANMA Energy Dashboards 0.7.2

Cloud Flow now has its own Connections editor on the platform and in Home
Assistant. Settings are grouped by the objects actually shown: solar total,
battery total, inverter, grid, house, non-backup group, EV, weather and appearance.

Removed irrelevant Cloud Flow controls for per-node photos, uploads, opacity,
border ratings, PV string layouts, MPPT grouping and individual battery blocks.
The architectural illustrations remain unchanged. Other dashboard editors retain
their existing equipment controls.

Bind one total solar power sensor, one total battery power sensor and total SOC.
These override the old sums without double counting. Leaving them empty preserves
previous PV/battery bindings, so existing layouts continue to work. Settings still
export through the single `custom:anma-card` type.

The HA section selector now identifies Cloud Flow Connections and omits unused
widget/measurement sections for this scene. Demo-weather selection is limited to
website preview, and HA does not show the website JSON entity-import control.

Validation: 33 JavaScript tests and Django checks pass. The actual standalone HA
editor was checked in headless Edge at 1440px and 375px, including entity editing,
absence of obsolete controls and horizontal overflow. No scene assets changed.
