# ANMA Energy Dashboards 0.7.1

Cloud Flow adds an optional Tesla-style EV below the house and a switch for the
non-backup group. Both the object and its flow disappear when hidden. Choose
backup or grid supply for the EV, set its display name and bind its power entity.
Grid-fed EV flow stops during a reported grid outage. Appliance power remains
part of the parent total, without being counted twice.

Battery readings explicitly show charging, discharging or standby. The standby
threshold matches the flow animation deadband: below 10 W in magnitude.
Unknown readings remain unknown and battery sign inversion remains supported.

The car image is embedded in the same `anma-card.js`. No additional HACS package,
resource or custom card type is needed. Existing layouts keep the EV hidden and
the non-backup group visible until changed in Connections.

Validation: 32 JavaScript tests pass, Django system checks pass, and the actual
standalone card was checked in headless Edge at desktop and 375px phone widths.
Battery states and flow direction, group visibility, Connections controls and
horizontal overflow were checked. The updated README contains real captures.
