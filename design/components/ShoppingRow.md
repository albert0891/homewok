# ShoppingRow

A shopping list row with a round check: one tap marks the food bought and moves it into the Kitchen.

- The check is at least `tap-target` including its padding. Checked: `accent` fill with an `on-accent` tick.
- After the tap, the row leaves the list and a toast says "Tofu moved to Kitchen" with Undo for a few seconds. Nothing else is asked.
- The new kitchen batch takes the row's amount. With no amount, it takes the last amount bought for that food, or the typical pack size the AI guessed when the food was first added, shown with "~". The use-by date is estimated from the food's shelf life.
- Staples move back to Have instead of creating a batch.
- The reverse is one tap too: a food marked used up or a staple marked Out offers "Add to list".
- The consumer provides the row and the move handler; the move itself is one database call that runs in code, with no AI.
