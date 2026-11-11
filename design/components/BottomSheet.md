# BottomSheet

The surface for every focused task: adding food, editing a batch, Cook with, Not tonight, and Cooked it.

- `surface` fill with `radius-sheet` top corners and a `hairline` grabber; the screen behind it dims.
- Title in `title-2` (serif), then the controls, then one full-width primary `Button` at the bottom, above the keyboard and the home indicator.
- Sheets open at the height their content needs; a sheet with a keyboard grows to full height.
- The edit sheet runs entirely on the phone: it opens instantly, and Save updates the screen first while the database save runs in the background. A failed save reverts the change and says so.
- On iOS, use the native sheet presentation (Expo Router's form sheet or Expo UI's bottom sheet). The consumer provides the content and the dismiss handler.
