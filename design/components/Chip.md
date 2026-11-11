# Chip

A small capsule for quick choices: foods to cook with, foods to leave out, and one-tap amounts like "½ lb".

- Unselected: `surface` fill, `control-border` outline, `ink` label. Selected: `accent-tint` fill, `accent-ink` outline and label, bolder weight.
- Labels use `subhead` and stay short: a food name or an amount. Chips wrap onto new lines, never scroll sideways.
- Selection is shown by fill, outline, and weight together, never by color alone, and the chip reports `aria-pressed` (in React Native, `accessibilityState.selected`).
- The consumer provides the label, the selected state, and the toggle handler.
