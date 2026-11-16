# Deye LCD — Solarman bindings / Прив’язки Solarman

## Scope / Межі перевірки

Read-only review on 2026-11-16: the supplied SG0*LP1 single-phase and SG0*HP3 three-phase HA device pages, both Solarman. No inverter settings changed. UI names and exposed controls were reviewed; this was not an API inventory of every entity ID or a live hardware write test.

## Setup / Налаштування

New studio dashboards use the `deye` prefix by default. Selecting a Deye catalog model fills standard bindings and detects LP1 (one phase) or LP3/HP3 (three phases), plus the nominal kW from its model name. Previous generated `inverter` bindings are replaced; custom IDs are preserved. Offline presets are naming templates, not proof that every entity exists. The supplied LP1 device's visible entity ID table was checked on 2026-11-16, including sensors, numbers, switches, selectors and program time entities. No hardware writes were performed.

Новий LCD використовує префікс `deye`. Вибір моделі заповнює стандартні прив’язки, визначає фазність LP1/LP3/HP3 та номінальну потужність. Власні ID зберігаються. Без HA кнопка **Standard bindings (offline)** заповнює шаблон назв; перевірте доступність сутностей після встановлення картки.

1. Open Deye LCD bindings in the website or Home Assistant card editor / Відкрийте прив’язки Deye LCD у редакторі.
2. Choose the exact Solarman entity prefix (for example `deye` for `sensor.deye_battery_power`) and 1 or 3 phases / Вкажіть префікс сутностей саме потрібного інвертора та кількість фаз.
3. Click **Fill empty bindings / Заповнити порожні прив’язки**. Only existing IDs are proposed; saved explicit mappings are preserved. Phase count is updated explicitly. Changing to another inverter requires clearing/replacing previous bindings, not filling around them.
4. Review **Binding audit / Перевірка прив’язок**. Renamed entities must be assigned manually. A missing entity is not created by this card.
5. On the website without live HA states, import a local JSON list of states (`[{"entity_id":"sensor.example","state":"0","attributes":{...}}]`) or a dictionary keyed by entity ID. This file is processed locally, not uploaded. Do not include credentials. Only selected mappings are saved/exported.
6. Export the existing ANMA dashboard file and install/use the regenerated `anma-card.js` with it. In HA the same `powerFlow.deye` map is used. English and Ukrainian share IDs and service values; translation changes only labels.

## Display and controls / Показники та керування

- Prefer total PV/Grid/Load/Battery power sensors for main gauges. L1–L3 are separate detail readings, not extra values to add on top of totals. One-phase profiles do not map L2/L3. Phase count cannot safely be inferred from the mere presence of L2 entities (the reviewed LP1 exposes zero-valued L2).
- `grid_frequency_sensor`: measured frequency (`sensor`); `grid_frequency`: 50/60 Hz setting (`select`). They must not share a field.
- `battery_control_mode` + `battery_operation_mode`: combined LCD battery mode; capacity/current settings use `number`, not the similarly named energy-capacity sensor.
- `tou_N_charging`: Solarman `select` with Disabled/Grid/Generator/Both. LCD Grid and Gen checkboxes share it and produce one merged write.
- `tou_N_time`: `time` or legacy `select`. The end of slot N and start of N+1 refer to the same key. `time.set_value` is used for a time entity.
- `tou_N_power`, `tou_N_soc`, `tou_N_voltage`: distinct number entities. Program voltage must never be mapped to the Gen percentage column.
- `gen_port_mode`: IO Mode selector. Generator / SmartLoad / Microinverter aliases map to firmware labels; the confirmed mode drives the home icon.
- `time_of_use`: switch or selector. A selector can restore its remembered enabled option; Week is supported as the observed Solarman enabled mode. Individual weekdays are not guessed from Week.
- Number limits and steps come from HA entity attributes. Select values come from HA options. Unknown combinations remain unavailable.
- All edits stage locally until ✓; × discards. Shared target writes are deduplicated; contradictory values are rejected. The card awaits HA state readback and does not claim service acceptance proves physical device success.

## Unsupported is not simulated / Відсутні параметри не імітуються

The reviewed device pages do not expose the entire physical LCD firmware menu. Extended Grid curves/tier times, individual weekday controls, Gen SOC per slot, several advanced options and firmware-only actions cannot be made writable merely by drawing fields. They remain unbound unless the user's integration supplies an appropriate real entity. AC Coupling is a shared selector on these devices; it is deliberately not automatically assigned to two independent switch fields. Date & Time is a combined datetime control; individual clock-number fields are not auto-bound to it. Factory Reset and Clear Arc Fault remain disabled.

For complete hardware coverage the underlying Solarman device profile must expose the missing registers with verified model-specific definitions. This change does not invent register addresses or modify the integration.

## Validation / Перевірки

`tests/test_deye_mapping.cjs`: prefix isolation, 1/3 phase selection, frequency sensor/control separation, missing fields, layout roundtrip, merged TOU writes, duplicated time fields, Gen Port aliases and EN/UK. Existing LCD and language suites cover staged changes, read-only access, history, native bundle and responsive layouts. Hardware write verification remains separate.
