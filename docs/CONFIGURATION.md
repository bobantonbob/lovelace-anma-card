# Configuration

## Cloud Flow groups and EV

Cloud Flow Names and captions uses `layout.powerFlow.cloud.labels`, keyed by
`solar`, `grid`, `inverter`, `home`, `battery`, `nonBackup`, `ev`. Each entry accepts
`name` (empty uses the default) and `show` (false hides only the title and matching
legend). `cloud.subtitle` changes the system caption beside Cloud Flow; an empty
string hides it. If absent, the existing layout name is used.

For all templates, `layout.showBrandHeader: false` hides the outer ANMA ELECTRIC
header. The default is true. This setting is available under General in HA and
the platform settings, and survives template switching and YAML export.

Since 0.7.5, Connections > Scene background allows a personal photo (file upload
or image URL), visibility slider, cover/contain and position. Remove it to restore
the standard background. Settings use `layout.powerFlow.background` with `image`,
`opacity` (0–100), `fit` and `position`. Uploads are resized/compressed and embedded
in the configuration; external/local URLs must resolve from the HA browser.
Cloud Flow no longer exposes or follows day/night themes. Other views still do.

`layout.powerFlow.cloud.solarForecast` selects today's total solar generation
forecast (energy sensor or fixed kWh value). The solar detail displays today's
actual generation / forecast. Sensor Wh and MWh are converted to kWh. Leave empty
for actual-only display. Choose a full-day forecast rather than remaining energy.

Since 0.7.2 Cloud Flow has dedicated Connections sections for its fixed objects.
Set `layout.powerFlow.cloud.solarPower`, `batteryPower` and `batterySoc` to total
sensor IDs (or fixed numeric values). Solar/battery power uses W, kW or MW sensor
units; numeric power is W. SOC uses percent. A configured total replaces the old
sum; unavailable configured totals stay unknown. Empty totals retain the previous
PV and battery arrays, including first-battery SOC. No legacy bindings are deleted.

Cloud Flow does not expose per-node images, border utilization or MPPT layout
settings. Its illustrations are fixed; those controls remain in other views.

In Connections, use **Cloud Flow · groups and EV** to show or hide the non-backup
group and the optional Tesla-style EV. The EV appears below the main house.
`layout.powerFlow.cloud` accepts `showNonBackup` (true by default), `showEv`
(false by default), `evName`, and `evGroup` (`backup` or `grid`). Bind the EV
power entity in `layout.powerFlow.ev`. Hiding equipment does not change totals.
During a reported grid outage, a grid-fed EV loses supply and its flow stops.

Battery power uses the existing sign convention (positive discharge, negative
charge), with the existing inversion option. Below 10 W in magnitude the label
shows standby and the flow stops. Missing data is never treated as zero.

## Starting point

Use a `type: custom:anma-card` card with a `layout` object. Examples are JSON formatted as YAML (JSON is valid YAML), so the Home Assistant raw editor accepts them directly. The three-tab file is a whole dashboard; the individual files are individual cards. Do not paste a whole dashboard into a single card editor.

`layout.template` selects `power_flow`, `cloud_flow`, `overview`, `compact` or `full`. `layout.widgets` selects and orders sections. Full analytics uses `flow`, `solar`, `battery`, `load`, `grid`, `weather`, `solar_forecast`, `chart`. The older Equipment & PV template is not part of this published template set.

## Power Flow and Cloud Flow

Inverter and battery `image` URLs/uploads are block backgrounds. `imageOpacity` is visibility from 0 to 100 (default 25): 0 is fully transparent, 100 is opaque. The image uses centered `cover` sizing, so it keeps its aspect ratio and crops excess edges. It does not replace the equipment icon. Use the Photo visibility slider in the equipment editor.

