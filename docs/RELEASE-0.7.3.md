# ANMA Energy Dashboards 0.7.3

Cloud Flow automatically fits the available screen height in ordinary Home
Assistant card mode, as well as fullscreen. Objects, text and paths scale together
without stretching. Phone coordinates are more compact so the complete scene,
including the optional EV, remains visible. Viewport resize and mobile browser
height changes recalculate the fit. Connections includes an automatic-fit switch.

Rain and snow now move gently from side to side with eased alternate animations,
avoiding the jump back to the start of the previous loop. Reduced-motion support
is preserved. Equipment artwork, entity bindings and other views are unchanged.

Verified the actual standalone card at 1920x1080, 1440x900, 768x1024, 375x812 and
375x667, with EV enabled and disabled: no horizontal or vertical page overflow in
the single-card fixture. Fullscreen was also checked. Browser animation positions
are continuous across the rain turnaround. 33 JavaScript tests and Django checks
pass. Screen fitting applies to this card; other cards in a HA view may still make
that view scroll.
