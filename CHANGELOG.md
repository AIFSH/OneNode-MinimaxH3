# Changelog

All notable changes to this project are documented here, newest first.

## [0.2.12] — 2026-08-18

- Added a **Second Pass (双采)** two-pass latent refinement to the parameter
  area as a single on/off toggle with fully automatic parameters (pass 2 runs
  10 steps at denoise 0.4 by default; no extra controls). Pass 1 renders the
  clip with the normal full-denoise schedule, then pass 2 feeds the same
  packed video+audio latent back through a second `SamplerCustomAdvanced` at a
  lower denoise so the model refines detail instead of generating from scratch
  — the classic Stage 1→2 / hi-res-fix technique used by
  [Muse-MiniMax-H3-Refine](https://github.com/muse-collective-26/Muse-MiniMax-H3-Refine),
  done entirely in latent space with core ComfyUI nodes (no extra packs).
  Applies to every mode, including each Chain clip. When the Latent Upscaler
  is also enabled, T2V / R2V switch to the RunningHub 一采-放大-二采 layout:
  the schedule is split in half automatically — pass 1 runs the high-sigma
  head at base resolution with the Sigma Refiner applied to pass 1's branch
  (splitting the REFINED schedule instead pushed the index-based split down to
  sigma ~0.12, so pass 1 did almost all the work at base res and pass 2 got a
  near-empty tail at 2× — the source of the garbled output), the video latent
  is upscaled from pass 1's clean estimate (`denoised_output`, 3D upscaler at
  fp16 — feeding the still-noisy intermediate instead corrupted the upscaler
  output), and pass 2 finishes the low-sigma tail at the upscaled resolution
  with the sampler forced to `euler` (R2V skips its frame-0 identity anchor here).
  In Chain with the upscaler enabled it uses the same split schedule: all clips
  run the high-sigma head at base resolution first (motion-context continuity
  stays on those clean base latents), then a gated final stage upscales each
  clip and runs the low-sigma tail (the upscaler's new `trigger` input waits on
  the last clip's saved latent). Pass 2 uses the BASE conditioning guider —
  without motion-context keyframes — because H3 keyframe rows scale with the
  target canvas while the keyframe latents stay base-encoded; re-sampling an
  upscaled latent under the motion-context guider crashed with a row-count
  shape mismatch (`all_video_rows[~img_update] = cond_video_rows`).
  Keyframe-based modes (I2V / Keyframes) keep the upscaler on the output side,
  because H3 keyframe rows scale with the target canvas while the keyframe
  latents stay base-encoded — re-sampling an upscaled latent there crashes with
  a row-count shape mismatch
  (`all_video_rows[~img_update] = cond_video_rows`).
  Fixed Chain prompt validation on ComfyUI builds where
  `MiniMaxH3MotionContext.context_length` is a string combo
  (`['22','5','39','56']`): the value is now sent as a string, which passes
  strict combo validation and is still coerced to int by INT-declared builds.
  Added a startup check for the obsolete `ComfyUI-H3-Motion-Context` pack
  (same node class names, layout self-test fails on current core): it now
  prints the exact install/pin instructions instead of failing mid-render.
  Off by default; enabling it roughly doubles sampling time.

## [0.2.11] — 2026-08-18

- Added a **Sigma Refiner** slider to the parameter area (0–15 extra low-noise
  refinement steps, default 1, 0 = off). The refiner re-samples the scheduler's
  low-sigma tail into a denser, smoother curve so the model spends extra steps
  on fine detail, removing pixel grain / flicker on fast-moving edges. It is
  implemented natively as `H3OneSigmaRefiner` (no extra custom-node pack
  required) and inserted between the scheduler and the sampler in every mode —
  including each Chain clip. Start / end thresholds and spacing keep the
  defaults from
  [ComfyUI-YCNodes-MiniMax-H3](https://github.com/yichengup/ComfyUI-YCNodes-MiniMax-H3)
  (start 0.7, end 0.0, cosine); changing the slider also invalidates ComfyUI's
  cache (the fingerprint now includes it).

## [0.2.10] — 2026-08-17

- Audio Lock auto-split now prefers natural pauses and never exceeds 15s per clip: `/h3one/audio_breaks` detects both plain silence (speech pauses) and vocal-band gaps (music with no silence) via ffmpeg; each boundary snaps to the closest pause **at or before** the 15s mark, so sentences/sung phrases aren't cut mid-phrase. Falls back to plain 15s splits when no pause is detected nearby.

## [0.2.9] — 2026-08-17

- QR image display hardening: the bundled `wechat_qr.png` was actually JPEG data with a `.png` name, which some browsers refuse to render — it's now converted to a real PNG, and the frontend tries multiple image paths as fallback so the QR shows regardless of which endpoint the server exposes.
- Rewrote the README to lead with Chain's Audio Lock and long-video generation features, including a quick-start, resolution/aspect-ratio overview, and the pack pinning note.

## [0.2.8] — 2026-08-17

- Replaced the Ko-fi "Buy me a coffee" button with an inline WeChat follow QR code in the settings panel (no popup). The QR is served via `/h3one/wechat_qr.png` from `web/wechat_qr.png` or `assets/wechat_qr.png`, so it renders regardless of the custom-node folder name; a placeholder box is shown until the image is provided.
- Fixed QR rendering for JPEG-saved-as-PNG: the `/h3one/wechat_qr` endpoint now detects the real image format from the file header (and also accepts `.jpg`/`.jpeg`/`.webp`/`.gif`), so the QR displays correctly.
- Fixed Audio Lock chains: Motion Context keeps its audio wiring (previous-clip audio is used as continuation conditioning), while each clip's output soundtrack still comes from its own time-aligned slice of the source track — so the concatenated audio continues instead of repeating the previous clip.
- Fixed Audio Lock audio duplication / lip-sync drift: the audio-driven track is now routed through the Motion Context Trim node (instead of being muxed directly), so each clip's delivered audio is trimmed to the same length as its pictures. Previously the audio stayed a full clip longer than the video and overlapped the next clip when concatenated.

## [0.2.7] — 2026-08-16

- Audio Lock now auto-splits the chain clips by the audio track length: clips are generated in 15-second units (the final clip keeps the remaining duration), so the whole track is covered without manual clip setup. Each clip also drives its own time-aligned slice of the track (via a new `H3AudioSlice` node), so the concatenated video's soundtrack continues instead of repeating the first 15 seconds.
- Replaced the Audio Lock track upload box with a compact text row: it shows the current track filename, or a "no audio track" hint when none is set, with a Select/Change button — no more "undefined" text in the UI.

## [0.2.6] — 2026-08-16

- Fixed Audio Lock audio handling: enabling Audio Lock no longer deletes uploaded reference audio — the first uploaded track is promoted to the Audio Lock track, and disabling the lock moves it back to the reference list.
- Audio upload no longer renders "undefined" when the server response is missing a filename; the upload is now treated as failed and logged instead.
- Extra hardening: any "undefined"/"null" string (or missing value) stored as the lock track is now treated as empty and automatically replaced by the first valid reference audio, so the track slot never shows a bogus filename.

## [0.2.5] — 2026-08-16

- Linked the aspect-ratio picker to the resolution list: selecting a ratio now filters the resolution dropdown to matching presets only (plus Custom), and the picker was moved in front of the resolution selector so the flow reads "ratio first, then size".

## [0.2.4] — 2026-08-16

- Fixed the resolution picker: it now always shows the full preset list and never gets locked by the aspect-ratio selector (the ratio picker is a quick-snap, not a filter). A hardcoded fallback preset list keeps the dropdown usable even if the server config endpoint fails.
- Added robust JSON parsing for chain merge calls: if the server returns a non-JSON response, the UI now reports the raw body (and HTTP status) instead of a cryptic `Unexpected non-whitespace character after JSON` message.
- Hardened the `/h3one/config` and `/h3one/gallery` server endpoints so internal errors return proper JSON instead of HTML error pages.
- Added 3:4 portrait resolution presets across the 0.2MP–1.0MP range (384x512, 480x640, 576x768, 672x896, 768x1024, 864x1152), so the 3:4 ratio picker now has matching options instead of falling back to Custom.
- Checked every ratio and added matching presets for the remaining ratios that had none: 4:3, 3:2, 2:3, 1:1, 21:9 and 9:21 now each have a 0.2MP–1MP ladder, so the ratio picker always lands on a real preset.

## [0.2.3] — 2026-08-16

- Made Chain final concatenation resilient: per-clip outputs are now collected from `executed` events with a node-id fallback, a short wait is added before merging, and if events are still missing the clip files are discovered directly from the output folder. The merge no longer fails with a generic "missing clip" error when events arrive late.
- Added a **Chain clips** strip in the video area that shows every generated clip (and the final stitched video). Each thumbnail is clickable and plays in the main preview.

## [0.2.2] — 2026-08-16

- Added an aspect-ratio (video ratio) picker next to Resolution: one tap for 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 1:1, 21:9 or 9:21. It filters the resolution presets to matching ratios and snaps to the closest preset (or a Custom size when no preset matches).

## [0.2.1] — 2026-08-16

- Fixed Chain execution order: each later clip now loads the previous clip's saved motion-context latent through an explicit graph dependency, so ComfyUI no longer starts clip 2 before clip 1 has finished saving.
- Added automatic concatenation of chain clips into a single final video via a new `/h3one/chain_concat` endpoint (stream-copy first, re-encode fallback).
- Added portrait / vertical resolution presets (352x608 through 768x1344).
- Added a startup warning + friendly UI error for the `h3_motion_context: ... missing ref_aware_arbitrary_guides` failure: the H3 Motion Context MultiRef pack's current `main` requires ComfyUI PR #15439 (0.33+), so Chain/Keyframes on ComfyUI 0.32 must stay pinned to the tested commit `0719855`.

## [0.2.0] — 2026-08-16

- Merged the standalone **Audio Drive** mode into **Chain**. Chain is now the primary multi-mode surface and supports image / video / audio references with the `fl2va` UNet model.
- Added an **Audio Lock** toggle inside Chain: when on, a single audio track drives the whole chain's lip-sync and becomes the soundtrack.
- Added multi-language UI support (English / 中文) with a free language switcher in the node toolbar.

## [0.1.2] — 2026-08-15

- Fixed the Support button in the node UI — it was a placeholder URL, now links to the real Ko-fi page.
- README: added status/license badges and a beta note, updated screenshots and requirements links.

## [0.1.1] — 2026-08-15

- Prompts are now saved **per mode** — each mode keeps its own prompt and restores it when you switch tabs (also survives ComfyUI workflow-tab switches).
- Compatibility docs updated to ComfyUI 0.32.0.

## [0.1.0] — 2026-08-15

- Initial release: T2V, I2V, R2V, Audio Drive, Keyframes, Extend, Chain, and Latent Upscaler in a single node.
