# Arcade metadata

`public/arcade/manifest.json` is this game's v1 arcade manifest. `gameId` is the repository ID and `playUrl` is the existing published game URL. Each image entry names a public-relative JPEG path, its SHA-256, descriptive alt text, and provenance. Files under `public/arcade/` are copied unchanged into the Vite build. Run `npm run check:arcade` after changing the manifest or images.

These files are optimized copies of existing repository captures; the manifest records their original source paths. Their capture dates and deployed build are unknown (`null`), so they must not be described as automated or current-deployment captures. The manifest and assets are source material for the arcade's explicit sync, not a claim that their local presence updates a deployed site. Change a hash when changing an image; review the image and provenance before syncing.
