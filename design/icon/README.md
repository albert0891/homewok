# App icon

A roof over a wok: the name, drawn. `AppIcon.icon` is an Icon Composer file, Apple's format for app icons. `app.config.ts` points at it, and Xcode builds it into the app.

- `icon.json` — the tile color, the two layers, and each layer's color in light, dark, and tinted mode.
- `Assets/roof.svg` — the roof and its chimney.
- `Assets/wok.svg` — the bowl and its handle.

The two `.svg` files hold shapes only, drawn in black on a 1024 × 1024 box. Each shape is a closed outline, not a pen line with a width: Xcode fills pen lines in when it makes the icon for iOS 18 and earlier, which turned the roof into a solid triangle.

Every color is in `icon.json`, written as red, green, and blue from 0 to 1, and comes from three tokens:

| Part | Token | Light | Dark |
| ---- | ----- | ----- | ---- |
| Tile | `canvas` | `#F4EDE3` | `#1C1714` |
| Roof | `ink` | `#2A1E16` | `#F3ECE6` |
| Wok | `accent` | `#C2410C` | `#F08A4B` |

`src/theme/appIcon.test.ts` fails when one of these differs from `tokens.json`.

In clear and tinted mode iOS draws the icon in grays and adds its own color. There the wok is white and the roof is light gray, so the wok stays the brightest part. Both layers are flat, with no glass and no shadow, like ink on paper.

## Looking at it

Open `AppIcon.icon` in Icon Composer (Xcode > Open Developer Tool > Icon Composer), or render one mode to a PNG without building the app:

```bash
"/Applications/Xcode.app/Contents/Applications/Icon Composer.app/Contents/Executables/ictool" design/icon/AppIcon.icon --export-image --output-file icon-dark.png --platform iOS --rendition Dark --width 1024 --height 1024 --scale 1
```

The modes are `Default`, `Dark`, `ClearLight`, `ClearDark`, `TintedLight`, and `TintedDark`. The design system shows four such renders: `default.png`, `dark.png`, `clear.png`, and `tinted.png`.

After changing the icon, rebuild the app (see `docs/setup.md`). The Home Screen only shows the new icon after a rebuild.

## How it was written

`icon.json` was written by hand. Its keys come from Xcode's file template for Icon Composer icons and from what `ictool` accepts on Xcode 27.2. No Apple reference for the file was found, so check the six modes again after an Xcode update.
