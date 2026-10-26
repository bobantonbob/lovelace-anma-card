# Cloud Flow architectural scene (local 0.7.0)

Cloud Flow now uses separate composited architectural objects, live HTML readings,
SVG energy paths and a subdued weather background. Energy Station and Power Flow
keep their existing renderers. The website and the standalone Home Assistant card
load the same `cloud-flow.js` implementation. Its WebP images are embedded in the
standalone card, so the exported `custom:anma-card` needs no extra resource.

## Local review

Open `/uk/dashboards/` and select **ANMA Cloud Flow**. Existing layouts keep their
power, status, PV, battery and background bindings. In **Connections**, the new
**Cloud Flow · weather and atmosphere** group provides:

- separate `weather.*` entity selections for current conditions and forecast;
- auto/hourly/daily/twice-daily forecast selection;
- background effects toggle and intensity;
- website-only demo weather and solar daily energy.

No weather entity is selected automatically: it may describe the wrong location.
When the forecast entity is empty, it uses the current-weather entity. An explicitly
selected unavailable forecast entity never falls back to a different provider.
Live missing values are unknown; preview readings are never substituted into HA.
The weather forecast uses `weather/subscribe_forecast` with supported feature
flags, and subscriptions are disposed when the scene is replaced or removed.
See the [official frontend weather data layer](https://github.com/home-assistant/frontend/blob/dev/src/data/weather.ts).

The desktop layout uses a 1200 × 680 coordinate scene. Containers below 600 px
reflow to 375 × 630, with two sources at the top, a smaller central home, and
batteries and non-backup supply below. Weather effects sit behind the content.
Reduced-motion preferences disable moving effects and flow particles.

Tests: `node --test tests/test_cloud_scene.cjs tests/test_power_flow.cjs tests/test_energy_station.cjs tests/test_ha_runtime.cjs`.
Browser verification was completed in an isolated Edge test process, using the
actual standalone card with synthetic HA states. All six templates rendered
without JavaScript errors at 1440px and 375px; no horizontal overflow was found.
The Cloud Flow settings were checked with a separate forecast provider, theme
switching and grid outages. Phone images are viewport previews, not certification
on a physical iPhone. The gallery fixture is `tests/card-gallery.html`.

## Generated assets and prompts

Images were generated with the built-in image generation tool for this project.
The production files are `static/dashboards/assets/cloud-flow-atlas.webp` and
`cloud-flow-sky.webp`; original PNGs are retained in the primary platform source. No image contains
live numbers: all values and animation are rendered by code.

Atlas prompt: create a production six-object atlas with a transparent background,
three columns and two rows, consistent restrained realistic 30-degree isometric
architectural rendering. Top row: freestanding blue solar panel array on a low
concrete support; complete steel transmission pylon without outgoing wires; small
modern two-storey charcoal-roofed gray house with warm windows and a wall inverter.
Bottom row: three dark battery cabinets with green charge indicators; smaller
single-storey house; isolated wall inverter. No labels, UI, numbers, landscaping or
decorative cars. Keep objects separated for CSS cropping.

Final atlas editing prompt (verbatim):

> Edit the attached six-object asset sheet ONLY to remove all background. Preserve the six objects, their positions and exact dimensions and appearance. Remove every bit of gray, black, cloudy or gradient backdrop between and around objects, leaving actual alpha=0 transparency. Keep isolated solar array upper left, transmission tower upper middle, two-storey home upper right, batteries lower left, smaller home lower middle, inverter lower right, unchanged. No solid background, no gray halo, no background shadows beyond contact shadows under object bases. This is a cutout atlas for compositing on a dark UI; the empty space must be truly transparent, not a painted gray checkerboard or gray fog. Same landscape canvas and exact object positions. Nothing else changes.

Sky prompt (verbatim):

> Asset type: subtle atmospheric background for an energy monitoring dashboard, no foreground objects. Wide landscape 16:9. Understated realistic twilight landscape with distant low mountains and an unfocused rural valley horizon in the upper third, desaturated deep navy blue and charcoal tones, faint warm dawn light at far left and soft clouds at top. Lower TWO THIRDS must be a plain dark navy matte ground fading smoothly toward #0b1721, almost featureless and with no grass or texture clutter, intended for overlaying crisp energy UI numbers and separate isometric equipment. Subtle very distant landscape, no buildings, no solar panels, no electricity towers, no people, no text, no icons, no interface, no borders. Calm realistic photographic atmosphere, restrained contrast, not cartoon, not dramatic cinematic lighting, no stars, no sun disk. Entire image will be used as a low-opacity UI backdrop.