| Path under `layout.powerFlow` | Meaning |
| --- | --- |
| `strings[]` | Up to 10 PV groups, each with `name`, `power`, optional `capacityKw` and up to two `mppts` |
| `batteries[]` | Up to 5 batteries: `name`, `power`, `soc`, `voltage`, `temperature`, `capacityKw` |
| `inverter` | Central inverter block: name, power, capacity and optional image |
| `grid`, `load`, `nonBackup`, `ev` | Power entity IDs or manual power strings |
| `gridCapacityKw` | Grid power scale for perimeter and speed |
| `gridStatus` | Connection-status entity, usually a binary sensor |
| `gridOn`, `gridOff` | Comma-separated state mappings |
| `inverterStatus` | Optional operating-state entity |
| `invertGrid`, `invertBattery` | Reverse the input sign convention |
| `showEv` | Show/hide the EV branch |
| `fit`, `profile`, `mode` | Screen fitting; auto/desktop/tablet/mobile profile; auto/day/night appearance |

Manual power strings are **watts**: `"9000"` means 9 kW. `capacityKw: 9` is a **maximum-power scale**, not a live reading and not battery energy capacity in kWh. At 4.5 kW against a 9 kW scale the perimeter is half filled. Higher utilization also increases animation speed. Do not guess per-string capacities by dividing an inverter's rating.

Default sign conventions: grid positive = import, negative = export; battery positive = discharge, negative = charge. Verify your integration with an observed import/charge event and invert only when needed. A zero power reading does not by itself prove that the grid is disconnected; supply `gridStatus` for outage behavior.

Battery `chargeSource` accepts `sensor`, `solar`, `grid` or `mixed`. With `sensor`, supply `chargeSourceEntity` whose state identifies the source. Fixed values are explicit configuration assumptions. Unknown source data is not inferred from sunlight.

Four inverters with two strings each can be represented as eight named PV groups (`Inverter 1 / PV1` through `Inverter 4 / PV2`). The Power Flow layout still has one central inverter block; use an explicitly defined aggregate sensor if you want that block to represent several inverters. Cloud Flow aggregates PV/battery power into its six-node diagram; it is not an eight-node per-string diagram.

## Full analytics and other templates

`layout.bindings` maps semantic keys to entities: `solar_power`, `battery_power`, `battery_soc`, `battery_voltage`, `battery_temp`, `grid_power`, `load_power`, `inverter_power`, `solar_daily_energy`, `load_daily_energy`, `grid_daily_import`, `grid_daily_export`, `weather_condition` and others present in the examples.

For flow widgets, `layout.flowMeters.<role>.mode` can be `single` for a signed sensor or `split` for separate positive/negative power sensors. Split sensors use `<role>_positive_power` and `<role>_negative_power` binding keys. `ratedPower` here is **watts**, unlike Power Flow's `capacityKw`. `layout.flowInverted` controls role-specific inversion. Do not apply both sensor-side inversion and card-side inversion inadvertently.

Forecast bindings `forecast_day_0` through `forecast_day_6` are daily energy estimates, normally kWh. Configure a weather entity separately. Chart bindings can use `chart_<role>_power` overrides; otherwise the role power bindings are used. Recorder retention and statistics availability determine usable time ranges.

## Editing and persistence

The card includes a Home Assistant editor and entity selection support. Search by entity ID or friendly name and check its displayed state and units. Save the surrounding dashboard after editor changes. Reload and verify that settings remain. Keep an exported layout backup before large changes.

## Troubleshooting

- **Custom element does not exist:** inspect the resource URL and JavaScript module type; reload after installation.
- **Old appearance:** replace the file, bump its cache query version for manual installs, and remove duplicate old resources.
- **Dashes:** check the exact entity ID, state and units in Developer Tools → States. `unavailable` is not a measured zero.
- **Wrong flow direction:** check single/split mode and sign inversion against real behavior.
- **No perimeter:** set the appropriate maximum-power scale; avoid entering kWh in a power field.
- **Demo chart:** bind real entities and verify Recorder history. Do not treat demo points as recorded measurements.
- **Phone overflow:** use responsive profile and remove old custom width/height/scale overrides from imported layouts.
- **No forecast:** install/configure a forecast integration; this card does not generate a production forecast itself.

