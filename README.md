# OneNode-MinimaxH3

![Status: Beta](https://img.shields.io/badge/status-beta-orange)
![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue)

> **Fork notice:** This project is a fork of
> [LeonQ8/ComfyUI-ALLinONE-MinimaxH3](https://github.com/LeonQ8/ComfyUI-ALLinONE-MinimaxH3).

> **中文说明：** 完整中文文档请见 [README_CN.md](README_CN.md)。

One node. The whole MiniMax H3 video pipeline — including **long videos driven by a single audio track**.

No node graph to build, no wires to connect, no hunting through twelve custom node packs to figure out which workflow is the right one. Pick a mode, drop in your prompt or references, hit **Generate** — the node does the rest.

![ALL in ONE MiniMaxH3 — T2V tab](assets/t2v_main.png)

---

## Chain — long video from one audio track

**Chain** is the star of this node. It generates a sequence of clips with real motion continuity (H3 Motion Context, latent path — no re-encode between clips), then stitches them into one final video automatically.

### Audio Lock

Turn on **Audio Lock** inside Chain and give it one audio track. The node handles everything else:

- Reads the track length and **auto-splits the chain into 15-second-or-less clips** — each boundary snaps to the nearest natural pause (speech silence, or vocal-band gaps for music with no silence), so sentences and sung phrases aren't cut mid-phrase. No clip ever exceeds 15 seconds.
- Every clip drives **lip-sync from its own time-aligned slice** of the track — no more repeating the first 15 seconds on every clip.
- The audio is routed through the Motion Context trim so each clip's soundtrack is the **exact same length as its pictures** — the concatenated result has one continuous, non-repeating soundtrack with **no lip-sync drift**.

### Long video generation

- Any number of clips, each with its own prompt and duration.
- Later clips inherit the previous clip's motion (and audio continuation when Audio Lock is off) through the latent path.
- Clips run in strict order inside one queue entry, and the node **concatenates them with ffmpeg** (stream copy first, re-encode fallback) into a single `final_*.mp4`.
- The video area shows every generated clip plus the final result — click any clip to inspect it.

### References in Chain

Chain also accepts **image / video / audio references** (identity, motion, soundtrack), with the `fl2va` UNet as the default model. Keep the same resolution across all clips — the latent path cannot resize mid-chain.

### Resolution & aspect ratio

- 55 built-in resolution presets from **0.2MP to 1.0MP**, covering landscape, portrait, 3:4, 4:3, 3:2, 2:3, 1:1, 21:9 and 9:21.
- An **aspect-ratio picker** sits in front of the resolution dropdown: pick 16:9, 9:16, etc., and the resolution list filters to matching options.
- Custom sizes snap to multiples of 32 and warn when they leave MiniMax H3's recommended canvas (short edge ≤ 768, long edge ≤ 1344).

## Quick start — Chain + Audio Lock

1. Select **Chain** mode.
2. Turn on **Audio Lock**.
3. Pick your audio track (Select / Change).
4. The clips list is auto-split by the track length (15s per clip).
5. Optionally add image/video references, tune resolution and quality.
6. Hit **Generate** — clips render in order and merge into one final video.

## All modes

| Mode | What it does |
|------|--------------|
| **Chain** | Multi-clip long video with Motion Context continuity, image/video/audio references, and **Audio Lock** for one-track lip-sync |
| **T2V** | Text to video with native audio (fl2va model) |
| **I2V** | Animate a start frame, optionally morph to an end frame |
| **R2V** | Reference images / videos / audio drive the clip (ref2va model) |
| **Keyframes** | Pin still images at arbitrary frame positions |
| **Extend** | Continue an existing video seamlessly |

The UI is available in **English** and **中文**, switchable from the toolbar.

### Latent Upscaler

An optional **Latent Upscaler** panel in the parameter area runs the generated
latent through
[Comfyui_Minimax_h3_latent_Upscaler](https://github.com/LBH-123-AI/Comfyui_Minimax_h3_latent_Upscaler)
before VAE decode. Choose the checkpoint, 2D/3D variant, scale, device and
precision; place the checkpoint in `ComfyUI/models/latent_upscale_models/`.

### Sigma Refiner

A single **Sigma Refiner** slider in the parameter area (0–15 extra steps,
default 1, 0 = off) refines the low-noise tail of the sampling schedule: the
scheduler's high-sigma head stays untouched, while the tail is resampled into a
longer, denser, smoother curve so the model spends extra iterations on fine
detail — removing pixel grain / flicker on fast-moving edges. The start / end
thresholds and spacing keep the upstream defaults (start 0.7, end 0.0, cosine).
The node is bundled natively (`H3OneSigmaRefiner`) — no extra custom-node pack
is required — with the algorithm credited to
[ComfyUI-YCNodes-MiniMax-H3](https://github.com/yichengup/ComfyUI-YCNodes-MiniMax-H3).

### Second Pass (双采)

An optional **Second Pass** toggle in the parameter area runs a two-pass latent
refinement with fully automatic parameters — no extra controls: pass 1 renders
the clip with the normal full-denoise schedule, then pass 2 feeds the same
packed video+audio latent back through a second sampler at a lower `denoise`
(automatic defaults: 10 steps, denoise 0.4) so the model redraws detail instead
of generating from scratch. This is the classic two-pass technique used by
LTX Stage 1→2 and
[Muse-MiniMax-H3-Refine](https://github.com/muse-collective-26/Muse-MiniMax-H3-Refine)
hi-res fixes, done entirely in latent space — no VAE round-trip, no extra packs.
It applies to every mode, including each Chain clip. Off by default, since it
roughly doubles sampling time.
When the **Latent Upscaler** is also enabled, T2V and R2V switch to the
RunningHub 一采-放大-二采 split-schedule layout: the schedule is split in half
automatically (the raw scheduler schedule is split first, then the Sigma
Refiner is applied to pass 1's branch) — pass 1 runs the high-sigma head at
base resolution with the extra detail steps, the video latent is upscaled from
pass 1's clean estimate (`denoised_output`, with the 3D upscaler at fp16 —
audio stays untouched), and pass 2 finishes the low-sigma tail at the upscaled
resolution with the sampler forced to `euler` (`pass 1 → upscale → pass 2 →
decode`). Feeding the still-noisy intermediate instead of the clean estimate
would corrupt the upscaler's output and garble the video. R2V drops its frame-0
identity anchor in this mode, matching the reference workflow.
In Chain with the upscaler enabled it uses the same split schedule: every clip
runs the high-sigma head at base resolution first (motion-context continuity
stays on those clean base latents), then a gated final stage upscales each
clip and runs the low-sigma tail — the stage waits for the last clip's first
pass via a trigger on the upscaler node, and pass 2 uses the base conditioning
(no motion-context keyframes) because H3 keyframe rows scale with the canvas
and cannot be re-sampled after upscaling. Keyframe-based modes (I2V, Keyframes)
keep the upscaler on the output side
(`pass 1 → pass 2 → upscale → decode`): H3 keyframe rows scale with the target
canvas while the keyframe latents stay base-encoded, so an upscaled latent
cannot be re-sampled there.

## Screenshots

**History** — searchable, with prompt reuse and per-entry preview.

![History](assets/history.png)

**Library** — every output in one place: inline preview, favorites, open-folder, delete.

![Library](assets/library.png)

**Settings** — theme accent, sounds, models, and the WeChat QR follow area.

![Settings](assets/settings.png)

## Requirements

### Models

Official MiniMax H3 files from [Comfy-Org/MiniMax-H3](https://huggingface.co/Comfy-Org/MiniMax-H3), placed in your standard `ComfyUI/models/` folders:

| File | Folder |
|------|--------|
| `minimax_h3_fl2va_pruned_int8_convrot.safetensors` | `diffusion_models/` |
| `minimax_h3_ref2va_pruned_int8_convrot.safetensors` | `diffusion_models/` |
| `qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors` | `text_encoders/` |
| `minimax_h3_video_vae_fp16.safetensors` | `vae/` |
| `minimax_h3_audio_vae_fp32.safetensors` | `vae/` |

### Custom nodes

- **Chain / Keyframes / Extend:** [ComfyUI-H3-Motion-Context-MultiRef](https://github.com/seitanism/ComfyUI-H3-Motion-Context-MultiRef) — on ComfyUI 0.32, pin the tested commit `0719855` (current `main` requires ComfyUI PR #15439 / 0.33+). See [COMPATIBILITY.md](COMPATIBILITY.md).
- **Audio Lock / Audio Drive:** comfyui-vrgamedevgirl
- **Turbo preset:** [ComfyUI-MiniMax-H3-Turbo](https://github.com/Larryvrh/ComfyUI-MiniMax-H3-Turbo) + a turbo LoRA from [larryvrh/MiniMax-H3-Turbo-Lora](https://huggingface.co/larryvrh/MiniMax-H3-Turbo-Lora)
- **Latent Upscaler:** [Comfyui_Minimax_h3_latent_Upscaler](https://github.com/LBH-123-AI/Comfyui_Minimax_h3_latent_Upscaler) — used by the optional Latent Upscaler panel.
- **Optional (Speed / High Quality presets):** ComfyUI-SolAttn_triton, ComfyUI-MiniMaxH3-Cache, SageAttention

Exact tested versions of everything are in **[COMPATIBILITY.md](COMPATIBILITY.md)** — check that file first if something breaks after you update ComfyUI or a pack.

## Installation

```bash
# inside ComfyUI/custom_nodes/
git clone https://github.com/AIFSH/OneNode-MinimaxH3.git
```

Restart ComfyUI, then double-click the canvas and search for **ALL in ONE MiniMaxH3**.

## Compatibility

I develop and test against a pinned stack (ComfyUI version, custom node commits, model files). It's all listed in **[COMPATIBILITY.md](COMPATIBILITY.md)** — if a render fails after you updated something, start there.

> **Important for Chain / Keyframes / Extend:** `ComfyUI-H3-Motion-Context-MultiRef` current `main` dropped the legacy patch path and requires ComfyUI PR #15439 (0.33+). On the pinned ComfyUI 0.32 stack you must stay on commit `0719855`:
>
> ```bash
> cd ComfyUI/custom_nodes/ComfyUI-H3-Motion-Context-MultiRef
> git fetch origin && git checkout 0719855
> ```
>
> then restart ComfyUI (or upgrade ComfyUI to 0.33+ and use the current pack).

## Credits

- The "one node" idea and UI approach: Ján — [one-node-flux-2-klein](https://github.com/yanokusnir-ai/one-node-flux-2-klein) and [one-node-gemma-4](https://github.com/yanokusnir-ai/one-node-gemma-4)
- Chain / Keyframes / Extend wiring: [ComfyUI-H3-Motion-Context-MultiRef](https://github.com/seitanism/ComfyUI-H3-Motion-Context-MultiRef) by seitanism
- Base graphs: the official MiniMax H3 native workflows from Comfy-Org
- Turbo preset: ComfyUI-MiniMax-H3-Turbo pack

## Support

This node is in **beta** — if something breaks, please [open an issue](https://github.com/AIFSH/OneNode-MinimaxH3/issues), it's the fastest way to get it fixed.

**Follow the WeChat official account:**

![WeChat official account QR code](web/wechat_qr.png)

The settings panel shows the QR code directly. Drop your QR image at `web/wechat_qr.png` (or `assets/wechat_qr.png`; `.jpg`/`.jpeg`/`.webp`/`.gif` also work) — it's served through the node's `/h3one/wechat_qr` endpoint, and the format is detected from the file content.

## License

GPL-3.0 — see [LICENSE](LICENSE).
