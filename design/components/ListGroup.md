# ListGroup

The inset grouped list used for the Kitchen and most other lists: white rounded groups on the `canvas`, one row per food.

- A group is `surface` with `radius-lg`, inset by the `space-4` screen gutter. Rows are at least `row-height` tall, separated by `hairline` dividers, with no divider after the last row.
- A row has the food name (`body`), an optional meta line (`subhead` in `ink-muted`: batch count or date), an optional `UseSoonPill`, and the amount on the right with tabular numbers.
- One row per food, never one per purchase. Separate purchases (batches) appear when the row is opened.
- Section headers sit above a group in `subhead` and `ink-muted`, sentence case: "Fridge", "Freezer", "Pantry", "Staples".
- Staples show Have or Low instead of a number. Amounts that are guesses start with "~".
- In React Native, build lists on `FlatList` or `SectionList`; the consumer provides the rows and the press handler that opens the edit sheet.
