# 0.6.9 — Solar forecast and desktop telemetry

Energy Station accepts a daily solar forecast entity in Connections → Solar. Below the sun, actual production is shown to the left of a centered slash and the daily forecast to the right. Energy entities are converted from Wh, kWh or MWh; an unavailable forecast remains unknown. Existing layouts without a forecast retain their production reading.

Desktop temperature captions now read `AC 46 °C` and `DC 41 °C`. Temperature readings sit to the left of the inverter, voltage/current to the right at the same height, and frequency inside its upper corner. Diagram text is increased by 2px on desktop; phone text sizes and inverter telemetry placement remain unchanged.

The single `custom:anma-card` entry point, entity bindings and battery calculations are preserved. Website YAML exports retain the forecast setting.

Validation: 20 automated tests and Django system checks passed. Browser checks covered centered forecast values, desktop 22px readings, and phone 20px readings with three phases and no horizontal overflow.
