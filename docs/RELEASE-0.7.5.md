# ANMA Energy Dashboards 0.7.5

Cloud Flow replaces its day/night selector with a scene background photo section.
Upload your own house photo or enter a background image URL. Adjust visibility,
fill and position, or remove the custom background to restore the default scene.
Equipment illustrations, readings, flows and weather effects remain above it.

Cloud Flow keeps a consistent photo-oriented palette rather than following the
HA day/night theme. Other dashboard theme controls are unchanged.

Uploaded PNG/JPEG/WebP photos up to 10 MB are resized and compressed locally for
the card configuration. The embedded photo survives YAML export and does not need
a separate image file installed in HA. URL-based images must remain accessible
from the Home Assistant browser. Existing background settings remain supported.

34 JavaScript tests and Django checks pass. Verified upload, embedded configuration,
rendering in a light HA theme, absence of the Cloud Flow theme selector and viewport
fit with the actual standalone card in headless Edge.
