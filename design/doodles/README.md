# Illustrations

Ink doodles of food, drawn for Homewok. Use them only on the login screen, empty screens, the setup flow, and badges, never beside data.

- `wok.svg` — a wok with two lines of steam. Login screen and the loading state while a list is read.
- `scallion.svg` — a bunch of scallions. Empty Kitchen screen.
- `egg.svg` — a whole egg and a fried egg. Empty Tonight screen.
- `rice-bowl.svg` — a bowl of rice with chopsticks. Empty Recipes screen and the setup flow.

All four are single-ink line drawings: stroke `#2A1E16` (the light `ink` value), 2.4 wide on a 120 × 80 box, round caps and joins, no fills. An `<img>` cannot recolor them, so in the app render them as SVG components whose stroke comes from the `ink` token, which keeps them visible in dark mode.
