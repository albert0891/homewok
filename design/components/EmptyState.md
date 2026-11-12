# EmptyState

What an empty screen shows: one ink doodle, a serif headline, one plain sentence, and one primary action.

- The doodle comes from the Illustrations asset group and is drawn with the `ink` token, so it follows dark mode. It sits inside `space-8` of padding and is never wider than 160px.
- Headline in `title-2`, sentence in `body` and `ink-muted`, at most two lines. Say what to do next, not what is missing.
- Doodles appear only here, on the login screen, in the setup flow, and on badges. Never beside data or inside lists.
- Every empty screen has a doodle, and each screen has its own. The component does not accept an empty state without one.
- The consumer provides the doodle name, the headline, the sentence, and the action.
