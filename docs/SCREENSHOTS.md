# Desktop and phone gallery

Captured from the actual 0.2.0 JavaScript card with synthetic demonstration data. Phone views use an iPhone 16-sized portrait browser viewport (393 × 852 CSS pixels), not a physical iPhone capture or a Safari certification.

## Power Flow

![Power Flow desktop](images/power-flow-stable.png)

<img src="images/power-flow-phone-stable.png" alt="Power Flow phone preview" width="393">

Eight PV groups fill two balanced rows. Phone mode prioritizes short PV/battery labels, icons and primary readings; long names and secondary technical details are reduced. All sensor bindings remain configured.

## Cloud Flow

![Cloud Flow desktop](images/cloud-flow-stable.png)

<img src="images/cloud-flow-phone-stable.png" alt="Cloud Flow phone preview" width="393">

Phone mode hides long node names and secondary status labels while preserving icons, readings and flow paths.

## Full analytics

![Full analytics desktop](images/analytics-stable.png)

<img src="images/analytics-phone-stable.png" alt="Full analytics phone preview" width="393">

This shows the first section of one scrolling dashboard. Additional metric, weather, forecast and chart blocks are below it. Forecast and historical data require Home Assistant integrations and Recorder; this local preview does not fabricate missing history.

## Background images

Power Flow and Cloud Flow support a whole-card image, independent inverter/battery photos, cover/contain fit, position and 0–100% visibility. Cover crops the excess without stretching. Background layers never move content or intercept controls.
