# Real-device checklist

Tests run in Chromium and WebKit on a computer; some things only show on a real phone:
installing, offline play, touch, notches, sound, vibration. Run this list at the end of
each milestone, and after a change to input, layout or the PWA, on one Android phone
(Chrome) and one iPhone (Safari), against the deployed game at
https://ewajs.github.io/grama/. Anything wrong goes to an issue
(Menú › Reportar un problema fills one in), with the phone, its system version and
whether the game was installed.

## Install and offline

- [ ] **Android:** Menú › Instalar Grama. The install dialog shows the description and
      screenshots; the icon lands on the home screen and opens full screen, upright, with
      the status bar in the theme's color.
- [ ] **Android:** long-pressing the icon offers Desafío del día, Contrarreloj and Tu
      diccionario, and each opens its place.
- [ ] **iPhone:** Safari › Compartir › Agregar a inicio. The icon is named Grama and opens
      full screen, clear of the notch and the home bar, after a launch screen with the
      icon (dark when the phone is), never a blank one.
- [ ] **A shared link** (the daily's Compartir, or the game's address) shows Grama's card
      in WhatsApp or Telegram.
- [ ] **Offline:** once the words have loaded, turn on airplane mode, close the game and
      open it from the icon. Home, a level, the daily and Contrarreloj all play.
- [ ] **Update:** after a deploy, reopen the installed game: the update prompt shows, and
      updating lands on the new version (Menú › Acerca de shows it).
- [ ] **Saved:** close the game completely (or restart the phone) mid-level and reopen:
      the level, score, hints and settings are where they were.

## Touch

- [ ] Fast drags across an 8-letter wheel catch every letter; dragging back onto the last
      letter takes it back.
- [ ] Nothing scrolls, zooms, selects text or pulls to refresh while playing.
- [ ] Tapping letters one by one, then the pill, submits the word.
- [ ] An edge swipe or a notification mid-drag cancels the word, and the next drag works.
- [ ] **Android:** a light tick per letter, unless Vibración is off.
- [ ] Every button is easy to hit with a thumb, the wheel's corner buttons included.

## Screen

- [ ] Upright: the board and wheel fit with nothing cut off, on the smallest phone at hand.
- [ ] **iPhone on its side** (the installed Android app stays upright): board on the left,
      wheel on the right, clear of the notch on either side. Turning mid-level keeps it.
- [ ] Finishing a level: the stars land one by one, the points count up, and the card's
      button is on screen, upright and on its side.
- [ ] **Tablet**, if there's one around: bigger board and wheel, both ways.

## Look and sound

- [ ] Each theme (Grama, Argento, Yerba, Quebrada) in Claro and Oscuro: text reads well
      in sunlight, and the status bar matches.
- [ ] Automático follows the phone when its dark mode is switched.
- [ ] Sounds play, and Sonido turns them off. **iPhone:** silent mode mutes them, and music
      already playing keeps going.

## A fresh start

- [ ] Uninstall, clear the site's data, install again and play levels 1 to 20: the
      tutorial shows once, and nothing feels rough along the way.
