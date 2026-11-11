# UseSoonPill

A small capsule label that says when a food should be used, shown on the row only when it matters (3 days or less).

- Use-soon: `accent-tint` fill with `accent-ink` text in the `caption` style: "Today", "Tomorrow", "2 days".
- Past date: no pill, `danger` text with the words "Past date, check first". Never claim a food is unsafe or safe; dates in the US are about quality, not safety.
- Foods with more than 3 days left show no pill; their date sits in the meta line ("Use by Thu, Nov 12").
- The consumer provides the date; which label to show is decided by code from the date and today, never by the AI.
