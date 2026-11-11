# SegmentedControl

A row of two or three mutually exclusive choices, used for the unit and the storage place in the edit sheet.

- The units shown depend on how the food is tracked: weight shows lb and oz, volume shows fl oz, cup, and gal, and counted foods show no unit control at all (their label, like "blocks", is just text). Staples show Have, Low, and Out.
- Storage is always Fridge, Freezer, and Pantry. Changing it re-estimates the use-by date in code.
- Selected segment: `accent-tint` fill, `accent-ink` label, bolder weight. The control sits in a `control-border` outline with `radius-md`.
- On iOS, the native segmented control is an acceptable substitute when it can take these colors.
- The consumer provides the options, the selected value, and the change handler.
