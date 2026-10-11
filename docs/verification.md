# Verification evidence

## Actual Mac Chrome gameplay

The actual production build was loaded at http://127.0.0.1:5191 through the connected Mac Chrome tab. Normal visible buttons and keyboard controls were used; no game state was injected, teleported or auto-completed.

- Hour I: dropped into the vault, recovered its memory, paused, reloaded, continued from saved position with memory/history preserved, reversed out, jumped across and completed.
- Hour II: recovered its first memory, reversed out, crossed the first pit, deliberately walked into spikes, observed the death message, reversed death, jumped the spikes, retrieved the second memory on a separate branch, reversed and completed.
- Hour III: woke the far bell, reversed to recover the remaining memory, observed the bell remain awake and its bridge persist, then crossed the bridge and completed.
- Hour IV: retrieved both memories using vault reversals and jumping around the blue pendulum, woke its bell, reversed again, crossed the final remembered bridge and completed. Pressed Light the observatory and inspected the authored ending. Ending replay returned to Hour I.
- Reloaded completed progress; Continue journey correctly restored the completion panel. Re-entered the ending from that panel.
- Pointer hold controls moved the keeper into a vault and reversed to the retained origin. Tested restart with a keyboard chord held, interrupted a held keyboard movement with Escape, resumed, and inspected the keeper at the origin without drifting input.
- Sound toggle switched its state correctly without application console errors. Audible sound quality was not verified.

Desktop full-page screenshots were inspected. At a 390×844 viewport, an initially clipped mobile intro button was discovered and fixed by allowing menu panels to size independently of the canvas. Rechecked the mobile ending and replay; DOM dimensions reported no horizontal overflow. Temporary viewport override was reset.

Application-origin browser log inspection returned no entries. Chrome extension warnings were observed and distinguished from application logs.

## Domain simulation (separate from browser evidence)

11 behavior tests cover all four authored physics solutions, ordinary-platforming bypass failures, deep-vault jump limits, reversal and branching, memory/bell persistence, reversible hazard position, death recovery, restart, completed-state freeze, save validation/restoration, bounded history, held jump behavior, and lingering in a vault beyond the history window followed by safe return to the retained origin.

Strict type checking and production build pass. Dependency audit reports zero vulnerabilities. GitHub Actions checks the same gates on the final pushed commit.

## Limitations

Physical touch hardware, simultaneous touch gestures, gamepads, audible output and assistive-technology play were not verified. Canvas gameplay requires vision. Native window-focus reproduction was attempted but not confirmed: browser-tab automation did not produce a real focus-loss signal, and native Chrome interaction was interrupted by concurrent user activity. Focus-loss handling exists in source but is not claimed as physically verified. Keyboard and pointer checks are actual Chrome inputs supplied by automation, not a human hands-on play session.

## Screenshots

- [Desktop gameplay](../artifacts/gameplay.jpg)
- [Return from rewind](../artifacts/rewind-return.jpg)
- [Ending](../artifacts/ending.jpg)
- [Mobile ending](../artifacts/mobile-ending.jpg)
