/**
 * The installed app's launch screens on iPhone: iOS only shows one whose size matches the
 * screen exactly, so there's one per iPhone screen size (upright), light and dark.
 * `npm run icons` renders them to public/splash/; vite.config.ts links them in the page.
 */

/** An iPhone screen: CSS pixels upright, and device pixels per CSS pixel. */
type IphoneScreen = { width: number; height: number; ratio: number };

/** The screen sizes of iPhones from the SE (2nd gen) and 8 on. */
export const IPHONE_SCREENS: readonly IphoneScreen[] = [
  { width: 375, height: 667, ratio: 2 }, // SE (2nd, 3rd gen), 8
  { width: 414, height: 736, ratio: 3 }, // 8 Plus
  { width: 375, height: 812, ratio: 3 }, // X, XS, 11 Pro, 12 mini, 13 mini
  { width: 414, height: 896, ratio: 2 }, // XR, 11
  { width: 414, height: 896, ratio: 3 }, // XS Max, 11 Pro Max
  { width: 390, height: 844, ratio: 3 }, // 12, 13, 14, 16e
  { width: 428, height: 926, ratio: 3 }, // 12 and 13 Pro Max, 14 Plus
  { width: 393, height: 852, ratio: 3 }, // 14 Pro, 15, 15 Pro, 16
  { width: 430, height: 932, ratio: 3 }, // 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus
  { width: 402, height: 874, ratio: 3 }, // 16 Pro
  { width: 440, height: 956, ratio: 3 }, // 16 Pro Max
];

/** The color schemes a launch screen comes in. */
export const SCHEMES = ['light', 'dark'] as const;

/** A launch screen's file name in public/splash/. */
export function launchScreenFile(
  { width, height, ratio }: IphoneScreen,
  scheme: (typeof SCHEMES)[number],
): string {
  return `${width}x${height}@${ratio}-${scheme}.png`;
}

/** The media query that picks a launch screen on the iPhone it fits. */
export function launchScreenMedia(
  { width, height, ratio }: IphoneScreen,
  scheme: (typeof SCHEMES)[number],
): string {
  return (
    `(device-width: ${width}px) and (device-height: ${height}px) and ` +
    `(-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait) and ` +
    `(prefers-color-scheme: ${scheme})`
  );
}
