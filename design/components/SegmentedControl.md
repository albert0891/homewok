# SegmentedControl

A row of two to four mutually exclusive choices, used in the edit sheet for how a new food is kept track of, its unit, a staple's level, and the storage place.

- How a new food is kept track of: Weight, Volume, Count, and Staple, with Weight picked to start. Only a food the household has not bought before shows this control.
- The units follow from that: weight shows lb and oz, and volume shows gal, cup, and fl oz, the largest first in both. A counted food shows no unit control at all: its amount is a plain number, or a known food's own word, such as "2 blocks", which is just text.
- A staple's level is Have, Low, and Out.
- Storage is always Fridge, Freezer, and Pantry. For a food one is always picked, and changing it re-estimates the use-by date in code. For a staple it is optional and starts with none picked, and tapping the picked segment again clears it, as the spot chips do.
- Selected segment: `accent-tint` fill, `accent-ink` label, bolder weight. The control sits in a `control-border` outline with `radius-md`. With none picked, every segment looks unselected.
- Each label stays on one line. With very large text a label shrinks to fit its segment, as in iOS's own segmented controls, rather than breaking inside a word.
- On iOS, the native segmented control is an acceptable substitute when it can take these colors, except for a staple's place, which needs none picked.
- The consumer provides the options, the selected value or none, and the change handler.
