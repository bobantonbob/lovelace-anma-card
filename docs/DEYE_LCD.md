# Deye LCD in ANMA Energy Platform

The existing `power_flow` template now renders the adapted Deye LCD. The template
identifier and saved layouts remain compatible. Cloud Flow and Energy Station
keep their existing renderers. No database, API, account or inverter configuration
is changed by this UI update.

## Source and reference

Based on the owner's saved `deye-lcd-8k.js`, Deye LCD Alpha 0.7 by
ТЕХНіКА / H-Auto, with its attribution retained. Menu layout reference:
`video_2026-11-16_09-09-53.mp4`. Values shown in that recording are not defaults
and are never written to equipment.

## Implementation

- `static/dashboards/deye-lcd.js`: original LCD renderer, staged control writes,
  detailed telemetry and history, extended for the video menus.
- `static/dashboards/deye-pages.js`: 26 settings pages across Battery (3), Work
  Mode (3), Smart Devices (5), Grid (7), Gen Port (1), Basic (2), Advanced (4),
  Device Info (1).
- `static/dashboards/deye-bridge.js`: ANMA bindings, preview, editor and persistent
  card updates. Configuration is stored in `layout.powerFlow.deye`.
- `power-flow.js`, `model.js`, `templates.js`, `dashboard.js` and the Django
  dashboard template connect the new renderer to the existing app.
- `tools/build_dashboard_card.py` includes the same code in `anma-card.js` and
  the existing HA installation ZIP.

## Binding and behavior

`Basic Setting → Language Select` selects the card UI language: English or
Українська. It is independent of inverter firmware language and works without
an HA control entity or administrator access. Selection applies immediately,
persists in `powerFlow.deye.ui_language` in the studio and has a per-card browser
storage fallback for HA. Menus, editor labels, accessibility labels and runtime
messages share `deye-i18n.js`; device entity IDs, raw option values and commands
are never translated. `tests/test_deye_language.cjs` verifies both languages,
all pages, no hardware commands and persistence after a real studio reload.

Explicit Deye bindings take precedence. Existing ANMA power fields and configured
PV/battery channels are reused. PV and battery powers are summed after unit
conversion. An unavailable configured channel invalidates its total. SOC fallback
is the arithmetic mean of configured modules; bind an authoritative bank SOC for
mixed-capacity banks. Battery sign remains positive discharge unless inverted.

Settings fields are empty/disabled until valid entities are connected. Writes
require HA administrator access, remain staged until the checkmark is pressed,
respect entity number ranges/steps and select options, and wait for state readback.
Navigation, preview, card loading and telemetry updates do not send commands.
The app preview uses clearly labelled demo telemetry and no write capability.

Detailed pages include PV channels, grid/load, battery BMS fields, inverter
temperatures and energy counters. Power history uses HA recorder history; Day,
Month and Year use an explicitly bound cumulative energy statistic, Total reads
the counter. Synthetic frontend sums have no recorder history: use persistent HA
bank/PV sensors for those plots. Missing statistics are shown explicitly.

## Practical limits

This is an adaptation, not a pixel-identical firmware emulator. Actual firmware
capabilities depend on the integration's exposed entities. No register addresses
are guessed. Reset/firmware-flash actions are not implemented as switches.
Device Info alarm text comes from a bound alarm-history entity. Date boundaries
for energy charts currently follow the browser timezone; the LCD clock follows HA.
TOU times currently bind to select entities; integrations exposing only time or
numeric HHMM entities need an adapter before those fields can control them.

## Validation

- `manage.py check`: passed.
- `tests/test_deye_lcd.cjs`: passed; aggregation, W/kW, missing channels, saved
  configuration, 26 pages, number/select writes against a mock HA service, read-only
  user, energy statistics, actual standalone `anma-card`, 360/768/1100 px layouts.
