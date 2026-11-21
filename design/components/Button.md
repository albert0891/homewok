# Button

A capsule-shaped button; use the primary style for the one action a screen is for, and the secondary or text style for everything else.

- **Primary** (`accent` fill, `on-accent` label): at most one per screen or sheet, for the main action ("Cook this", "Add 3 items", "Save"). Full width at the bottom of a sheet.
- **Secondary** (`surface` fill, `control-border` outline): other choices next to the primary ("Another idea"), and a pair of quick actions side by side at equal width, such as Used some and Used up at the top of the edit sheet.
- **Text** (`accent-ink`, no outline): quiet ways out ("Not tonight", "Cancel", "Undo").
- **Destructive** (`danger` label, no outline): only for deleting, "Delete purchase" and "Delete staple", alone at the very bottom of a sheet, below its primary button. It always asks first in an iOS action sheet, whose Delete is red and whose Cancel keeps everything.
- Labels use the `headline` style, start with a verb, and stay in sentence case. No icons inside unless the label alone is unclear.
- Height is at least `tap-target` (44px). Disabled buttons are avoided: keep the button and explain on tap what is missing.
- The consumer provides the label and the press handler. In React Native, build it on `Pressable` with `borderRadius: 9999`.
