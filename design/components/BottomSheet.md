# BottomSheet

The surface for every focused task: adding food, editing a batch, Cook with, Not tonight, and Cooked it.

- `surface` fill with `radius-sheet` top corners and a `hairline` grabber; the screen behind it dims.
- Title in `title-2` (serif), then the controls, then one full-width primary `Button` at the bottom, above the keyboard and the home indicator.
- Sheets open at the height their content needs; a sheet with a keyboard grows to full height.
- The edit sheet runs entirely on the phone: it opens instantly, and Save updates the screen first while the database save runs in the background. A failed save reverts the change and says so.
- **The spot row** (optional) sits right under the storage control, because the spots offered depend on the storage: a text field with the placeholder "Spot (optional)", then a row of `Chip`s below it.
  - The field uses `surface` fill, a `control-border` outline, `radius-md`, and `body` text; the placeholder is `ink-muted`. It holds 1 to 30 characters, and an empty field means no spot.
  - The chips are the spots already used in the chosen storage, so the spelling stays the same. Tapping a chip fills the field and selects it; tapping the selected chip clears the field. Typing the same text selects the matching chip.
  - Editing a purchase shows its own spot. Adding a food the kitchen already knows starts with that food's last spot (`usual_spot`). Switching storage clears a spot that is not used in the new storage.
  - With no spots used yet in that storage, the chip row is not shown, so the sheet is no taller than before. A long spot is cut with an ellipsis inside its chip, and the field shows it in full.
- On iOS, use the native sheet presentation (Expo Router's form sheet or Expo UI's bottom sheet). The consumer provides the content and the dismiss handler.