- `tests/test_deye_studio.cjs`: passed against the real local Django page.
- Existing power-flow and energy-station tests: 22 passed.
- Broader model suite: 11 passed / 3 failed, reproduced with the pre-change model
  and renderer (export normalization, external-image policy, obsolete template).
- Django dashboard suite: 18 passed / 1 failed on a stale literal-string assertion
  for `type: custom:anma-card`; the same literal is absent in the pre-change model.
- An existing Cloud Flow responsive assertion also failed; that renderer was not
  changed in this task. The full repository suite is not green.

The change is local and has not been committed, pushed or deployed. Existing
uncommitted work is retained; backup files are in `tmp/deye-lcd-backup`.

## Menu layout review (2026-11-16)
Matched field grouping against the supplied Deye video: compact battery charging columns, vertical battery thresholds, grid protection/curve groups, generator, calendar, parallel and wind pages. The LCD is capped at 920 px; narrow screens scroll long menu content independently of the action rail. Existing bindings, staged writes and EN/UK selection remain intact.

Validation: test_deye_layout.cjs covers all 26 pages at 360/390/768/1600 px in both languages, outer overflow and rail bounds; battery screens captured for visual review. This is a responsive adaptation, not a claim of identical firmware functionality. No inverter settings were changed.


## Work Mode follow-up
Work Mode1 now includes an explicitly bound CT phase selector beside Solar Sell. TOU displays cyclic start/end pairs using the six existing time entities; the end of slot 6 is slot 1. Gen uses new tou_N_gen_soc bindings, never the previous voltage binding. Existing saved voltage fields are retained but are no longer mislabeled as Gen percent. The weekly controls remain a horizontal row on desktop. Narrow TOU tables scroll with a visible hint. All 26 pages were checked for layout bounds in both languages at four widths; the local Django studio and control/translation tests passed. Production was not changed.


## Gen / Basic / Advanced placement review
Rebuilt reference positioning for generator mode radios, clock steppers, centered language, Advanced Function rows, parallel role/phase radios, two wind columns, and limits above labels. Factory Reset and Clear Arc Fault are visible disabled placeholders without device commands. Radio options match available HA options by normalized label, never numeric guesses. Mock service tests confirm staged radio/stepper edits send only on Apply. Func Set4 verified against clear video frames rather than the transitional overlaid screenshot. Local only.


## Fixed LCD placement
Settings now render inside a 720px reference viewport scaled uniformly by ResizeObserver; phone breakpoints no longer reorder firmware fields. Battery, weekly schedule, TOU and Grid retain desktop relative positions. Grid frequency/type use HA-option-matched radios. All 26 pages checked across four widths and both languages; no physical inverter changes. The UI is a reference reconstruction, not pixel-verified against perspective-corrected photos.


## No-scroll LCD
Content is measured after translation and uniformly fitted inside the settings area; Ukrainian uses a smaller base font. Internal scroll containers are disabled only alongside fitting. Layout tests assert content bounds inside the visible region on all 26 pages at four widths in both languages. ON/OFF remain short in either language. Existing staged controls retained.


## LCD sizing and confirmation
Reference settings stage adjusted to 720×408 with 46px header, larger labels, battery field alignment and full action rail. Added solar-only battery option only where the bound HA selector exposes a matching option. UI language is now a pending edit committed with Apply; Cancel clears it like device drafts. No-scroll bounds checked after fitting across all pages. This remains a reconstructed layout rather than a pixel-certified copy.


### Grid layout follow-up (2026-11-16)
Grid pages now reserve label space and flexible value widths, preventing letter-by-letter wrapping and accidental whole-page shrinkage. Grid Set1 follows the frequency/type grouping; curve lock thresholds sit above their values. Terminal down navigation is invisible (space retained) and disabled across all menu groups; it returns on preceding pages. HA field keys and Apply/cancel behavior are unchanged. Verified 26 pages at 4 widths in EN/UK, register-label single lines and terminal navigation visibility, plus staged-write/input regression suites. Reference photos still require human visual acceptance; no hardware writes were made.
