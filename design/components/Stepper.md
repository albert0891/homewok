# Stepper

A capsule with minus and plus buttons for changing an amount without the keyboard, paired with chips for common amounts.

- Steps follow the unit: ½ lb or 2 oz for weight, ½ gal, ½ cup, or 4 fl oz for volume, and 1 for counts. Tapping the number opens the keyboard for an exact value.
- The value is the amount with its unit, "1½ lb" or "½ gal". A counted food shows a plain number, "12", or a known food's own word, "2 blocks".
- The quick chips below it are the amounts this household buys most, falling back to ½, 1, and 2 of the unit.
- Buttons are `tap-target` squares inside a `control-border` capsule; the value uses `headline` weight with tabular numbers.
- Minus never makes the amount bigger: at one step or less, such as ½ bunch from a chip, it stays and fades, as iOS's own steppers do at their lowest value.
- The amount grows with the text size, and so do the minus and plus, up to twice their size. In the edit sheet the unit control sits beside the stepper, and from the accessibility text sizes it moves under it, full width.
- The consumer provides the value, the unit, the step, and the change handler. Everything here runs on the phone with no AI call.
