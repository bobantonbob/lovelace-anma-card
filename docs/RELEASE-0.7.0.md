# 0.7.0 — Architectural Cloud Flow and refreshed gallery

Cloud Flow becomes a responsive architectural energy scene: a compact home with wall inverter, solar panels, grid pylon, battery cabinets and non-backup supply. Readings and directional flows are rendered live above separate illustrated assets. Desktop and phone layouts rearrange the objects independently.

## Weather and forecast sources

Connections now exposes separate current-weather and forecast `weather.*` entities. Current conditions control temperature and subtle background sunlight, clouds, rain or snow. The forecast provider supplies hourly, daily or day/night readings when supported. Leave its entity empty to use the current-weather provider. Effects can be disabled or adjusted in intensity.

Cloud Flow's images are embedded in `anma-card.js`; all six templates still use the single `custom:anma-card` entry point. Existing PV, battery, grid and inverter bindings remain compatible.

## Documentation and downloads

- All six dashboard gallery sections have fresh desktop and 375px phone screenshots from the actual 0.7.0 card.
- Cloud Flow setup and its example include separate weather/forecast source fields.
- The standalone JS file and manual-install ZIP are rebuilt for 0.7.0.
- Energy Station retains recent improvements: solar actual/forecast comparison, compact inverter readings, actual-discharge battery autonomy and appearance settings.

## Validation

30 automated tests, JavaScript syntax checks and Django system checks passed. Isolated browser checks rendered all six templates at desktop and phone sizes without JavaScript errors or horizontal overflow, including with a pre-registered legacy card. Additional Cloud Flow checks covered a separate forecast provider, settings persistence while editing, theme switching and grid outages.

Gallery readings, history and forecasts are synthetic demonstration data. Phone views are browser viewport tests, not physical-device certification. Real provider availability and recorded history depend on each Home Assistant installation.
