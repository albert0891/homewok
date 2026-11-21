# BottomSheet

The surface for every focused task: adding food, editing a batch, Cook with, Not tonight, and Cooked it.

- `surface` fill with `radius-sheet` top corners and a `hairline` grabber; the screen behind it dims.
- Title in `title-2` (serif), then the controls, then one full-width primary `Button` at the bottom, above the keyboard and the home indicator.
- Sheets open at the height their content needs; a sheet with a keyboard grows to full height, and a sheet taller than the screen scrolls.
- On iOS, use the native sheet presentation (Expo Router's form sheet or Expo UI's bottom sheet). The consumer provides the content and the dismiss handler.

## The edit sheet

One sheet adds a food with the + and opens a row of the Kitchen list. It runs entirely on the phone: it opens instantly, and Save updates the screen first while the database save runs in the background. A failed save reverts the change and says so. It was drawn whole, for every kind of food, on 2026-11-21 (`HW-67`), and each card that builds a part of it follows this.

Its rows, top to bottom. Each one shows only where it says:

1. **Title:** "Add food" from the +, "Edit food" from a food's row, and "Edit staple" from a staple's row.
2. **Name:** a text field. When adding, a name the household knows fills in that food's usual purchase as it is typed. When editing, it renames the food, which changes only its name, everywhere the name shows. A name another food already has is refused with "Another food is already called Eggs.", because two foods are never merged.
3. **Used some and Used up** (a food's row): first a `subhead` line in `ink-muted` saying what the row holds, "In the fridge" or "In the fridge, 2 purchases", then two secondary buttons side by side. They act at once on the whole row, every purchase of this food in this storage, and the sheet closes without Save. Used some halves what is left and marks it as a guess ("~"). Used up removes the row's purchases, keeps the food with its usual purchase, and asks in a system alert, "Add Milk to the shopping list?", with Not now and Add to list. Nothing asks how much was used.
4. **How it is kept track of** (a new food): a `SegmentedControl` with Weight, Volume, Count, and Staple, Weight picked to start. A food the household knows shows nothing here, so the sheet never turns a counted food into a staple, or back. Picking a kind starts the amount again at 1 of its first unit: 1 lb, 1 gal, or 1.
5. **Amount** (foods): the `Stepper`, the unit control beside it (lb and oz, or gal, cup, and fl oz), and the one-tap amounts under it. A counted food has no unit control and no word to type: its amount is a plain number, "12". A known food that already has a word of its own, such as the sample kitchen's "2 blocks" of Firm tofu, keeps showing it.
6. **Level** (staples): Have, Low, and Out. A new staple starts at Have. Saving Out asks, "Add Soy sauce to the shopping list?".
7. **Storage:** Fridge, Freezer, and Pantry. A food always has one picked, and changing it estimates the date again. For a staple it is optional, under the `footnote` label "Where it's kept (optional)", with nothing picked to start, and tapping the picked place again clears it. A staple's place is only shown: it is the second line of its row, and the staple stays under Staples.
8. **Spot** (foods): the spot row below.
9. **Date** (foods): "Use by about Nov 28" while it is the app's estimate, and "Use by Thu, Nov 26" once one is picked, then the chips Tomorrow, In 3 days, In a week, and Pick a date, which opens the native calendar.
10. **Price** (foods): an optional field, "Price (optional)", after a "$", with the decimal keyboard.
11. **Save:** the one primary button.
12. **Delete** (editing): a destructive text button at the very bottom, "Delete purchase" or "Delete staple". It asks first in an action sheet with Delete and Cancel. Deleting a food's last purchase removes the food too, so a mistake leaves nothing behind. Used up is for food that was eaten; Delete is for a mistake.

A food's row with several purchases in its storage opens a list first: the food's name as the title, then row 3's line and buttons, then one row per purchase, with the amount, the spot and date in `ink-muted`, and a chevron. Tapping a purchase opens its own sheet with rows 1, 2, and 5 to 12, and without Used some and Used up, which stay on the list.

The preview draws nine cases: a new food of each of the four kinds (Bok choy, Oat milk, Silken tofu, and Doubanjiang), two known foods added again (Ground pork and Firm tofu), a row with one purchase (Milk), a row with two (Ground pork), and a staple's row (Soy sauce).

### The spot row

The spot (optional) sits right under the storage control, because the spots offered depend on the storage: a text field with the placeholder "Spot (optional)", then a row of `Chip`s below it.

- The field uses `surface` fill, a `control-border` outline, `radius-md`, and `body` text; the placeholder is `ink-muted`. It holds 1 to 30 characters, and an empty field means no spot.
- The chips are the spots already used in the chosen storage, so the spelling stays the same. Tapping a chip fills the field and selects it; tapping the selected chip clears the field. Typing the same text selects the matching chip.
- Editing a purchase shows its own spot. Adding a food the kitchen already knows starts with that food's last spot (`usual_spot`). Switching storage clears a spot that is not used in the new storage.
- With no spots used yet in that storage, the chip row is not shown, so the sheet is no taller than before. A long spot is cut with an ellipsis inside its chip, and the field shows it in full.
