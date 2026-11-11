# Stepper

A capsule with minus and plus buttons for changing an amount without the keyboard, paired with chips for common amounts.

- Steps follow the unit: ½ lb or 2 oz for weight, 1 for counts. Tapping the number opens the keyboard for an exact value.
- The quick chips below it are the amounts this household buys most, falling back to ½, 1, and 2 of the unit.
- Buttons are `tap-target` squares inside a `control-border` capsule; the value uses `headline` weight with tabular numbers.
- The consumer provides the value, the unit, the step, and the change handler. Everything here runs on the phone with no AI call.