## Whole-card and device backgrounds

Power Flow and Cloud Flow settings include Card background: upload a PNG/JPEG/WebP image or enter its URL, choose cover or contain, select a position and adjust visibility (0–100%). Cover fills every edge and crops excess image area without changing aspect ratio. Background photos remain outside the document layout and do not move readings or controls.

Inverter and battery photos have their own visibility controls; their icons remain above the image. Whole-card settings are stored in `layout.powerFlow.background` with `image`, `opacity`, `fit` and `position`. Older `layout.background` station images remain supported when no card-specific override is set.

## Energy Station telemetry (0.5.0)

Under `layout.powerFlow.station`, individual `batteries` accept `soc` and `voltage` entity IDs. Voltage displays two decimal places.

`master` accepts `power`, `soc`, `voltage`, `current`, `capacity`, `chargeToday`, and `dischargeToday`. Capacity is energy in kWh (not Ah). Set `reserveSoc` to the desired minimum percentage. Runtime uses current discharge power and available capacity above reserve; it is an estimate, not a guarantee.

`telemetry` accepts `importToday`, `exportToday`, `homeToday`, `voltage`, `current`, `frequency`, `acTemperature`, `dcTemperature`, and `buyPrice`. Set `currency` for the purchase price label. Configure `inverterStatus` and the `inverterOn`, `inverterOff`, `inverterFault` state lists for status indication. Optional measurements appear beside their matching diagram node. `fit: true` enables desktop/tablet viewport fitting.

## Phases, colors and reserve energy (0.6.0)

Set `station.phases` to `1` (default) or `3`. Three-phase systems use `phaseReadings`, an array of three objects with `voltage` and `current` entity IDs. `telemetry.frequency` is shared. Existing single-phase `telemetry.voltage` and `telemetry.current` bindings remain stored.

`station.colors` supports six-digit hex values for `solar`, `grid`, `backup`, `battery`, `charge`, `discharge`, `aux`, and `inverter`. Configure these in Connections → Flow colors.

The displayed battery kWh is usable energy above `reserveSoc`: total capacity × max(0, SOC − reserve) / 100. Estimated runtime divides that energy by the actual battery discharge power. Missing required readings, charging and idle produce a dash. The purchase price is no longer displayed on the diagram; saved bindings are retained.

## Cloud Flow weather

Version 0.7.0 stores these options in `layout.powerFlow.cloud`. Select them under **Connections → Cloud Flow · weather and atmosphere**.

| Field | Purpose | Default |
| --- | --- | --- |
| `weatherEntity` | `weather.*` for current conditions, temperature and atmosphere. | Empty |
| `forecastEntity` | Separate forecast `weather.*`; empty uses `weatherEntity`. | Empty |
| `forecastType` | `auto`, `hourly`, `daily`, `twice_daily`. Auto prefers supported hourly forecasts. | `auto` |
| `showForecast` | Show the upcoming forecast row. | `true` |
| `effects` | Enable background weather effects. | `true` |
| `effectOpacity` | Effect intensity, 0–100. Text and equipment remain opaque. | `35` |
| `solarToday` | Daily solar energy entity in Wh, kWh or MWh, or a fixed kWh value. | Empty |
| `demoWeather` | Website preview only: sunny, partlycloudy, rainy, snowy, cloudy, clear-night. | `partlycloudy` |

```yaml
type: custom:anma-card
layout:
  template: cloud_flow
  name: My home
  powerFlow:
    cloud:
      weatherEntity: weather.home
      forecastEntity: weather.forecast_home
      forecastType: auto
      showForecast: true
      effects: true
      effectOpacity: 35
```

Forecasts use Home Assistant's weather subscription API and the provider's supported forecast types. Selecting a separate provider changes only the forecast; the current weather entity continues to control the background. An unavailable explicitly selected provider is not replaced by a different source. Temperature units follow each selected weather entity.

All views use the same `anma-card.js` resource. The architectural images are embedded; no extra JS card type or asset installation is needed.
