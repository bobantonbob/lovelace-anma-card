# ANMA Energy Dashboards 0.7.4

Cloud Flow displays today's solar generation and forecast separated by a slash:
`Today 5.2 / 24 kWh` (actual / forecast). In Connections > Solar total, select the
forecast for total generation today. A remaining-generation forecast is a different
measurement and should not be used for this field.

The optional `layout.powerFlow.cloud.solarForecast` accepts an energy sensor or
fixed kWh value. Wh, kWh and MWh sensor units are converted consistently. Without
a forecast binding the existing actual-only display remains. Unavailable configured
readings show a dash. The binding survives the same unified card YAML export.

Validation: 34 JavaScript tests, Django checks, and a browser check of the actual
standalone phone card with the fact/forecast reading and no page overflow.
