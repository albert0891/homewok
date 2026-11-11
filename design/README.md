Homewok is a personal iOS app for Chinese families in the US. It keeps track of what is in the kitchen and suggests tonight's dinner from it. It should feel like a well-used kitchen notebook: linen paper, cookbook titles, one persimmon accent, and a few ink doodles. Everything else follows iOS.

## Content

- Write in plain, warm English. Short sentences, sentence case everywhere, no exclamation marks, no emoji.
- The tagline is "All wok, no work." It turns the homework sound of the name into a joke, so never write copy that frames dinner as homework or a task.
- Buttons start with a verb: "Cook this", "Add 3 items", "Save", "Not tonight". Toasts state what happened: "Tofu moved to Kitchen".
- Use US units: lb, oz, fl oz, cup, gal. Write ½ and 1½, not 0.5. Counted foods keep their own word: "2 blocks", "1 bunch".
- Write dates as "Wed, Nov 11". A guess always says so: "~1 lb", "Use by about Dec 8", "estimated".
- Keep the user's own words for food names, in any language they type. Recipes are written in English.
- Never guilt or nag. Say "Threw away", not "Wasted". Never say a food is safe or unsafe; say "Past date, check first".
- Costs are rough on purpose: "about $2 per serving", rounded to the nearest 50 cents.

## Color

- Put every screen on `canvas`. Put lists, cards, sheets, and fields on `surface`.
- Set text in `ink`; meta lines, helper text, and section headers in `ink-muted`.
- Use `accent` (persimmon) for the one primary button on a screen, the check of a bought item, and the active tab. Never for running text: accent-colored words use `accent-ink`.
- Show use-soon foods with an `accent-tint` pill and `accent-ink` text. Show past-date foods with `danger` text and the words "Past date". These two always differ by their words, not just their hue.
- Draw dividers with `hairline` and the outlines of chips, fields, steppers, and secondary buttons with `control-border`.
- Show keyboard focus as a solid 2px `focus` ring, offset 2px.
- Dark mode is "Warm charcoal": the same token names with dark values, so components never pick colors by theme themselves. Text on an accent fill is always `on-accent`.

## Type

- Set screen titles in `large-title`, dish names in `title-1`, and sheet titles and empty-state headlines in `title-2`. These use the serif family (`ui-serif`, Apple's New York) and appear nowhere else.
- Set everything else in the system sans: `body` for names and steps, `headline` for button labels, `subhead` for meta lines, `footnote` for helper text, `caption` for pills and tab labels.
- The sizes are the iOS defaults for Dynamic Type. Let text grow with the user's text size setting, and never fix a height that would clip it.
- Line up numbers in amounts and costs with tabular figures.

## Space and shape

- Work on a 4px grid. Keep a `space-4` (16px) gutter on both sides of every screen.
- Round list groups and cards with `radius-lg`, the top of sheets with `radius-sheet`, and fields and segmented controls with `radius-md`. Every pressable thing (buttons, chips, pills, steppers) is a capsule: `radius-pill`.
- Make anything pressable at least `tap-target` (44px) in both directions. List rows are at least `row-height`.
- No shadows and no glass inside content. Separation comes from `surface` on `canvas`. The system tab bar keeps Apple's own look.

## Layout

- Four tabs in the native iOS tab bar: Tonight, Kitchen, Shopping, Recipes.
- Lists are inset grouped (`ListGroup`): one row per food, grouped by Fridge, Freezer, Pantry, and Staples.
- Focused tasks open in a `BottomSheet` with one primary action at the bottom.
- Show what a screen does even when empty: an `EmptyState` with one doodle, one line, and one action.

## Iconography and illustration

- Icons are SF Symbols, Apple's built-in set, at the system weights. Native tabs take them through the `sf` prop. No emoji anywhere, and no hand-drawn icons in controls.
- Illustrations are the ink doodles in the Illustrations asset group: single-ink line drawings with round caps and no fills. Use them only on the login screen, empty screens, the setup flow, and badges.
- In the app, render doodles as SVG components whose stroke is the `ink` token, so they stay visible in dark mode. The files themselves are drawn in the light `ink` value.
- Doodles are Homewok's own. Do not copy another brand's illustrations.
- The Continue with Google button follows Google's branding guidelines, not these tokens: the full-color G logo, a white fill with a #747775 outline and #1F1F1F text in light mode, and Google's dark style (#131314 fill, #8E918F outline, #E3E3E3 text) in dark mode. It may be a capsule like every other button.

## Motion

- Use the system animations for sheets, tabs, and lists. A bought item slides out of the list. Respect Reduce Motion.

## Building it in React Native

- Mirror `tokens.json` in one theme file in the app, and read colors by name for the current color scheme. Components never contain hex values.
- Use `fontFamily: 'ui-serif'` for titles; React Native supports the iOS generic families. Use the default system font for everything else.
- Build lists on `FlatList` or `SectionList`, sheets on the native sheet presentation, and tabs on Expo Router's native tabs.

## Components

- `Button`: capsule; one primary per screen.
- `Chip`: quick choices such as Cook with foods and one-tap amounts.
- `UseSoonPill`: when a food needs using, and the past-date warning.
- `ListGroup`: the inset grouped kitchen list.
- `ShoppingRow`: one tap marks a food bought and moves it to the Kitchen.
- `Stepper`: change an amount without typing.
- `SegmentedControl`: unit and storage.
- `BottomSheet`: add, edit, cook, and other focused tasks.
- `EmptyState`: doodle, one line, one action.
