import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

const ACCENT_DEFAULT = "#c0a996";
const WECHAT_QR_PATH = "/h3one/wechat_qr.png";
const C = {
  lime:ACCENT_DEFAULT, bg0:"#080808", bg1:"#101010", bg2:"#1c1c1c",
  bg3:"#2a2a2a", border:"#4c4c4c", borderH:"#5f5f5f",
  text:"#ffffff", muted:"#b0b0b0", dim:"#4a4a4a",
  warn:"#ffc266", err:"#ff8080",
};
// The accent is a live CSS variable: every C.lime read resolves to
// var(--h3accent), which _applyAccent sets on <html> at runtime.
C.lime = "var(--h3accent)";

// -- i18n ---------------------------------------------------------------------
let _uiLang = "en";
try { const _l = localStorage.getItem("one_node_minimax_h3_lang"); _uiLang = _l === "zh" ? "zh" : "en"; } catch(e) {}

const I18N = {
  en: {
    "mode.short.t2v": "T2V",
    "mode.short.i2v": "I2V",
    "mode.short.r2v": "R2V",
    "mode.short.keyframes": "Keyframes",
    "mode.short.extend": "Extend",
    "mode.short.chain": "Chain",
    "mode.hint.t2v": "Text to Video - generate a video from a text prompt only. No images or audio needed.",
    "mode.hint.i2v": "Image to Video - animate from a first frame, converge to a last frame, or morph between both.",
    "mode.hint.r2v": "Reference to Video - reference image = identity, reference video = motion, reference audio = final soundtrack.",
    "mode.hint.keyframes": "Custom Keyframes - pin still images at chosen frames; the video morphs through them in order.",
    "mode.hint.extend": "Extend - continue a source video seamlessly beyond its ending, keeping its look and sound.",
    "mode.hint.chain": "Chain - multiple clips generated in sequence and stitched end-to-end with motion-context continuity. Turn on Audio Lock to drive the whole chain with an audio track.",
    "mode.desc.t2v": "Generate a video from a text prompt only.",
    "mode.desc.i2v": "Animate from a first frame, converge to a last frame, or morph between both.",
    "mode.desc.r2v": "Image = identity, video = motion, audio = final soundtrack.",
    "mode.desc.keyframes": "Pin still images at chosen frames; the video morphs through them in order.",
    "mode.desc.extend": "Continue a source video seamlessly beyond its ending.",
    "mode.desc.chain": "Clips generated in sequence, stitched with motion-context continuity.",
    "nav.history": "History",
    "nav.library": "Library",
    "nav.settings": "Settings",
    "nav.fullscreen": "Fullscreen",
    "nav.lang.to.zh": "中文",
    "nav.lang.to.en": "EN",
    "nav.lang.hint.to.zh": "Switch to Chinese",
    "nav.lang.hint.to.en": "Switch to English",
    "ui.settings": "Settings",
    "ui.refresh.models": "Refresh models",
    "ui.close": "Close",
    "ui.speed.lora": "Speed LoRA (Turbo preset)",
    "ui.speed.lora.hint": "Used by the Turbo quality preset.",
    "ui.completion.sound": "Completion sound",
    "ui.accent.colour": "Accent colour",
    "ui.support": "Follow us",
    "ui.support.btn": "Scan to follow",
    "ui.wechat.title": "Follow our WeChat official account",
    "ui.wechat.hint": "Open WeChat and scan the QR code below to follow us.",
    "ui.wechat.placeholder": "QR code image placeholder\n(put wechat_qr.png in the node's web/ folder)",
    "ui.wechat.close": "Close",
    "ui.audio.native": "Generate native audio",
    "ui.sound.complete": "Notification sound on complete",
    "ui.play.finish": "Play video on finish",
    "ui.model.diff.t2v": "Diffusion model (T2V / I2V)",
    "ui.model.diff.r2v": "Diffusion model (R2V / refs)",
    "ui.model.clip": "Text encoder (CLIP)",
    "ui.model.vae.video": "Video VAE",
    "ui.model.vae.audio": "Audio VAE",
    "ui.latent.upscaler": "Latent Upscaler",
    "ui.latent.enabled": "Enable latent upscale",
    "ui.latent.model": "Latent upscaler model",
    "ui.latent.variant": "Variant",
    "ui.latent.scale": "Scale",
    "ui.latent.device": "Device",
    "ui.latent.precision": "Precision",
    "ui.latent.hint": "Runs in latent space after sampling and before VAE decode. Requires Comfyui_Minimax_h3_latent_Upscaler and a model in ComfyUI/models/latent_upscale_models/.",
    "err.latent.model": "Latent upscaling is enabled, but no latent upscaler model is selected. Open the Latent Upscaler panel and choose a model.",
    "tip.latent.variant": "2D is faster and lighter; 3D gives stronger temporal coherence. Both preserve the time dimension and only scale H x W.",
    "tip.latent.scale": "Spatial scale from 1.0x to 4.0x. 1.0 keeps the latent unchanged.",
    "ui.history": "History",
    "ui.library": "Library",
    "ui.discover": "Discover",
    "ui.prompt": "Prompt",
    "ui.tune": "Tune",
    "ui.resolution": "Resolution",
    "ui.aspect": "Ratio",
    "ui.aspect.auto": "Auto",
    "ui.duration": "Duration (s)",
    "ui.steps": "Steps",
    "ui.quality": "Quality",
    "ui.sampler": "Sampler",
    "ui.scheduler": "Scheduler",
    "ui.sigma.refine": "Sigma Refiner",
    "tip.sigma.refine": "Low-sigma detail refinement (from ComfyUI-YCNodes-MiniMax-H3).\nAdds extra smoothing steps at the low-noise tail of the schedule to remove pixel grain / flicker on fast-moving edges.\n0 = off. Default 1. Thresholds and spacing use defaults (start 0.7, end 0.0, cosine).",
    "ui.dual": "Second Pass",
    "tip.dual": "Second-pass latent refinement (双采), parameters are automatic.\nDefault: pass 1 renders the full clip, then a second sampler partially re-denoises the same packed video+audio latent (10 steps at denoise 0.4).\nWith the Latent Upscaler enabled, T2V / R2V switch to the RunningHub 一采-放大-二采 split-schedule layout: the raw schedule is split in half — pass 1 runs the high-sigma head at base resolution with the Sigma Refiner's extra detail steps, the video latent is upscaled (from pass 1's clean estimate, 3D upscaler at fp16), and pass 2 finishes the low-sigma tail at the upscaled resolution (sampler forced to euler, matching the reference workflow; R2V drops its frame-0 anchor here).\nIn Chain with the upscaler enabled it uses the same split schedule: all clips run the high-sigma head at base resolution first (continuity stays on those clean base latents), then a gated final stage upscales each clip and runs the low-sigma tail — pass 2 uses the base conditioning (no motion-context keyframes) because H3 keyframe rows scale with the canvas and cannot be re-sampled after upscaling. I2V / Keyframes keep the upscaler on the output side for the same reason.\nOff by default — roughly doubles sampling time when enabled.",
    "ui.advanced": "Advanced",
    "ui.loras.none": "LoRAs — none loaded",
    "ui.loras.loaded": "LoRAs — {n} loaded",
    "ui.add.lora": "+ Add LoRA",
    "ui.add.image": "Add image",
    "ui.optional": "Optional",
    "ui.add.video": "Add video",
    "ui.add.audio": "Add audio",
    "ui.favorite": "Favorite",
    "ui.open": "Open",
    "ui.open.folder": "Open folder",
    "ui.delete": "Delete",
    "ui.back": "Back",
    "ui.copy": "Copy",
    "ui.copied": "Copied",
    "ui.failed": "Failed",
    "ui.use": "Use",
    "ui.edit": "Edit",
    "ui.load.into.prompt": "Load into prompt box",
    "ui.loaded": "Loaded",
    "ui.favorites": "Favorites",
    "ui.refresh": "Refresh",
    "ui.outputs": "Outputs",
    "ui.no.outputs": "No outputs yet.",
    "ui.generated.placeholder": "Generated videos appear here",
    "ui.video.word": "video",
    "ui.generate": "Generate",
    "ui.generating": "Generating...",
    "ui.stop": "Stop",
    "ui.save.on": "Save On",
    "ui.save.off": "Save Off",
    "ui.autosave.title": "Auto-save videos to your ComfyUI output folder. Off = preview only (temp files, cleaned on restart).",
    "ui.error.title": "Something went wrong",
    "ui.generation.time": "Generation time",
    "ui.seed": "Seed",
    "ui.random": "Random",
    "ui.batch": "Batch",
    "ui.copy.seed": "Copy seed",
    "ui.reuse.prompt": "Reuse prompt",
    "ui.result": "Result",
    "ui.no.video": "No video recorded.",
    "ui.delete.entry": "Delete entry",
    "ui.seed.label": "seed -",
    "ui.seed.word": "seed",
    "ui.mode.label": "mode ·",
    "ui.time.label": "time ·",
    "ui.turbo.badge": "⚡ Turbo LoRA",
    "ui.chars": "{n} chars",
    "ui.frames.label": "= {n} frames @ 24fps",
    "ui.empty.fav": "No favorites yet. Favorite a video to collect it here.",
    "ui.empty.lib": "No videos yet. Generate something to see it here.",
    "ui.search.history": "Search history...",
    "ui.filter": "Type to filter...",
    "ui.prompt.used": "Prompt used",
    "ui.no.prompt": "No prompt recorded for this video.",
    "ui.disc.title": "Discover - prompt presets",
    "ui.disc.note": "Presets insert a complete structured H3 prompt. Your own plain text also works - it is wrapped with the required fields automatically when you generate, so you can type anything.",
    "ui.disc.save.cap": "Save a new preset (name + prompt)",
    "ui.disc.save": "Save preset",
    "ui.disc.update": "Update preset",
    "ui.disc.cancel": "Cancel edit",
    "ui.disc.saving": "Saving...",
    "ui.disc.failed": "Failed - restart ComfyUI?",
    "ui.disc.yours": "Your presets (all modes)",
    "ui.disc.builtin": "Built-in presets",
    "ui.disc.preset.name": "Preset name",
    "ui.disc.editing": "Editing: {n}",
    "ui.disc.saved": "Saved \"{n}\" to Your presets",
    "ui.disc.overwrite": "A preset named \"{n}\" already exists in that mode. Overwrite it?",
    "ui.disc.delete.confirm": "Delete preset \"{n}\" ({m})?",
    "ui.mode.t2v": "Text to Video",
    "ui.mode.i2v": "Image to Video",
    "ui.mode.r2v": "Reference to Video",
    "ui.mode.keyframes": "Custom Keyframes",
    "ui.mode.extend": "Extend Video",
    "ui.mode.chain": "Motion Context Chain",
    "ui.first.frame": "First frame",
    "ui.last.frame": "Last frame",
    "ui.audio.track": "Audio track",
    "ui.chain.select.track": "Select",
    "ui.chain.change.track": "Change",
    "ui.chain.no.track": "No audio track",
    "ui.video.extend": "Video to extend",
    "ui.ref.images": "Reference images ({n}/9)",
    "ui.ref.videos": "Reference videos ({n}/3)",
    "ui.ref.audio": "Reference audio ({n}/3)",
    "ui.ref.audio.video": "Reference audio (using video audio)",
    "ui.ref.audio.disabled": "Disabled: <Audio N> now refers to the reference video's own soundtrack. Turn off \"Use audio\" on the video to add your own audio track.",
    "ui.ref.use.audio": "Use audio",
    "ui.keyframes": "Keyframes ({n})",
    "ui.frame": "Frame",
    "ui.add.keyframe": "+ Add keyframe (max 32)",
    "ui.remove.keyframe": "Remove this keyframe",
    "ui.clips": "Clips ({n})",
    "ui.discover.presets": "Discover presets",
    "ui.clip": "Clip {n}",
    "ui.sec": "sec",
    "ui.remove.clip": "Remove this clip",
    "ui.prompt.clip": "Prompt for clip {n}",
    "ui.add.clip": "+ Add clip",
    "ui.context.length": "Context length (frames)",
    "ui.chain.hint": "Clips run sequentially in one queue entry. Each clip pins the previous clip's tail (motion + audio). Keep the same resolution across clips - the latent path cannot resize.",
    "ui.audio.lock": "Audio Lock",
    "ui.audio.lock.on": "The whole chain is audio-driven. The audio track below drives mouth movements and becomes the soundtrack.",
    "ui.audio.lock.off": "Turn on to drive the whole chain's mouth movement and timing with one audio track.",
    "ui.chain.references": "References",
    "ui.chain.clips": "Chain clips",
    "ui.chain.final": "Final",
    "ui.remove.lora": "Remove this LoRA",
    "err.audio.lock.audio": "Audio Lock is on - add an audio track to drive the chain.",
    "err.chain.missing.clip": "One or more chain clips did not produce a video. Check the ComfyUI console for clip errors.",
    "err.h3.native.required": "Chain needs ComfyUI-H3-Motion-Context-MultiRef pinned to commit 0719855 (the current pack main requires ComfyUI PR #15439 / 0.33+). Fix: in ComfyUI/custom_nodes/ComfyUI-H3-Motion-Context-MultiRef run `git fetch origin && git checkout 0719855`, then restart ComfyUI. Alternatively upgrade ComfyUI to 0.33+.",
    "err.r2v.maxvideos": "R2V supports up to 3 reference videos. Remove one first.",
    "err.load.video": "Could not load video into {n}:",
    "err.copy.video": "Could not copy the video to the input folder",
    "err.tpl": "Failed to load workflow template: {n}",
    "err.turbo.lora": "Turbo preset needs a Turbo LoRA - set one in Settings (Speed LoRA) or pick another quality.",
    "err.i2v.image": "I2V needs at least one image. Drop a First frame (animate from it), a Last frame (converge to it), or both (morph between them) - or switch to T2V mode.",
    "err.r2v.ref": "R2V needs at least one reference. Add a reference image, video or audio - or switch to T2V mode.",
    "err.keyframes.image": "Keyframes mode needs at least one image. Drop an image into a keyframe slot, or switch to another mode.",
    "err.extend.video": "Extend needs a source video. Drop a file in the Video to extend slot, or switch to another mode.",
    "err.unknown": "Unknown error",
    "ui.today": "Today",
    "ui.unfavorite": "Unfavorite",
    "ui.delete.confirm": "Delete {n}?",
    "tip.audio.native": "R2V and Chain Audio Lock always use the audio you provide - this toggle only controls the model's own generated soundtrack in T2V / I2V / Keyframes.",
    "tip.resolution": "The output pixel grid (width x height).\nHigher = sharper detail and more VRAM + time.\nPick Custom to set any size - snapped to multiples of 32.\nMiniMax H3 recommends up to 1344x768 (short edge <= 768, long edge <= 1344). Above that the model may repeat content or distort.",
    "tip.quality": "The sampling pipeline, not the pixel size.\nBalanced: SolAttn sparse attention + your steps.\nSpeed: SolAttn + H3 block cache (fastest, tiny quality tradeoff).\nHigh Quality: full SageAttention - no sparse attention, no cache. Slowest, maximum fidelity.\nTurbo: Turbo LoRA + 6-step distilled sampler. Much faster, visibly lower quality - needs the Turbo LoRA set in Settings.",
    "tip.sampler": "The sampling algorithm. MiniMax H3's native workflows use res_multistep - keep it unless you know why you're changing it.",
    "tip.scheduler": "The noise schedule. MiniMax H3's native workflows use simple - keep it unless you know why you're changing it.",
    "tip.mc.length": "How many frames of the previous clip's tail (motion + audio) are pinned as context for the next clip.\nOnly H3-native clip lengths are valid: 1, 5, 22, 39, 56, 73, 90, 107, 124, 141.\nDefault 22 frames (~1s at 24fps). Higher = tighter continuity but less freedom.",
  },
  zh: {
    "mode.short.t2v": "文生",
    "mode.short.i2v": "图生",
    "mode.short.r2v": "参考",
    "mode.short.keyframes": "关键帧",
    "mode.short.extend": "延长",
    "mode.short.chain": "链",
    "mode.hint.t2v": "文生视频 - 仅根据文本提示生成视频，无需图片或音频。",
    "mode.hint.i2v": "图生视频 - 从首帧开始动画，收敛到末帧，或在两者之间变形。",
    "mode.hint.r2v": "参考生视频 - 参考图 = 身份，参考视频 = 动作，参考音频 = 最终配乐。",
    "mode.hint.keyframes": "自定义关键帧 - 将静态图固定在选定帧，视频按顺序变形。",
    "mode.hint.extend": "延长 - 无缝延续源视频，保留其画面与声音。",
    "mode.hint.chain": "链 - 多段视频按顺序生成并首尾拼接，带运动上下文连贯性。开启 Audio Lock 可用一条音频驱动整条链。",
    "mode.desc.t2v": "仅根据文本提示生成视频。",
    "mode.desc.i2v": "从首帧开始动画，收敛到末帧，或在两者之间变形。",
    "mode.desc.r2v": "参考图 = 身份，参考视频 = 动作，参考音频 = 最终配乐。",
    "mode.desc.keyframes": "将静态图固定在选定帧，视频按顺序变形。",
    "mode.desc.extend": "无缝延续源视频。",
    "mode.desc.chain": "多段视频按顺序生成，带运动上下文连贯性。",
    "nav.history": "历史",
    "nav.library": "库",
    "nav.settings": "设置",
    "nav.fullscreen": "全屏",
    "nav.lang.to.zh": "中文",
    "nav.lang.to.en": "EN",
    "nav.lang.hint.to.zh": "切换到中文",
    "nav.lang.hint.to.en": "切换到英文",
    "ui.settings": "设置",
    "ui.refresh.models": "刷新模型",
    "ui.close": "关闭",
    "ui.speed.lora": "加速 LoRA（Turbo 预设）",
    "ui.speed.lora.hint": "Turbo 画质预设会用到。",
    "ui.completion.sound": "完成提示音",
    "ui.accent.colour": "主题色",
    "ui.support": "关注我们",
    "ui.support.btn": "扫码关注",
    "ui.wechat.title": "关注微信公众号",
    "ui.wechat.hint": "打开微信扫描下方二维码关注我们。",
    "ui.wechat.placeholder": "二维码图片位置\n（将 wechat_qr.png 放入节点的 web/ 目录）",
    "ui.wechat.close": "关闭",
    "ui.audio.native": "生成原生音频",
    "ui.sound.complete": "完成时播放提示音",
    "ui.play.finish": "完成后播放视频",
    "ui.model.diff.t2v": "扩散模型（T2V / I2V）",
    "ui.model.diff.r2v": "扩散模型（R2V / 参考）",
    "ui.model.clip": "文本编码器（CLIP）",
    "ui.model.vae.video": "视频 VAE",
    "ui.model.vae.audio": "音频 VAE",
    "ui.latent.upscaler": "Latent 放大",
    "ui.latent.enabled": "启用 latent 放大",
    "ui.latent.model": "Latent 放大模型",
    "ui.latent.variant": "版本",
    "ui.latent.scale": "放大倍数",
    "ui.latent.device": "设备",
    "ui.latent.precision": "精度",
    "ui.latent.hint": "在采样后、VAE 解码前于 latent 空间执行。需要安装 Comfyui_Minimax_h3_latent_Upscaler，并将模型放入 ComfyUI/models/latent_upscale_models/。",
    "err.latent.model": "已启用 latent 放大，但未选择模型。请打开 Latent 放大专栏选择模型。",
    "tip.latent.variant": "2D 更快、更轻量；3D 时间一致性更强。两个版本都保持时间长度不变，仅放大宽高。",
    "tip.latent.scale": "空间放大倍数，范围 1.0x 到 4.0x。1.0 表示不改变 latent。",
    "ui.history": "历史",
    "ui.library": "库",
    "ui.discover": "发现",
    "ui.prompt": "提示词",
    "ui.tune": "调参",
    "ui.resolution": "分辨率",
    "ui.aspect": "比例",
    "ui.aspect.auto": "自动",
    "ui.duration": "时长 (秒)",
    "ui.steps": "步数",
    "ui.quality": "画质",
    "ui.sampler": "采样器",
    "ui.scheduler": "调度器",
    "ui.sigma.refine": "Sigma 精修",
    "tip.sigma.refine": "低噪细节精修（源自 ComfyUI-YCNodes-MiniMax-H3）。\n在噪声调度的低噪尾部增加平滑步数，消除高速运动边缘的像素颗粒与闪烁。\n0 = 关闭。默认 1。阈值与分布曲线使用默认值（起始 0.7、结束 0.0、cosine）。",
    "ui.dual": "二次采样",
    "tip.dual": "第二遍潜空间精修（双采），参数全自动。\n默认：第一遍完整 denoise 渲染全片，第二遍采样器在同一份打包的视频+音频 latent 上做局部重绘（10 步、denoise 0.4）。\n同时开启 Latent 放大时，T2V / R2V 切换为 RunningHub 的「一采-放大-二采」拆分调度：原始调度自动对半拆分——第一遍在基础分辨率跑高 sigma 头部（Sigma 精修的加步也作用在第一遍），视频 latent 从第一遍的干净估计（denoised_output）放大（3D、fp16），第二遍在放大分辨率跑低 sigma 尾部（采样器强制 euler，与参考工作流一致；R2V 此时不插入第 0 帧锚点）。\nChain 开启放大时同样用拆分调度：所有片段先在基础分辨率跑高 sigma 头部（连续性沿用干净基础 latent），受门控的最终阶段再逐片段放大并跑低 sigma 尾部——二采使用基础 conditioning 引导器（不含 MotionContext 关键帧），因为 H3 关键帧行数随画布缩放、放大后无法再采样。I2V / Keyframes 仍保持输出侧放大。\n默认关闭——开启后采样时间约翻倍。",
    "ui.advanced": "高级",
    "ui.loras.none": "LoRA — 未加载",
    "ui.loras.loaded": "LoRA — 已加载 {n} 个",
    "ui.add.lora": "+ 添加 LoRA",
    "ui.add.image": "添加图片",
    "ui.optional": "可选",
    "ui.add.video": "添加视频",
    "ui.add.audio": "添加音频",
    "ui.favorite": "收藏",
    "ui.open": "打开",
    "ui.open.folder": "打开文件夹",
    "ui.delete": "删除",
    "ui.back": "返回",
    "ui.copy": "复制",
    "ui.copied": "已复制",
    "ui.failed": "失败",
    "ui.use": "使用",
    "ui.edit": "编辑",
    "ui.load.into.prompt": "载入提示词框",
    "ui.loaded": "已载入",
    "ui.favorites": "收藏",
    "ui.refresh": "刷新",
    "ui.outputs": "输出",
    "ui.no.outputs": "还没有输出。",
    "ui.generated.placeholder": "生成的视频会显示在这里",
    "ui.video.word": "视频",
    "ui.generate": "生成",
    "ui.generating": "生成中...",
    "ui.stop": "停止",
    "ui.save.on": "保存开",
    "ui.save.off": "保存关",
    "ui.autosave.title": "将视频自动保存到 ComfyUI 输出文件夹。关闭 = 仅预览（临时文件，重启后清理）。",
    "ui.error.title": "出错了",
    "ui.generation.time": "生成时间",
    "ui.seed": "种子",
    "ui.random": "随机",
    "ui.batch": "批量",
    "ui.copy.seed": "复制种子",
    "ui.reuse.prompt": "复用提示词",
    "ui.result": "结果",
    "ui.no.video": "没有录制视频。",
    "ui.delete.entry": "删除记录",
    "ui.seed.label": "种子 -",
    "ui.seed.word": "种子",
    "ui.mode.label": "模式 ·",
    "ui.time.label": "时间 ·",
    "ui.turbo.badge": "⚡ Turbo LoRA",
    "ui.chars": "{n} 字符",
    "ui.frames.label": "= {n} 帧 @ 24fps",
    "ui.empty.fav": "还没有收藏。收藏一个视频以收集到这里。",
    "ui.empty.lib": "还没有视频。生成一个后即可在此查看。",
    "ui.search.history": "搜索历史...",
    "ui.filter": "输入以过滤...",
    "ui.prompt.used": "使用的提示词",
    "ui.no.prompt": "该视频没有记录提示词。",
    "ui.disc.title": "发现 - 提示词预设",
    "ui.disc.note": "预设会插入完整的 H3 结构化提示词。你自己写的普通文本也可以 - 生成时会自动补上所需字段，所以你可以输入任何内容。",
    "ui.disc.save.cap": "保存新预设（名称 + 提示词）",
    "ui.disc.save": "保存预设",
    "ui.disc.update": "更新预设",
    "ui.disc.cancel": "取消编辑",
    "ui.disc.saving": "保存中...",
    "ui.disc.failed": "失败 - 请重启 ComfyUI？",
    "ui.disc.yours": "你的预设（所有模式）",
    "ui.disc.builtin": "内置预设",
    "ui.disc.preset.name": "预设名称",
    "ui.disc.editing": "编辑中：{n}",
    "ui.disc.saved": "已将“{n}”保存到你的预设",
    "ui.disc.overwrite": "该模式下已存在名为“{n}”的预设。是否覆盖？",
    "ui.disc.delete.confirm": "删除预设“{n}”（{m}）？",
    "ui.mode.t2v": "文生视频",
    "ui.mode.i2v": "图生视频",
    "ui.mode.r2v": "参考生视频",
    "ui.mode.keyframes": "自定义关键帧",
    "ui.mode.extend": "延长视频",
    "ui.mode.chain": "运动上下文链",
    "ui.first.frame": "首帧",
    "ui.last.frame": "末帧",
    "ui.audio.track": "音轨",
    "ui.chain.select.track": "选择",
    "ui.chain.change.track": "更换",
    "ui.chain.no.track": "未选择音轨",
    "ui.video.extend": "要延长的视频",
    "ui.ref.images": "参考图片 ({n}/9)",
    "ui.ref.videos": "参考视频 ({n}/3)",
    "ui.ref.audio": "参考音频 ({n}/3)",
    "ui.ref.audio.video": "参考音频（使用视频音频）",
    "ui.ref.audio.disabled": "已禁用：<Audio N> 现在指向参考视频自身的音轨。关闭视频上的“使用音频”以添加你自己的音轨。",
    "ui.ref.use.audio": "使用音频",
    "ui.keyframes": "关键帧 ({n})",
    "ui.frame": "帧",
    "ui.add.keyframe": "+ 添加关键帧（最多 32）",
    "ui.remove.keyframe": "移除该关键帧",
    "ui.clips": "片段 ({n})",
    "ui.discover.presets": "发现预设",
    "ui.clip": "片段 {n}",
    "ui.sec": "秒",
    "ui.remove.clip": "移除该片段",
    "ui.prompt.clip": "片段 {n} 的提示词",
    "ui.add.clip": "+ 添加片段",
    "ui.context.length": "上下文长度（帧）",
    "ui.chain.hint": "片段会在同一个队列里按顺序运行。每个片段都钉住上一个片段尾部（动作 + 音频）。所有片段请保持相同分辨率 - 潜空间路径无法缩放。",
    "ui.audio.lock": "音频锁定",
    "ui.audio.lock.on": "整条链由音频驱动。下方的音轨驱动口型并作为最终配乐。",
    "ui.audio.lock.off": "开启后，用一条音轨驱动整条链的口型和节奏。",
    "ui.chain.references": "参考",
    "ui.chain.clips": "链片段",
    "ui.chain.final": "最终",
    "ui.remove.lora": "移除该 LoRA",
    "err.audio.lock.audio": "已开启 Audio Lock - 请添加音轨以驱动整条链。",
    "err.chain.missing.clip": "有一个或多个链片段没有生成视频。请检查 ComfyUI 控制台中的片段错误。",
    "err.h3.native.required": "链功能需要把 ComfyUI-H3-Motion-Context-MultiRef 固定到提交 0719855（当前 main 分支要求 ComfyUI PR #15439 / 0.33+）。修复：在 ComfyUI/custom_nodes/ComfyUI-H3-Motion-Context-MultiRef 目录下执行 `git fetch origin && git checkout 0719855`，然后重启 ComfyUI；或者把 ComfyUI 升级到 0.33+。",
    "err.r2v.maxvideos": "R2V 最多支持 3 个参考视频，请先移除一个。",
    "err.load.video": "无法将视频载入 {n}：",
    "err.copy.video": "无法将视频复制到输入文件夹",
    "err.tpl": "加载工作流模板失败：{n}",
    "err.turbo.lora": "Turbo 预设需要 Turbo LoRA - 请在设置（Speed LoRA）中设置，或选择其他画质。",
    "err.i2v.image": "I2V 至少需要一张图片。拖入首帧（从它开始动画）、末帧（收敛到它），或两者（在其间变形）- 或切换到 T2V 模式。",
    "err.r2v.ref": "R2V 至少需要一个参考。添加参考图、视频或音频 - 或切换到 T2V 模式。",
    "err.keyframes.image": "关键帧模式至少需要一张图片。将图片拖入关键帧槽，或切换到其他模式。",
    "err.extend.video": "延长模式需要源视频。将文件拖入“要延长的视频”槽，或切换到其他模式。",
    "err.unknown": "未知错误",
    "ui.today": "今天",
    "ui.unfavorite": "取消收藏",
    "ui.delete.confirm": "删除 {n}？",
    "tip.audio.native": "R2V 和链的 Audio Lock 始终使用你提供的音频 - 此开关只控制 T2V / I2V / 关键帧模式中模型自己生成的配乐。",
    "tip.resolution": "输出像素网格（宽 x 高）。\n越高 = 细节越清晰，显存和时间也越多。\n选择自定义可设置任意尺寸 - 会吸附到 32 的倍数。\nMiniMax H3 推荐最高 1344x768（短边 <= 768，长边 <= 1344）。超过后模型可能重复内容或变形。",
    "tip.quality": "采样管线，而非像素尺寸。\nBalanced：SolAttn 稀疏注意力 + 你的步数。\nSpeed：SolAttn + H3 块缓存（最快，画质损失很小）。\nHigh Quality：完整 SageAttention - 无稀疏注意力、无缓存。最慢，保真度最高。\nTurbo：Turbo LoRA + 6 步蒸馏采样。快得多，画质明显下降 - 需要在设置中设置 Turbo LoRA。",
    "tip.sampler": "采样算法。MiniMax H3 原生工作流使用 res_multistep - 除非你知道为什么要改，否则保持它。",
    "tip.scheduler": "噪声调度。MiniMax H3 原生工作流使用 simple - 除非你知道为什么要改，否则保持它。",
    "tip.mc.length": "上一个片段尾部（动作 + 音频）有多少帧被钉住，作为下一个片段的上下文。\n只有 H3 原生片段长度有效：1、5、22、39、56、73、90、107、124、141。\n默认 22 帧（24fps 下约 1 秒）。越高 = 连续性越紧，但自由度越低。",
  },
};

function t(key, vars){
  let s = (I18N[_uiLang] && I18N[_uiLang][key]) || I18N.en[key] || key;
  if(vars){
    for(const k in vars) s = s.split("{"+k+"}").join(vars[k]);
  }
  return s;
}

let _i18nLive = [];
function _tr(el, key, vars, kind){
  const apply = () => {
    const s = t(key, vars);
    if(kind === "title") el.title = s;
    else if(kind === "placeholder") el.placeholder = s;
    else if(kind === "aria") el.setAttribute("aria-label", s);
    else el.textContent = s;
  };
  if(el._i18nApply){
    el._i18nApply = apply;
  } else {
    el._i18nApply = apply;
    _i18nLive.push(el);
  }
  apply();
  return el;
}

let _langBtnEl = null;
function _updateLangButton(){
  if(!_langBtnEl) return;
  const next = _uiLang === "zh" ? "en" : "zh";
  _langBtnEl.textContent = t(next === "zh" ? "nav.lang.to.zh" : "nav.lang.to.en");
  _langBtnEl.title = t(next === "zh" ? "nav.lang.hint.to.zh" : "nav.lang.hint.to.en");
}

function setUiLang(lang){
  _uiLang = lang === "zh" ? "zh" : "en";
  try { localStorage.setItem("one_node_minimax_h3_lang", _uiLang); } catch(e) {}
  _i18nLive = _i18nLive.filter(el => el && el.isConnected);
  _i18nLive.forEach(el => { try { el._i18nApply && el._i18nApply(); } catch(e){} });
  _updateLangButton();
}

const MEDIA = {
  image: { rgb:"90,168,255",  solid:"#5aa8ff" },
  video: { rgb:"95,208,140",  solid:"#5fd08c" },
  audio: { rgb:"192,127,255", solid:"#c07fff" },
};
const mediaCol = (t, a=1) => `rgba(${(MEDIA[t]||{rgb:"200,200,200"}).rgb},${a})`;

// Global video hover-preview mute (persisted; applies to every video slot in every mode)
let _videoMuted=false;
try{ _videoMuted=localStorage.getItem("one_node_minimax_h3_video_muted")==="1"; }catch(e){}
const _videoMuteListeners=[];
const SPEAKER_SVG='<path d="M11 5 L6 9 L2 9 L2 15 L6 15 L11 19 Z" fill="currentColor" stroke="none"/><path d="M15.5 8.5 a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M18 6 a9 9 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>';
const SPEAKER_MUTED_SVG=SPEAKER_SVG+'<line x1="2.5" y1="2.5" x2="21.5" y2="21.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>';
function setVideoMuted(m){
  _videoMuted=!!m;
  try{ localStorage.setItem("one_node_minimax_h3_video_muted",_videoMuted?"1":"0"); }catch(e){}
  _videoMuteListeners.forEach(f=>{ try{ f(_videoMuted); }catch(e){} });
}

const NODE_W = 1200;
const NODE_H = 700;
const LS_KEY = "one_node_minimax_h3_state";

const MODES = [
  { key:"t2v",         label:"T2V" },
  { key:"i2v",         label:"I2V" },
  { key:"r2v",         label:"R2V" },
  { key:"keyframes",   label:"Keyframes" },
  { key:"extend",      label:"Extend" },
  { key:"chain",       label:"Chain" },
];

const MODE_HINTS = {
  t2v:"mode.hint.t2v",
  i2v:"mode.hint.i2v",
  r2v:"mode.hint.r2v",
  keyframes:"mode.hint.keyframes",
  extend:"mode.hint.extend",
  chain:"mode.hint.chain",
};

const MODE_DESC = {
  t2v:"mode.desc.t2v",
  i2v:"mode.desc.i2v",
  r2v:"mode.desc.r2v",
  keyframes:"mode.desc.keyframes",
  extend:"mode.desc.extend",
  chain:"mode.desc.chain",
};

const TEMPLATES = {
  t2v:"t2v.json", i2v:"i2v.json", r2v:"r2v.json",
  keyframes:"keyframes.json", extend:"video_extend.json", chain:"chain_section.json",
};

// Sigma Refiner defaults, matching config.json and the upstream
// ComfyUI-YCNodes-MiniMax-H3 H3SigmaRefiner node. Only extra_steps is exposed
// in the UI (a single slider); the rest keep the upstream defaults.
const SIGMA_REFINE_DEFAULTS = {
  extra_steps:1, start_at_sigma:0.7, end_at_sigma:0.0, spacing:"cosine",
};

// Second-pass (双采) defaults, matching config.json. Pass 2 runs a partial-
// denoise refine over pass 1's packed AV latent; denoise 0.4 is the same
// starting point Muse-MiniMax-H3-Refine uses for its refine pass.
const DUAL_SAMPLING_DEFAULTS = {
  enabled:false, steps:10, denoise:0.4,
};

// Common video aspect ratios offered next to the resolution picker. "auto"
// means no filtering: the full resolution preset list is shown.
const ASPECT_RATIOS = ["auto", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "1:1", "21:9", "9:21"];
const ASPECT_TOL = 0.045;
function _aspectLabel(v){
  return v === "auto" ? t("ui.aspect.auto") : v;
}
function _aspectValue(label){
  return ASPECT_RATIOS.includes(label) ? label : "auto";
}
function _aspectRatioNum(v){
  const p = String(v || "").split(":").map(Number);
  return (p.length === 2 && p[0] > 0 && p[1] > 0) ? p[0] / p[1] : 0;
}
function _nearestAspect(w, h){
  if(!w || !h) return "auto";
  const v = w / h;
  let best = "auto", bestDiff = Infinity;
  for(const r of ASPECT_RATIOS){
    if(r === "auto") continue;
    const d = Math.abs(_aspectRatioNum(r) - v);
    if(d < bestDiff){ bestDiff = d; best = r; }
  }
  return best;
}

// Hard fallback so the resolution picker always has entries even if the
// server config endpoint fails to load.
const FALLBACK_RESOLUTIONS = [
  { label: "608x352 (0.2MP Preview)", width: 608, height: 352 },
  { label: "736x416 (0.3MP Draft)", width: 736, height: 416 },
  { label: "864x480 (0.4MP Speed)", width: 864, height: 480 },
  { label: "960x544 (0.5MP Balanced)", width: 960, height: 544 },
  { label: "1152x640 (0.7MP Quality)", width: 1152, height: 640 },
  { label: "1344x768 (0.98MP Native Max)", width: 1344, height: 768 },
  { label: "352x608 (0.2MP Portrait)", width: 352, height: 608 },
  { label: "416x736 (0.3MP Portrait)", width: 416, height: 736 },
  { label: "480x864 (0.4MP Portrait)", width: 480, height: 864 },
  { label: "544x960 (0.5MP Portrait)", width: 544, height: 960 },
  { label: "640x1152 (0.7MP Portrait)", width: 640, height: 1152 },
  { label: "768x1344 (0.98MP Portrait)", width: 768, height: 1344 },
  { label: "384x512 (0.2MP 3:4)", width: 384, height: 512 },
  { label: "480x640 (0.3MP 3:4)", width: 480, height: 640 },
  { label: "576x768 (0.4MP 3:4)", width: 576, height: 768 },
  { label: "672x896 (0.6MP 3:4)", width: 672, height: 896 },
  { label: "768x1024 (0.8MP 3:4)", width: 768, height: 1024 },
  { label: "864x1152 (1.0MP 3:4)", width: 864, height: 1152 },
  { label: "512x384 (0.2MP 4:3)", width: 512, height: 384 },
  { label: "640x480 (0.3MP 4:3)", width: 640, height: 480 },
  { label: "768x576 (0.4MP 4:3)", width: 768, height: 576 },
  { label: "896x672 (0.6MP 4:3)", width: 896, height: 672 },
  { label: "1024x768 (0.8MP 4:3)", width: 1024, height: 768 },
  { label: "1152x864 (1.0MP 4:3)", width: 1152, height: 864 },
  { label: "576x384 (0.2MP 3:2)", width: 576, height: 384 },
  { label: "672x448 (0.3MP 3:2)", width: 672, height: 448 },
  { label: "768x512 (0.4MP 3:2)", width: 768, height: 512 },
  { label: "864x576 (0.5MP 3:2)", width: 864, height: 576 },
  { label: "960x640 (0.6MP 3:2)", width: 960, height: 640 },
  { label: "1152x768 (0.9MP 3:2)", width: 1152, height: 768 },
  { label: "1248x832 (1.0MP 3:2)", width: 1248, height: 832 },
  { label: "384x576 (0.2MP 2:3)", width: 384, height: 576 },
  { label: "448x672 (0.3MP 2:3)", width: 448, height: 672 },
  { label: "512x768 (0.4MP 2:3)", width: 512, height: 768 },
  { label: "576x864 (0.5MP 2:3)", width: 576, height: 864 },
  { label: "640x960 (0.6MP 2:3)", width: 640, height: 960 },
  { label: "768x1152 (0.9MP 2:3)", width: 768, height: 1152 },
  { label: "832x1248 (1.0MP 2:3)", width: 832, height: 1248 },
  { label: "480x480 (0.2MP 1:1)", width: 480, height: 480 },
  { label: "544x544 (0.3MP 1:1)", width: 544, height: 544 },
  { label: "608x608 (0.4MP 1:1)", width: 608, height: 608 },
  { label: "672x672 (0.5MP 1:1)", width: 672, height: 672 },
  { label: "768x768 (0.6MP 1:1)", width: 768, height: 768 },
  { label: "864x864 (0.7MP 1:1)", width: 864, height: 864 },
  { label: "992x992 (1.0MP 1:1)", width: 992, height: 992 },
  { label: "672x288 (0.2MP 21:9)", width: 672, height: 288 },
  { label: "896x384 (0.3MP 21:9)", width: 896, height: 384 },
  { label: "1120x480 (0.5MP 21:9)", width: 1120, height: 480 },
  { label: "1344x576 (0.8MP 21:9)", width: 1344, height: 576 },
  { label: "1568x672 (1.1MP 21:9)", width: 1568, height: 672 },
  { label: "288x672 (0.2MP 9:21)", width: 288, height: 672 },
  { label: "384x896 (0.3MP 9:21)", width: 384, height: 896 },
  { label: "480x1120 (0.5MP 9:21)", width: 480, height: 1120 },
  { label: "576x1344 (0.8MP 9:21)", width: 576, height: 1344 },
  { label: "672x1568 (1.1MP 9:21)", width: 672, height: 1568 },
];

async function _resJson(res, label){
  try{
    return await res.json();
  }catch(e){
    let txt = "";
    try{ txt = await res.text(); }catch(_){}
    throw new Error(`Bad JSON from ${label || "server"} (HTTP ${res && res.status}): ${String(txt).slice(0, 300) || e.message}`);
  }
}
function _validAudioName(v){
  return (typeof v === "string" && v && v !== "undefined" && v !== "null") ? v : null;
}
function _audioSplitPoints(duration, silences, vocalBreaks){
  const total=Math.max(0.5,Number(duration)||0);
  const MAX=15, LOOKBACK=3.0, MIN=1.5;
  const points=[0];
  let cursor=0;
  while(true){
    if(total-cursor<=MAX){ points.push(total); break; }
    const target=cursor+MAX;
    const lo=target-LOOKBACK;
    let best=target, bestDist=Infinity;
    const consider=cand=>{
      if(!isFinite(cand)) return;
      if(cand<=cursor+MIN || cand>=total-MIN) return;
      if(cand<lo || cand>target) return;
      const d=target-cand;
      if(d<bestDist){ bestDist=d; best=cand; }
    };
    for(const s of silences||[]) consider(Number(s&&s.end));
    for(const v of vocalBreaks||[]) consider((Number(v&&v.start)+Number(v&&v.end))/2);
    points.push(best);
    cursor=best;
  }
  return points;
}

const DEFAULT_MODELS = {
  unetT2V:"minimax_h3_fl2va_pruned_int8_convrot.safetensors",
  unetR2V:"minimax_h3_ref2va_pruned_int8_convrot.safetensors",
  clip:"qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
  vaeVideo:"minimax_h3_video_vae_fp16.safetensors",
  vaeAudio:"minimax_h3_audio_vae_fp32.safetensors",
  latentUpscaleModel:"none",
};

function snapFrames(seconds){
  const base = Math.max(5, Math.round(seconds * 24));
  return base + ((5 - (base % 17)) + 17) % 17;
}

// -- DOM helpers (adapted from the One Node family) ----------------------------
const mk = (tag,css={},props={}) => { const e=document.createElement(tag); Object.assign(e.style,css); Object.assign(e,props); return e; };
const tx = (e,t) => { e.textContent=t; return e; };
const cap = (k) => _tr(mk("div",{fontSize:"9px",fontWeight:"700",letterSpacing:".1em",
  textTransform:"uppercase",color:C.muted,marginBottom:"5px"}), k);

let _infoTipEl=null;
function infoIcon(key){
  const ic=mk("span",{width:"13px",height:"13px",borderRadius:"50%",border:`1px solid ${C.borderH}`,color:C.muted,fontSize:"8px",fontWeight:"700",display:"inline-flex",alignItems:"center",justifyContent:"center",cursor:"help",flexShrink:"0",fontStyle:"italic",fontFamily:"Georgia, serif",transition:"border-color .15s, color .15s",userSelect:"none"});
  tx(ic,"i");
  const show=()=>{
    if(!_infoTipEl){
      _infoTipEl=mk("div",{position:"fixed",background:C.bg1,border:`1px solid ${C.borderH}`,borderRadius:"8px",padding:"9px 11px",fontSize:"10px",lineHeight:"1.55",color:C.text,maxWidth:"280px",zIndex:"999999",pointerEvents:"none",boxShadow:"0 10px 32px rgba(0,0,0,.95)",whiteSpace:"pre-line",wordBreak:"break-word",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"});
      document.body.appendChild(_infoTipEl);
    }
    tx(_infoTipEl,t(key));
    _infoTipEl.style.display="block";
    const r=ic.getBoundingClientRect();
    let left=r.right+8, top=r.top-6;
    const tw=_infoTipEl.offsetWidth, th=_infoTipEl.offsetHeight;
    if(left+tw>window.innerWidth-8) left=r.left-tw-8;
    if(top+th>window.innerHeight-8) top=window.innerHeight-th-8;
    if(top<8) top=8;
    _infoTipEl.style.left=left+"px";
    _infoTipEl.style.top=top+"px";
  };
  const hide=()=>{ if(_infoTipEl) _infoTipEl.style.display="none"; };
  ic.addEventListener("mouseenter",show);
  ic.addEventListener("mouseleave",hide);
  ic.addEventListener("mousedown",e=>e.stopPropagation());
  ic.addEventListener("pointerdown",e=>e.stopPropagation());
  return ic;
}

function attachTip(el,key){
  el.addEventListener("mouseenter",()=>{
    if(!_infoTipEl){
      _infoTipEl=mk("div",{position:"fixed",background:C.bg1,border:`1px solid ${C.borderH}`,borderRadius:"8px",padding:"9px 11px",fontSize:"10px",lineHeight:"1.55",color:C.text,maxWidth:"280px",zIndex:"999999",pointerEvents:"none",boxShadow:"0 10px 32px rgba(0,0,0,.95)",whiteSpace:"pre-line",wordBreak:"break-word",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"});
      document.body.appendChild(_infoTipEl);
    }
    tx(_infoTipEl,t(key));
    _infoTipEl.style.display="block";
    _infoTipEl.style.fontWeight="700";
    const r=el.getBoundingClientRect();
    let left=r.right+8, top=r.top-6;
    const tw=_infoTipEl.offsetWidth, th=_infoTipEl.offsetHeight;
    if(left+tw>window.innerWidth-8) left=r.left-tw-8;
    if(top+th>window.innerHeight-8) top=window.innerHeight-th-8;
    if(top<8) top=8;
    _infoTipEl.style.left=left+"px";
    _infoTipEl.style.top=top+"px";
  });
  el.addEventListener("mouseleave",()=>{ if(_infoTipEl) _infoTipEl.style.display="none"; });
}

async function h3Copy(text){
  text=String(text==null?"":text);
  try{
    if(navigator.clipboard&&window.isSecureContext){ await navigator.clipboard.writeText(text); return true; }
  }catch(e){}
  try{
    const ta=document.createElement("textarea");
    ta.value=text; ta.style.cssText="position:fixed;top:-9999px;left:-9999px;opacity:0;";
    document.body.appendChild(ta); ta.focus(); ta.select();
    const ok=document.execCommand("copy"); document.body.removeChild(ta); return ok;
  }catch(e){ return false; }
}

function _isVueNodes(){
  try{
    const v=app?.ui?.settings?.getSettingValue?.("Comfy.VueNodes.Enabled");
    return v===true||v==="true";
  }catch(e){ return false; }
}

function playDone(kind){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    const ctx=new AC();
    const sets={
      chime:[[660,0,0.09],[990,0.1,0.07]],
      soft:[[520,0,0.06],[780,0.08,0.05]],
      pop:[[440,0,0.12],[880,0.12,0.1],[1320,0.24,0.08]],
    };
    (sets[kind]||sets.chime).forEach(([freq,delay,vol])=>{
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.connect(gain);gain.connect(ctx.destination);
      osc.type="sine";osc.frequency.value=freq;
      gain.gain.setValueAtTime(0,ctx.currentTime+delay);
      gain.gain.linearRampToValueAtTime(vol,ctx.currentTime+delay+0.03);
      gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+delay+0.55);
      osc.start(ctx.currentTime+delay);osc.stop(ctx.currentTime+delay+0.6);
    });
  }catch(e){}
}

function fmtErr(v){
  try{
    if(!v) return "Unknown error.";
    if(typeof v==="string") return v;
    if(v.message){
      const m=String(v.message);
      if(m.includes("PR #15439")||m.includes("ref_aware_arbitrary_guides")){
        return t("err.h3.native.required");
      }
      return m;
    }
    if(v.error){
      if(typeof v.error==="string") return v.error;
      if(v.error.message){
        const m=String(v.error.message);
        if(m.includes("PR #15439")||m.includes("ref_aware_arbitrary_guides")){
          return t("err.h3.native.required");
        }
        return m;
      }
    }
    return JSON.stringify(v);
  }catch(e){ return String(v); }
}

function fmtDur(ms){
  const s=Math.round(Math.max(0,ms)/1000);
  const m=Math.floor(s/60), sec=s%60;
  if(m<1) return sec+"s";
  const h=Math.floor(m/60);
  if(h<1) return m+"m "+String(sec).padStart(2,"0")+"s";
  return h+"h "+String(m%60).padStart(2,"0")+"m "+String(sec).padStart(2,"0")+"s";
}

let _dim=null;
const showDimmer=()=>{ if(!_dim){_dim=mk("div",{position:"fixed",inset:"0",background:"rgba(0,0,0,.7)",zIndex:"999990",display:"none",pointerEvents:"none"});document.body.appendChild(_dim);} _dim.style.display="block"; };
const hideDimmer=()=>{ if(_dim)_dim.style.display="none"; };

function Toggle(labelKey,checked,onChange,infoKey){
  const wrap=mk("div",{display:"flex",alignItems:"center",justifyContent:"space-between",
    padding:"9px 0",borderBottom:`1px solid ${C.border}`});
  const lblRow=mk("div",{display:"flex",alignItems:"center",gap:"6px",minWidth:"0"});
  const lbl=mk("span",{fontSize:"12px",color:C.text});_tr(lbl,labelKey);
  lblRow.appendChild(lbl);
  if(infoKey) lblRow.appendChild(infoIcon(infoKey));
  const track=mk("div",{width:"34px",height:"18px",borderRadius:"9px",
    background:checked?C.lime:C.dim,cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:"0"});
  const thumb=mk("div",{position:"absolute",top:"2px",left:checked?"16px":"2px",
    width:"14px",height:"14px",borderRadius:"50%",
    background:checked?"#111":"#888",transition:"left .2s,background .2s"});
  track.appendChild(thumb);
  let val=checked;
  track.onclick=()=>{
    val=!val;track.style.background=val?C.lime:C.dim;
    thumb.style.left=val?"16px":"2px";thumb.style.background=val?"#111":"#888";onChange(val);
  };
  wrap.append(lblRow,track);
  const _setChecked=(v)=>{
    val=v;track.style.background=val?C.lime:C.dim;
    thumb.style.left=val?"16px":"2px";thumb.style.background=val?"#111":"#888";
  };
  return{el:wrap,get value(){return val;},_setChecked};
}

function DD(items,selected,onChange){
  let val=selected;
  const wrap=mk("div",{position:"relative",width:"100%",minWidth:"0",overflow:"hidden"});
  const trig=mk("div",{background:C.bg3,border:`1px solid ${C.border}`,borderRadius:"7px",
    padding:"0 8px",height:"28px",display:"flex",alignItems:"center",
    justifyContent:"space-between",cursor:"pointer",boxSizing:"border-box",
    transition:"border-color .15s",userSelect:"none",overflow:"hidden"});
  const trigTxt=mk("span",{fontSize:"11px",color:C.text,overflow:"hidden",
    textOverflow:"ellipsis",whiteSpace:"nowrap",flex:"1",minWidth:"0"});
  tx(trigTxt,val); trigTxt.style.color=val?C.lime:C.muted;
  const arr=mk("span",{fontSize:"8px",color:C.muted,marginLeft:"5px",flexShrink:"0",transition:"transform .18s"});
  tx(arr,"v");
  trig.append(trigTxt,arr);
  const panel=mk("div",{display:"none",position:"fixed",background:C.bg1,
    border:`1px solid ${C.borderH}`,borderRadius:"8px",zIndex:"999999",
    flexDirection:"column",boxShadow:"0 8px 28px rgba(0,0,0,.9)",
    overflow:"hidden",minWidth:"140px",maxWidth:"400px"});
  const srch=mk("input",{background:C.bg2,border:"none",borderBottom:`1px solid ${C.border}`,
      padding:"7px 10px",color:C.text,fontSize:"11px",outline:"none",
      width:"100%",boxSizing:"border-box"},{type:"text",placeholder:"Type to filter..."});
  const list=mk("div",{overflowY:"auto",maxHeight:"200px"});
  const _norm=(s)=>(s||"").replace(/\\/g,"/").toLowerCase();
  const render=q=>{
    list.innerHTML="";
    items.filter(i=>!q||i.toLowerCase().includes(q.toLowerCase())).forEach(item=>{
      const isSel=_norm(item)===_norm(val);
      const r=mk("div",{padding:"7px 12px",fontSize:"11px",cursor:"pointer",
        color:isSel?C.lime:C.text,background:isSel?C.bg2:"transparent",
        whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",transition:"background .1s"});
      tx(r,item);
      r.onmouseenter=()=>r.style.background=C.bg3;
      r.onmouseleave=()=>r.style.background=_norm(item)===_norm(val)?C.bg2:"transparent";
      r.onclick=()=>{val=item;tx(trigTxt,item);trigTxt.style.color=item?C.lime:C.muted;close();onChange(item);};
      list.appendChild(r);
    });
  };
  const reposition=()=>{
    const rect=trig.getBoundingClientRect();
    panel.style.left=rect.left+"px";
    panel.style.width=Math.max(rect.width,140)+"px";
    const ph=Math.min(items.length*28+44,220);
    panel.style.top=(rect.top-ph-4>8?rect.top-ph-4:rect.bottom+4)+"px";
  };
  const open=()=>{
    document.body.appendChild(panel);panel.style.display="flex";
    reposition();arr.style.transform="rotate(180deg)";
    trig.style.borderColor=C.lime;showDimmer();
    srch.value="";srch.focus();render("");
  };
  const close=()=>{
    panel.style.display="none";
    if(panel.parentNode)panel.parentNode.removeChild(panel);
    arr.style.transform="";trig.style.borderColor=C.border;hideDimmer();
  };
  srch.oninput=()=>render(srch.value);
  trig.onclick=e=>{e.stopPropagation();panel.style.display==="flex"?close():open();};
  document.addEventListener("click",e=>{if(!wrap.contains(e.target)&&!panel.contains(e.target))close();});
  trig.onmouseenter=()=>{if(panel.style.display!=="flex")trig.style.background=C.bg2;};
  trig.onmouseleave=()=>{if(panel.style.display!=="flex")trig.style.background=C.bg3;};
  panel.appendChild(srch);
  panel.appendChild(list);
  wrap.appendChild(trig);
  render("");
  return{
    el:wrap,get value(){return val;},
    set(v){val=v;tx(trigTxt,v);trigTxt.style.color=v?C.lime:C.muted;render("");},
    updateItems(ni){items=ni;if(!ni.some(i=>_norm(i)===_norm(val))){val=ni[0]||val;tx(trigTxt,val);trigTxt.style.color=val?C.lime:C.muted;onChange(val);}render(srch.value||"");},
  };
}

function NI(_label,val,min,max,_step,onChange,width="72px"){
  const wrap=mk("div",{
    width,height:"28px",background:C.bg2,border:`1px solid ${C.border}`,
    borderRadius:"6px",boxSizing:"border-box",display:"flex",alignItems:"center",
    padding:"0 7px",transition:"border-color .15s",overflow:"hidden",
  });
  const inp=mk("input",{
    flex:"1 1 0",minWidth:"0",background:"transparent",border:"none",outline:"none",
    color:C.text,fontSize:"11px",padding:"0",textAlign:"left",
  },{type:"number",min:String(min),max:String(max),value:String(val),step:String(_step||1)});
  inp.oninput=()=>{ const v=Math.max(min,Math.min(max,parseFloat(inp.value)||min)); onChange(v); };
  inp.onfocus=()=>{ inp.select(); wrap.style.borderColor=C.lime; };
  inp.onblur=()=>{ inp.value=String(Math.max(min,Math.min(max,parseFloat(inp.value)||min))); wrap.style.borderColor=C.border; };
  inp.addEventListener("wheel",e=>{
    if(document.activeElement===inp){ e.stopPropagation(); }
    else { inp.blur(); e.preventDefault(); }
  },{passive:false});
  wrap.appendChild(inp);
  wrap.onclick=()=>inp.focus();
  wrap._inp=inp;
  wrap.setVal=(v)=>{inp.value=String(v);};
  Object.defineProperty(wrap,"numVal",{get(){return parseFloat(inp.value)||min;}});
  return wrap;
}

function mkRmBtn(){
  const b=mk("button",{
    position:"absolute",top:"4px",right:"4px",width:"18px",height:"18px",
    borderRadius:"50%",background:"rgba(0,0,0,.85)",border:`1px solid ${C.border}`,
    color:"rgba(255,255,255,.7)",fontSize:"9px",cursor:"pointer",display:"none",
    alignItems:"center",justifyContent:"center",padding:"0",
    transition:"background .15s, color .15s, border-color .15s",lineHeight:"1",zIndex:"2",
  });
  tx(b,"x");
  b.onmouseenter=()=>{ b.style.borderColor=C.lime; b.style.color=C.lime; };
  b.onmouseleave=()=>{ b.style.borderColor=C.border; b.style.color="rgba(255,255,255,.7)"; };
  return b;
}

function ImgSlot(optional,onFile){
  const wrap=mk("div",{
    width:"72px",height:"72px",borderRadius:"12px",
    border:`1.5px dashed ${C.border}`,background:C.bg2,
    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
    cursor:"pointer",position:"relative",
    transition:"border-color .18s, background .18s",
    overflow:"hidden",flexShrink:"0",boxSizing:"border-box",
  });
  const icoWrap=mk("div",{
    position:"absolute",inset:"0",
    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
    gap:"5px",pointerEvents:"none",
  });
  const ico=document.createElementNS("http://www.w3.org/2000/svg","svg");
  ico.setAttribute("viewBox","0 0 24 24");ico.setAttribute("width","22");ico.setAttribute("height","22");
  ico.setAttribute("fill","none");ico.setAttribute("stroke","currentColor");
  ico.setAttribute("stroke-width","1.4");ico.setAttribute("stroke-linecap","round");ico.setAttribute("stroke-linejoin","round");
  ico.style.color=C.muted;ico.style.transition="color .18s";ico.style.pointerEvents="none";
  ico.innerHTML=`<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>`;
  const lbl=mk("div",{fontSize:"8px",color:C.muted,pointerEvents:"none",letterSpacing:".04em",fontWeight:"600",transition:"color .18s"});
  _tr(lbl,"ui.add.image");
  if(optional){
    const optPill=mk("div",{fontSize:"6px",color:C.muted,letterSpacing:".06em",fontWeight:"700",
      border:`1px solid ${C.border}`,borderRadius:"20px",padding:"1px 5px",pointerEvents:"none",
      textTransform:"uppercase",background:"transparent",lineHeight:"1.7"});
    _tr(optPill,"ui.optional");icoWrap.append(ico,lbl,optPill);
  } else { icoWrap.append(ico,lbl); }
  const prevEl=mk("img",{
    position:"absolute",inset:"0",width:"100%",height:"100%",
    objectFit:"cover",display:"none",borderRadius:"11px",
  });
  const rm=mkRmBtn();
  const inp=mk("input",{display:"none"},{type:"file",accept:"image/*"});
  wrap.append(icoWrap,prevEl,rm,inp);
  wrap.onmouseenter=()=>{wrap.style.borderColor=C.lime;};
  wrap.onmouseleave=()=>{wrap.style.borderColor=C.border;};
  wrap.onclick=()=>inp.click();
  let _dragDepth=0;
  wrap.addEventListener("dragenter",e=>{e.preventDefault();e.stopPropagation();_dragDepth++;wrap.style.borderColor=C.lime;wrap.style.background=C.bg1;});
  wrap.addEventListener("dragover",e=>{e.preventDefault();e.stopPropagation();});
  wrap.addEventListener("dragleave",()=>{ _dragDepth--;if(_dragDepth<=0){_dragDepth=0;wrap.style.borderColor=C.border;wrap.style.background=C.bg2;} });
  wrap.addEventListener("drop",e=>{
    e.preventDefault();e.stopPropagation();_dragDepth=0;wrap.style.borderColor=C.border;wrap.style.background=C.bg2;
    const f=e.dataTransfer.files[0];if(f&&f.type.startsWith("image/"))_load(f);
  });
  let _currentName=null;
  const _showLoaded=(src,fname)=>{
    prevEl.src=src;prevEl.style.display="block";
    icoWrap.style.display="none";rm.style.display="flex";
    wrap.style.borderColor=C.lime;
  };
  const _load=async(file)=>{
    const objUrl=URL.createObjectURL(file);
    _showLoaded(objUrl,file.name);
    const fd=new FormData();fd.append("image",file);fd.append("overwrite","true");
    try{
      const r=await api.fetchApi("/upload/image",{method:"POST",body:fd});
      const d=await r.json();_currentName=d.name||file.name;
      onFile(_currentName);
    }catch(err){console.warn("[H3One] upload:",err);_currentName=file.name;onFile(_currentName);}
  };
  inp.onchange=()=>{if(inp.files[0])_load(inp.files[0]);};
  rm.onclick=e=>{
    e.stopPropagation();
    prevEl.src="";prevEl.style.display="none";
    rm.style.display="none";icoWrap.style.display="flex";
    wrap.style.borderColor=C.border;inp.value="";_currentName=null;onFile(null);
  };
  const _restorePreview=(name)=>{
    if(!name) return;
    const src=api.apiURL(`/view?filename=${encodeURIComponent(name)}&type=input&subfolder=`);
    _currentName=name;
    _showLoaded(src,name);
  };
  return{el:wrap,get name(){return _currentName;},loadFile:(file)=>_load(file),_restorePreview};
}

function MediaSlot(type,onFile){
  const acceptMap={video:"video/*",audio:"audio/*"};
  const icons={
    video:`<rect x="2" y="2" width="20" height="20" rx="2.5"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/>`,
    audio:`<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>`,
  };
  const labels={video:"ui.add.video",audio:"ui.add.audio"};
  const wrap=mk("div",{
    width:"72px",height:"72px",borderRadius:"12px",
    border:`1.5px dashed ${C.border}`,background:C.bg2,
    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
    cursor:"pointer",position:"relative",
    transition:"border-color .18s, background .18s",
    overflow:"hidden",flexShrink:"0",boxSizing:"border-box",
  });
  const icoWrap=mk("div",{position:"absolute",inset:"0",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"5px",pointerEvents:"none"});
  const ico=document.createElementNS("http://www.w3.org/2000/svg","svg");
  ico.setAttribute("viewBox","0 0 24 24");ico.setAttribute("width","22");ico.setAttribute("height","22");
  ico.setAttribute("fill","none");ico.setAttribute("stroke","currentColor");
  ico.setAttribute("stroke-width","1.4");ico.setAttribute("stroke-linecap","round");ico.setAttribute("stroke-linejoin","round");
  ico.style.color=C.muted;ico.style.transition="color .18s";ico.style.pointerEvents="none";
  ico.innerHTML=icons[type];
  const lbl=mk("div",{fontSize:"8px",color:C.muted,pointerEvents:"none",letterSpacing:".04em",fontWeight:"600",transition:"color .18s"});
  _tr(lbl,labels[type]);
  icoWrap.append(ico,lbl);
  const videoThumb = type==="video" ? mk("video",{
    position:"absolute",inset:"0",width:"100%",height:"100%",
    objectFit:"cover",display:"none",borderRadius:"11px",pointerEvents:"none",
  }) : null;
  if(videoThumb){ videoThumb.muted=_videoMuted; videoThumb.preload="metadata"; }
  const audioGlow = type==="audio" ? mk("div",{
    position:"absolute",inset:"0",display:"none",
    flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none",
  }) : null;
  if(audioGlow){
    const glowSvg=document.createElementNS("http://www.w3.org/2000/svg","svg");
    glowSvg.setAttribute("viewBox","0 0 24 24");glowSvg.setAttribute("width","28");glowSvg.setAttribute("height","28");
        glowSvg.setAttribute("fill","none");glowSvg.style.stroke=C.lime;glowSvg.setAttribute("stroke-width","1.5");
    glowSvg.setAttribute("stroke-linecap","round");    glowSvg.style.filter=`drop-shadow(0 0 6px rgba(var(--h3accent-rgb),.66))`;
    glowSvg.innerHTML=`<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>`;
    audioGlow.appendChild(glowSvg);
  }
  const loadedName=mk("div",{
    position:"absolute",bottom:"0",left:"0",right:"0",
    fontSize:"6.5px",color:"rgba(255,255,255,.85)",textAlign:"center",
    padding:"3px 4px",background:"rgba(0,0,0,.6)",
    wordBreak:"break-all",lineHeight:"1.3",display:"none",
  });
  const rm=mkRmBtn();
  const playBtn = type==="audio" ? mk("button",{
    position:"absolute",top:"4px",left:"4px",width:"20px",height:"20px",
    borderRadius:"50%",background:"rgba(0,0,0,.85)",border:`1px solid ${C.border}`,
    color:"rgba(255,255,255,.8)",cursor:"pointer",display:"none",
    alignItems:"center",justifyContent:"center",padding:"0",zIndex:"2",
    transition:"border-color .15s, color .15s",lineHeight:"1",fontSize:"8px",
  }) : null;
  if(playBtn){
    tx(playBtn,"▶");
    playBtn.title="Play audio preview";
    playBtn.onmouseenter=()=>{playBtn.style.borderColor=C.lime;playBtn.style.color=C.lime;};
    playBtn.onmouseleave=()=>{playBtn.style.borderColor=C.border;playBtn.style.color="rgba(255,255,255,.8)";};
  }
  const spkBtn = type==="video" ? mk("button",{
    position:"absolute",top:"4px",left:"4px",width:"20px",height:"20px",
    borderRadius:"50%",background:"rgba(0,0,0,.85)",border:`1px solid ${C.border}`,
    color:"rgba(255,255,255,.8)",cursor:"pointer",display:"none",
    alignItems:"center",justifyContent:"center",padding:"0",zIndex:"2",
    transition:"border-color .15s, color .15s",lineHeight:"1",
  }) : null;
  if(spkBtn){
    const spkSvg=document.createElementNS("http://www.w3.org/2000/svg","svg");
    spkSvg.setAttribute("viewBox","0 0 24 24");spkSvg.setAttribute("width","12");spkSvg.setAttribute("height","12");
    spkBtn.appendChild(spkSvg);
    spkBtn.title="Video preview sound: click to mute/unmute (applies everywhere)";
    const _applyMute=(m)=>{
      if(videoThumb) videoThumb.muted=m;
      spkSvg.innerHTML=m?SPEAKER_MUTED_SVG:SPEAKER_SVG;
      spkBtn.style.color=m?"#ff8080":C.lime;
    };
    _videoMuteListeners.push(_applyMute);
    _applyMute(_videoMuted);
    spkBtn.onmouseenter=()=>{spkBtn.style.borderColor=C.lime;};
    spkBtn.onmouseleave=()=>{spkBtn.style.borderColor=C.border;};
    spkBtn.onclick=(e)=>{ e.stopPropagation(); setVideoMuted(!_videoMuted); };
  }
  let _audioEl=null;
  const fileInp=mk("input",{display:"none"},{type:"file",accept:acceptMap[type]});
  if(videoThumb) wrap.append(icoWrap,videoThumb,loadedName,spkBtn,rm,fileInp);
  else wrap.append(icoWrap,audioGlow,loadedName,playBtn,rm,fileInp);
  wrap.onmouseenter=()=>{
    wrap.style.borderColor=C.lime;
    if(wrap._hasFile&&videoThumb&&videoThumb.src){try{videoThumb.play().catch(()=>{});}catch(e){}}
  };
  wrap.onmouseleave=()=>{
    wrap.style.borderColor=C.border;
    if(videoThumb){try{videoThumb.pause();videoThumb.currentTime=0;}catch(e){}}
  };
  wrap.onclick=e=>{
    if(e.target===rm||rm.contains(e.target)) return;
    fileInp.click();
  };
  let _dragDepth=0;
  wrap.addEventListener("dragenter",e=>{e.preventDefault();e.stopPropagation();_dragDepth++;wrap.style.borderColor=C.lime;});
  wrap.addEventListener("dragover",e=>{e.preventDefault();e.stopPropagation();});
  wrap.addEventListener("dragleave",()=>{ _dragDepth--;if(_dragDepth<=0){_dragDepth=0;wrap.style.borderColor=C.border;} });
  wrap.addEventListener("drop",e=>{ e.preventDefault();e.stopPropagation();_dragDepth=0;const f=e.dataTransfer.files[0];if(f)_load(f); });
  wrap._hasFile=false;wrap._filename=null;
  let _objUrl=null;
  const _showLoaded=(name,objectUrl)=>{
    if(!name) return;
    icoWrap.style.display="none";
    tx(loadedName,name);loadedName.style.display="block";
    rm.style.display="flex";wrap.style.borderColor=C.lime;wrap._hasFile=true;wrap._filename=name;
    if(videoThumb&&objectUrl){
      videoThumb.src=objectUrl;videoThumb.style.display="block";videoThumb.load();
      videoThumb.addEventListener("loadedmetadata",()=>{videoThumb.currentTime=0.01;},{once:true});
    }
    if(audioGlow) audioGlow.style.display="flex";
    if(playBtn) playBtn.style.display="flex";
    if(spkBtn) spkBtn.style.display="flex";
  };
  const _stopAudio=()=>{
    if(_audioEl){
      try{_audioEl.pause();_audioEl.src="";}catch(e){}
      _audioEl=null;
    }
    if(playBtn){tx(playBtn,"▶");}
  };
  if(playBtn){
    playBtn.onclick=e=>{
      e.stopPropagation();
      if(!wrap._filename) return;
      if(_audioEl&&!_audioEl.paused){ _audioEl.pause(); tx(playBtn,"▶"); return; }
      if(!_audioEl){
        const src=api.apiURL(`/view?filename=${encodeURIComponent(wrap._filename)}&type=input&subfolder=`);
        _audioEl=new Audio(src);
        _audioEl.addEventListener("ended",()=>tx(playBtn,"▶"));
        _audioEl.addEventListener("error",()=>tx(playBtn,"▶"));
      }
      _audioEl.play().then(()=>tx(playBtn,"⏸")).catch(()=>{});
    };
  }
  const _clearLoaded=()=>{
    icoWrap.style.display="flex";loadedName.style.display="none";rm.style.display="none";
    wrap.style.borderColor=C.border;wrap.style.background=C.bg2;
    wrap._hasFile=false;wrap._filename=null;
    if(videoThumb){videoThumb.style.display="none";videoThumb.src="";}
    if(audioGlow) audioGlow.style.display="none";
    if(playBtn) playBtn.style.display="none";
    if(spkBtn) spkBtn.style.display="none";
    _stopAudio();
    if(_objUrl){URL.revokeObjectURL(_objUrl);_objUrl=null;}
    onFile(null);
  };
  const _restorePreview=(name)=>{
    if(!name) return;
    wrap._filename=name;
    tx(loadedName,name);loadedName.style.display="block";
    icoWrap.style.display="none";rm.style.display="flex";
    wrap.style.borderColor=C.lime;wrap._hasFile=true;
    if(videoThumb){
      const src=api.apiURL(`/view?filename=${encodeURIComponent(name)}&type=input&subfolder=`);
      videoThumb.src=src;videoThumb.style.display="block";videoThumb.load();
      videoThumb.addEventListener("loadedmetadata",()=>{videoThumb.currentTime=0.01;},{once:true});
    }
    if(audioGlow) audioGlow.style.display="flex";
    if(playBtn) playBtn.style.display="flex";
    if(spkBtn) spkBtn.style.display="flex";
  };
  const _load=async(file)=>{
    if(_objUrl){URL.revokeObjectURL(_objUrl);_objUrl=null;}
    _objUrl=URL.createObjectURL(file);
    const fd=new FormData();fd.append("file",file,file.name);
    try{
      const res=await fetch("/h3one/upload",{method:"POST",body:fd});
      const data=await res.json();
      const fname=data&&(data.filename||data.name);
      if(!data.ok||!fname){console.error("[H3One] upload failed:",data);return;}
      _showLoaded(fname,_objUrl);onFile(fname);
    }catch(e){console.error("[H3One] upload error:",e);}
  };
  fileInp.onchange=()=>{ const f=fileInp.files[0];if(f)_load(f);fileInp.value=""; };
  rm.onclick=e=>{ e.stopPropagation();_clearLoaded(); };
  wrap.clear=_clearLoaded;
  wrap._restorePreview=_restorePreview;
  return wrap;
}

function loadState(){ try{return JSON.parse(localStorage.getItem(LS_KEY)||"{}");}catch(e){return{};} }
function saveState(s){ try{localStorage.setItem(LS_KEY,JSON.stringify(s));}catch(e){} }

// -- Active refs + global API events ------------------------------------------
let _activeNode=null;
let _activeShowOutput=null;
let _activeResetBtn=null;
let _activeShowError=null;
let _activeSetStage=null;
let _activePromptId=null;
let _activeShowTime=null;
let _activeGenStartTs=0;
let _activeShowLatest=null;
let _activeShownFiles=[];
let _batchIds=[];
let _batchDone=0;
let _listenersRegistered=false;
let _chainMode=false;
let _chainClipOutputs=[];
let _chainFinalOutput=null;
let _chainSession="";
let _chainFinalizing=false;
let _activeRenderChainClips=null;

app.registerExtension({
  name:"OneNode.MinimaxH3",
  async beforeRegisterNodeDef(nodeType,nodeData){
    if(nodeData.name!=="H3OneNode") return;

    nodeType.prototype.onNodeCreated=function(){
      try{
        this.color=C.bg0;this.bgcolor=C.bg0;this.resizable=false;
        if(this.widgets)this.widgets=[];
        this._buildUI();
      }catch(e){
        console.error("[OneNode.MinimaxH3] onNodeCreated failed:",e);
        console.error(e&&e.stack?e.stack:e);
        try{
          const errRoot=mk("div",{width:"100%",height:"560px",background:C.bg0,color:C.err,
            fontSize:"11px",padding:"16px",boxSizing:"border-box",overflow:"auto",
            fontFamily:"monospace",whiteSpace:"pre-wrap",lineHeight:"1.6"});
          tx(errRoot,"ALL in ONE MiniMaxH3 - UI build error:\n\n"+String(e&&e.stack?e.stack:e));
          this.addDOMWidget("h3_ui","div",errRoot,{
            getValue(){return null;},setValue(){},serialize:false,
            canvasOnly:!_isVueNodes(),
            computeSize(){const sh=(typeof LiteGraph!=="undefined"&&LiteGraph.NODE_SLOT_HEIGHT)||20;return[NODE_W,NODE_H+sh*3];},
          });
          {const sh=(typeof LiteGraph!=="undefined"&&LiteGraph.NODE_SLOT_HEIGHT)||20;this.setSize([NODE_W,NODE_H+sh*3]);}
        }catch(e2){ console.error("[OneNode.MinimaxH3] error display failed:",e2); }
      }
    };

    nodeType.prototype.onResize=function(){
      const slotH=(typeof LiteGraph!=="undefined"&&LiteGraph.NODE_SLOT_HEIGHT)||20;
      this.size=[NODE_W,NODE_H+slotH*3];
    };

    nodeType.prototype._buildUI=function(){
      const self=this;
      const saved=loadState();

      if(!self._h3_S){
        self._h3_S={
          mode:            saved.mode==="audio_drive"?"chain":(saved.mode||"t2v"),
          prompt:          saved.prompt!==undefined?saved.prompt:"",
          resolution:      saved.resolution!==undefined?saved.resolution:"960x544 (0.5MP Balanced)",
          aspect:          ASPECT_RATIOS.includes(saved.aspect)?saved.aspect:"auto",
          duration:        saved.duration!==undefined?saved.duration:5,
          steps:           (saved.steps&&saved.steps!==30)?saved.steps:20,
          quality:         saved.quality||"balanced",
          samplerName:     saved.samplerName||"res_multistep",
          schedulerName:   saved.schedulerName||"simple",
          seed:            (typeof saved.seed==="number")?saved.seed:0,
          randomizeSeed:   saved.randomizeSeed!==undefined?saved.randomizeSeed:true,
          batch:           saved.batch||1,
          loras:          (()=>{ const arr=Array.isArray(saved.loras)?saved.loras:[]; const named=arr.filter(l=>l&&l.name); return named.concat([{name:"",strength:1}]); })(),
          firstFrame:      saved.firstFrame||null,
          lastFrame:       saved.lastFrame||null,
          refImages:       Array.isArray(saved.refImages)?saved.refImages:[],
          refVideos:       (Array.isArray(saved.refVideos)?saved.refVideos:[]).map(v=>(typeof v==="string")?{name:v,useAudio:false}:{name:(v&&v.name)||"",useAudio:!!(v&&v.useAudio)}),
          refAudios:       Array.isArray(saved.refAudios)?saved.refAudios:[],
          audioFile:       saved.audioFile||null,
          audioLock:       saved.audioLock!==undefined?saved.audioLock:false,
          lang:            saved.lang||_uiLang,
          extendVideo:     saved.extendVideo||null,
          kf:              (Array.isArray(saved.kf)&&saved.kf.length)?saved.kf.map(k=>({img:k.img||null,pos:k.pos||0})):[{img:null,pos:1},{img:null,pos:62},{img:null,pos:124}],
          chainClips:      Array.isArray(saved.chainClips)&&saved.chainClips.length? saved.chainClips : [{prompt:"",duration:5},{prompt:"",duration:5}],
          models:          Object.assign({}, DEFAULT_MODELS, saved.models||{}),
          speedLora:       saved.speedLora||"",
          audioOn:         saved.audioOn!==undefined?saved.audioOn:true,
          soundEnabled:    saved.soundEnabled!==undefined?saved.soundEnabled:true,
          sound:           saved.sound||"chime",
          accent:          (saved.accent&&saved.accent!=="#f0ff41"&&saved.accent.toLowerCase()!=="#00e5ff")?saved.accent:ACCENT_DEFAULT,
          mcLength:        saved.mcLength!==undefined?saved.mcLength:22,
          sigmaRefine:     (saved.sigmaRefine!==undefined)?Math.max(0,Math.min(15,Math.round(Number(saved.sigmaRefine)||0))):SIGMA_REFINE_DEFAULTS.extra_steps,
          sigmaRefineCfg:  Object.assign({}, SIGMA_REFINE_DEFAULTS, (saved.sigmaRefineCfg&&typeof saved.sigmaRefineCfg==="object")?saved.sigmaRefineCfg:{}),
          dualPass:        saved.dualPass!==undefined?!!saved.dualPass:DUAL_SAMPLING_DEFAULTS.enabled,
          // Second-pass parameters are automatic (fixed defaults); the UI only
          // exposes the enable toggle.
          dualSteps:       DUAL_SAMPLING_DEFAULTS.steps,
          dualDenoise:     DUAL_SAMPLING_DEFAULTS.denoise,
          customW:         saved.customW||960,
          customH:         saved.customH||544,
          latentUpscale:   (saved.latentUpscale&&typeof saved.latentUpscale==="object")
            ? {
                enabled: !!saved.latentUpscale.enabled,
                model: saved.latentUpscale.model || (saved.models && saved.models.latentUpscaleModel) || "none",
                variant: saved.latentUpscale.variant === "3d" ? "3d" : "2d",
                scale: Number(saved.latentUpscale.scale) || 2.0,
                device: saved.latentUpscale.device === "cpu" ? "cpu" : "cuda",
                precision: ["fp32","fp16","bf16"].includes(saved.latentUpscale.precision)
                  ? saved.latentUpscale.precision : "fp32",
              }
            : {enabled:false, model:(saved&&saved.models&&saved.models.latentUpscaleModel)||"none", variant:"2d", scale:2.0, device:"cuda", precision:"fp32"},
          modeSettings:    (saved.modeSettings&&typeof saved.modeSettings==="object")?saved.modeSettings:{},
          autoSave:        saved.autoSave!==undefined?saved.autoSave:true,
          generating:      false,
          playOnFinish:    saved.playOnFinish!==undefined?saved.playOnFinish:true,
          folded:          (saved.folded&&typeof saved.folded==="object")?saved.folded:{},
        };
      }
      const S=self._h3_S;
      const _upscaleOn=()=>!!(S.latentUpscale&&S.latentUpscale.enabled&&S.latentUpscale.model&&S.latentUpscale.model!=="none"&&!String(S.latentUpscale.model).startsWith("("));
      if(S.audioLock){
        const af=_validAudioName(S.audioFile);
        if(!af && Array.isArray(S.refAudios)){
          const cand=S.refAudios.find(n=>_validAudioName(n));
          if(cand) S.audioFile=_validAudioName(cand);
          S.refAudios=[];
        } else {
          S.audioFile=af;
        }
      }
      _uiLang = S.lang === "zh" ? "zh" : "en";
      const _hexToRgb=(hex)=>{
        const h=String(hex||"").replace("#","");
        if(h.length===3) return h.split("").map(x=>parseInt(x+x,16)).join(",");
        const n=parseInt(h.slice(0,6),16);
        return isNaN(n)?"192,169,150":`${(n>>16)&255},${(n>>8)&255},${n&255}`;
      };
      let _updRecipeFn=null;
      const _applyAccent=(hex)=>{
        S.accent=hex;persist();
        document.documentElement.style.setProperty("--h3accent",hex);
        document.documentElement.style.setProperty("--h3accent-rgb",_hexToRgb(hex));
      };
      _applyAccent(S.accent||ACCENT_DEFAULT);

      function persist(){
        // Keep the per-mode snapshot current on EVERY change, so steps/duration/
        // quality/resolution/loras survive workflow-tab switches (they used to be
        // captured only when switching mode tabs, so a stale snapshot overwrote
        // the just-changed value on rebuild).
        S.modeSettings[S.mode]={prompt:S.prompt,steps:S.steps,quality:S.quality,resolution:S.resolution,duration:S.duration,loras:JSON.parse(JSON.stringify(S.loras||[]))};
        if(_updRecipeFn){ try{ _updRecipeFn(); }catch(e){} }
        saveState({
          mode:S.mode,prompt:S.prompt,resolution:S.resolution,aspect:S.aspect,duration:S.duration,
          steps:S.steps,quality:S.quality,samplerName:S.samplerName,schedulerName:S.schedulerName,randomizeSeed:S.randomizeSeed,seed:S.seed,batch:S.batch,
          loras:S.loras,chainClips:S.chainClips.map(c=>({prompt:c.prompt,duration:c.duration})),
          firstFrame:S.firstFrame,lastFrame:S.lastFrame,
          refImages:S.refImages,refVideos:S.refVideos,refAudios:S.refAudios,
          audioFile:S.audioFile,extendVideo:S.extendVideo,
          audioLock:S.audioLock,lang:S.lang,
          kf:(S.kf||[]).map(k=>({img:k.img||null,pos:k.pos||0})),
          models:S.models,speedLora:S.speedLora,audioOn:S.audioOn,
          soundEnabled:S.soundEnabled,sound:S.sound,accent:S.accent,mcLength:S.mcLength,
          sigmaRefine:S.sigmaRefine,sigmaRefineCfg:S.sigmaRefineCfg,
          dualPass:S.dualPass,
          latentUpscale:S.latentUpscale,
          modeSettings:S.modeSettings,
          autoSave:S.autoSave,customW:S.customW,customH:S.customH,
          playOnFinish:S.playOnFinish,folded:S.folded,
        });
      }

      const _foldState=S.folded||{};
      function _applyFold(key,hdr,body,chev){
        // Capture the body's inline display (flex/column etc.) BEFORE clearing it:
        // setting display="" on unfold used to wipe mk()'s display:flex, which
        // silently killed the container's gap (children then touched each other).
        const _dflt=body.style.display&&body.style.display!=="none"?body.style.display:"block";
        const _apply=f=>{ body.style.display=f?"none":_dflt; };
        _apply(!!_foldState[key]);
        tx(chev,_foldState[key]?"▸":"▾");
        hdr.onclick=()=>{
          _foldState[key]=!_foldState[key];
          _apply(_foldState[key]);
          tx(chev,_foldState[key]?"▸":"▾");
          persist();
        };
      }

      if(!document.getElementById("h3one-styles")){
        const styleEl=document.createElement("style");
        styleEl.id="h3one-styles";
        styleEl.textContent=`
          @keyframes h3-gradient { 0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%} }
          @keyframes h3-light-sweep { 0%{left:-80%;opacity:0}15%{opacity:1}85%{opacity:1}100%{left:120%;opacity:0} }
          @keyframes h3-pulse { 50%{opacity:.35;} }
          .h3one-root ~ .node_title, .h3one-root + .node_title { display:none !important; }
          input[type=number]::-webkit-inner-spin-button,
          input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
          input[type=number] { -moz-appearance:textfield; }
          .h3one-root{
            --h3-panel:#101010; --h3-card:#161616; --h3-field:#1d1d1d; --h3-hover:#242424;
            --h3-line:#2c2c2c; --h3-line2:#3d3d3d;
            --h3-tx:#f2f2f2; --h3-tx2:#9a9a9a; --h3-tx3:#5c5c5c;
            --h3-ok:#7ed491; --h3-warn:#ffc266; --h3-err:#ff8080;
          }
          /* nav row: compact mode chips + icon actions */
          .h3-nav{display:flex;align-items:center;gap:6px;padding:2px 2px 0 2px;}
          .h3-modes{display:flex;gap:3px;flex:1;min-width:0;flex-wrap:wrap;}
          .h3-mode{display:inline-flex;align-items:center;gap:4px;padding:5px 7px;background:var(--h3-card);border:1px solid var(--h3-line);border-radius:8px;cursor:pointer;color:var(--h3-tx2);font-family:inherit;transition:background-color .15s,border-color .15s,color .15s;}
          .h3-mode svg{width:12px;height:12px;flex-shrink:0;}
          .h3-mode span{font-size:8.5px;font-weight:700;letter-spacing:.02em;white-space:nowrap;}
          .h3-mode:hover{border-color:var(--h3-line2);color:var(--h3-tx);}
          .h3-mode:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(192,169,150,.35);}
          .h3-mode.on{background:linear-gradient(150deg,var(--h3accent),#e8d5c0);border-color:transparent;color:#141414;}
          .h3-mode.on span{color:#141414;}
          .h3-topbtn{width:26px;height:26px;border-radius:8px;background:transparent;border:1px solid transparent;color:var(--h3-tx2);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;transition:border-color .15s,color .15s,background-color .15s;flex-shrink:0;}
          .h3-topbtn:hover{background:var(--h3-card);border-color:var(--h3-line2);color:var(--h3-tx);}
          .h3-topbtn:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(192,169,150,.35);}
          .h3-topbtn svg{width:13px;height:13px;}
          /* cards */
          .h3-card{background:var(--h3-card);border:1px solid var(--h3-line);border-radius:13px;padding:11px 12px;display:flex;flex-direction:column;gap:8px;}
          .h3-ctitle{font-size:12.5px;font-weight:700;color:var(--h3-tx);}
          .h3-cdesc{font-size:10px;color:var(--h3-tx2);line-height:1.5;}
          /* recipe line: pill chips in two visual groups (media | sampling) */
          .h3-recipe{display:flex;align-items:center;flex-wrap:wrap;gap:5px;font-variant-numeric:tabular-nums;}
          .h3-chip{display:inline-flex;align-items:center;gap:5px;background:var(--h3-field);border:1px solid var(--h3-line);border-radius:20px;padding:3px 9px;font-size:10px;line-height:1.4;flex-shrink:0;}
          .h3-chip .cl{font-size:8.5px;font-weight:700;letter-spacing:.04em;color:var(--h3-tx3);}
          .h3-chip .cv{font-weight:700;color:var(--h3-tx);}
          .h3-chip.media .cv{color:var(--h3accent);}
          .h3-gsep{width:1px;height:14px;background:var(--h3-line);margin:0 3px;align-self:center;flex-shrink:0;}
          /* ghost remove button (LoRA / keyframe / clip rows) */
          .h3-rmbtn{width:26px;height:26px;border-radius:9px;background:var(--h3-field);border:1px solid var(--h3-line);color:var(--h3-tx3);font-size:11px;font-weight:600;line-height:1;padding:0;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:border-color .15s,color .15s,background-color .15s;}
          .h3-rmbtn:hover{border-color:rgba(255,128,128,.55);color:var(--h3-err);background:rgba(255,128,128,.07);}
          .h3-rmbtn:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(255,128,128,.3);}
          /* raised action buttons (under the preview) */
          .h3-actbtn{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 10px;border-radius:8px;background:linear-gradient(180deg,#2b2b2b,#1e1e1e);border:1px solid var(--h3-line2);border-bottom-color:#141414;color:var(--h3-tx2);font-size:9.5px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;cursor:pointer;font-family:inherit;box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 1px 3px rgba(0,0,0,.45);transition:border-color .15s,color .15s,background .15s,box-shadow .15s,transform .1s;flex-shrink:0;}
          .h3-actbtn svg{width:11px;height:11px;flex-shrink:0;}
          .h3-actbtn:hover{border-color:var(--h3accent);color:var(--h3accent);background:linear-gradient(180deg,#313131,#232323);transform:translateY(-1px);box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 2px 6px rgba(0,0,0,.5);}
          .h3-actbtn:active{transform:translateY(0);background:linear-gradient(180deg,#1a1a1a,#212121);box-shadow:inset 0 1px 3px rgba(0,0,0,.5);}
          .h3-actbtn:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(192,169,150,.35);}
          .h3-actbtn.on{background:linear-gradient(150deg,var(--h3accent),#e8d5c0);border-color:transparent;border-bottom-color:rgba(0,0,0,.25);color:#141414;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 2px 8px rgba(192,169,150,.3);}
          .h3-actbtn.on:hover{color:#141414;filter:brightness(1.07);}
          .h3-actbtn.danger:hover{border-color:rgba(255,128,128,.55);color:var(--h3-err);}
          .h3-actbtn.warn{border-color:rgba(255,194,102,.4);}
          /* seed chip over the preview */
          .h3-seedchip{position:absolute;top:8px;right:8px;display:none;align-items:center;gap:7px;background:rgba(12,12,12,.82);backdrop-filter:blur(6px);border:1px solid var(--h3-line2);border-radius:9px;padding:4px 5px 4px 10px;z-index:4;cursor:default;box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 2px 8px rgba(0,0,0,.5);}
          .h3-seedchip .scl{font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--h3-tx3);}
          .h3-seedchip .scv{font-size:10px;font-weight:700;color:var(--h3accent);font-variant-numeric:tabular-nums;}
          .h3-seedbtn{display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 7px;border-radius:6px;background:linear-gradient(180deg,#2b2b2b,#1e1e1e);border:1px solid var(--h3-line2);border-bottom-color:#141414;color:var(--h3-tx2);font-size:8px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;font-family:inherit;box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 1px 2px rgba(0,0,0,.45);transition:border-color .15s,color .15s,background .15s,box-shadow .15s,transform .1s;flex-shrink:0;}
          .h3-seedbtn svg{width:9px;height:9px;flex-shrink:0;}
          .h3-seedbtn:hover{border-color:var(--h3accent);color:var(--h3accent);background:linear-gradient(180deg,#313131,#232323);transform:translateY(-1px);box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 2px 5px rgba(0,0,0,.5);}
          .h3-seedbtn:active{transform:translateY(0);box-shadow:inset 0 1px 3px rgba(0,0,0,.5);}
          .h3-seedbtn:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(192,169,150,.35);}
          .h3-seedbtn.ok{border-color:var(--h3-ok);color:var(--h3-ok);}
          .h3-seedbtn.err{border-color:var(--h3-err);color:var(--h3-err);}
          /* seed pill row (Tune card) */
          .h3-seedrow{display:flex;align-items:center;gap:8px;background:var(--h3-field);border:1px solid var(--h3-line);border-radius:10px;padding:7px 10px;}
          .h3-slbl{font-size:10px;font-weight:600;color:var(--h3-tx2);flex-shrink:0;}
          .h3-tgl{width:38px;height:21px;border-radius:11px;background:var(--h3-tx3);cursor:pointer;position:relative;transition:background-color .2s;flex-shrink:0;border:none;padding:0;}
          .h3-tgl .thumb{position:absolute;top:2px;left:2px;width:17px;height:17px;border-radius:50%;background:#cfcfcf;transition:left .2s,background-color .2s;}
          .h3-tgl.on{background:var(--h3accent);}
          .h3-tgl.on .thumb{left:19px;background:#141414;}
          .h3-tgl:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(192,169,150,.35);}
          @media (prefers-reduced-motion:reduce){ .h3-mode,.h3-topbtn,.h3-rmbtn,.h3-tgl,.h3-actbtn,.h3-seedbtn{transition:none;} }
        `;
        document.head.appendChild(styleEl);
      }

      const root=mk("div",{width:"100%",background:C.bg0,boxSizing:"border-box",
        fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        color:C.text,overflow:"hidden",position:"relative"});
      root.classList.add("h3one-root");

      const _syncNodeRadius=()=>{
        const wrapper=root.parentElement;
        if(!wrapper) return;
        const r=getComputedStyle(wrapper).borderRadius;
        root.style.borderRadius=(r&&r!=="0px")?r:"0px";
      };
      requestAnimationFrame(()=>{
        _syncNodeRadius();
        if(typeof ResizeObserver!=="undefined"){
          new ResizeObserver(_syncNodeRadius).observe(root.parentElement||root);
        }
      });

      const titleH=(typeof LiteGraph!=="undefined"&&LiteGraph.NODE_TITLE_HEIGHT)||30;
      const _slotH=(typeof LiteGraph!=="undefined"&&LiteGraph.NODE_SLOT_HEIGHT)||20;
      const _uiH=NODE_H-titleH-4;
      const scrollEl=mk("div",{width:"100%",height:_uiH+"px",overflowY:"hidden",overflowX:"hidden",boxSizing:"border-box",scrollbarWidth:"thin",scrollbarColor:`${C.border} transparent`});
      scrollEl.addEventListener("wheel",e=>{ if(document.activeElement&&(document.activeElement.tagName==="TEXTAREA"||document.activeElement.tagName==="INPUT")) return; e.stopPropagation(); },{passive:true});

      const pad=mk("div",{padding:"12px",display:"flex",flexDirection:"column",
        gap:"10px",boxSizing:"border-box",width:"100%",height:"100%"});

      const openOverlay=(el)=>{ el.style.display="flex";el.offsetHeight;el.style.opacity="1";el.style.transform="translateY(0)"; };
      const closeOverlayFade=(el)=>{ el.style.opacity="0";el.style.transform="translateY(6px)";setTimeout(()=>el.style.display="none",220); };

      // -- NAV ROW: compact mode chips + actions ------------------------------
      const topRight=mk("div",{display:"flex",gap:"4px",alignItems:"center",flexShrink:"0"});
      const MODE_ICONS={
        t2v:'<path d="M4 6h16M4 12h10M4 18h14"/>',
        i2v:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M6 17l4-4 3 3 2-2 3 3"/>',
        r2v:'<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13.5l9 5 9-5"/>',
        keyframes:'<path d="M12 4l7 8-7 8-7-8 7-8z"/>',
        extend:'<path d="M4 12h14M13 6l6 6-6 6"/>',
        chain:'<path d="M10.5 13.5a4 4 0 005.7 0l2.8-2.8a4 4 0 00-5.7-5.7l-1.4 1.4"/><path d="M13.5 10.5a4 4 0 00-5.7 0L5 13.3a4 4 0 005.7 5.7l1.4-1.4"/>',
      };
      const modesWrap=mk("div",{}, {className:"h3-modes"});
      const modeEls={};
      const _updateTabs=()=>{
        MODES.forEach(m=>{
          const el=modeEls[m.key];
          if(!el) return;
          el.classList.toggle("on",S.mode===m.key);
        });
      };
      MODES.forEach(m=>{
        const b=mk("button",{}, {type:"button",className:"h3-mode",title:MODE_HINTS[m.key]||"","aria-pressed":"false"});
        b.innerHTML=`<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${MODE_ICONS[m.key]}</svg>`;
        const sp=mk("span",{});_tr(sp,"mode.short."+m.key);b.appendChild(sp);
        attachTip(b,MODE_HINTS[m.key]||"");
        b.onclick=()=>{ _switchMode(m.key); };
        modeEls[m.key]=b;modesWrap.appendChild(b);
      });
      const navRow=mk("div",{}, {className:"h3-nav"});
      navRow.append(modesWrap,topRight);
      const mkTopBtn=(svgPath,labelKey,cb)=>{
        const b=mk("button",{}, {type:"button",className:"h3-topbtn"});
        _tr(b,labelKey,null,"title");
        b.setAttribute("aria-label",t(labelKey));
        b.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svgPath}</svg>`;
        attachTip(b,labelKey);
        b.onclick=cb;return b;
      };

      // -- SETTINGS OVERLAY --------------------------------------------------
      const settingsOverlay=mk("div",{
        position:"absolute",inset:"0",background:"#0a0a0a",
        display:"none",flexDirection:"column",padding:"16px",
        boxSizing:"border-box",zIndex:"50",borderRadius:"8px",overflowY:"auto",
        opacity:"0",transition:"opacity .22s ease, transform .22s ease",transform:"translateY(6px)",
      });
      const settHdr=mk("div",{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px",flexShrink:"0"});
      const settTitle=mk("div",{fontSize:"13px",fontWeight:"700",letterSpacing:".06em",textTransform:"uppercase",color:C.text});
      _tr(settTitle,"ui.settings");
      const settBtnRow=mk("div",{display:"flex",alignItems:"center",gap:"8px"});
      const settRefresh=mk("button",{background:"transparent",border:`1px solid ${C.border}`,borderRadius:"6px",padding:"4px 14px",fontSize:"11px",color:C.muted,cursor:"pointer",outline:"none"});
      _tr(settRefresh,"ui.refresh.models");
      settRefresh.onclick=()=>{ _loadModels().then(()=>tx(settRefresh,t("ui.refresh.models"))); };
      const settClose=mk("button",{background:"transparent",border:`1px solid #e05555`,borderRadius:"6px",padding:"4px 14px",fontSize:"11px",color:"#e05555",cursor:"pointer",outline:"none"});
      _tr(settClose,"ui.close");
      settClose.onclick=()=>closeOverlayFade(settingsOverlay);
      settBtnRow.append(settRefresh,settClose);
      settHdr.append(settTitle,settBtnRow);

      let _M={diffusion:[],text_encoders:[],vaes:[],loras:[]};
      const modelDDs={};
      const _mkModelRow=(key,label,items=[],onChange)=>{
        const w=mk("div",{marginBottom:"12px"});
        w.appendChild(cap(label));
        const dd=DD(items,S.models[key],v=>{S.models[key]=v;persist();onChange&&onChange(v);});
        w.appendChild(dd.el);
        modelDDs[key]=dd;
        return w;
      };
      const unetT2VRow=_mkModelRow("unetT2V","ui.model.diff.t2v");
      const unetR2VRow=_mkModelRow("unetR2V","ui.model.diff.r2v");
      const clipRow=_mkModelRow("clip","ui.model.clip");
      const vaeVRow=_mkModelRow("vaeVideo","ui.model.vae.video");
      const vaeARow=_mkModelRow("vaeAudio","ui.model.vae.audio");
      const speedLoraWrap=mk("div",{marginBottom:"12px"});
      speedLoraWrap.appendChild(cap("ui.speed.lora"));
      const speedLoraDD=DD(["none"],S.speedLora,v=>{S.speedLora=v==="none"?"":v;persist();});
      speedLoraWrap.appendChild(speedLoraDD.el);
      const speedLoraHint=mk("div",{fontSize:"9px",color:C.muted,marginTop:"4px",lineHeight:"1.4"});
      _tr(speedLoraHint,"ui.speed.lora.hint");
      speedLoraWrap.appendChild(speedLoraHint);
      const audioToggle=Toggle("ui.audio.native",S.audioOn,v=>{S.audioOn=v;persist();},"tip.audio.native");
      const soundToggle=Toggle("ui.sound.complete",S.soundEnabled,v=>{S.soundEnabled=v;persist();});
      const playOnFinishToggle=Toggle("ui.play.finish",S.playOnFinish,v=>{S.playOnFinish=v;persist();});
      const sndWrap=mk("div",{marginBottom:"12px"});
      sndWrap.appendChild(cap("ui.completion.sound"));
      const sndNames={chime:"Chime",soft:"Soft",pop:"Pop"};
      const sndDD=DD(["Chime","Soft","Pop"],sndNames[S.sound]||"Chime",v=>{
        const map={Chime:"chime",Soft:"soft",Pop:"pop"};
        S.sound=map[v];persist();
      });
      sndWrap.appendChild(sndDD.el);
      const accWrap=mk("div",{marginBottom:"12px"});
      accWrap.appendChild(cap("ui.accent.colour"));
      const accRow=mk("div",{display:"flex",gap:"6px",alignItems:"center"});
      const swatches=["#c0a996","#00e5ff","#a259ff","#ff6b6b","#4ade80","#ffb347"];
      const _syncSwatches=()=>{
        accRow.querySelectorAll(".h3-swatch").forEach(x=>{
          x.style.borderColor=(x.dataset.sw||"").toLowerCase()===(S.accent||"").toLowerCase()?"#fff":"transparent";
        });
      };
      swatches.forEach(sw=>{
        const b=mk("div",{width:"22px",height:"22px",borderRadius:"50%",background:sw,cursor:"pointer",border:"2px solid transparent",boxSizing:"border-box",flexShrink:"0"});
        b.className="h3-swatch";b.dataset.sw=sw;
        b.onclick=()=>{_applyAccent(sw);_syncSwatches();};
        accRow.appendChild(b);
      });
      const accInp=mk("input",{width:"32px",height:"26px",background:"transparent",border:"1px solid "+C.border,borderRadius:"6px",cursor:"pointer",padding:"2px"},{type:"color",value:S.accent||ACCENT_DEFAULT});
      accInp.oninput=()=>{_applyAccent(accInp.value);_syncSwatches();};
      accRow.appendChild(accInp);
      accWrap.append(accRow);
      const supWrap=mk("div",{marginTop:"20px",borderTop:`1px solid ${C.border}`,paddingTop:"14px",display:"flex",flexDirection:"column",alignItems:"center",gap:"10px"});
      const supCap=mk("div",{fontSize:"9px",fontWeight:"700",letterSpacing:".1em",textTransform:"uppercase",color:C.muted,marginBottom:"8px"});
      _tr(supCap,"ui.support");
      const qrBox=mk("div",{width:"210px",height:"210px",borderRadius:"10px",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative",flexShrink:"0"});
      const qrImg=mk("img",{width:"100%",height:"100%",objectFit:"contain",display:"none"},{alt:"WeChat QR",referrerPolicy:"no-referrer"});
      const qrPh=mk("div",{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"6px",border:"1.5px dashed #bbb",boxSizing:"border-box",borderRadius:"10px",color:"#888",fontSize:"10px",textAlign:"center",padding:"10px",lineHeight:"1.5",whiteSpace:"pre-line"});
      _tr(qrPh,"ui.wechat.placeholder");
      qrBox.append(qrImg,qrPh);
      const qrCands=[
        api.apiURL(WECHAT_QR_PATH),
        api.apiURL("/extensions/ComfyUI-ALLinONE-MinimaxH3/wechat_qr.png"),
        "/extensions/ComfyUI-ALLinONE-MinimaxH3/wechat_qr.png",
      ];
      let qrIdx=0;
      const qrTryNext=()=>{
        if(qrIdx>=qrCands.length){ qrImg.style.display="none";qrPh.style.display="flex";return; }
        qrImg.src=qrCands[qrIdx++];
      };
      qrImg.onload=()=>{qrImg.style.display="block";qrPh.style.display="none";};
      qrImg.onerror=qrTryNext;
      qrTryNext();
      const wechatHint=mk("div",{fontSize:"10px",color:C.muted,textAlign:"center",lineHeight:"1.5"});
      _tr(wechatHint,"ui.wechat.hint");
      supWrap.append(supCap,qrBox,wechatHint);
      settingsOverlay.append(settHdr,unetT2VRow,unetR2VRow,clipRow,vaeVRow,vaeARow,speedLoraWrap,audioToggle.el,soundToggle.el,playOnFinishToggle.el,sndWrap,accWrap,supWrap);

      // -- HISTORY OVERLAY ---------------------------------------------------
      const historyOverlay=mk("div",{
        position:"absolute",inset:"0",background:"#0a0a0a",
        display:"none",flexDirection:"column",padding:"16px",boxSizing:"border-box",zIndex:"50",
        borderRadius:"8px",overflowY:"auto",opacity:"0",transition:"opacity .22s ease",transform:"translateY(6px)",
      });
      const histHdr=mk("div",{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"});
      const histTitle=mk("div",{fontSize:"13px",fontWeight:"700",letterSpacing:".06em",textTransform:"uppercase",color:C.text});
      _tr(histTitle,"ui.history");
      const histClose=mk("button",{background:"transparent",border:`1px solid #e05555`,borderRadius:"6px",padding:"4px 14px",fontSize:"11px",color:"#e05555",cursor:"pointer",outline:"none"});
      _tr(histClose,"ui.close");histClose.onclick=()=>closeOverlayFade(historyOverlay);
      histHdr.append(histTitle,histClose);
      const histSearch=mk("input",{
        width:"100%",boxSizing:"border-box",background:C.bg2,border:`1px solid ${C.border}`,
        borderRadius:"8px",color:C.text,fontSize:"12px",padding:"7px 12px",outline:"none",
        transition:"border-color .15s",fontFamily:"inherit",marginBottom:"10px",
      },{type:"text"});
      _tr(histSearch,"ui.search.history",null,"placeholder");
      histSearch.onfocus=()=>histSearch.style.borderColor=C.lime;
      histSearch.onblur=()=>histSearch.style.borderColor=C.border;
      histSearch.oninput=()=>_renderHistory(histSearch.value);
      const histBody=mk("div",{flex:"1",minHeight:"0",display:"flex",gap:"0",overflow:"hidden"});
      const histList=mk("div",{width:"300px",flexShrink:"0",minHeight:"0",overflowY:"auto",padding:"4px 10px 12px",display:"flex",flexDirection:"column",gap:"5px",scrollbarWidth:"thin",scrollbarColor:`${C.border} transparent`,borderRight:`1px solid ${C.border}`});
      histList.addEventListener("wheel",e=>e.stopPropagation(),{passive:true});
      const histDetail=mk("div",{flex:"1",minWidth:"0",minHeight:"0",overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:"12px",scrollbarWidth:"thin",scrollbarColor:`${C.border} transparent`});
      histDetail.addEventListener("wheel",e=>e.stopPropagation(),{passive:true});
      histBody.append(histList,histDetail);
      historyOverlay.append(histHdr,histSearch,histBody);
      const _fmtTime=(ts)=>{
        const d=new Date(ts*1000);
        const pad=n=>String(n).padStart(2,"0");
        const now=new Date();
        if(d.toDateString()===now.toDateString()) return `${t("ui.today")} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        return `${d.getDate()}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      let _histItems=[];
      let _histOpenId=null;
      // History row mode metadata: per-mode icon and color.
      const _HIST_MODE_COLORS={t2v:"#c0a996",i2v:"#5aa8ff",r2v:"#5fd08c",audio_drive:"#c07fff",keyframes:"#ffc266",extend:"#7ed491",chain:"#4dd0e1"};
      const _histModeMeta=(mode)=>{
        const m=String(mode||"");
        const c=_HIST_MODE_COLORS[m]||"#c0a996";
        return {kind:"mode",label:m||"t2v",color:c,icon:MODE_ICONS[m]||MODE_ICONS.t2v};
      };
      const _mkHistIcon=(meta,size)=>{
        const chip=mk("span",{width:size+"px",height:size+"px",borderRadius:"7px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:"0",border:`1px solid rgba(${_hexToRgb(meta.color)},.45)`,background:`rgba(${_hexToRgb(meta.color)},.09)`,color:meta.color});
        chip.innerHTML=`<svg viewBox="0 0 24 24" width="${Math.round(size*0.62)}" height="${Math.round(size*0.62)}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${meta.icon}</svg>`;
        return chip;
      };
      const _renderDetail=()=>{
        histDetail.innerHTML="";
        const it=_histItems.find(x=>x.id===_histOpenId);
        if(!it){
          const hint=mk("div",{flex:"1",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",color:C.muted,fontSize:"12px",textAlign:"center"});
          const hTxt=mk("div");tx(hTxt,_histItems.length?"Select an entry to view it":"Nothing here yet");
          hint.appendChild(hTxt);histDetail.appendChild(hint);return;
        }
        const meta=mk("div",{display:"flex",alignItems:"center",gap:"8px",flexShrink:"0",flexWrap:"wrap"});
        const mBadge=mk("span",{fontSize:"9px",fontWeight:"700",letterSpacing:".06em",color:C.lime,border:`1px solid rgba(var(--h3accent-rgb),.4)`,borderRadius:"5px",padding:"2px 8px",background:"rgba(var(--h3accent-rgb),.08)"});
        tx(mBadge,it.mode||"");
        const mTime=mk("span",{fontSize:"10px",color:C.muted});tx(mTime,_fmtTime(it.timestamp));
        const mInfo=mk("span",{fontSize:"9px",color:C.muted});
        tx(mInfo,`${it.resolution||""}${it.duration?(" - "+it.duration+"s"):""} - ${t("ui.seed.word")} ${it.seed??"?"}`);
        const mGen=mk("span",{fontSize:"9px",color:C.text,fontWeight:"600"});
        if(it.gen_time){ tx(mGen,"⏱ "+fmtDur(it.gen_time)); } else { tx(mGen,""); }
        const mSeedCopy=mk("button",{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:"5px",padding:"2px 8px",fontSize:"8px",fontWeight:"700",color:C.muted,cursor:"pointer",outline:"none",transition:"border-color .15s, color .15s"});
        _tr(mSeedCopy,"ui.copy.seed");
        mSeedCopy.onmouseenter=()=>{mSeedCopy.style.borderColor=C.lime;mSeedCopy.style.color=C.lime;};
        mSeedCopy.onmouseleave=()=>{mSeedCopy.style.borderColor=C.border;mSeedCopy.style.color=C.muted;};
        mSeedCopy.onclick=async()=>{
          if(it.seed===undefined||it.seed===null) return;
          const ok=await h3Copy(String(it.seed));
          tx(mSeedCopy,t(ok?"ui.copied":"ui.failed"));
          setTimeout(()=>tx(mSeedCopy,t("ui.copy.seed")),1300);
        };
        meta.append(mBadge,mTime,mInfo,mGen,mSeedCopy);
        if(it.quality==="turbo"){
          const mTurbo=mk("span",{fontSize:"9px",fontWeight:"700",letterSpacing:".06em",color:"#ffc266",border:"1px solid rgba(255,194,102,.45)",borderRadius:"5px",padding:"2px 8px",background:"rgba(255,194,102,.1)"});
          _tr(mTurbo,"ui.turbo.badge");
          meta.insertBefore(mTurbo,mTime);
        }
        const secPrompt=mk("div",{display:"flex",flexDirection:"column",gap:"6px",flexShrink:"0"});
        const spLbl=mk("div",{display:"flex",alignItems:"center",justifyContent:"space-between"});
        const spTitle=mk("div",{fontSize:"9px",fontWeight:"700",letterSpacing:".08em",textTransform:"uppercase",color:C.lime});_tr(spTitle,"ui.prompt");
        const reuseBtn=mk("button",{background:C.lime,color:"#111",border:"none",borderRadius:"6px",padding:"4px 12px",fontSize:"9px",fontWeight:"700",cursor:"pointer",outline:"none"});
        _tr(reuseBtn,"ui.reuse.prompt");
        reuseBtn.onclick=()=>{ _setPrompt(it.prompt||""); closeOverlayFade(historyOverlay); };
        spLbl.append(spTitle,reuseBtn);
        const promptBox=mk("div",{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:"8px",color:C.text,fontSize:"12px",padding:"10px 12px",lineHeight:"1.6",userSelect:"text",wordBreak:"break-word",whiteSpace:"pre-wrap",maxHeight:"140px",overflowY:"auto",scrollbarWidth:"thin"});
        tx(promptBox,it.prompt&&it.prompt.trim()?it.prompt:"(no prompt)");
        promptBox.addEventListener("wheel",e=>e.stopPropagation(),{passive:true});
        secPrompt.append(spLbl,promptBox);
        const secResult=mk("div",{display:"flex",flexDirection:"column",gap:"6px",flex:"1 1 0",minHeight:"0",overflow:"hidden"});
        const srTitle=mk("div",{fontSize:"9px",fontWeight:"700",letterSpacing:".08em",textTransform:"uppercase",color:C.muted,flexShrink:"0"});_tr(srTitle,"ui.result");
        secResult.appendChild(srTitle);
        if(it.video){
          const vurl=api.apiURL(`/view?filename=${encodeURIComponent(it.video)}&type=output&subfolder=${encodeURIComponent(it.subfolder||"")}`);
          const v=mk("video",{width:"100%",flex:"1 1 0",minHeight:"0",height:"0",borderRadius:"8px",background:"#000",objectFit:"contain",outline:"none"},{controls:true,src:vurl});
          secResult.appendChild(v);
        } else {
          const none=mk("div",{fontSize:"10px",color:C.muted});_tr(none,"ui.no.video");
          secResult.appendChild(none);
        }
        const footer=mk("div",{display:"flex",justifyContent:"flex-end",flexShrink:"0",marginTop:"2px"});
        const delBtn=mk("button",{background:"transparent",border:`1px solid rgba(220,80,80,.3)`,borderRadius:"6px",padding:"4px 12px",fontSize:"9px",fontWeight:"700",color:"rgba(220,80,80,.7)",cursor:"pointer",outline:"none"});
        _tr(delBtn,"ui.delete.entry");
        delBtn.onclick=async()=>{
          await fetch(`/h3one/history/${it.id}`,{method:"DELETE"});
          _histItems=_histItems.filter(x=>x.id!==it.id);
          if(_histOpenId===it.id)_histOpenId=null;
          _renderHistory(histSearch.value||"");
        };
        footer.appendChild(delBtn);
        histDetail.append(meta,secPrompt,secResult,footer);
      };
      const _renderHistory=async(filter="")=>{
        histList.innerHTML="";
        let items=[];
        try{const r=await fetch("/h3one/history");const d=await r.json();items=d.items||[];}catch(e){}
        _histItems=items;
        const f=(filter||"").toLowerCase();
        const vis=items.filter(it=>!f||(it.prompt+" "+it.mode+" "+(it.video||"")).toLowerCase().includes(f));
        if(!vis.length){
          const empty=mk("div",{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"8px",paddingTop:"30px",color:C.muted,fontSize:"12px",textAlign:"center"});
          const emptyTxt=mk("div");tx(emptyTxt,f?"No results found":"No history yet. Generate something to see it here.");
          empty.append(emptyTxt);histList.appendChild(empty);
          _histOpenId=null;_renderDetail();return;
        }
        if(!vis.some(it=>it.id===_histOpenId)) _histOpenId=vis[0].id;
        vis.forEach(it=>{
          const isActive=it.id===_histOpenId;
          const row=mk("div",{
            background:isActive?"rgba(var(--h3accent-rgb),.06)":C.bg1,
            border:`1px solid ${isActive?C.lime:C.border}`,
            borderRadius:"9px",padding:"8px 10px",display:"flex",alignItems:"center",gap:"9px",
            cursor:"pointer",transition:"border-color .15s, background .15s",flexShrink:"0",
          });
          const dot=mk("span",{width:"7px",height:"7px",borderRadius:"50%",background:C.lime,flexShrink:"0"});
          const rowMain=mk("div",{flex:"1",minWidth:"0",display:"flex",flexDirection:"column",gap:"2px"});
          const rowPrompt=mk("div",{fontSize:"11.5px",color:C.text,lineHeight:"1.4",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:isActive?"600":"400"});
          tx(rowPrompt,it.prompt&&it.prompt.trim()?it.prompt.trim():"(no prompt)");
          const rowTime=mk("div",{fontSize:"9px",color:C.muted});tx(rowTime,`${_fmtTime(it.timestamp)} - ${it.mode||""}`);
          rowMain.append(rowPrompt,rowTime);
          const mmeta=_histModeMeta(it.mode);
          const mic=_mkHistIcon(mmeta,24);
          mic.title=MODE_HINTS[mmeta.label]||mmeta.label;
          row.append(mic,rowMain);
          if(it.quality==="turbo"){
            const tChip=mk("span",{width:"18px",height:"18px",borderRadius:"5px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:"0",border:"1px solid rgba(255,194,102,.45)",background:"rgba(255,194,102,.1)",color:"#ffc266"});
            tChip.innerHTML='<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>';
            tChip.title="Turbo (Speed LoRA)";
            row.appendChild(tChip);
          }
          if(it.video){
            const thumb=mk("video",{width:"64px",height:"36px",borderRadius:"6px",background:"#000",objectFit:"cover",border:`1px solid ${C.border}`,flexShrink:"0",pointerEvents:"none",display:"block"},{muted:true,preload:"metadata",playsInline:true});
            thumb.src=api.apiURL(`/view?filename=${encodeURIComponent(it.video)}&type=output&subfolder=${encodeURIComponent(it.subfolder||"")}`);
            thumb.addEventListener("loadeddata",()=>{ try{ thumb.currentTime=0.1; }catch(e){} });
            thumb.title=it.video;
            row.appendChild(thumb);
          }
          row.onmouseenter=()=>{if(!isActive){row.style.borderColor="rgba(var(--h3accent-rgb),.3)";row.style.background=C.bg2;}};
          row.onmouseleave=()=>{if(!isActive){row.style.borderColor=C.border;row.style.background=C.bg1;}};
          row.onclick=()=>{_histOpenId=it.id;_renderHistory(histSearch.value||"");};
          histList.appendChild(row);
        });
        _renderDetail();
      };
      const historyBtn=mkTopBtn('<path d="M12 7v5l3.5 2"/><circle cx="12" cy="12" r="8.5"/>',"nav.history",()=>{_renderHistory();openOverlay(historyOverlay);});
      const settingsBtn=mkTopBtn('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',"nav.settings",()=>openOverlay(settingsOverlay));

      // -- LIBRARY OVERLAY ---------------------------------------------------
      const libraryOverlay=mk("div",{
        position:"absolute",inset:"0",background:"#0a0a0a",
        display:"none",flexDirection:"column",padding:"16px",boxSizing:"border-box",zIndex:"50",
        borderRadius:"8px",overflow:"hidden",opacity:"0",transition:"opacity .22s ease",transform:"translateY(6px)",
      });
      const _LIB_MODE_LBL={t2v:"T2V",i2v:"I2V",r2v:"R2V",audio_drive:"Audio Drive",keyframes:"Keyframes",extend:"Extend",chain:"Chain"};
      const libHdr=mk("div",{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"});
      const libTitle=mk("div",{fontSize:"13px",fontWeight:"700",letterSpacing:".06em",textTransform:"uppercase",color:C.text});
      _tr(libTitle,"ui.library");
      const libActs=mk("div",{display:"flex",alignItems:"center",gap:"8px"});
      const libFavOnly=mk("button",{background:"transparent",border:`1px solid ${C.border}`,borderRadius:"6px",padding:"4px 12px",fontSize:"11px",color:C.muted,cursor:"pointer",outline:"none",transition:"background .15s, color .15s"});
      _tr(libFavOnly,"ui.favorites");
      libFavOnly.onclick=()=>{_libFavOnly=!_libFavOnly;libFavOnly.style.background=_libFavOnly?C.lime:"transparent";libFavOnly.style.borderColor=_libFavOnly?C.lime:C.border;libFavOnly.style.color=_libFavOnly?"#111":C.muted;_renderLibrary();};
      const libRefresh=mk("button",{background:"transparent",border:`1px solid ${C.border}`,borderRadius:"6px",padding:"4px 12px",fontSize:"11px",color:C.muted,cursor:"pointer",outline:"none"});
      _tr(libRefresh,"ui.refresh");
      libRefresh.onmouseenter=()=>{libRefresh.style.borderColor=C.lime;libRefresh.style.color=C.lime;};
      libRefresh.onmouseleave=()=>{libRefresh.style.borderColor=C.border;libRefresh.style.color=C.muted;};
      libRefresh.onclick=()=>_renderLibrary();
      const libClose=mk("button",{background:"transparent",border:`1px solid #e05555`,borderRadius:"6px",padding:"4px 14px",fontSize:"11px",color:"#e05555",cursor:"pointer",outline:"none"});
      _tr(libClose,"ui.close");
      libClose.onclick=()=>closeOverlayFade(libraryOverlay);
      libActs.append(libFavOnly,libRefresh,libClose);
      libHdr.append(libTitle,libActs);
      const libGrid=mk("div",{flex:"1",minHeight:"0",overflowY:"auto",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"8px",alignContent:"start",scrollbarWidth:"thin",scrollbarColor:`${C.border} transparent`});
      libGrid.addEventListener("wheel",e=>e.stopPropagation(),{passive:true});
      libraryOverlay.append(libHdr,libGrid);
      const libLightbox=mk("div",{position:"absolute",inset:"0",background:"rgba(0,0,0,.96)",display:"none",flexDirection:"column",padding:"14px",boxSizing:"border-box",zIndex:"55"});
      const lbHdr=mk("div",{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"});
      const lbName=mk("div",{fontSize:"11px",color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:"1",minWidth:"0"});
      tx(lbName,"");
      const lbActs=mk("div",{display:"flex",gap:"6px",flexShrink:"0"});
      const lbFav=mk("button",{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:"6px",padding:"4px 10px",fontSize:"10px",fontWeight:"700",color:C.muted,cursor:"pointer",outline:"none"});
      _tr(lbFav,"ui.favorite");
      const lbOpen=mk("button",{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:"6px",padding:"4px 10px",fontSize:"10px",fontWeight:"700",color:C.muted,cursor:"pointer",outline:"none"});
      _tr(lbOpen,"ui.open.folder");
      lbOpen.onclick=()=>{
        if(_libCur)fetch("/h3one/open_folder",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:_libCur.filename,subfolder:_libCur.subfolder||""})}).catch(()=>{});
      };
      const lbDel=mk("button",{background:"transparent",border:`1px solid rgba(220,80,80,.4)`,borderRadius:"6px",padding:"4px 10px",fontSize:"10px",fontWeight:"700",color:"rgba(220,80,80,.8)",cursor:"pointer",outline:"none"});
      _tr(lbDel,"ui.delete");
      const lbClose=mk("button",{background:"transparent",border:`1px solid ${C.borderH}`,borderRadius:"6px",padding:"4px 12px",fontSize:"10px",fontWeight:"700",color:C.muted,cursor:"pointer",outline:"none"});
      _tr(lbClose,"ui.back");
      lbClose.onclick=()=>{lbVideo.pause();lbVideo.src="";libLightbox.style.display="none";_renderLibrary();};
      const lbSeedWrap=mk("div",{display:"flex",alignItems:"center",gap:"6px",background:C.bg2,border:`1px solid ${C.border}`,borderRadius:"6px",padding:"2px 8px"});
      const lbSeedLbl=mk("span",{fontSize:"9px",color:C.muted});_tr(lbSeedLbl,"ui.seed.label");
      const lbSeedVal=mk("span",{fontSize:"9px",color:C.text,fontWeight:"600"});tx(lbSeedVal,"?");
      const lbSeedCopy=mk("button",{background:"transparent",border:"none",fontSize:"9px",fontWeight:"700",color:C.lime,cursor:"pointer",outline:"none",padding:"0"});
      tx(lbSeedCopy,t("ui.copy"));
      lbSeedCopy.onclick=async()=>{
        const ok=await h3Copy(lbSeedVal.textContent);
        tx(lbSeedCopy,t(ok?"ui.copied":"ui.failed"));
        setTimeout(()=>tx(lbSeedCopy,t("ui.copy")),1300);
      };
      lbSeedWrap.append(lbSeedLbl,lbSeedVal,lbSeedCopy);
      const lbModeWrap=mk("div",{display:"flex",alignItems:"center",gap:"6px",background:C.bg2,border:`1px solid ${C.border}`,borderRadius:"6px",padding:"2px 8px"});
      const lbModeLbl=mk("span",{fontSize:"9px",color:C.muted});_tr(lbModeLbl,"ui.mode.label");
      const lbModeVal=mk("span",{fontSize:"9px",color:C.text,fontWeight:"600"});tx(lbModeVal,"?");
      lbModeWrap.append(lbModeLbl,lbModeVal);
      const lbTimeWrap=mk("div",{display:"flex",alignItems:"center",gap:"6px",background:C.bg2,border:`1px solid ${C.border}`,borderRadius:"6px",padding:"2px 8px"});
      const lbTimeIco=mk("span",{fontSize:"9px",opacity:".7"});tx(lbTimeIco,"⏱");
      const lbTimeLbl=mk("span",{fontSize:"9px",color:C.muted});_tr(lbTimeLbl,"ui.time.label");
      const lbTimeVal=mk("span",{fontSize:"9px",color:C.text,fontWeight:"600"});tx(lbTimeVal,"?");
      lbTimeWrap.append(lbTimeIco,lbTimeLbl,lbTimeVal);
      const lbUseDD=DD(["Use in...","R2V reference video","Extend source video"],"Use in...",v=>{
        lbUseDD.set("Use in...");
        if(v==="Use in...") return;
        _libUseIn(v);
      });
      const lbUseWrap=mk("div",{width:"150px",flexShrink:"0"});
      lbUseWrap.appendChild(lbUseDD.el);
      lbActs.append(lbSeedWrap,lbModeWrap,lbTimeWrap,lbUseWrap,lbFav,lbOpen,lbDel,lbClose);
      lbHdr.append(lbName,lbActs);
      const lbPromptWrap=mk("div",{display:"flex",flexDirection:"column",gap:"4px",marginBottom:"10px",flexShrink:"0"});
      const lbPromptHdr=mk("div",{display:"flex",alignItems:"center",justifyContent:"space-between"});
      const lbPromptTitle=mk("div",{fontSize:"9px",fontWeight:"700",letterSpacing:".08em",textTransform:"uppercase",color:C.muted});_tr(lbPromptTitle,"ui.prompt.used");
      const lbPromptReuse=mk("button",{background:C.lime,color:"#111",border:"none",borderRadius:"5px",padding:"3px 10px",fontSize:"9px",fontWeight:"700",cursor:"pointer",outline:"none",display:"none"});
      _tr(lbPromptReuse,"ui.load.into.prompt");
      lbPromptReuse.onclick=()=>{
        if(!lbPromptBox.textContent)return;
        _setPrompt(lbPromptBox.textContent);
        tx(lbPromptReuse,t("ui.loaded"));
        setTimeout(()=>tx(lbPromptReuse,t("ui.load.into.prompt")),1400);
      };
      lbPromptHdr.append(lbPromptTitle,lbPromptReuse);
      const lbPromptBox=mk("div",{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:"8px",color:C.text,fontSize:"11px",padding:"8px 10px",lineHeight:"1.55",userSelect:"text",wordBreak:"break-word",whiteSpace:"pre-wrap",maxHeight:"84px",overflowY:"auto",scrollbarWidth:"thin"});
      tx(lbPromptBox,"");
      lbPromptWrap.append(lbPromptHdr,lbPromptBox);
      const lbVideo=mk("video",{flex:"1",minHeight:"0",width:"100%",borderRadius:"8px",background:"#000",objectFit:"contain"},{controls:true});
      libLightbox.append(lbHdr,lbPromptWrap,lbVideo);
      libraryOverlay.appendChild(libLightbox);
      let _libFavOnly=false;
      let _libItems=[];
      let _libCur=null;
      const _libUseIn=async(target)=>{
        if(!_libCur) return;
        if(target!=="R2V reference video"&&target!=="Extend source video") return;
        try{
          const stage=await fetch("/h3one/stage_input",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:_libCur.filename,subfolder:_libCur.subfolder||""})});
          const sd=await stage.json();
          if(!sd.ok) throw new Error(sd.error||t("err.copy.video"));
          if(target==="R2V reference video"){
            if(S.refVideos.length>=3){ showError(t("err.r2v.maxvideos")); return; }
            S.refVideos.push({name:sd.name,useAudio:false});
            _switchMode("r2v");
          }else if(target==="Extend source video"){
            S.extendVideo=sd.name;
            _switchMode("extend");
            exSlot._restorePreview(sd.name);
          }
          lbVideo.pause();lbVideo.src="";libLightbox.style.display="none";
          closeOverlayFade(libraryOverlay);
        }catch(e){
          showError(t("err.load.video",{n:target})+" "+fmtErr(e));
        }
      };
      const _renderLibrary=async()=>{
        libGrid.innerHTML="";
        try{
          const r=await fetch("/h3one/gallery");
          const d=await r.json();
          _libItems=d.videos||[];
        }catch(e){ _libItems=[]; }
        const vis=_libItems.filter(v=>!_libFavOnly||v.favorite);
        if(!vis.length){
          const empty=mk("div",{fontSize:"11px",color:C.muted,padding:"20px 0",textAlign:"center",gridColumn:"1 / -1"});
          _tr(empty,_libFavOnly?"ui.empty.fav":"ui.empty.lib");
          libGrid.appendChild(empty);
          return;
        }
        vis.forEach(item=>{
          const card=mk("div",{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:"9px",overflow:"hidden",cursor:"pointer",display:"flex",flexDirection:"column",transition:"border-color .15s, background .15s"});
          const url=api.apiURL(`/view?filename=${encodeURIComponent(item.filename)}&type=output&subfolder=${encodeURIComponent(item.subfolder||"")}`);
          const v=mk("video",{width:"100%",height:"78px",objectFit:"cover",display:"block",background:"#000",pointerEvents:"none"},{muted:true,preload:"metadata"});
          v.src=url;
          const name=mk("div",{fontSize:"8px",color:item.favorite?C.lime:C.muted,padding:"4px 6px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"});
          tx(name,(item.favorite?"★ ":"")+item.filename);
          card.append(v,name);
          card.onclick=()=>_libOpen(item);
          card.onmouseenter=()=>card.style.borderColor=C.lime;
          card.onmouseleave=()=>card.style.borderColor=C.border;
          libGrid.appendChild(card);
        });
      };
      const _libOpen=async(item)=>{
        _libCur=item;
        tx(lbName,item.filename);
        tx(lbFav,t(item.favorite?"ui.unfavorite":"ui.favorite"));
        tx(lbSeedVal,"?");
        tx(lbModeVal,"?");
        tx(lbTimeVal,"?");
        tx(lbPromptBox,"");
        lbPromptReuse.style.display="none";
        if(_seedByFile[item.filename]!==undefined){
          tx(lbSeedVal,String(_seedByFile[item.filename]));
        }
        if(_genTimeByFile[item.filename]){
          tx(lbTimeVal,fmtDur(_genTimeByFile[item.filename]));
        }
        try{
          const r=await fetch("/h3one/history");
          const d=await r.json();
          const hit=(d.items||[]).find(it=>it.video===item.filename);
          if(hit){
            if(hit.seed!==undefined&&hit.seed!==null){ _seedByFile[item.filename]=hit.seed; tx(lbSeedVal,String(hit.seed)); }
            if(hit.mode){ tx(lbModeVal,_LIB_MODE_LBL[hit.mode]||hit.mode); }
            if(hit.gen_time){ _genTimeByFile[item.filename]=hit.gen_time; tx(lbTimeVal,fmtDur(hit.gen_time)); }
            if(hit.prompt&&hit.prompt.trim()){
              tx(lbPromptBox,hit.prompt);
              lbPromptReuse.style.display="inline-block";
            }else{
              tx(lbPromptBox,t("ui.no.prompt"));
            }
          }else{
            tx(lbPromptBox,t("ui.no.prompt"));
          }
        }catch(e){ tx(lbPromptBox,t("ui.no.prompt")); }
        lbVideo.src=api.apiURL(`/view?filename=${encodeURIComponent(item.filename)}&type=output&subfolder=${encodeURIComponent(item.subfolder||"")}`);
        libLightbox.style.display="flex";
        lbVideo.muted=false;
        lbVideo.play().catch(()=>{lbVideo.muted=true;lbVideo.play().catch(()=>{});});
      };
      lbFav.onclick=async()=>{
        if(!_libCur)return;
        await fetch("/h3one/favorite",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:_libCur.filename,favorite:!_libCur.favorite})}).catch(()=>{});
        _libCur.favorite=!_libCur.favorite;
        tx(lbFav,t(_libCur.favorite?"ui.unfavorite":"ui.favorite"));
        _renderLibrary();
      };
      lbDel.onclick=async()=>{
        if(!_libCur)return;
        if(!confirm(t("ui.delete.confirm",{n:_libCur.filename})))return;
        await fetch("/h3one/delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:_libCur.filename,subfolder:_libCur.subfolder||""})}).catch(()=>{});
        lbVideo.pause();lbVideo.src="";libLightbox.style.display="none";
        _libCur=null;_renderLibrary();_loadGallery();
      };
      const libraryBtn=mkTopBtn('<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.5"/>',"nav.library",()=>{_renderLibrary();openOverlay(libraryOverlay);});

      const fsNodeBtn=mk("button",{}, {type:"button",className:"h3-topbtn"});
      _tr(fsNodeBtn,"nav.fullscreen",null,"title");
      fsNodeBtn.setAttribute("aria-label",t("nav.fullscreen"));
      fsNodeBtn.innerHTML=`<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`;
      let _inFullscreen=false,_fsNodeOverlay=null,_rootOrigParent=null,_rootOrigNextSibling=null;
      const _enterFullscreen=()=>{
        if(_inFullscreen) return;
        if(!_fsNodeOverlay){
          _fsNodeOverlay=mk("div",{position:"fixed",inset:"0",zIndex:"99990",background:"rgba(6,6,8,.97)",display:"none",flexDirection:"column",alignItems:"center",justifyContent:"center",boxSizing:"border-box",overflow:"hidden"});
          document.body.appendChild(_fsNodeOverlay);
        }
        _rootOrigParent=root.parentNode;_rootOrigNextSibling=root.nextSibling;
        root.style.width=NODE_W+"px";root.style.height=NODE_H+"px";root.style.overflow="hidden";
        root.style.borderRadius="0";root.style.position="absolute";root.style.top="0";root.style.left="0";root.style.margin="0";
        const _vw=window.innerWidth,_vh=window.innerHeight;
        const _scale=Math.min(_vw/NODE_W,_vh/NODE_H)*0.97;
        root.style.transformOrigin="top left";root.style.transform=`scale(${_scale})`;
        const _scW=Math.round(NODE_W*_scale),_scH=Math.round(NODE_H*_scale);
        const _scWrap=mk("div",{width:_scW+"px",height:_scH+"px",position:"relative",flexShrink:"0",overflow:"hidden"});
        _scWrap.appendChild(root);_fsNodeOverlay.appendChild(_scWrap);_fsNodeOverlay._scWrap=_scWrap;
        _fsNodeOverlay.style.display="flex";_fsNodeOverlay.setAttribute("tabindex","-1");_fsNodeOverlay.focus();
        fsNodeBtn.innerHTML=`<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5"/></svg>`;
        _inFullscreen=true;
      };
      const _exitFullscreen=()=>{
        if(!_inFullscreen) return;
        if(_rootOrigParent){ if(_rootOrigNextSibling) _rootOrigParent.insertBefore(root,_rootOrigNextSibling);else _rootOrigParent.appendChild(root); }
        root.style.position="";root.style.inset="";root.style.width="100%";root.style.height="";
        root.style.borderRadius="";root.style.overflow="hidden";root.style.transform="";root.style.transformOrigin="";root.style.margin="";root.style.top="";root.style.left="";
        scrollEl.style.height=_uiH+"px";
        if(_fsNodeOverlay._scWrap) _fsNodeOverlay._scWrap.remove();
        _fsNodeOverlay._scWrap=null;_fsNodeOverlay.style.display="none";
        fsNodeBtn.innerHTML=`<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`;
        _inFullscreen=false;
      };
      fsNodeBtn.onclick=()=>{ if(_inFullscreen) _exitFullscreen();else _enterFullscreen(); };

      const langBtn=mk("button",{width:"auto",minWidth:"34px",padding:"0 8px",fontSize:"10px",fontWeight:"700",letterSpacing:".02em",fontFamily:"inherit"}, {type:"button",className:"h3-topbtn"});
      _langBtnEl=langBtn;
      _updateLangButton();
      langBtn.onclick=()=>{
        const next=_uiLang==="en"?"zh":"en";
        setUiLang(next);
        S.lang=next;persist();
      };
      topRight.append(historyBtn,libraryBtn,settingsBtn,langBtn,fsNodeBtn);

      // -- PROMPT SECTION ----------------------------------------------------
      const promptWrap=mk("div",{display:"flex",flexDirection:"column",gap:"5px"});
      const promptHdr=mk("div",{display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",userSelect:"none"});
      const promptCapEl=mk("div",{}, {className:"h3-ctitle"});_tr(promptCapEl,"ui.prompt");
      promptHdr.appendChild(promptCapEl);
      const discoverBtn=mk("button",{background:"none",border:`1px solid ${C.border}`,cursor:"pointer",padding:"2px 8px",color:C.muted,outline:"none",borderRadius:"5px",fontSize:"9px",fontWeight:"700",transition:"color .15s,border-color .15s",flexShrink:"0"});
      _tr(discoverBtn,"ui.discover");
      discoverBtn.onmouseenter=()=>{discoverBtn.style.color="#fff";discoverBtn.style.borderColor="#555";};
      discoverBtn.onmouseleave=()=>{discoverBtn.style.color=C.muted;discoverBtn.style.borderColor=C.border;};
      discoverBtn.onclick=(e)=>{e.stopPropagation();_renderDiscover();openOverlay(discoverOverlay);};
      promptHdr.append(discoverBtn);
      const promptChev=mk("span",{marginLeft:"auto",color:C.dim,fontSize:"10px",flexShrink:"0"});
      tx(promptChev,"▾");
      promptHdr.appendChild(promptChev);
      const promptTA=mk("textarea",{
        background:C.bg2,border:`1px solid ${C.border}`,borderRadius:"8px",
        color:C.text,fontSize:"12px",padding:"8px 10px",
        resize:"vertical",outline:"none",fontFamily:"inherit",
        transition:"border-color .15s",lineHeight:"1.5",
        width:"100%",boxSizing:"border-box",minHeight:"70px",
      });
      promptTA.value=S.prompt;
      promptTA.onfocus=()=>promptTA.style.borderColor=C.lime;
      promptTA.onblur=()=>promptTA.style.borderColor=C.border;
      const pCharsEl=mk("div",{fontSize:"9px",color:C.dim,alignSelf:"flex-end",marginTop:"3px"});
      const _updChars=()=>{ tx(pCharsEl, t("ui.chars",{n:promptTA.value.length})); };
      promptTA.oninput=()=>{S.prompt=promptTA.value;persist();_updChars();};
      const _setPrompt=(t)=>{ S.prompt=t; promptTA.value=t; persist(); _updChars(); if(S.mode==="chain"&&S.chainClips.length){ S.chainClips[0].prompt=t; chainArea._render(); } };
      promptTA.addEventListener("wheel",e=>{ if(document.activeElement===promptTA) e.stopPropagation(); },{passive:true});
      promptWrap.appendChild(promptTA);
      promptWrap.appendChild(pCharsEl);
      _updChars();

      // -- DISCOVER OVERLAY --------------------------------------------------
      const discoverOverlay=mk("div",{
        position:"absolute",inset:"0",background:C.bg0,display:"none",flexDirection:"column",
        padding:"14px",boxSizing:"border-box",zIndex:"60",borderRadius:"8px",
        opacity:"0",transition:"opacity .15s ease",overflowY:"auto",
      });
      const discHdr=mk("div",{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"});
      const discTitle=mk("div",{fontSize:"10px",fontWeight:"700",color:C.muted,letterSpacing:".07em",textTransform:"uppercase"});
      _tr(discTitle,"ui.disc.title");
      const discClose=mk("button",{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:"14px",lineHeight:"1",outline:"none"});
      tx(discClose,"x");
      discClose.onclick=()=>{discoverOverlay.style.opacity="0";setTimeout(()=>discoverOverlay.style.display="none",160);};
      discHdr.append(discTitle,discClose);
      const discBody=mk("div",{display:"flex",flexDirection:"column",gap:"8px"});
      discoverOverlay.append(discHdr,discBody);
      let _discTmpl={};
      let _discCustom={};
      let _presetEditName="";
      let _presetEditMode="";
      const _renderDiscover=async()=>{
        discBody.innerHTML="";
        try{const r=await fetch("/h3one/config");const d=await r.json();_discTmpl=d.prompt_templates||{};_discCustom=d.custom_presets||{};}catch(e){_discTmpl={};_discCustom={};}
        const tplEntry=_discTmpl[S.mode]||{presets:[]};
        const builtin=(tplEntry.presets||[]).filter(p=>!p.builtin_hidden);
        const note=mk("div",{fontSize:"9px",color:C.muted,lineHeight:"1.5",marginBottom:"2px"});
        _tr(note,"ui.disc.note");
        discBody.appendChild(note);

        // -- save new preset --
        const saveRow=mk("div",{background:C.bg1,border:`1px dashed rgba(var(--h3accent-rgb),.4)`,borderRadius:"8px",padding:"8px 10px",display:"flex",flexDirection:"column",gap:"6px"});
        const saveCapRow=mk("div",{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"6px"});
        const saveCap=mk("div",{fontSize:"9px",fontWeight:"700",letterSpacing:".07em",textTransform:"uppercase",color:C.muted});
        _tr(saveCap,"ui.disc.save.cap");
        const editTag=mk("span",{fontSize:"8px",fontWeight:"700",color:C.lime,border:`1px solid rgba(var(--h3accent-rgb),.4)`,borderRadius:"4px",padding:"1px 6px",display:"none"});
        const cancelEditBtn=mk("button",{background:"transparent",border:`1px solid ${C.borderH}`,borderRadius:"4px",padding:"1px 6px",fontSize:"8px",fontWeight:"700",color:C.muted,cursor:"pointer",outline:"none",display:"none"});
        _tr(cancelEditBtn,"ui.disc.cancel");
        cancelEditBtn.onclick=()=>{
          _presetEditName="";
          _presetEditMode="";
          nameInp.value="";
          presetTA.value=promptTA.value;
          tx(saveBtn,t("ui.disc.save"));
          editTag.style.display="none";
          cancelEditBtn.style.display="none";
          saveCap.textContent=t("ui.disc.save.cap");
        };
        saveCapRow.append(saveCap,editTag,cancelEditBtn);
        const nameInp=mk("input",{width:"100%",boxSizing:"border-box",background:C.bg2,border:`1px solid ${C.border}`,borderRadius:"6px",color:C.text,fontSize:"11px",padding:"5px 8px",outline:"none"},{type:"text"});
        _tr(nameInp,"ui.disc.preset.name",null,"placeholder");
        nameInp.onfocus=()=>nameInp.style.borderColor=C.lime;
        nameInp.onblur=()=>nameInp.style.borderColor=C.border;
        const presetTA=mk("textarea",{width:"100%",boxSizing:"border-box",background:C.bg2,border:`1px solid ${C.border}`,borderRadius:"6px",color:C.text,fontSize:"10px",padding:"6px 8px",outline:"none",resize:"vertical",fontFamily:"inherit",lineHeight:"1.5",minHeight:"64px"});
        presetTA.value=promptTA.value;
        presetTA.onfocus=()=>presetTA.style.borderColor=C.lime;
        presetTA.onblur=()=>presetTA.style.borderColor=C.border;
        const saveBtn=mk("button",{background:C.lime,color:"#111",border:"none",borderRadius:"6px",padding:"5px 10px",fontSize:"9px",fontWeight:"700",cursor:"pointer",outline:"none",alignSelf:"flex-start"});
        _tr(saveBtn,"ui.disc.save");
        const _enterEditMode=(pr)=>{
          _presetEditName=pr.name;
          _presetEditMode=pr.mode||S.mode;
          nameInp.value=pr.name;
          presetTA.value=pr.prompt;
          tx(saveBtn,t("ui.disc.update"));
          tx(editTag,t("ui.disc.editing",{n:pr.name}));
          editTag.style.display="inline-block";
          cancelEditBtn.style.display="inline-block";
          saveCap.textContent=t("ui.disc.update");
          nameInp.focus();
          saveRow.scrollIntoView({block:"nearest",behavior:"smooth"});
        };
        const _presetSave=async()=>{
          const name=nameInp.value.trim();
          const prompt=presetTA.value.trim();
          const saveMode=_presetEditMode||S.mode;
          if(!name){nameInp.style.borderColor=C.err;return;}
          if(!prompt){presetTA.style.borderColor=C.err;return;}
          const customs=Array.isArray(_discCustom[saveMode])?_discCustom[saveMode]:[];
          const sameName=customs.find(p=>String(p.name||"").trim().toLowerCase()===name.toLowerCase());
          if(sameName && (!_presetEditName || _presetEditName.toLowerCase()!==name.toLowerCase())){
            if(!confirm(t("ui.disc.overwrite",{n:name}))) return;
          }
          saveBtn.disabled=true;tx(saveBtn,t("ui.disc.saving"));
          try{
            if(_presetEditName && _presetEditName.toLowerCase()!==name.toLowerCase()){
              await fetch("/h3one/presets",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:saveMode,name:_presetEditName})}).catch(()=>{});
            }
            const r=await fetch("/h3one/presets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:saveMode,name,prompt,original_name:_presetEditName||undefined})});
            const d=await r.json();
            if(!d.ok) throw new Error(d.error||"save failed");
            const savedName=name;
            _presetEditName="";
            _presetEditMode="";
            _renderDiscover();
            const savedNote=mk("div",{fontSize:"9px",fontWeight:"700",color:C.lime,marginTop:"2px"});
            tx(savedNote,t("ui.disc.saved",{n:savedName}));
            discBody.insertBefore(savedNote,discBody.firstChild);
            setTimeout(()=>savedNote.remove(),2600);
            return;
          }catch(e){
            console.warn("[H3One] preset save:",e);
            saveBtn.disabled=false;
            tx(saveBtn,t("ui.disc.failed"));
            setTimeout(()=>tx(saveBtn,t(_presetEditName?"ui.disc.update":"ui.disc.save")),2600);
          }
        };
        saveBtn.onclick=_presetSave;
        nameInp.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();_presetSave();}};
        presetTA.onkeydown=e=>{if(e.key==="Enter"&&e.ctrlKey)_presetSave();};
        saveRow.append(saveCapRow,nameInp,presetTA,saveBtn);
        discBody.appendChild(saveRow);

        // -- custom presets (all modes, labeled) --
        const allCustom=[];
        const MODE_LABELS={t2v:"T2V",i2v:"I2V",r2v:"R2V",audio_drive:"Audio Drive",keyframes:"Keyframes",extend:"Extend",chain:"Chain"};
        Object.keys(_discCustom||{}).forEach(mode=>{
          (Array.isArray(_discCustom[mode])?_discCustom[mode]:[]).forEach(pr=>{
            allCustom.push({name:pr.name,prompt:pr.prompt,mode});
          });
        });
        if(allCustom.length){
          const capC=mk("div",{fontSize:"9px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginTop:"4px"});
          _tr(capC,"ui.disc.yours");
          discBody.appendChild(capC);
          allCustom.forEach(pr=>{
            const row=mk("div",{background:C.bg1,border:`1px solid rgba(var(--h3accent-rgb),.3)`,borderRadius:"8px",padding:"8px 10px",display:"flex",alignItems:"center",gap:"8px"});
            const badge=mk("span",{fontSize:"7.5px",fontWeight:"700",letterSpacing:".05em",color:C.lime,border:`1px solid rgba(var(--h3accent-rgb),.35)`,borderRadius:"4px",padding:"1px 5px",flexShrink:"0",textTransform:"uppercase"});
            tx(badge,MODE_LABELS[pr.mode]||pr.mode);
            const name=mk("div",{flex:"1",minWidth:"0",fontSize:"11px",color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"});
            tx(name,pr.name);
            const use=mk("button",{background:C.lime,color:"#111",border:"none",borderRadius:"6px",padding:"4px 10px",fontSize:"9px",fontWeight:"700",cursor:"pointer",outline:"none"});
            _tr(use,"ui.use");
            use.onclick=()=>{ _setPrompt(pr.prompt); discClose.onclick(); };
            const edit=mk("button",{background:"transparent",border:`1px solid ${C.borderH}`,borderRadius:"6px",padding:"4px 10px",fontSize:"9px",fontWeight:"700",color:C.muted,cursor:"pointer",outline:"none"});
            _tr(edit,"ui.edit");
            edit.onclick=()=>{
              _enterEditMode({name:pr.name,prompt:pr.prompt,mode:pr.mode});
              if(pr.mode!==S.mode){
                tx(editTag,t("ui.disc.editing",{n:pr.name})+" ["+(MODE_LABELS[pr.mode]||pr.mode)+"]");
              }
            };
            const del=mk("button",{background:"transparent",border:`1px solid rgba(220,80,80,.4)`,borderRadius:"6px",padding:"4px 10px",fontSize:"9px",fontWeight:"700",color:"rgba(220,80,80,.8)",cursor:"pointer",outline:"none"});
            tx(del,"x");
            del.onclick=async()=>{
              if(!confirm(t("ui.disc.delete.confirm",{n:pr.name,m:(MODE_LABELS[pr.mode]||pr.mode)})))return;
              try{
                await fetch("/h3one/presets",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:pr.mode,name:pr.name})});
              }catch(e){console.warn("[H3One] preset delete:",e);}
              _renderDiscover();
            };
            row.append(badge,name,use,edit,del);
            discBody.appendChild(row);
          });
        }

        // -- built-in presets --
        const capB=mk("div",{fontSize:"9px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginTop:"4px"});
        _tr(capB,"ui.disc.builtin");
        discBody.appendChild(capB);
        builtin.forEach(pr=>{
          const row=mk("div",{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:"8px",padding:"8px 10px",display:"flex",alignItems:"center",gap:"8px"});
          const name=mk("div",{flex:"1",minWidth:"0",fontSize:"11px",color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"});
          tx(name,pr.name);
          const use=mk("button",{background:C.lime,color:"#111",border:"none",borderRadius:"6px",padding:"4px 10px",fontSize:"9px",fontWeight:"700",cursor:"pointer",outline:"none"});
          _tr(use,"ui.use");
          use.onclick=()=>{ _setPrompt(pr.prompt); discClose.onclick(); };
          const cpy=mk("button",{background:"transparent",border:`1px solid ${C.borderH}`,borderRadius:"6px",padding:"4px 10px",fontSize:"9px",fontWeight:"700",color:C.muted,cursor:"pointer",outline:"none"});
          _tr(cpy,"ui.copy");
          cpy.onclick=async()=>{ const ok=await h3Copy(pr.prompt); tx(cpy,t(ok?"ui.copied":"ui.failed")); setTimeout(()=>tx(cpy,t("ui.copy")),1500); };
          row.append(name,use,cpy);
          discBody.appendChild(row);
        });
      };

      // -- MODE-SPECIFIC SECTIONS --------------------------------------------
      const modeHdr=mk("div",{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",userSelect:"none"});
      const modeTitleBlock=mk("div",{flex:"1",minWidth:"0",display:"flex",flexDirection:"column",gap:"2px"});
      const modeTitle=mk("div",{}, {className:"h3-ctitle"});
      const modeDesc=mk("div",{}, {className:"h3-cdesc"});
      modeTitleBlock.append(modeTitle,modeDesc);
      const modeChev=mk("span",{marginLeft:"auto",color:C.dim,fontSize:"10px",flexShrink:"0"});
      tx(modeChev,"▾");
      modeHdr.append(modeTitleBlock,modeChev);
      const modeArea=mk("div",{display:"flex",flexDirection:"column",gap:"8px"});
      const _modeTitleKey=()=> ({i2v:"ui.mode.i2v",r2v:"ui.mode.r2v",keyframes:"ui.mode.keyframes",extend:"ui.mode.extend",chain:"ui.mode.chain"})[S.mode]||"ui.mode.t2v";
      modeTitle._i18nApply=()=>{ modeTitle.textContent=t(_modeTitleKey()); };
      _i18nLive.push(modeTitle);
      modeDesc._i18nApply=()=>{ modeDesc.textContent=t(MODE_DESC[S.mode]||"mode.desc.t2v"); };
      _i18nLive.push(modeDesc);

      const i2vArea=mk("div",{display:"flex",gap:"10px"});
      const kfArea=mk("div",{display:"flex",flexDirection:"column",gap:"6px"});
      const refArea=mk("div",{display:"flex",flexDirection:"column",gap:"8px"});
      const chainArea=mk("div",{display:"flex",flexDirection:"column",gap:"6px"});
      const exArea=mk("div",{display:"flex",gap:"10px"});

      const _clearSections=()=>{
        [i2vArea,kfArea,refArea,chainArea,exArea].forEach(a=>a.style.display="none");
      };

      const _mkSlotCard=(labelKey,slot)=>{
        const card=mk("div",{display:"flex",flexDirection:"column",gap:"3px",alignItems:"center"});
        const lbl=mk("div",{fontSize:"8px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:".07em",textAlign:"center"});
        _tr(lbl,labelKey);
        card.append(slot,lbl);
        return card;
      };

      // I2V slots
      const firstSlot=ImgSlot(true,n=>{S.firstFrame=n;persist();});
      const lastSlot=ImgSlot(true,n=>{S.lastFrame=n;persist();});
      i2vArea.append(_mkSlotCard("ui.first.frame",firstSlot.el),_mkSlotCard("ui.last.frame",lastSlot.el));
      if(S.firstFrame) firstSlot._restorePreview(S.firstFrame);
      if(S.lastFrame) lastSlot._restorePreview(S.lastFrame);

      // R2V refs
      const _renderRefs=()=>{
        refArea.innerHTML="";
        const chainAudioLock=S.mode==="chain"&&S.audioLock;
        const imgCap=mk("div",{fontSize:"9px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:".07em"});
        _tr(imgCap,"ui.ref.images",{n:S.refImages.length});
        refArea.appendChild(imgCap);
        const imgRow=mk("div",{display:"flex",gap:"8px",flexWrap:"wrap"});
        S.refImages.forEach((name,idx)=>{
          const slot=ImgSlot(false,n=>{ if(n===null){S.refImages.splice(idx,1);} else { S.refImages[idx]=n; persist(); } _renderRefs(); });
          imgRow.appendChild(slot.el);
          if(name) slot._restorePreview(name);
        });
        const addImg=mk("div",{width:"72px",height:"72px",borderRadius:"12px",border:`1.5px dashed rgba(90,168,255,.4)`,background:"rgba(90,168,255,.05)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"rgba(90,168,255,.8)",fontSize:"18px",fontWeight:"700",flexShrink:"0"});
        tx(addImg,"+");
        const upImg=mk("input",{display:"none"},{type:"file",accept:"image/*"});
        imgRow.append(addImg,upImg);
        refArea.appendChild(imgRow);
        addImg.onclick=async()=>{
          if(S.refImages.length>=9) return;
          upImg.value="";
          upImg.onchange=async()=>{
            if(!upImg.files[0]) return;
            const fd=new FormData();fd.append("image",upImg.files[0]);fd.append("overwrite","true");
            try{
              const r=await api.fetchApi("/upload/image",{method:"POST",body:fd});
              const d=await r.json();
              S.refImages.push(d.name||upImg.files[0].name);
              persist();
            }catch(e){ console.warn(e); }
            _renderRefs();
          };
          upImg.click();
        };
        const vidCap=mk("div",{fontSize:"9px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginTop:"4px"});
        _tr(vidCap,"ui.ref.videos",{n:S.refVideos.length});
        refArea.appendChild(vidCap);
        const vidRow=mk("div",{display:"flex",gap:"8px",flexWrap:"wrap"});
        S.refVideos.forEach((entry,idx)=>{
          const name=(typeof entry==="string")?entry:entry.name;
          const useAudio=!!(entry&&entry.useAudio);
          const card=mk("div",{display:"flex",flexDirection:"column",gap:"3px",alignItems:"center"});
          const slot=MediaSlot("video",n=>{
            if(n===null){ S.refVideos.splice(idx,1); }
            else { S.refVideos[idx]={name:n,useAudio:!!(S.refVideos[idx]&&S.refVideos[idx].useAudio)}; persist(); }
            _renderRefs();
          });
          card.appendChild(slot);
          if(name) slot._restorePreview(name);
          if(!chainAudioLock){
            const tgl=mk("div",{display:"flex",alignItems:"center",gap:"4px",cursor:"pointer",padding:"2px 4px",borderRadius:"5px",border:`1px solid ${useAudio?C.lime:C.border}`,background:useAudio?"rgba(var(--h3accent-rgb),.10)":"transparent",transition:"border-color .15s, background .15s"});
            const box=mk("div",{width:"10px",height:"10px",borderRadius:"3px",border:`1px solid ${C.borderH}`,background:useAudio?C.lime:C.bg2,transition:"background .15s",flexShrink:"0"});
            const tglLbl=mk("div",{fontSize:"7px",color:useAudio?C.lime:C.muted,fontWeight:"700",letterSpacing:".02em",whiteSpace:"nowrap"});
            _tr(tglLbl,"ui.ref.use.audio");
            tgl.append(box,tglLbl);
            tgl.title=t("ui.ref.use.audio");
            tgl.onclick=(e)=>{
              e.stopPropagation();
              const on=!(S.refVideos[idx]&&S.refVideos[idx].useAudio);
              S.refVideos[idx]={name:(S.refVideos[idx]&&S.refVideos[idx].name)||name,useAudio:on};
              if(on){ S.refAudios=[]; persist(); }
              _renderRefs();
            };
            card.appendChild(tgl);
          }
          vidRow.appendChild(card);
        });
        const anyVideoAudio=S.refVideos.some(v=>v&&v.useAudio);
        const addVid=mk("div",{width:"72px",height:"72px",borderRadius:"12px",border:`1.5px dashed rgba(95,208,140,.4)`,background:"rgba(95,208,140,.05)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"rgba(95,208,140,.8)",fontSize:"18px",fontWeight:"700",flexShrink:"0"});
        tx(addVid,"+");
        addVid.onclick=async()=>{
          if(S.refVideos.length>=3) return;
          const fi=mk("input",{display:"none"},{type:"file",accept:"video/*"});
          document.body.appendChild(fi);
          fi.onchange=async()=>{
            if(!fi.files[0]){fi.remove();return;}
            const fd=new FormData();fd.append("file",fi.files[0],fi.files[0].name);
            try{
              const res=await fetch("/h3one/upload",{method:"POST",body:fd});
              const d=await res.json();
              if(d.ok){ S.refVideos.push({name:d.filename,useAudio:false}); persist(); _renderRefs(); }
            }catch(e){ console.warn(e); }
            fi.remove();
          };
          fi.click();
        };
        vidRow.append(addVid);
        refArea.appendChild(vidRow);
        if(!chainAudioLock){
        const audCap=mk("div",{fontSize:"9px",fontWeight:"700",color:anyVideoAudio?C.dim:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginTop:"4px"});
        _tr(audCap,anyVideoAudio?"ui.ref.audio.video":"ui.ref.audio",anyVideoAudio?null:{n:S.refAudios.length});
        refArea.appendChild(audCap);
        if(anyVideoAudio){
          const note=mk("div",{fontSize:"8px",color:C.dim,lineHeight:"1.5"});
          _tr(note,"ui.ref.audio.disabled");
          refArea.appendChild(note);
        } else {
          const audRow=mk("div",{display:"flex",gap:"8px",flexWrap:"wrap"});
          S.refAudios.forEach((name,idx)=>{
            const slot=MediaSlot("audio",n=>{ if(n===null){S.refAudios.splice(idx,1);} else { S.refAudios[idx]=n; persist(); } _renderRefs(); });
            audRow.appendChild(slot);
            if(name) slot._restorePreview(name);
          });
          const addAud=mk("div",{width:"72px",height:"72px",borderRadius:"12px",border:`1.5px dashed rgba(192,127,255,.4)`,background:"rgba(192,127,255,.05)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"rgba(192,127,255,.8)",fontSize:"18px",fontWeight:"700",flexShrink:"0"});
          tx(addAud,"+");
          addAud.onclick=async()=>{
            if(S.refAudios.length>=3) return;
            const fi=mk("input",{display:"none"},{type:"file",accept:"audio/*"});
            document.body.appendChild(fi);
            fi.onchange=async()=>{
              if(!fi.files[0]){fi.remove();return;}
              const fd=new FormData();fd.append("file",fi.files[0],fi.files[0].name);
              try{
                const res=await fetch("/h3one/upload",{method:"POST",body:fd});
                const d=await res.json();
                if(d.ok){ S.refAudios.push(d.filename); persist(); _renderRefs(); }
              }catch(e){ console.warn(e); }
              fi.remove();
            };
            fi.click();
          };
          audRow.append(addAud);
          refArea.appendChild(audRow);
        }
        } else {
          const lockNote=mk("div",{fontSize:"8px",color:C.muted,lineHeight:"1.5",marginTop:"2px"});
          _tr(lockNote,"ui.audio.lock.on");
          refArea.appendChild(lockNote);
        }
      };
      refArea._render=_renderRefs;

      // Keyframes
      const _renderKf=()=>{
        kfArea.innerHTML="";
        const hdr=mk("div",{fontSize:"9px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:".07em"});
        _tr(hdr,"ui.keyframes",{n:S.kf.length});
        kfArea.appendChild(hdr);
        S.kf.forEach((k,idx)=>{
          const row=mk("div",{display:"flex",alignItems:"center",gap:"8px"});
          const slot=ImgSlot(false,n=>{k.img=n;persist();});
          row.appendChild(slot.el);
          if(k.img) slot._restorePreview(k.img);
          const posCap=mk("div",{fontSize:"9px",color:C.muted});_tr(posCap,"ui.frame");
          const posNI=NI("",k.pos,1,9999,1,v=>{k.pos=Math.round(v);persist();},"64px");
          posNI._inp.value=String(k.pos);
          const rm=mk("button",{}, {type:"button",className:"h3-rmbtn"});
          _tr(rm,"ui.remove.keyframe",null,"title");
          rm.setAttribute("aria-label",t("ui.remove.keyframe"));
          tx(rm,"x");
          if(!k.img) rm.style.display="none";
          rm.onclick=()=>{ if(S.kf.length>1){ S.kf.splice(idx,1); persist(); _renderKf(); } };
          row.append(posCap,posNI,rm);
          kfArea.appendChild(row);
        });
        const addRow=mk("div",{display:"flex",gap:"6px"});
        const addKf=mk("button",{background:"transparent",border:`1px dashed rgba(var(--h3accent-rgb),.4)`,borderRadius:"6px",padding:"4px 12px",fontSize:"9px",fontWeight:"700",color:"rgba(var(--h3accent-rgb),.7)",cursor:"pointer",outline:"none"});
        _tr(addKf,"ui.add.keyframe");
        addKf.onclick=()=>{ if(S.kf.length<32){ S.kf.push({img:null,pos:Math.min(9999, (S.kf.length+1)*62)}); persist(); _renderKf(); } };
        addRow.appendChild(addKf);
        kfArea.appendChild(addRow);
      };
      kfArea._render=_renderKf;

      // Extend video slot
      const exSlot=MediaSlot("video",n=>{S.extendVideo=n;persist();});
      exArea.append(_mkSlotCard("ui.video.extend",exSlot));
      if(S.extendVideo) exSlot._restorePreview(S.extendVideo);

      // Chain clips
      const _renderChain=()=>{
        chainArea.innerHTML="";
        const hdr=mk("div",{display:"flex",alignItems:"center",justifyContent:"space-between"});
        const clipsTitle=mk("div",{fontSize:"9px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:".07em"});
        _tr(clipsTitle,"ui.clips",{n:S.chainClips.length});
        hdr.appendChild(clipsTitle);
        const presBtn=mk("button",{background:"transparent",border:`1px solid ${C.border}`,cursor:"pointer",padding:"2px 8px",color:C.muted,outline:"none",borderRadius:"5px",fontSize:"9px",fontWeight:"700"});
        _tr(presBtn,"ui.discover.presets");
        presBtn.onmouseenter=()=>{presBtn.style.color=C.lime;presBtn.style.borderColor=C.lime;};
        presBtn.onmouseleave=()=>{presBtn.style.color=C.muted;presBtn.style.borderColor=C.border;};
        presBtn.onclick=(e)=>{e.stopPropagation();_renderDiscover();openOverlay(discoverOverlay);};
        hdr.appendChild(presBtn);
        chainArea.appendChild(hdr);
        const clipsList=mk("div",{display:"flex",flexDirection:"column",gap:"6px",maxHeight:"300px",overflowY:"auto",scrollbarWidth:"thin",scrollbarColor:`${C.border} transparent`,paddingRight:"2px"});
        S.chainClips.forEach((cl,idx)=>{
          const row=mk("div",{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:"8px",padding:"6px 8px",display:"flex",flexDirection:"column",gap:"4px"});
          const head=mk("div",{display:"flex",alignItems:"center",gap:"8px"});
          const num=mk("div",{fontSize:"10px",fontWeight:"700",color:C.lime,flexShrink:"0"});
          _tr(num,"ui.clip",{n:idx+1});
          const durNI=NI("",cl.duration,1,30,0.5,v=>{cl.duration=v;persist();},"56px");
          const durLbl=mk("div",{fontSize:"8px",color:C.muted,flexShrink:"0"});_tr(durLbl,"ui.sec");
          const rm=mk("button",{marginLeft:"auto"}, {type:"button",className:"h3-rmbtn"});
          _tr(rm,"ui.remove.clip",null,"title");
          rm.setAttribute("aria-label",t("ui.remove.clip"));
          tx(rm,"x");
          rm.onclick=()=>{ if(S.chainClips.length>1){ S.chainClips.splice(idx,1); persist(); _renderChain(); } };
          head.append(num,durNI,durLbl,rm);
          const ta=mk("textarea",{
            background:C.bg2,border:`1px solid ${C.border}`,borderRadius:"6px",
            color:C.text,fontSize:"11px",padding:"6px 8px",resize:"vertical",outline:"none",
            fontFamily:"inherit",lineHeight:"1.5",width:"100%",boxSizing:"border-box",minHeight:"44px",
          },{value:cl.prompt});
          _tr(ta,"ui.prompt.clip",{n:idx+1},"placeholder");
          ta.onfocus=()=>ta.style.borderColor=C.lime;
          ta.onblur=()=>ta.style.borderColor=C.border;
          ta.oninput=()=>{cl.prompt=ta.value;persist();};
          ta.addEventListener("wheel",e=>{ if(document.activeElement===ta) e.stopPropagation(); },{passive:true});
          row.append(head,ta);
          clipsList.appendChild(row);
        });
        chainArea.appendChild(clipsList);
        const addCl=mk("button",{background:"transparent",border:`1px dashed rgba(var(--h3accent-rgb),.4)`,borderRadius:"6px",padding:"4px 12px",fontSize:"9px",fontWeight:"700",color:"rgba(var(--h3accent-rgb),.7)",cursor:"pointer",outline:"none",alignSelf:"flex-start"});
        _tr(addCl,"ui.add.clip");
        addCl.onclick=()=>{ S.chainClips.push({prompt:"",duration:S.duration}); persist(); _renderChain(); };
        chainArea.appendChild(addCl);
        const mcRow=mk("div",{display:"flex",alignItems:"center",gap:"8px",background:C.bg1,border:`1px solid ${C.border}`,borderRadius:"8px",padding:"6px 8px"});
        const mcCapRow=mk("div",{display:"flex",alignItems:"center",gap:"4px"});
        const mcCap=mk("div",{fontSize:"9px",color:C.text});_tr(mcCap,"ui.context.length");
        mcCapRow.append(mcCap,infoIcon("tip.mc.length"));
        const MC_GRID=[1,5,22,39,56,73,90,107,124,141];
        const _snapMC=v=>{ v=Math.round(Number(v)||22); return MC_GRID.reduce((a,b)=>Math.abs(b-v)<Math.abs(a-v)?b:a,22); };
        S.mcLength=_snapMC(S.mcLength);
        const mcDD=DD(MC_GRID.map(String),String(S.mcLength),v=>{S.mcLength=parseInt(v)||22;persist();});
        mcRow.append(mcCapRow,mcDD.el);
        chainArea.appendChild(mcRow);
        const hint=mk("div",{fontSize:"8px",color:C.muted,lineHeight:"1.5"});
        _tr(hint,"ui.chain.hint");
        chainArea.appendChild(hint);
        const lockWrap=mk("div",{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:"8px",padding:"8px 10px",display:"flex",flexDirection:"column",gap:"6px"});
        const lockToggle=Toggle("ui.audio.lock",S.audioLock,v=>{
          S.audioLock=v;
          if(v){
            // Keep any audio the user already uploaded: promote the first
            // reference audio to the Audio Lock track instead of losing it.
            const af=_validAudioName(S.audioFile);
            if(!af && Array.isArray(S.refAudios)){
              const cand=S.refAudios.find(n=>_validAudioName(n));
              if(cand) S.audioFile=_validAudioName(cand);
            }
            S.refAudios=[];
          } else {
            if(!Array.isArray(S.refAudios)) S.refAudios=[];
            const af=_validAudioName(S.audioFile);
            if(af && !S.refAudios.includes(af)){
              S.refAudios.push(af);
            }
          }
          const track=_validAudioName(S.audioFile);
          if(track) _applyAudioLockClips(track);
          persist();
          _renderChain();
          _renderRefs();
        },S.audioLock?"ui.audio.lock.on":"ui.audio.lock.off");
        lockWrap.appendChild(lockToggle.el);
        if(S.audioLock){
          const lockNote=mk("div",{fontSize:"8px",color:C.muted,lineHeight:"1.5"});
          _tr(lockNote,"ui.audio.lock.on");
          lockWrap.appendChild(lockNote);
          const trackRow=mk("div",{display:"flex",alignItems:"center",gap:"6px"});
          const trackLbl=mk("div",{fontSize:"8px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:".07em",flexShrink:"0"});
          _tr(trackLbl,"ui.audio.track");
          const trackName=mk("div",{flex:"1",minWidth:"0",fontSize:"10px",color:C.lime,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"});
          const trackBtn=mk("button",{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:"6px",padding:"2px 8px",fontSize:"8px",fontWeight:"700",color:C.muted,cursor:"pointer",outline:"none",flexShrink:"0"});
          const trackInp=mk("input",{display:"none"},{type:"file",accept:"audio/*"});
          const _refreshTrack=()=>{
            const af=_validAudioName(S.audioFile);
            if(af){
              tx(trackName,af);trackName.style.color=C.lime;
              _tr(trackBtn,"ui.chain.change.track");
            } else {
              _tr(trackName,"ui.chain.no.track");trackName.style.color=C.dim;
              _tr(trackBtn,"ui.chain.select.track");
            }
          };
          trackBtn.onclick=()=>trackInp.click();
          trackInp.onchange=async()=>{
            const f=trackInp.files[0];trackInp.value="";
            if(!f) return;
            const fd=new FormData();fd.append("file",f,f.name);
            try{
              const res=await fetch("/h3one/upload",{method:"POST",body:fd});
              const data=await res.json();
              const fname=data&&(data.filename||data.name);
              if(!data.ok||!fname){ console.error("[H3One] upload failed:",data); return; }
              S.audioFile=fname;
              persist();
              _refreshTrack();
              _applyAudioLockClips(fname);
            }catch(e){ console.error("[H3One] upload error:",e); }
          };
          _refreshTrack();
          trackRow.append(trackLbl,trackName,trackBtn,trackInp);
          lockWrap.appendChild(trackRow);
        }
        chainArea.appendChild(lockWrap);
      };
      chainArea._render=_renderChain;

      const _audioDuration=(name)=>{
        return new Promise(resolve=>{
          const url=api.apiURL(`/view?filename=${encodeURIComponent(name)}&type=input&subfolder=`);
          const a=new Audio();
          let settled=false;
          const done=v=>{ if(settled) return; settled=true; a.removeEventListener("loadedmetadata",onM); a.removeEventListener("error",onE); resolve(v); };
          const onM=()=>{ const d=a.duration; done((Number.isFinite(d)&&d>0)?d:0); };
          const onE=()=>done(0);
          a.addEventListener("loadedmetadata",onM);
          a.addEventListener("error",onE);
          a.preload="metadata";
          a.src=url;
          setTimeout(()=>done(0),5000);
        });
      };
      const _splitClipsByAudio=(duration)=>{
        const total=Math.max(0.5,Number(duration)||0);
        if(!(total>0)) return null;
        const n=Math.max(1,Math.ceil(total/15));
        const clips=[];
        for(let i=0;i<n;i++){
          const start=i*15;
          const dur=Math.round(Math.min(15,total-start)*10)/10;
          if(dur<0.1) break;
          clips.push({prompt:"",duration:dur});
        }
        return clips.length?clips:null;
      };
      const _applyAudioLockClips=async(name)=>{
        const fn=_validAudioName(name);
        if(!fn||!S.audioLock) return;
        const dur=await _audioDuration(fn);
        if(!(dur>0)) return;
        let silences=[];
        let vocalBreaks=[];
        try{
          const r=await fetch("/h3one/audio_breaks?filename="+encodeURIComponent(fn));
          const d=await _resJson(r,"/h3one/audio_breaks");
          if(d&&Array.isArray(d.silences)) silences=d.silences;
          if(d&&Array.isArray(d.vocal_breaks)) vocalBreaks=d.vocal_breaks;
        }catch(e){}
        const points=_audioSplitPoints(dur,silences,vocalBreaks);
        const clips=[];
        for(let i=0;i<points.length-1;i++){
          const d=Math.round((points[i+1]-points[i])*10)/10;
          if(d>=0.5) clips.push({prompt:"",duration:d});
        }
        if(!clips.length) return;
        S.chainClips=clips;
        persist();
        _renderChain();
      };

      const _updateModeSections=()=>{
        _clearSections();
        modeCard.style.display=S.mode==="t2v"?"none":"";
        promptCard.style.display=S.mode==="chain"?"none":"";
        if(S.mode==="chain"){
          durRow.style.display="none";
        } else {
          durRow.style.display="flex";
          durCap._i18nApply?.();
          durNI._inp.disabled=false;
          durNI.style.opacity="";
        }
        modeTitle._i18nApply?.();
        modeDesc._i18nApply?.();
        if(S.mode==="i2v"){ modeHdr.style.display="flex"; i2vArea.style.display="flex"; }
        else if(S.mode==="r2v"){ modeHdr.style.display="flex"; _renderRefs(); refArea.style.display="flex"; }
        else if(S.mode==="keyframes"){ modeHdr.style.display="flex"; _renderKf(); kfArea.style.display="flex"; }
        else if(S.mode==="extend"){ modeHdr.style.display="flex"; exArea.style.display="flex"; }
        else if(S.mode==="chain"){ modeHdr.style.display="flex"; _renderRefs(); refArea.style.display="flex"; _renderChain(); chainArea.style.display="flex"; }
        else { modeHdr.style.display="none"; }
      };

      // -- PARAMS ------------------------------------------------------------
      const paramsHdr=mk("div",{display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",userSelect:"none"});
      paramsHdr.appendChild(cap("ui.tune"));
      paramsHdr.lastChild.style.marginBottom="0";
      const paramsChev=mk("span",{marginLeft:"auto",color:C.dim,fontSize:"10px",flexShrink:"0"});
      tx(paramsChev,"▾");
      paramsHdr.appendChild(paramsChev);
      const params=mk("div",{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"});
      let _resItems=[];
      const _resolveRes=()=>{
        if(S.resolution==="Custom"){
          const w=Math.max(32,Math.min(16384,Math.round(S.customW/32)*32));
          const h=Math.max(32,Math.min(16384,Math.round(S.customH/32)*32));
          return {width:w,height:h,label:`${w}x${h} (custom)`};
        }
        return _resItems.find(r=>r.label===S.resolution)||_resItems[0]||{width:960,height:544,label:S.resolution};
      };
      const resRow=mk("div",{display:"flex",flexDirection:"column",gap:"3px"});
      const resInputs=mk("div",{display:"flex",gap:"6px",alignItems:"stretch"});
      const resCol=mk("div",{flex:"1",minWidth:"0",display:"flex",flexDirection:"column",gap:"3px"});
      const resCapRow=mk("div",{display:"flex",alignItems:"center",gap:"4px"});
      const resCap=mk("div",{fontSize:"10px",color:C.text});_tr(resCap,"ui.resolution");
      resCapRow.append(resCap,infoIcon("tip.resolution"));
      const resDD=DD([],S.resolution,v=>{
        S.resolution=v;
        const r=_resolveRes();
        S.aspect=_nearestAspect(r.width,r.height);
        ratioDD.set(_aspectLabel(S.aspect));
        persist();_updateFramesLabel();_updResCustom();
      });
      resCol.append(resCapRow,resDD.el);
      const ratioCol=mk("div",{width:"84px",flexShrink:"0",display:"flex",flexDirection:"column",gap:"3px"});
      const ratioCap=mk("div",{fontSize:"10px",color:C.text});_tr(ratioCap,"ui.aspect");
      const ratioItems=ASPECT_RATIOS.map(v=>_aspectLabel(v));
      const ratioDD=DD(ratioItems,_aspectLabel(S.aspect),v=>{ _applyAspect(_aspectValue(v)); });
      ratioCol.append(ratioCap,ratioDD.el);
      resInputs.append(ratioCol,resCol);
      resRow.append(resInputs);
      const resCustom=mk("div",{display:"none",alignItems:"center",gap:"6px"});
      const resCW=NI("",S.customW,32,16384,32,v=>{S.customW=Math.max(32,Math.min(16384,Math.round(v/32)*32));persist();_updResMP();},"58px");
      const resCH=NI("",S.customH,32,16384,32,v=>{S.customH=Math.max(32,Math.min(16384,Math.round(v/32)*32));persist();_updResMP();},"58px");
      const resX=mk("div",{fontSize:"10px",color:C.muted,flexShrink:"0"});tx(resX,"x");
      const resMPLbl=mk("div",{fontSize:"9px",color:C.muted,flexShrink:"0"});
      const _updResMP=()=>{
        const w=Math.max(32,Math.round(S.customW/32)*32), h=Math.max(32,Math.round(S.customH/32)*32);
        tx(resMPLbl,`${((w*h)/1000000).toFixed(2)}MP`);
        const over=Math.min(w,h)>768||Math.max(w,h)>1344;
        resMPLbl.style.color=over?C.warn:C.muted;
      };
      resCustom.append(resCW,resX,resCH,resMPLbl);
      resRow.appendChild(resCustom);
      const _updResCustom=()=>{ resCustom.style.display=S.resolution==="Custom"?"flex":"none"; _updResMP(); };
      const _aspectItems=()=>{
        const src=_resItems.length?_resItems:FALLBACK_RESOLUTIONS;
        if(S.aspect==="auto") return src.map(r=>r.label).concat("Custom");
        const target=_aspectRatioNum(S.aspect);
        return src.filter(r=>Math.abs((r.width/r.height)-target)<=ASPECT_TOL).map(r=>r.label).concat("Custom");
      };
      const _syncAspectFromResolution=()=>{
        const src=_resItems.length?_resItems:FALLBACK_RESOLUTIONS;
        const p=src.find(r=>r.label===S.resolution);
        if(p){
          S.aspect=_nearestAspect(p.width,p.height);
        } else {
          const r=_resolveRes();
          S.aspect=_nearestAspect(r.width,r.height);
        }
        ratioDD.set(_aspectLabel(S.aspect));
      };
      const _applyAspect=(ratio)=>{
        S.aspect=ratio;
        const labels=_aspectItems();
        if(ratio==="auto"){
          if(_resItems.length&&!_resItems.some(r=>r.label===S.resolution)&&S.resolution!=="Custom"){
            S.resolution=_resItems[0].label;
          }
          resDD.updateItems(labels);
          resDD.set(S.resolution);
          _updResCustom();
          persist();
          return;
        }
        const target=_aspectRatioNum(ratio);
        const matches=_resItems.filter(r=>Math.abs((r.width/r.height)-target)<=ASPECT_TOL);
        if(matches.length){
          const mpTarget=0.52;
          matches.sort((a,b)=>Math.abs(a.width*a.height/1e6-mpTarget)-Math.abs(b.width*b.height/1e6-mpTarget));
          S.resolution=matches[0].label;
        } else {
          const maxW=1344,maxH=768;
          let w,h;
          if(target>=1){
            w=maxW; h=Math.round(w/target/32)*32;
            if(h>maxH){ h=maxH; w=Math.round(h*target/32)*32; }
          } else {
            h=maxH; w=Math.round(h*target/32)*32;
            if(w>maxW){ w=maxW; h=Math.round(w/target/32)*32; }
          }
          S.customW=Math.max(32,Math.min(16384,w));
          S.customH=Math.max(32,Math.min(16384,h));
          resCW._inp.value=String(S.customW);
          resCH._inp.value=String(S.customH);
          S.resolution="Custom";
        }
        resDD.updateItems(labels);
        resDD.set(S.resolution);
        _updResCustom();
        persist();
      };
      const durRow=mk("div",{display:"flex",flexDirection:"column",gap:"3px"});
      const durCap=mk("div",{fontSize:"10px",color:C.text});_tr(durCap,"ui.duration");
      const durInner=mk("div",{display:"flex",alignItems:"center",gap:"8px"});
      const durNI=NI("",S.duration,1,30,0.5,v=>{S.duration=v;persist();_updateFramesLabel();},"60px");
      const framesLbl=mk("div",{fontSize:"9px",color:C.muted,flexShrink:"0"});
      durInner.append(durNI,framesLbl);
      durRow.append(durCap,durInner);
      const stepsRow=mk("div",{display:"flex",flexDirection:"column",gap:"3px"});
      const stepsCap=mk("div",{fontSize:"10px",color:C.text});_tr(stepsCap,"ui.steps");
      const stepsNI=NI("",S.steps,1,60,1,v=>{S.steps=Math.round(v);persist();},"60px");
      stepsRow.append(stepsCap,stepsNI);
      const qualRow=mk("div",{display:"flex",flexDirection:"column",gap:"3px"});
      const qualCapRow=mk("div",{display:"flex",alignItems:"center",gap:"4px"});
      const qualCap=mk("div",{fontSize:"10px",color:C.text});_tr(qualCap,"ui.quality");
      qualCapRow.append(qualCap,infoIcon("tip.quality"));
      const qualDD=DD(["Balanced","Speed","High Quality","Turbo (Speed LoRA)"],S.quality==="balanced"?"Balanced":S.quality==="speed"?"Speed":S.quality==="high"?"High Quality":"Turbo (Speed LoRA)",v=>{
        S.quality= v==="Balanced"?"balanced": v==="Speed"?"speed": v==="High Quality"?"high":"turbo";
        persist();
        if(S.quality==="turbo"){ stepsNI._inp.value="6"; S.steps=6; }
      });
      qualRow.append(qualCapRow,qualDD.el);
      const samplerRow=mk("div",{display:"flex",flexDirection:"column",gap:"3px"});
      const samplerCapRow=mk("div",{display:"flex",alignItems:"center",gap:"4px"});
      const samplerCap=mk("div",{fontSize:"10px",color:C.text});_tr(samplerCap,"ui.sampler");
      samplerCapRow.append(samplerCap,infoIcon("tip.sampler"));
      const samplerDD=DD(["euler","euler_cfg_pp","euler_ancestral","euler_ancestral_cfg_pp","heun","heunpp2","exp_heun_2_x0","exp_heun_2_x0_sde","dpm_2","dpm_2_ancestral","lms","dpm_fast","dpm_adaptive","dpmpp_2s_ancestral","dpmpp_2s_ancestral_cfg_pp","dpmpp_sde","dpmpp_sde_gpu","dpmpp_2m","dpmpp_2m_cfg_pp","dpmpp_2m_sde","dpmpp_2m_sde_gpu","dpmpp_2m_sde_heun","dpmpp_2m_sde_heun_gpu","dpmpp_3m_sde","dpmpp_3m_sde_gpu","ddpm","lcm","ipndm","ipndm_v","deis","res_multistep","res_multistep_cfg_pp","res_multistep_ancestral","res_multistep_ancestral_cfg_pp","gradient_estimation","gradient_estimation_cfg_pp","er_sde","seeds_2","seeds_3","sa_solver","sa_solver_pece","ddim","uni_pc","uni_pc_bh2","legacy_rk","rk","rk_beta","deis_3m_ode","deis_2m_ode","deis_3m","deis_2m","res_6s_ode","res_5s_ode","res_3s_ode","res_2s_ode","res_3m_ode","res_2m_ode","res_6s","res_5s","res_3s","res_2s","res_3m","res_2m"],S.samplerName||"res_multistep",v=>{S.samplerName=v;persist();});
      samplerRow.append(samplerCapRow,samplerDD.el);
      const schedRow=mk("div",{display:"flex",flexDirection:"column",gap:"3px"});
      const schedCapRow=mk("div",{display:"flex",alignItems:"center",gap:"4px"});
      const schedCap=mk("div",{fontSize:"10px",color:C.text});_tr(schedCap,"ui.scheduler");
      schedCapRow.append(schedCap,infoIcon("tip.scheduler"));
      const schedDD=DD(["simple","sgm_uniform","karras","exponential","ddim_uniform","beta","normal","linear_quadratic","kl_optimal","bong_tangent","beta57"],S.schedulerName||"simple",v=>{S.schedulerName=v;persist();});
      schedRow.append(schedCapRow,schedDD.el);
      const sigmaRow=mk("div",{display:"flex",flexDirection:"column",gap:"3px"});
      const sigmaCapRow=mk("div",{display:"flex",alignItems:"center",gap:"4px"});
      const sigmaCap=mk("div",{fontSize:"10px",color:C.text});_tr(sigmaCap,"ui.sigma.refine");
      sigmaCapRow.append(sigmaCap,infoIcon("tip.sigma.refine"));
      const sigmaInner=mk("div",{display:"flex",alignItems:"center",gap:"8px"});
      const sigmaRange=mk("input",{flex:"1",minWidth:"0",height:"16px",cursor:"pointer",accentColor:"var(--h3accent)",margin:"0"},{type:"range",min:"0",max:"15",step:"1",value:String(S.sigmaRefine)});
      const sigmaVal=mk("div",{fontSize:"11px",color:C.lime,width:"16px",textAlign:"right",flexShrink:"0",fontVariantNumeric:"tabular-nums"});
      tx(sigmaVal,String(S.sigmaRefine));
      sigmaRange.oninput=()=>{
        const v=Math.round(Number(sigmaRange.value)||0);
        S.sigmaRefine=Math.max(0,Math.min(15,v));
        tx(sigmaVal,String(S.sigmaRefine));
        persist();
      };
      sigmaInner.append(sigmaRange,sigmaVal);
      sigmaRow.append(sigmaCapRow,sigmaInner);
      const dualRow=mk("div",{display:"flex",flexDirection:"column",gap:"2px"});
      const dualToggle=Toggle("ui.dual", !!S.dualPass, v=>{
        S.dualPass=!!v;
        persist();
      }, "tip.dual");
      dualToggle.el.style.borderBottom="none";
      dualToggle.el.style.padding="6px 0";
      dualRow.append(dualToggle.el);
      params.append(resRow,durRow,stepsRow,qualRow,samplerRow,schedRow,sigmaRow,dualRow);
      const _saveModeState=()=>{
        S.modeSettings[S.mode]={
          prompt:S.prompt,steps:S.steps,quality:S.quality,resolution:S.resolution,duration:S.duration,
          loras:JSON.parse(JSON.stringify(S.loras)),
        };
      };
      const _restoreModeState=()=>{
        const ms=S.modeSettings[S.mode];
        if(!ms) return;
        if(ms.prompt!==undefined){ S.prompt=ms.prompt; promptTA.value=ms.prompt; _updChars(); }
        if(ms.steps!==undefined){ S.steps=ms.steps; stepsNI._inp.value=String(ms.steps); }
        if(ms.quality!==undefined){ S.quality=ms.quality; qualDD.set(ms.quality==="balanced"?"Balanced":ms.quality==="speed"?"Speed":ms.quality==="high"?"High Quality":"Turbo (Speed LoRA)"); }
        if(ms.resolution!==undefined){
          S.resolution=ms.resolution;
          _syncAspectFromResolution();
          resDD.updateItems(_aspectItems());
          resDD.set(S.resolution);
          _updResCustom();
        }
        if(ms.duration!==undefined){ S.duration=ms.duration; durNI._inp.value=String(ms.duration); _updateFramesLabel(); }
        if(Array.isArray(ms.loras)){ const named=ms.loras.filter(l=>l&&l.name); S.loras=named.concat([{name:"",strength:1}]); _renderLoras(); }
        if(Array.isArray(ms.refImages)) S.refImages=ms.refImages.slice();
        if(Array.isArray(ms.refVideos)) S.refVideos=ms.refVideos.map(v=>(typeof v==="string")?{name:v,useAudio:false}:{name:(v&&v.name)||"",useAudio:!!(v&&v.useAudio)});
        if(Array.isArray(ms.refAudios)) S.refAudios=ms.refAudios.slice();
      };
      const _switchMode=(m)=>{
        if(S.mode===m) return;
        _saveModeState();
        // Reference slots are per-mode (R2V and Audio Drive keep their own sets).
        const ms0=S.modeSettings[S.mode]||{};
        ms0.refImages=(S.refImages||[]).slice();
        ms0.refVideos=(S.refVideos||[]).map(v=>(typeof v==="string")?{name:v,useAudio:false}:{name:(v&&v.name)||"",useAudio:!!(v&&v.useAudio)});
        ms0.refAudios=(S.refAudios||[]).slice();
        S.modeSettings[S.mode]=ms0;
        S.mode=m;
        _restoreModeState();
        persist();
        _updateTabs();
        _updateModeSections();
      };

      // -- LoRA slots (Advanced) ----------------------------------------------
      const loraArea=mk("div",{}, {className:"h3-card"});
      const loraHdr=mk("div",{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",userSelect:"none"});
      const loraTitle=mk("div",{fontSize:"9px",fontWeight:"700",letterSpacing:".1em",textTransform:"uppercase",color:C.muted});
      _tr(loraTitle,"ui.advanced");
      const loraSub=mk("div",{fontSize:"10px",color:C.muted,marginLeft:"auto",marginRight:"8px"});_tr(loraSub,"ui.loras.none");
      const loraChev=mk("span",{color:C.dim,fontSize:"10px",flexShrink:"0"});
      tx(loraChev,"▾");
      loraHdr.append(loraTitle,loraSub,loraChev);
      const loraBody=mk("div",{display:"flex",flexDirection:"column",gap:"5px"});
      const loraRowsWrap=mk("div",{display:"flex",flexDirection:"column",gap:"5px"});
      loraBody.appendChild(loraRowsWrap);
      const addLoraBtn=mk("button",{background:"transparent",border:`1px dashed rgba(var(--h3accent-rgb),.4)`,borderRadius:"6px",padding:"4px 12px",fontSize:"9px",fontWeight:"700",color:"rgba(var(--h3accent-rgb),.7)",cursor:"pointer",outline:"none",alignSelf:"flex-start"});
      _tr(addLoraBtn,"ui.add.lora");
      addLoraBtn.onmouseenter=()=>{addLoraBtn.style.borderColor=C.lime;addLoraBtn.style.color=C.lime;};
      addLoraBtn.onmouseleave=()=>{addLoraBtn.style.borderColor="rgba(var(--h3accent-rgb),.4)";addLoraBtn.style.color="rgba(var(--h3accent-rgb),.7)";};
      addLoraBtn.onclick=()=>{
        if(S.loras.length>=8) return;
        S.loras.push({name:"",strength:1});
        persist();
        _renderLoras();
      };
      loraBody.appendChild(addLoraBtn);
      loraArea.append(loraHdr,loraBody);
      const loraRows=[];
      const _renderLoras=()=>{
        loraRows.forEach(r=>r.remove());
        loraRows.length=0;
        S.loras.forEach((lr,idx)=>{
          const row=mk("div",{display:"flex",alignItems:"center",gap:"6px"});
          const dd=DD(_M.loras.length?_M.loras:["none"],lr.name||"none",async v=>{
            lr.name=v==="none"?"":v;persist();
            if(lr.name){
              try{
                const r=await fetch(`/h3one/lora_triggers?name=${encodeURIComponent(lr.name)}`);
                const d=await r.json();
                if(d.ok&&d.triggers&&d.triggers.length){
                  const tw=d.triggers.join(", ");
                  if(!(S.prompt||"").includes(tw)){
                    _setPrompt((S.prompt?S.prompt+" ":"")+tw);
                  }
                }
              }catch(e){ console.warn("[H3One] lora triggers:",e); }
            }
            _renderLoras();
          });
          const stNI=NI("",lr.strength,-3,3,0.1,v=>{lr.strength=Math.round(v*100)/100;persist();},"52px");
          const rm=mk("button",{flexShrink:"0"}, {type:"button",className:"h3-rmbtn"});
          _tr(rm,"ui.remove.lora",null,"title");
          rm.setAttribute("aria-label",t("ui.remove.lora"));
          tx(rm,"x");
          rm.onclick=()=>{
            S.loras.splice(idx,1);
            if(!S.loras.length) S.loras=[{name:"",strength:1}];
            persist();
            _renderLoras();
          };
          if(!lr.name && S.loras.length<=1) rm.style.display="none";
          row.append(dd.el,stNI,rm);
          loraRowsWrap.appendChild(row);
          loraRows.push(row);
        });
        addLoraBtn.style.display=S.loras.length>=8?"none":"";
        const _n=S.loras.filter(l=>l&&l.name).length;
        _tr(loraSub, _n?"ui.loras.loaded":"ui.loras.none", _n?{n:_n}:null);
      };
      _renderLoras();

      // -- Latent upscaler panel ----------------------------------------------
      const latentCard=mk("div",{}, {className:"h3-card"});
      const latentHdr=mk("div",{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",userSelect:"none"});
      const latentTitle=mk("div",{fontSize:"9px",fontWeight:"700",letterSpacing:".1em",textTransform:"uppercase",color:C.muted});
      _tr(latentTitle,"ui.latent.upscaler");
      const latentChev=mk("span",{color:C.dim,fontSize:"10px",flexShrink:"0"});
      tx(latentChev,"▾");
      latentHdr.append(latentTitle,latentChev);
      const latentBody=mk("div",{display:"flex",flexDirection:"column",gap:"7px"});
      const latentToggle=Toggle("ui.latent.enabled",S.latentUpscale.enabled,v=>{
        S.latentUpscale.enabled=v;persist();_updLatentUI();
      });
      latentBody.appendChild(latentToggle.el);
      const latentModelWrap=mk("div",{display:"flex",flexDirection:"column",gap:"3px"});
      const latentModelCap=mk("div",{fontSize:"9px",fontWeight:"700",letterSpacing:".06em",textTransform:"uppercase",color:C.muted});
      _tr(latentModelCap,"ui.latent.model");
      latentModelWrap.appendChild(latentModelCap);
      const latentUpscaleDD=DD(["none"],S.latentUpscale.model,v=>{
        S.latentUpscale.model=v;S.models.latentUpscaleModel=v;persist();_updLatentUI();
      });
      latentModelWrap.appendChild(latentUpscaleDD.el);
      latentBody.appendChild(latentModelWrap);
      const latentGrid=mk("div",{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px"});
      const latentVarWrap=mk("div",{display:"flex",flexDirection:"column",gap:"3px"});
      const latentVarCapRow=mk("div",{display:"flex",alignItems:"center",gap:"4px"});
      const latentVarCap=mk("div",{fontSize:"9px",fontWeight:"700",letterSpacing:".06em",textTransform:"uppercase",color:C.muted});
      _tr(latentVarCap,"ui.latent.variant");
      latentVarCapRow.append(latentVarCap,infoIcon("tip.latent.variant"));
      latentVarWrap.appendChild(latentVarCapRow);
      const latentVarDD=DD(["2D","3D"],S.latentUpscale.variant==="3d"?"3D":"2D",v=>{
        S.latentUpscale.variant=v==="3D"?"3d":"2d";persist();_updLatentUI();
      });
      latentVarWrap.appendChild(latentVarDD.el);
      const latentScaleWrap=mk("div",{display:"flex",flexDirection:"column",gap:"3px"});
      const latentScaleCapRow=mk("div",{display:"flex",alignItems:"center",gap:"4px"});
      const latentScaleCap=mk("div",{fontSize:"9px",fontWeight:"700",letterSpacing:".06em",textTransform:"uppercase",color:C.muted});
      _tr(latentScaleCap,"ui.latent.scale");
      latentScaleCapRow.append(latentScaleCap,infoIcon("tip.latent.scale"));
      latentScaleWrap.appendChild(latentScaleCapRow);
      const latentScaleNI=NI("",S.latentUpscale.scale,1.0,4.0,0.1,v=>{
        S.latentUpscale.scale=Math.round(v*10)/10;persist();_updLatentUI();
      },"100%");
      latentScaleWrap.appendChild(latentScaleNI);
      const latentDevWrap=mk("div",{display:"flex",flexDirection:"column",gap:"3px"});
      const latentDevCap=mk("div",{fontSize:"9px",fontWeight:"700",letterSpacing:".06em",textTransform:"uppercase",color:C.muted});
      _tr(latentDevCap,"ui.latent.device");
      latentDevWrap.appendChild(latentDevCap);
      const latentDevDD=DD(["cuda","cpu"],S.latentUpscale.device,v=>{
        S.latentUpscale.device=v;persist();_updLatentUI();
      });
      latentDevWrap.appendChild(latentDevDD.el);
      const latentPrecWrap=mk("div",{display:"flex",flexDirection:"column",gap:"3px"});
      const latentPrecCap=mk("div",{fontSize:"9px",fontWeight:"700",letterSpacing:".06em",textTransform:"uppercase",color:C.muted});
      _tr(latentPrecCap,"ui.latent.precision");
      latentPrecWrap.appendChild(latentPrecCap);
      const latentPrecDD=DD(["fp32","fp16","bf16"],S.latentUpscale.precision,v=>{
        S.latentUpscale.precision=v;persist();_updLatentUI();
      });
      latentPrecWrap.appendChild(latentPrecDD.el);
      latentGrid.append(latentVarWrap,latentScaleWrap,latentDevWrap,latentPrecWrap);
      latentBody.appendChild(latentGrid);
      const latentHint=mk("div",{fontSize:"8px",color:C.muted,lineHeight:"1.5"});
      _tr(latentHint,"ui.latent.hint");
      latentBody.appendChild(latentHint);
      latentCard.append(latentHdr,latentBody);
      const _updLatentUI=()=>{
        const on=S.latentUpscale.enabled;
        latentBody.style.opacity=on?"1":".45";
        latentToggle._setChecked(on);
      };
      _updLatentUI();

      // -- Seed row (inside the Tune card) ------------------------------------
      const seedBody=mk("div",{display:"flex",flexDirection:"column",gap:"5px"});
      const seedRow=mk("div",{}, {className:"h3-seedrow"});
      const seedLbl=mk("span",{}, {className:"h3-slbl"});_tr(seedLbl,"ui.seed");
      const seedNI=NI("",S.seed,0,9007199254740991,1,v=>{S.seed=Math.round(v);persist();},"110px");
      seedNI.style.height="34px";seedNI.style.borderRadius="9px";seedNI.style.background="var(--h3-panel)";
      seedNI.style.border="1px solid var(--h3-line)";seedNI.style.width="auto";seedNI.style.flex="1 1 0";
      seedNI.style.minWidth="0";seedNI.style.maxWidth="150px";
      const _rollSeed=()=>{ S.seed=Math.floor(Math.random()*9007199254740991); seedNI._inp.value=String(S.seed); persist(); };
      const randLbl=mk("span",{}, {className:"h3-slbl"});_tr(randLbl,"ui.random");
      const randTgl=mk("button",{}, {type:"button",role:"switch",className:"h3-tgl","aria-label":"Randomize seed",title:"Randomize seed"});
      randTgl.appendChild(mk("span",{}, {className:"thumb"}));
      const _updSeedUI=()=>{
        randTgl.classList.toggle("on",S.randomizeSeed);
        randTgl.setAttribute("aria-checked",S.randomizeSeed?"true":"false");
        tx(randLbl,S.randomizeSeed?"Random":"Fixed");
        randLbl.style.color=S.randomizeSeed?"var(--h3accent)":"";
        seedNI._inp.style.color=S.randomizeSeed?C.dim:C.text;
      };
      _updSeedUI();
      randTgl.onclick=()=>{
        if(S.randomizeSeed){ S.randomizeSeed=false; _rollSeed(); }
        else { S.randomizeSeed=true; persist(); }
        _updSeedUI();
      };
      const batchLbl=mk("span",{}, {className:"h3-slbl"});_tr(batchLbl,"ui.batch");
      const batchNI=NI("",S.batch,1,4,1,v=>{S.batch=Math.round(v);persist();},"56px");
      batchNI.style.height="34px";batchNI.style.borderRadius="9px";batchNI.style.background="var(--h3-panel)";
      batchNI.style.border="1px solid var(--h3-line)";
      seedRow.append(seedLbl,seedNI,randLbl,randTgl,batchLbl,batchNI);
      seedBody.appendChild(seedRow);

      // -- RIGHT: preview + gallery ------------------------------------------
      const rightPanel=mk("div",{flex:"1",minWidth:"0",display:"flex",flexDirection:"column",gap:"8px",overflow:"hidden"});
      const previewBox=mk("div",{
        width:"100%",flex:"1",minHeight:"180px",background:"#000",
        borderRadius:"10px",border:`1px solid ${C.border}`,
        position:"relative",overflow:"hidden",
      });
      const placeholder=mk("div",{position:"absolute",inset:"0",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"8px"});
      const phIco=mk("div",{fontSize:"28px",opacity:".25"});_tr(phIco,"ui.video.word");
      const phLbl=mk("div",{fontSize:"11px",color:C.muted});_tr(phLbl,"ui.generated.placeholder");
      placeholder.append(phIco,phLbl);
      const vidEl=mk("video",{position:"absolute",inset:"0",width:"100%",height:"100%",objectFit:"contain",display:"none",background:"#000"},{controls:true});
      const errorBox=mk("div",{position:"absolute",inset:"0",display:"none",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"16px",color:C.err,fontSize:"11px",lineHeight:"1.6",textAlign:"center",background:"rgba(0,0,0,.8)"});
      const progWrap=mk("div",{position:"absolute",bottom:"0",left:"0",right:"0",background:"linear-gradient(transparent,rgba(0,0,0,.88))",padding:"14px 14px 10px",display:"none",flexDirection:"column",gap:"4px",pointerEvents:"none"});
      const progTop=mk("div",{display:"flex",justifyContent:"space-between",alignItems:"center"});
      const progStage=mk("div",{fontSize:"11px",fontWeight:"600",color:C.text,flex:"1"});tx(progStage,t("ui.generating"));
      const progPct=mk("div",{fontSize:"10px",color:C.muted,flexShrink:"0"});tx(progPct,"0%");
      progTop.append(progStage,progPct);
      const progBar=mk("div",{height:"3px",borderRadius:"2px",background:"rgba(255,255,255,.15)",overflow:"hidden",marginTop:"4px"});
      const progFill=mk("div",{height:"100%",background:C.lime,width:"0%",transition:"width .3s ease"});
      progBar.appendChild(progFill);
      progWrap.append(progTop,progBar);
      const seedChip=mk("div",{}, {className:"h3-seedchip"});
      const seedChipLbl=mk("span",{}, {className:"scl"});_tr(seedChipLbl,"ui.seed");
      const seedChipVal=mk("span",{}, {className:"scv",textContent:""});
      const seedChipCopy=mk("button",{}, {type:"button",className:"h3-seedbtn",title:"Copy seed value","aria-label":"Copy seed value"});
      seedChipCopy.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      seedChipCopy._lbl=mk("span",{});tx(seedChipCopy._lbl,t("ui.copy"));
      seedChipCopy.appendChild(seedChipCopy._lbl);
      seedChipCopy.onclick=async(e)=>{
        e.stopPropagation();
        const ok=await h3Copy(seedChipVal.textContent);
        tx(seedChipCopy._lbl,t(ok?"ui.copied":"ui.failed"));
        seedChipCopy.classList.add(ok?"ok":"err");
        setTimeout(()=>{ tx(seedChipCopy._lbl,t("ui.copy")); seedChipCopy.classList.remove("ok","err"); },1300);
      };
      seedChip.append(seedChipLbl,seedChipVal,seedChipCopy);
      previewBox.append(placeholder,vidEl,errorBox,progWrap,seedChip);
      const setStage=(l,p)=>{
        tx(progStage,l);progFill.style.width=p+"%";tx(progPct,Math.round(p)+"%");
      };
      const timeBar=mk("div",{display:"none",alignItems:"center",justifyContent:"center",gap:"7px",background:C.bg1,border:`1px solid ${C.border}`,borderRadius:"8px",padding:"5px 10px"});
      const timeIco=mk("span",{fontSize:"10px",opacity:".7"});tx(timeIco,"⏱");
      const timeLbl=mk("span",{fontSize:"9px",fontWeight:"700",letterSpacing:".05em",textTransform:"uppercase",color:C.muted});_tr(timeLbl,"ui.generation.time");
      const timeVal=mk("span",{fontSize:"11px",fontWeight:"700",color:C.lime,fontVariantNumeric:"tabular-nums"});tx(timeVal,"0s");
      timeBar.append(timeIco,timeLbl,timeVal);
      const _updateTimeBar=(filename)=>{
        const genT=_genTimeByFile[filename];
        if(genT){
          tx(timeVal,fmtDur(genT));
          timeBar.style.display="flex";
          return;
        }
        timeBar.style.display="none";
        _fetchTimeFromHistory(filename).then(hitT=>{
          if(hitT && _curItem && _curItem.filename===filename){
            _genTimeByFile[filename]=hitT;
            tx(timeVal,fmtDur(hitT));
            timeBar.style.display="flex";
          }
        });
      };
      const showTime=(ms)=>{
        if(ms>0&&_activeShownFiles.length){
          const lastShown=_activeShownFiles[_activeShownFiles.length-1];
          _genTimeByFile[lastShown]=ms;
        }
        if(_curItem) _updateTimeBar(_curItem.filename);
      };
      const galleryBox=mk("div",{display:"flex",gap:"8px",overflowX:"auto",paddingBottom:"4px",scrollbarWidth:"thin"});
      const galleryHdr=mk("div",{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"6px",padding:"2px 0 5px"});
      const galleryTitle=mk("div",{fontSize:"9px",fontWeight:"700",letterSpacing:".1em",textTransform:"uppercase",color:C.muted});
      _tr(galleryTitle,"ui.outputs");
      const galleryRefresh=mk("button",{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:"6px",padding:"0 10px",height:"22px",fontSize:"8px",fontWeight:"700",letterSpacing:".04em",textTransform:"uppercase",color:C.muted,cursor:"pointer",outline:"none",display:"inline-flex",alignItems:"center",justifyContent:"center",transition:"border-color .15s, color .15s"});
      _tr(galleryRefresh,"ui.refresh");
      galleryRefresh.onmouseenter=()=>{galleryRefresh.style.borderColor=C.lime;galleryRefresh.style.color=C.lime;};
      galleryRefresh.onmouseleave=()=>{galleryRefresh.style.borderColor=C.border;galleryRefresh.style.color=C.muted;};
      galleryRefresh.onclick=()=>_loadGallery();
      const galleryActs=mk("div",{display:"flex",gap:"5px",alignItems:"center"});
      const actBtn=(lKey,cb,opts={})=>{
        const b=mk("button",{}, {type:"button",className:"h3-actbtn"+(opts.danger?" danger":"")+(opts.warn?" warn":"")+(opts.on?" on":"")});
        if(opts.icon) b.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${opts.icon}</svg>`;
        b._lbl=mk("span",{});_tr(b._lbl,lKey);
        b.appendChild(b._lbl);
        if(opts.title) b.title=opts.title;
        b.onclick=cb;
        return b;
      };
      const ICON_FAV='<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>';
      const ICON_OPEN='<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/>';
      const ICON_DEL='<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>';
      const ICON_REFRESH='<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>';
      galleryActs.append(
        actBtn("ui.favorite",()=>_favCurrent(),{icon:ICON_FAV}),
        actBtn("ui.open",()=>_openCurrent(),{icon:ICON_OPEN}),
        actBtn("ui.delete",()=>_delCurrent(),{icon:ICON_DEL,danger:true})
      );
      const saveTogBtn=mk("button",{}, {type:"button",className:"h3-actbtn"+(S.autoSave?" on":"")});
      saveTogBtn._lbl=mk("span",{});tx(saveTogBtn._lbl,t(S.autoSave?"ui.save.on":"ui.save.off"));
      saveTogBtn.appendChild(saveTogBtn._lbl);
      saveTogBtn.title=t("ui.autosave.title");
      saveTogBtn.onclick=()=>{
        S.autoSave=!S.autoSave;persist();
        saveTogBtn.classList.toggle("on",S.autoSave);
        tx(saveTogBtn._lbl,t(S.autoSave?"ui.save.on":"ui.save.off"));
      };
      galleryRefresh.style.height="26px";
      galleryRefresh.style.borderRadius="8px";
      galleryRefresh.style.background="linear-gradient(180deg,#2b2b2b,#1e1e1e)";
      galleryRefresh.style.border="1px solid var(--h3-line2)";
      galleryRefresh.style.borderBottomColor="#141414";
      galleryRefresh.style.boxShadow="inset 0 1px 0 rgba(255,255,255,.07), 0 1px 3px rgba(0,0,0,.45)";
      galleryRefresh.style.fontSize="9.5px";
      galleryRefresh.innerHTML=`<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_REFRESH}</svg>`+`<span style="margin-left:5px;">Refresh</span>`;
      galleryHdr.append(galleryTitle,saveTogBtn,galleryRefresh,galleryActs);
      const galleryWrap=mk("div",{display:"flex",flexDirection:"column",gap:"7px"});
      galleryWrap.append(galleryHdr,galleryBox);
      const chainClipsWrap=mk("div",{display:"none",flexDirection:"column",gap:"5px"});
      const chainClipsHdr=mk("div",{fontSize:"9px",fontWeight:"700",letterSpacing:".1em",textTransform:"uppercase",color:C.muted});
      _tr(chainClipsHdr,"ui.chain.clips");
      const chainClipsBox=mk("div",{display:"flex",gap:"6px",overflowX:"auto",paddingBottom:"4px",scrollbarWidth:"thin"});
      chainClipsWrap.append(chainClipsHdr,chainClipsBox);
      rightPanel.append(previewBox,chainClipsWrap,timeBar,galleryWrap);
      const _renderChainClips=()=>{
        chainClipsBox.innerHTML="";
        const items=[];
        _chainClipOutputs.forEach((it,idx)=>{
          if(!it) return;
          items.push({item:it,label:t("ui.clip",{n:idx+1}),final:false});
        });
        if(_chainFinalOutput) items.push({item:_chainFinalOutput,label:t("ui.chain.final"),final:true});
        chainClipsWrap.style.display=items.length?"flex":"none";
        items.forEach(entry=>{
          const card=mk("div",{width:"112px",flexShrink:"0",cursor:"pointer",background:C.bg1,border:`1px solid ${entry.final?C.lime:C.border}`,borderRadius:"7px",overflow:"hidden"});
          const url=api.apiURL(`/view?filename=${encodeURIComponent(entry.item.filename)}&type=${entry.item.type||"output"}&subfolder=${encodeURIComponent(entry.item.subfolder||"")}`);
          const v=mk("video",{width:"100%",height:"62px",objectFit:"cover",display:"block",background:"#000",pointerEvents:"none"},{muted:true,preload:"metadata"});
          v.src=url;
          const name=mk("div",{fontSize:"8px",color:entry.final?C.lime:C.muted,padding:"3px 5px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"});
          tx(name,entry.label);
          card.append(v,name);
          card.onclick=()=>_showVideo(entry.item);
          card.onmouseenter=()=>card.style.borderColor=C.lime;
          card.onmouseleave=()=>card.style.borderColor=entry.final?C.lime:C.border;
          chainClipsBox.appendChild(card);
        });
      };
      _activeRenderChainClips=_renderChainClips;

      let _galItems=[];
      let _curItem=null;
      const _showVideo=(item,fromFinish)=>{
        _curItem=item;
        const vtype=item.type||"output";
        const url=api.apiURL(`/view?filename=${encodeURIComponent(item.filename)}&type=${vtype}&subfolder=${encodeURIComponent(item.subfolder||"")}`);
        vidEl.src=url;vidEl.style.display="block";
        placeholder.style.display="none";errorBox.style.display="none";
        _updateSeedChip(item.filename);
        if(_seedByFile[item.filename]===undefined) _showSeedFromHistory(item.filename);
        _updateTimeBar(item.filename);
        if(fromFinish&&S.playOnFinish===false){
          vidEl.muted=false;
          vidEl.load();
          vidEl.pause();
          const seek0=()=>{try{vidEl.currentTime=0;}catch(e){}};
          vidEl.addEventListener("loadedmetadata",seek0,{once:true});
          return;
        }
        vidEl.muted=false;
        vidEl.play().catch(()=>{ vidEl.muted=true; vidEl.play().catch(()=>{}); });
      };
      const _favCurrent=async()=>{
        if(!_curItem) return;
        const nf=!_curItem.favorite;
        await fetch("/h3one/favorite",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:_curItem.filename,favorite:nf})}).catch(()=>{});
        _loadGallery();
      };
      const _openCurrent=()=>{
        if(!_curItem) return;
        fetch("/h3one/open_folder",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:_curItem.filename,subfolder:_curItem.subfolder||""})}).catch(()=>{});
      };
      const _delCurrent=async()=>{
        if(!_curItem) return;
        if(!confirm(t("ui.delete.confirm",{n:_curItem.filename}))) return;
        await fetch("/h3one/delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:_curItem.filename,subfolder:_curItem.subfolder||""})}).catch(()=>{});
        vidEl.src="";vidEl.style.display="none";placeholder.style.display="flex";
        _curItem=null;
        _loadGallery();
      };
      const _loadGallery=async()=>{
        galleryBox.innerHTML="";
        try{
          const r=await fetch("/h3one/gallery");
          const d=await r.json();
          _galItems=d.videos||[];
        }catch(e){ _galItems=[]; }
        if(!_galItems.length){
          const empty=mk("div",{fontSize:"9px",color:C.muted,padding:"6px 0"});
          _tr(empty,"ui.no.outputs");
          galleryBox.appendChild(empty);return;
        }
        _galItems.slice(0,30).forEach(item=>{
          const card=mk("div",{width:"96px",flexShrink:"0",cursor:"pointer",background:C.bg1,border:`1px solid ${C.border}`,borderRadius:"7px",overflow:"hidden"});
          const url=api.apiURL(`/view?filename=${encodeURIComponent(item.filename)}&type=output&subfolder=${encodeURIComponent(item.subfolder||"")}`);
          const v=mk("video",{width:"100%",height:"54px",objectFit:"cover",display:"block",background:"#000",pointerEvents:"none"},{muted:true,preload:"metadata"});
          v.src=url;
          const name=mk("div",{fontSize:"8px",color:C.muted,padding:"3px 5px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"});
          tx(name,(item.favorite?"* ":"")+item.filename);
          if(item.favorite) name.style.color=C.lime;
          card.append(v,name);
          card.onclick=()=>_showVideo(item);
          card.onmouseenter=()=>card.style.borderColor=C.lime;
          card.onmouseleave=()=>card.style.borderColor=C.border;
          galleryBox.appendChild(card);
        });
      };

      // -- GENERATE ROW ------------------------------------------------------
      const genRow=mk("div",{display:"flex",gap:"0",alignItems:"stretch",width:"100%",boxSizing:"border-box"});
      const genBtn=mk("button",{
        background:"linear-gradient(120deg,var(--h3accent),#e8d5c0)",color:"#141414",border:"none",borderRadius:"10px",
        padding:"0",height:"42px",fontSize:"13px",fontWeight:"800",
        cursor:"pointer",flex:"1",letterSpacing:".06em",
        display:"flex",alignItems:"center",justifyContent:"center",gap:"9px",
        transition:"filter .15s,background .3s,color .3s,transform .1s",
        outline:"none",position:"relative",overflow:"hidden",
      });
      genBtn.innerHTML=`<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;
      const genBtnLbl=mk("span",{});tx(genBtnLbl,t("ui.generate"));
      const genKbd=mk("span",{fontSize:"9px",fontWeight:"700",opacity:".65",border:"1px solid rgba(0,0,0,.25)",borderRadius:"4px",padding:"1px 5px"}, {textContent:"Space"});
      genBtn.append(genBtnLbl,genKbd);
      const stopBtn=mk("button",{background:"transparent",border:`1px solid ${C.border}`,borderRadius:"8px",color:C.muted,fontSize:"12px",cursor:"pointer",maxWidth:"0",minWidth:"0",width:"0",opacity:"0",padding:"0",height:"42px",transition:"max-width .25s ease, opacity .25s ease, padding .25s ease",outline:"none",overflow:"hidden",flexShrink:"0",whiteSpace:"nowrap"});
      tx(stopBtn,t("ui.stop"));
      stopBtn.onmouseenter=()=>{stopBtn.style.borderColor=C.err;stopBtn.style.color=C.err;};
      stopBtn.onmouseleave=()=>{stopBtn.style.borderColor=C.border;stopBtn.style.color=C.muted;};
      genRow.append(genBtn,stopBtn);

      const resetBtn=()=>{
        S.generating=false;
        _batchIds=[];_batchDone=0;
        _chainMode=false;_chainFinalizing=false;
        genBtn.disabled=false;
        tx(genBtnLbl,t("ui.generate"));
        genBtn.style.background="linear-gradient(120deg,var(--h3accent),#e8d5c0)";genBtn.style.backgroundSize="";
        genBtn.style.animation="none";genBtn.style.color="#141414";
        stopBtn.style.maxWidth="0";stopBtn.style.minWidth="0";stopBtn.style.width="0";stopBtn.style.opacity="0";stopBtn.style.padding="0";stopBtn.style.marginLeft="0";
        progWrap.style.display="none";progFill.style.width="0%";
      };
      const showError=(msg)=>{
        errorBox.style.display="flex";
        errorBox.innerHTML="";
        const title=mk("div",{fontSize:"12px",fontWeight:"700",color:C.err,letterSpacing:".02em",marginBottom:"6px"});
        _tr(title,"ui.error.title");
        const body=mk("div",{fontSize:"11px",color:C.text,lineHeight:"1.6",whiteSpace:"pre-wrap",wordBreak:"break-word",maxWidth:"100%"});
        tx(body,fmtErr(msg));
        errorBox.append(title,body);
        vidEl.style.display="none";placeholder.style.display="none";
      };
      const showOutput=(item)=>{
        errorBox.style.display="none";
        if(S.seed!==undefined&&S.seed!==null&&S.seed!=="") _seedByFile[item.filename]=S.seed;
        const genMs=Date.now()-_activeGenStartTs;
        _genTimeByFile[item.filename]=genMs;
        _showVideo(item,true);
        _activeShownFiles.push(item.filename);
        const isTemp=item.type==="temp";
        if(!isTemp){
          fetch("/h3one/set_output",{method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({node_id:self.id,info:{filename:item.filename,subfolder:item.subfolder||""}})}).catch(()=>{});
          const histMode=S.mode;
          const histRes=S.resolution;
          fetch("/h3one/history",{method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
              mode:histMode,quality:S.quality,prompt:(S.prompt||"").slice(0,2000),duration:S.duration,
              resolution:histRes,seed:S.seed,gen_time:genMs,video:item.filename,subfolder:item.subfolder||"",
            })}).catch(()=>{});
        }
        _loadGallery();
      };
      const _genTimeByFile={};
      const _seedByFile={};
      const _updateSeedChip=(filename)=>{
        let seed=_seedByFile[filename];
        if(seed===undefined||seed===null||seed===""){
          seedChip.style.display="none";
          return;
        }
        tx(seedChipVal,String(seed));
        seedChip.style.display="flex";
      };
      const _showSeedFromHistory=async(filename)=>{
        try{
          const r=await fetch("/h3one/history");
          const d=await r.json();
          const hit=(d.items||[]).find(it=>it.video===filename);
          if(hit&&hit.seed!==undefined&&hit.seed!==null){
            _seedByFile[filename]=hit.seed;
            _updateSeedChip(filename);
          }
        }catch(e){}
      };
      const _fetchTimeFromHistory=async(filename)=>{
        try{
          const r=await fetch("/h3one/history");
          const d=await r.json();
          const hit=(d.items||[]).find(it=>it.video===filename);
          return hit&&hit.gen_time? hit.gen_time : null;
        }catch(e){ return null; }
      };
      const showLatest=async()=>{
        if(_activeShownFiles.length) return;
        try{
          const r=await fetch("/h3one/gallery");
          const d=await r.json();
          const items=d.videos||[];
          if(!items.length) return;
          showOutput(items[0]);
        }catch(e){}
      };

      // -- WORKFLOW BUILDERS -------------------------------------------------
      const _fetchTpl=async(name)=>{
        const res=await fetch(`/h3one/workflow/${name}`);
        if(!res.ok) throw new Error(t("err.tpl",{n:name}));
        return await res.json();
      };

      const _finalPrompt=(userText,tplKey)=>{
        let text=(userText||"").trim();
        if(!text) return "";
        if(S.mode==="extend"){
          const airlock="Hold the exact closing framing of the source video for about 2 seconds - same camera, same subject position, same lighting and same motion - then continue seamlessly with no visible cut: ";
          if(text.includes("integrated_multimodal_description")){
            text=text.replace(/\[Shot 1\]\s*/i, "[Shot 1] "+airlock);
          }
        }
        if(text.includes("integrated_multimodal_description")||text.includes("summary:")||text.includes("detailed_description:")){
          if(S.mode==="r2v"&&S.refAudios.length&&!text.includes("<Audio")){
            text=text.replace(/(retention_analysis:\s*)/i, "$1<Audio 1>: fully_copy - reused 1:1 as the target video's complete final audio track.\n");
            if(!/<Audio/.test(text.split("overall_soundscape:")[1]||"")){
              text=text.replace(/(overall_soundscape:\s*)/i, "$1The copied audio track <Audio 1> is the complete soundtrack. ");
            }
          }
          return text;
        }
        const mode=tplKey||S.mode;
        const tpl=_discTmpl[mode==="chain"?"chain":mode]||{};
        const wrap=tpl.wrap;
        if(!wrap) return text;
        return wrap.split("{USER}").join(text);
      };

      // -- Cache fingerprint + bust node -------------------------------------
      // ComfyUI's execution cache cannot see inside autogrow dicts
      // (ref_images / ref_audios ...), so a changed reference image/audio left
      // the cache signature unchanged and generation was served stale output.
      // H3CacheBust sits between the CLIP loader and the conditioning node and
      // invalidates everything downstream whenever any input that matters
      // (prompt, media names, media file CONTENT, seed, steps, geometry) changes.
      const _buildFingerprint=(extra)=>{
        const files=[];
        const add=(type,name)=>{ if(name) files.push({type,name}); };
        add("image",S.firstFrame); add("image",S.lastFrame);
        (S.refImages||[]).forEach(n=>add("image",n));
        (S.refVideos||[]).forEach(v=>{ const n=(typeof v==="string")?v:v&&v.name; add("video",n); });
        (S.refAudios||[]).forEach(n=>add("audio",n));
        add("audio",S.audioFile);
        add("video",S.extendVideo);
        (S.kf||[]).forEach(k=>add("image",k.img));
        if(Array.isArray(extra)) extra.forEach(f=>files.push(f));
        const res=_resolveRes();
        const fp={
          prompt:_finalPrompt(S.prompt),
          files,
          seed:S.seed||0,
          steps:S.steps,
          sigmaRefine:S.sigmaRefine,
          dualPass:S.dualPass,
          width:res.width,
          height:res.height,
          latentUpscale:S.latentUpscale||{enabled:false},
          kf:(S.kf||[]).map(k=>({img:k.img||"",pos:Math.round(k.pos||0)})),
        };
        return JSON.stringify(fp);
      };

      const _insertCacheBust=(wf,fp)=>{
        const clipId=Object.keys(wf).find(id=>wf[id]&&wf[id].class_type==="CLIPLoader");
        if(!clipId) return;
        const bustId="499";
        wf[bustId]={class_type:"H3CacheBust",inputs:{clip:[clipId,0],fingerprint:fp||_buildFingerprint()},_meta:{title:"Cache Invalidation"}};
        Object.keys(wf).forEach(id=>{
          if(id===bustId) return;
          const n=wf[id];
          if(!n||!n.inputs) return;
          Object.keys(n.inputs).forEach(k=>{
            const v=n.inputs[k];
            if(Array.isArray(v)&&v.length===2&&v[0]===clipId&&v[1]===0) n.inputs[k]=[bustId,0];
          });
        });
      };

      const _insertModelPatches=(wf)=>{
        let modelSrc=["2",0];
        let nextId=100;
        const newId=()=>String(nextId++);
        const actives=S.loras.filter(l=>l.name);
        actives.forEach(lr=>{
          const id=newId();
          wf[id]={class_type:"LoraLoaderModelOnly",inputs:{model:modelSrc,lora_name:lr.name,strength_model:lr.strength},_meta:{title:"LoRA"}};
          modelSrc=[id,0];
        });
        const q=S.quality;
        if(q==="turbo"){
          if(!S.speedLora) throw new Error(t("err.turbo.lora"));
          {
            const tl=newId();
            wf[tl]={class_type:"MiniMaxH3TurboLoRA",inputs:{model:modelSrc,lora_name:S.speedLora,strength:1,low_vram:false},_meta:{title:"Turbo LoRA"}};
            modelSrc=[tl,0];
          }
          const ts=newId();
          wf[ts]={class_type:"MiniMaxH3TurboSampler",inputs:{},_meta:{title:"Turbo Sampler"}};
          wf["10"]=wf[ts];delete wf[ts];
          wf["9"].inputs.steps=6;
        } else {
          if(q==="speed"||q==="balanced"){
            const sol=newId();
            wf[sol]={class_type:"SolAttnPatch",inputs:{
              model:modelSrc,tau:1.3,start_percent:0.2,end_percent:0.9,min_tokens:4096,
              int8_qk:true,sink_conditioning:"exact_kv_and_rows",morton:false,
              morton_curve:"2d_frame",int8_pv:true,verbose:false,use_tma:false,dense_blocks:"",
            },_meta:{title:"Sol-Attn"}};
            modelSrc=[sol,0];
          }
          if(q==="speed"){
            const cache=newId();
            wf[cache]={class_type:"MiniMaxH3Cache",inputs:{
              model:modelSrc,resuse_threshold:0.1,start_percent:0.15,end_percent:0.9,
              max_steps:2,device:"auto",verbose:false,
            },_meta:{title:"H3 Cache"}};
            modelSrc=[cache,0];
          }
          if(q==="high"){
            const sage=newId();
            wf[sage]={class_type:"MiniMaxH3MemoryEfficientSageAttentionPatch",inputs:{model:modelSrc},_meta:{title:"SageAttn"}};
            modelSrc=[sage,0];
          }
          const stepsByQ={balanced:S.steps,speed:S.steps,high:S.steps};
          wf["9"].inputs.steps=stepsByQ[q]||S.steps;
        }
        wf["5"].inputs.model=modelSrc;
      };

      const _applyAutoSave=(wf)=>{
        if(S.autoSave!==false) return;
        Object.keys(wf).forEach(id=>{
          const n=wf[id];
          if(n.class_type!=="SaveVideo") return;
          const src=(n.inputs.video||[])[0];
          const cv=src?wf[src]:null;
          if(cv&&cv.class_type==="CreateVideo"){
            wf[id]={class_type:"VHS_VideoCombine",inputs:{
              images:cv.inputs.images,
              frame_rate:(cv.inputs.fps!==undefined?cv.inputs.fps:24),
              loop_count:0,
              filename_prefix:"one-node-minimax-h3/preview",
              format:"video/h264-mp4",
              pingpong:false,
              save_output:false,
            },_meta:{title:"Preview (no save)"}};
            if(cv.inputs.audio!==undefined) wf[id].inputs.audio=cv.inputs.audio;
            delete wf[src];
          }
        });
      };

      const _insertLatentUpscaler=(wf,samplerId="11",decodeId="12",nodeId="650")=>{
        const up=S.latentUpscale;
        if(!up || !up.enabled || !up.model || up.model==="none" || String(up.model).startsWith("(")) return;
        wf[nodeId]={
          class_type:"H3NestedLatentUpscaler",
          inputs:{
            latent:[samplerId,0],
            model_name:up.model,
            variant:up.variant==="3d"?"3D":"2D",
            scale:Number(up.scale)||2.0,
            device:up.device==="cpu"?"cpu":"cuda",
            precision:["fp32","fp16","bf16"].includes(up.precision)?up.precision:"fp32",
          },
          _meta:{title:"Latent Upscaler"},
        };
        if(wf[decodeId]) wf[decodeId].inputs.samples=[nodeId,0];
      };

      const _patchCommon=(wf)=>{
        wf["1"].inputs.clip_name=S.models.clip;
        const condNode=wf["6"];
        const isR2V=condNode&&condNode.class_type==="MiniMaxH3ReferenceToVideo";
        wf["2"].inputs.unet_name= isR2V&&S.mode==="r2v"? S.models.unetR2V : S.models.unetT2V;
        wf["3"].inputs.vae_name=S.models.vaeVideo;
        wf["4"].inputs.vae_name=S.models.vaeAudio;
        const res=_resolveRes();
        let frames=snapFrames(S.duration);
        if(S.mode==="extend"){
          const EXT_CONTEXT=90;
          frames=snapFrames(S.duration+EXT_CONTEXT/24);
        }
        condNode.inputs.prompt=_finalPrompt(S.prompt);
        condNode.inputs.width=res.width;
        condNode.inputs.height=res.height;
        condNode.inputs.length=frames;
        wf["8"].inputs.noise_seed=S.seed||0;
        wf["9"].inputs.steps=S.steps;
        wf["9"].inputs.scheduler=S.schedulerName||"simple";
        if(wf["10"]&&wf["10"].class_type==="KSamplerSelect") wf["10"].inputs.sampler_name=S.samplerName||"res_multistep";
        if(!S.audioOn && wf["14"] && ["t2v","i2v","r2v","keyframes"].includes(S.mode)){
          delete wf["14"].inputs.audio;
        }
        _insertModelPatches(wf);
        _applyAutoSave(wf);
        // Second-pass (双采) latent refinement.
        // - Default path: pass 2 partially re-denoises pass 1's BASE-resolution
        //   latent; the latent upscaler (if any) stays on the output side.
        // - Reference path (dual + upscaler + T2V/R2V): the RunningHub
        //   "一采-放大-二采" layout - the schedule is split, pass 1 runs the
        //   high-sigma head at base res, the video latent is upscaled, and
        //   pass 2 finishes the low-sigma tail at the upscaled res. Only
        //   refs-based / no-ref conditioning is safe there (ref rows use the
        //   ref's own latent grid); keyframe conditioning scales its rows with
        //   the target canvas (all_video_rows[~img_update] = cond_video_rows),
        //   so keyframe modes keep the output-side layout.
        const _syncDualPass=(wf)=>{
          const steps=Math.max(1,Math.min(60,Math.round(Number(S.dualSteps)||DUAL_SAMPLING_DEFAULTS.steps)));
          const denoise=Math.max(0.05,Math.min(1.0,Number(S.dualDenoise)||DUAL_SAMPLING_DEFAULTS.denoise));
          const p2sched="29",p2noise="30",p2sampler="31",splitId="28";
          const refMode=S.dualPass&&_upscaleOn()&&["t2v","r2v"].includes(S.mode);
          if(S.dualPass){
            if(refMode){
              // SplitSigmas is inserted after the sigma refiner sync below;
              // this branch only lays down pass 2 (tail sigmas, upscaled latent).
              wf[p2noise]={class_type:"RandomNoise",inputs:{noise_seed:S.seed||0},_meta:{title:"Noise (2nd Pass)"}};
              wf[p2sampler]={class_type:"SamplerCustomAdvanced",inputs:{
                noise:[p2noise,0],
                guider:["7",0],
                sampler:["10",0],
                sigmas:[splitId,1],
                latent_image:["650",0],
              },_meta:{title:"Sampler Custom Advanced (2nd Pass)"}};
            } else {
              wf[p2sched]={class_type:"BasicScheduler",inputs:{
                model:["5",0],
                scheduler:S.schedulerName||"simple",
                steps,
                denoise,
              },_meta:{title:"Scheduler (2nd Pass)"}};
              wf[p2noise]={class_type:"RandomNoise",inputs:{noise_seed:S.seed||0},_meta:{title:"Noise (2nd Pass)"}};
              wf[p2sampler]={class_type:"SamplerCustomAdvanced",inputs:{
                noise:[p2noise,0],
                guider:["7",0],
                sampler:["10",0],
                sigmas:[p2sched,0],
                latent_image:["11",0],
              },_meta:{title:"Sampler Custom Advanced (2nd Pass)"}};
            }
            if(wf["12"]) wf["12"].inputs.samples=[p2sampler,0];
            if(wf["13"]) wf["13"].inputs.samples=[p2sampler,0];
          } else {
            delete wf[splitId]; delete wf[p2sched]; delete wf[p2noise]; delete wf[p2sampler];
            if(wf["12"]) wf["12"].inputs.samples=["11",0];
            if(wf["13"]) wf["13"].inputs.samples=["11",0];
          }
        };
        _syncDualPass(wf);
        _insertCacheBust(wf);
        _insertLatentUpscaler(wf, S.dualPass?"31":"11", "12", "650");
        // Sigma Refiner: rewire BasicScheduler -> (sigmas) -> Refiner -> Sampler
        // whenever the slider is > 0; otherwise remove the node and restore the
        // direct scheduler -> sampler link.
        const _syncSigmaRefiner=(wf,schedId,samplerId)=>{
          const srCfg=Object.assign({}, SIGMA_REFINE_DEFAULTS, S.sigmaRefineCfg||{});
          const srSteps=Math.max(0,Math.min(15,Math.round(Number(S.sigmaRefine)||0)));
          let srId=Object.keys(wf).find(id=>wf[id]&&wf[id].class_type==="H3OneSigmaRefiner");
          if(srSteps<=0){
            if(srId) delete wf[srId];
            if(wf[samplerId]) wf[samplerId].inputs.sigmas=[schedId,0];
            return;
          }
          if(!srId){
            srId="651";
            wf[srId]={class_type:"H3OneSigmaRefiner",inputs:{},_meta:{title:"Sigma Refiner"}};
          }
          Object.assign(wf[srId].inputs,{
            sigmas:[schedId,0],
            extra_steps:srSteps,
            start_at_sigma:srCfg.start_at_sigma,
            end_at_sigma:srCfg.end_at_sigma,
            spacing:srCfg.spacing,
          });
          if(wf[samplerId]) wf[samplerId].inputs.sigmas=[srId,0];
        };
        _syncSigmaRefiner(wf,"9","11");
        // Reference-mode split (一采-放大-二采): split the RAW scheduler
        // schedule first, then apply the sigma refiner to PASS 1's branch so
        // its extra low-sigma detail steps run at base resolution (一采), and
        // pass 2 receives the untouched low tail at the upscaled resolution.
        // Both branches meet at the same split sigma (~half), so pass 2
        // continues exactly where pass 1 stopped. (Splitting the REFINED
        // schedule instead made the cosine-densified tail push the index-based
        // split down to sigma ~0.12, so pass 1 did almost all the work at base
        // res and pass 2 got a near-empty tail at 2x - the source of the
        // garbled output.)
        if(S.dualPass && _upscaleOn() && ["t2v","r2v"].includes(S.mode)){
          const total=Math.max(2,Math.round(Number(S.steps)||20));
          // Automatic split: pass 2 (low-sigma tail) runs half the steps at
          // the upscaled resolution; pass 1 runs the rest at base resolution.
          const split=Math.max(1,Math.min(total-1,Math.round(total/2)));
          wf["28"]={class_type:"SplitSigmas",inputs:{sigmas:["9",0],step:split},_meta:{title:"Split Sigmas"}};
          const srId=Object.keys(wf).find(id=>wf[id]&&wf[id].class_type==="H3OneSigmaRefiner");
          if(srId){
            wf[srId].inputs.sigmas=["28",0];
            if(wf["11"]) wf["11"].inputs.sigmas=[srId,0];
          } else {
            if(wf["11"]) wf["11"].inputs.sigmas=["28",0];
          }
          if(wf["31"]) wf["31"].inputs.sigmas=["28",1];
          if(wf["31"]) wf["31"].inputs.latent_image=["650",0];
          // Feed pass 1's CLEAN estimate (denoised_output, slot 1) into the
          // upscaler, matching the reference workflow: the latent upscaler is
          // trained on clean latents, so upscaling the still-noisy sampling
          // state (slot 0) produces a corrupted intermediate and garbled video.
          if(wf["650"]) wf["650"].inputs.latent=["11",1];
          if(wf["12"]) wf["12"].inputs.samples=["31",0];
          if(wf["13"]) wf["13"].inputs.samples=["31",0];
          // Match the reference workflow's validated sampling config: euler
          // sampler for both passes, 3D upscaler at fp16.
          if(wf["10"]&&wf["10"].class_type==="KSamplerSelect") wf["10"].inputs.sampler_name="euler";
          if(wf["650"]){ wf["650"].inputs.variant="3D"; wf["650"].inputs.precision="fp16"; }
        }
        return {frames,res};
      };

      const _buildWorkflow=async()=>{
        const mode=S.mode;
        if(mode==="chain") return _buildChain();
        const wf=await _fetchTpl(TEMPLATES[mode]);
        _patchCommon(wf);
        let nextId=200;
        const newId=()=>String(nextId++);
        if(mode==="i2v"){
          if(!S.firstFrame&&!S.lastFrame) throw new Error(t("err.i2v.image"));
          if(S.firstFrame){
            const id=newId();
            wf[id]={class_type:"LoadImage",inputs:{image:S.firstFrame},_meta:{title:"First Frame"}};
            wf["6"].inputs.first_frame=[id,0];
          }
          if(S.lastFrame){
            const id2=newId();
            wf[id2]={class_type:"LoadImage",inputs:{image:S.lastFrame},_meta:{title:"Last Frame"}};
            wf["6"].inputs.last_frame=[id2,0];
          }
        } else if(mode==="r2v"){
          const hasRefs=S.refImages.length||S.refVideos.length||S.refAudios.length;
          if(!hasRefs) throw new Error(t("err.r2v.ref"));
          if(S.refImages.length){
            let firstImgId=null;
            S.refImages.forEach((name,idx)=>{
              const id=newId();
              wf[id]={class_type:"LoadImage",inputs:{image:name},_meta:{title:"Ref Image"}};
              wf["6"].inputs[`ref_images.ref_image_${idx}`]=[id,0];
              if(idx===0) firstImgId=id;
            });
            // Identity anchor: pin the first reference image as the frame-0
            // keyframe so the shot STARTS from it. Reference videos then provide
            // motion only - without this, a talking ref video outranks the still
            // image ~2:1 in the packed sequence and its face wins (verified).
            // Skipped in the 一采-放大-二采 reference mode (dual + upscaler):
            // the anchor is a keyframe, and keyframe rows scale with the target
            // canvas while the anchor latent stays base-encoded - an upscaled
            // pass-2 latent would crash with a row-count shape mismatch. The
            // reference image alone carries identity, matching the RunningHub
            // workflow.
            if(!(S.dualPass&&_upscaleOn()&&S.mode==="r2v")){
              const kfId=newId();
              wf[kfId]={class_type:"H3IdentityAnchor",inputs:{
                conditioning:["6",0],
                vae:["3",0],
                latent:["6",1],
                frame_count:Number(wf["6"].inputs.length)||124,
                width:Number(wf["6"].inputs.width)||960,
                height:Number(wf["6"].inputs.height)||544,
                anchor:"first",
                image:[firstImgId,0],
              },_meta:{title:"Identity Anchor (frame 0)"}};
              wf["7"].inputs.conditioning=[kfId,0];
            }
          }
          if(S.refVideos.length){
            S.refVideos.forEach((entry,idx)=>{
              const name=(typeof entry==="string")?entry:entry.name;
              const useAudio=!!(entry&&entry.useAudio);
              const lv=newId(),gc=newId();
              wf[lv]={class_type:"LoadVideo",inputs:{file:name,"video-preview":""},_meta:{title:"Ref Video"}};
              wf[gc]={class_type:"GetVideoComponents",inputs:{video:[lv,0]},_meta:{title:"Ref Video Components"}};
              wf["6"].inputs[`ref_videos.ref_video_${idx}`]=[gc,0];
              if(useAudio) wf["6"].inputs[`ref_video_audios.ref_video_audio_${idx}`]=[gc,1];
            });
          }
          if(S.refAudios.length){
            S.refAudios.forEach((name,idx)=>{
              const id=newId();
              wf[id]={class_type:"LoadAudio",inputs:{audio:name},_meta:{title:"Ref Audio"}};
              const trimId=newId();
              wf[trimId]={class_type:"H3AudioTrim",inputs:{audio:[id,0],trim_seconds:S.duration},_meta:{title:"Audio Trim"}};
              wf["6"].inputs[`ref_audios.ref_audio_${idx}`]=[trimId,0];
            });
          }
        } else if(mode==="keyframes"){
          const totalFrames=snapFrames(S.duration);
          const positions=[];
          let imgNum=0;
          S.kf.forEach((k)=>{
            if(!k.img) return;
            imgNum++;
            const id=newId();
            wf[id]={class_type:"LoadImage",inputs:{image:k.img},_meta:{title:`Keyframe ${imgNum}`}};
            wf["16"].inputs[`keyframe_image_${imgNum}`]=[id,0];
            positions.push(Math.max(1,Math.min(totalFrames,Math.round(k.pos))));
          });
          if(!positions.length) throw new Error(t("err.keyframes.image"));
          const count=positions.length;
          wf["16"].inputs.keyframe_state=JSON.stringify({count,positions});
        } else if(mode==="extend"){
          if(!S.extendVideo) throw new Error(t("err.extend.video"));
          wf["16"].inputs.file=S.extendVideo;
        }
        return wf;
      };

      const _buildChain=async()=>{
        const section=await _fetchTpl(TEMPLATES.chain);
        const session=Date.now().toString(36);
        _chainSession=session;
        const clips=S.chainClips;
        const wf={};
        const sharedKeys=["s:1","s:2","s:3","s:4","s:5"];
        const res=_resolveRes();
        const audioLock=!!S.audioLock;
        if(audioLock&&!S.audioFile) throw new Error(t("err.audio.lock.audio"));

        // Shared reference loaders: created once, referenced by every clip's
        // conditioning so identity / motion / soundtrack stay consistent across
        // the whole chain.
        let refId=500;
        const refNewId=()=>String(refId++);
        const imgNodes=S.refImages.map(name=>{
          const id=refNewId();
          wf[id]={class_type:"LoadImage",inputs:{image:name},_meta:{title:"Ref Image"}};
          return id;
        });
        const vidNodes=S.refVideos.map(entry=>{
          const name=(typeof entry==="string")?entry:entry.name;
          const useAudio=!!(entry&&entry.useAudio)&&!audioLock;
          const lv=refNewId(),gc=refNewId();
          wf[lv]={class_type:"LoadVideo",inputs:{file:name,"video-preview":""},_meta:{title:"Ref Video"}};
          wf[gc]={class_type:"GetVideoComponents",inputs:{video:[lv,0]},_meta:{title:"Ref Video Components"}};
          return {frames:gc,audio:useAudio?gc:null};
        });
        const audioNames=audioLock?[S.audioFile]:(S.refAudios||[]);
        const audioLoads=audioNames.map(name=>{
          const id=refNewId();
          wf[id]={class_type:"LoadAudio",inputs:{audio:name},_meta:{title:"Ref Audio"}};
          return id;
        });
        const lockAudioId=audioLock&&audioLoads.length?audioLoads[0]:null;

        let audioCursor=0;
        clips.forEach((cl,idx)=>{
          const clone=JSON.parse(JSON.stringify(section));
          const out={};
          Object.keys(clone).forEach(k=>{
            if(k.startsWith("s:")){
              if(idx===0) out[k]=clone[k];
              return;
            }
            const nk=k.replace("sec:","c"+idx+":");
            const node=clone[k];
            node.inputs=JSON.parse(JSON.stringify(node.inputs).split('"sec:').join('"c'+idx+':'));
            out[nk]=node;
          });
          const cond=out["c"+idx+":cond"];
          const guider=out["c"+idx+":guider"];
          const mc=out["c"+idx+":mc"];
          const trim=out["c"+idx+":trim"];
          const save=out["c"+idx+":save"];
          const frames=snapFrames(cl.duration);
          const sampleSecs=frames/24;
          const trimSecs=idx===0?0:((S.mcLength||22)/24);
          const sliceStart=idx===0?0:Math.max(0,audioCursor-trimSecs);
          audioCursor += sampleSecs-trimSecs;
          cond.inputs.prompt=_finalPrompt(cl.prompt, idx===0?"t2v":undefined);
          cond.inputs.width=res.width;
          cond.inputs.height=res.height;
          cond.inputs.length=frames;
          S.refImages.forEach((_name,i)=>{ if(imgNodes[i]) cond.inputs[`ref_images.ref_image_${i}`]=[imgNodes[i],0]; });
          S.refVideos.forEach((_entry,i)=>{
            const vn=vidNodes[i];
            if(!vn) return;
            cond.inputs[`ref_videos.ref_video_${i}`]=[vn.frames,0];
            if(vn.audio) cond.inputs[`ref_video_audios.ref_video_audio_${i}`]=[vn.audio,0];
          });
          if(!audioLock){
            audioLoads.forEach((loadId,i)=>{
              const trimId="c"+idx+":atrim"+i;
              out[trimId]={class_type:"H3AudioTrim",inputs:{audio:[loadId,0],trim_seconds:cl.duration},_meta:{title:"Audio Trim"}};
              cond.inputs[`ref_audios.ref_audio_${i}`]=[trimId,0];
            });
          }
          if(audioLock&&lockAudioId){
            const sliceId="c"+idx+":alock";
            out[sliceId]={class_type:"H3AudioSlice",inputs:{
              audio:[lockAudioId,0],
              start_seconds:Math.round(sliceStart*100)/100,
              duration_seconds:Math.round(sampleSecs*100)/100,
            },_meta:{title:"Audio Slice"}};
            cond.inputs["ref_audios.ref_audio_0"]=[sliceId,0];
            const adId="c"+idx+":audrive";
            out[adId]={class_type:"VRGDG_MiniMaxH3AudioDrive",inputs:{
              av_latent:["c"+idx+":cond",1],
              source_audio:[sliceId,0],
              audio_vae:["s:4",0],
            },_meta:{title:"Audio Drive"}};
            out["c"+idx+":sampler"].inputs.latent_image=[adId,0];
            // Route the driven audio through the Trim node so its pinned head
            // is removed together with the video frames; otherwise the muxed
            // audio stays a full clip longer than the pictures and overlaps
            // the next clip when concatenated (audio duplication / lip-sync drift).
            trim.inputs.audio=[adId,1];
          }
          const seed=S.seed||0;
          out["c"+idx+":noise"].inputs.noise_seed=seed;
          out["c"+idx+":sched"].inputs.steps=S.steps;
          out["c"+idx+":sched"].inputs.scheduler=S.schedulerName||"simple";
          if(out["c"+idx+":ksel"]&&out["c"+idx+":ksel"].class_type==="KSamplerSelect") out["c"+idx+":ksel"].inputs.sampler_name=S.samplerName||"res_multistep";
          // Sigma Refiner per clip: keep the cloned refiner wired when the
          // slider is > 0; otherwise drop the node and restore the direct
          // scheduler -> sampler link.
          const srCfg=Object.assign({}, SIGMA_REFINE_DEFAULTS, S.sigmaRefineCfg||{});
          const srSteps=Math.max(0,Math.min(15,Math.round(Number(S.sigmaRefine)||0)));
          const srNode=out["c"+idx+":refine"];
          if(srNode){
            if(srSteps>0){
              Object.assign(srNode.inputs,{
                sigmas:["c"+idx+":sched",0],
                extra_steps:srSteps,
                start_at_sigma:srCfg.start_at_sigma,
                end_at_sigma:srCfg.end_at_sigma,
                spacing:srCfg.spacing,
              });
              out["c"+idx+":sampler"].inputs.sigmas=["c"+idx+":refine",0];
            } else {
              delete out["c"+idx+":refine"];
              out["c"+idx+":sampler"].inputs.sigmas=["c"+idx+":sched",0];
            }
          }
          // Second-pass (双采) per clip.
          // - Without a latent upscaler: pass 2 partially re-denoises pass 1's
          //   base latent (own 10-step / denoise-0.4 schedule, motion-context
          //   guider) and feeds the decoders + saved context latent directly.
          // - With a latent upscaler: the RunningHub 一采-放大-二采 split
          //   schedule, deferred to a gated stage-2 pass. Pass 1 runs the
          //   high-sigma head at base res (sigma refiner + motion-context
          //   guider); its CLEAN estimate (slot 1) feeds continuity and the
          //   upscaler. Pass 2 runs the low-sigma tail on the UPSCALED latent
          //   with the BASE conditioning guider (no motion-context keyframes):
          //   H3 keyframe rows scale with the target canvas while the keyframe
          //   latents stay base-encoded, so an upscaled latent cannot be
          //   re-sampled under the motion-context guider.
          if(S.dualPass){
            const dSteps=Math.max(1,Math.min(60,Math.round(Number(S.dualSteps)||DUAL_SAMPLING_DEFAULTS.steps)));
            const dDenoise=Math.max(0.05,Math.min(1.0,Number(S.dualDenoise)||DUAL_SAMPLING_DEFAULTS.denoise));
            const dNoise="c"+idx+":noise2", dSampler="c"+idx+":sampler2";
            const upOn=_upscaleOn();
            if(upOn){
              const splitId="c"+idx+":split";
              const total=Math.max(2,Math.round(Number(S.steps)||20));
              const split=Math.max(1,Math.min(total-1,Math.round(total/2)));
              out[splitId]={class_type:"SplitSigmas",inputs:{sigmas:["c"+idx+":sched",0],step:split},_meta:{title:"Split Sigmas"}};
              // Sigma refiner stays on pass 1's branch (base res).
              const srNode=out["c"+idx+":refine"];
              if(srNode){
                srNode.inputs.sigmas=[splitId,0];
                out["c"+idx+":sampler"].inputs.sigmas=["c"+idx+":refine",0];
              } else {
                out["c"+idx+":sampler"].inputs.sigmas=[splitId,0];
              }
              // Pass 2 uses the base conditioning WITHOUT motion-context
              // keyframes (see comment above); motion continuity was already
              // baked into pass 1's clean estimate at base resolution.
              out["c"+idx+":guider2"]={class_type:"BasicGuider",inputs:{model:["s:5",0],conditioning:["c"+idx+":cond",0]},_meta:{title:"Basic Guider (2nd Pass)"}};
              out[dNoise]={class_type:"RandomNoise",inputs:{noise_seed:seed},_meta:{title:"Noise (2nd Pass)"}};
              out[dSampler]={class_type:"SamplerCustomAdvanced",inputs:{
                noise:[dNoise,0],
                guider:["c"+idx+":guider2",0],
                sampler:["c"+idx+":ksel",0],
                sigmas:[splitId,1],
                latent_image:["c"+idx+":sampler",0],
              },_meta:{title:"Sampler Custom Advanced (2nd Pass)"}};
              if(out["c"+idx+":ksel"]&&out["c"+idx+":ksel"].class_type==="KSamplerSelect") out["c"+idx+":ksel"].inputs.sampler_name="euler";
              // Continuity stays on pass 1's CLEAN estimate (slot 1); the raw
              // split output is still noisy at the split sigma. The stage-2
              // upscaler (below) also consumes slot 1.
              save.inputs.latent=["c"+idx+":sampler",1];
              out["c"+idx+":decode"].inputs.samples=["c"+idx+":sampler",1];
              out["c"+idx+":decodea"].inputs.samples=["c"+idx+":sampler",1];
            } else {
              const dSched="c"+idx+":sched2";
              out[dSched]={class_type:"BasicScheduler",inputs:{
                model:["s:5",0],
                scheduler:S.schedulerName||"simple",
                steps:dSteps,
                denoise:dDenoise,
              },_meta:{title:"Scheduler (2nd Pass)"}};
              out[dNoise]={class_type:"RandomNoise",inputs:{noise_seed:seed},_meta:{title:"Noise (2nd Pass)"}};
              out[dSampler]={class_type:"SamplerCustomAdvanced",inputs:{
                noise:[dNoise,0],
                guider:["c"+idx+":guider",0],
                sampler:["c"+idx+":ksel",0],
                sigmas:[dSched,0],
                latent_image:["c"+idx+":sampler",0],
              },_meta:{title:"Sampler Custom Advanced (2nd Pass)"}};
              out["c"+idx+":decode"].inputs.samples=[dSampler,0];
              out["c"+idx+":decodea"].inputs.samples=[dSampler,0];
              save.inputs.latent=[dSampler,0];
            }
          }
          save.inputs.filename_prefix="one-node-minimax-h3/chain/"+session;
          save.inputs.clip_index=idx+1;
          out["c"+idx+":savevid"].inputs.filename_prefix=`one-node-minimax-h3/chain/${session}/clip_${idx+1}`;
          if(idx===0){
            delete out["c0:mc"];
            guider.inputs.conditioning=["c0:cond",0];
            trim.inputs.trim_frames=0;
          } else {
            const loadId="c"+idx+":load";
            out[loadId]={class_type:"MiniMaxH3MotionContextLoadLatent",inputs:{latent_path:["c"+(idx-1)+":save",0],clip_index:0},_meta:{title:"Load Latent"}};
            mc.inputs.context_frames=["c"+(idx-1)+":trim",0];
            mc.inputs.context_latent=[loadId,0];
            // Send the grid values as strings: some versions of
            // ComfyUI-H3-Motion-Context-MultiRef declare context_length as a
            // string combo (["22","5","39","56"]) and ComfyUI's combo
            // validation is strict (no int->str coercion), while INT versions
            // coerce str->int themselves - a string satisfies both.
            mc.inputs.context_length=String(S.mcLength);
            mc.inputs.audio_context_length=String(S.mcLength);
            mc.inputs.crop="disabled";
            trim.inputs.trim_frames=["c"+idx+":mc",1];
          }
          const up=S.latentUpscale;
          if(up && up.enabled && up.model && up.model!=="none" && !String(up.model).startsWith("(")){
            const upId="c"+idx+":up";
            const decodeUpId="c"+idx+":decodeUp";
            const trimUpId="c"+idx+":trimUp";
            const deferred=!!S.dualPass;
            out[upId]={
              class_type:"H3NestedLatentUpscaler",
              inputs:{
                // Deferred: consume pass 1's CLEAN estimate (slot 1) - the
                // split-schedule pass-1 output is still noisy at the split
                // sigma, and the upscaler is trained on clean latents.
                latent:deferred?["c"+idx+":sampler",1]:["c"+idx+":sampler",0],
                model_name:up.model,
                variant:deferred?"3D":(up.variant==="3d"?"3D":"2D"),
                scale:Number(up.scale)||2.0,
                device:up.device==="cpu"?"cpu":"cuda",
                precision:deferred?"fp16":(["fp32","fp16","bf16"].includes(up.precision)?up.precision:"fp32"),
                trigger:deferred?["c"+(clips.length-1)+":save",0]:"",
              },
              _meta:{title:"Latent Upscaler"},
            };
            // Deferred stage 2: the upscaler consumes pass 1's final (clean)
            // output, waits for the whole chain's first pass (trigger = the
            // last clip's saved latent path), then the second pass refines the
            // upscaled latent before decode.
            const refineSrc=deferred?"c"+idx+":sampler2":upId;
            if(deferred) out["c"+idx+":sampler2"].inputs.latent_image=[upId,0];
            out[decodeUpId]={class_type:"VAEDecode",inputs:{samples:[refineSrc,0],vae:["s:3",0]},_meta:{title:"VAE Decode (Upscaled)"}};
            out[trimUpId]={class_type:"MiniMaxH3MotionContextTrim",inputs:{
              images:[decodeUpId,0],
              trim_frames:trim.inputs.trim_frames,
              audio:trim.inputs.audio,
              fps:24,
              match_tail:true,
            },_meta:{title:"Trim (Upscaled)"}};
            out["c"+idx+":video"].inputs.images=[trimUpId,0];
            out["c"+idx+":video"].inputs.audio=[trimUpId,1];
          }
          Object.assign(wf,out);
        });
        // shared model chain + patches (inserted once, into clip 0's copy)
        let modelSrc=["s:2",0];
        let nextId=900;
        const newId=()=>String(nextId++);
        const actives=S.loras.filter(l=>l.name);
        actives.forEach(lr=>{
          const id=newId();
          wf[id]={class_type:"LoraLoaderModelOnly",inputs:{model:modelSrc,lora_name:lr.name,strength_model:lr.strength},_meta:{title:"LoRA"}};
          modelSrc=[id,0];
        });
        const q=S.quality;
        if(q==="speed"||q==="balanced"){
          const sol=newId();
          wf[sol]={class_type:"SolAttnPatch",inputs:{
            model:modelSrc,tau:1.3,start_percent:0.2,end_percent:0.9,min_tokens:4096,
            int8_qk:true,sink_conditioning:"exact_kv_and_rows",morton:false,
            morton_curve:"2d_frame",int8_pv:true,verbose:false,use_tma:false,dense_blocks:"",
          },_meta:{title:"Sol-Attn"}};
          modelSrc=[sol,0];
        }
        if(q==="speed"){
          const cache=newId();
          wf[cache]={class_type:"MiniMaxH3Cache",inputs:{
            model:modelSrc,resuse_threshold:0.1,start_percent:0.15,end_percent:0.9,
            max_steps:2,device:"auto",verbose:false,
          },_meta:{title:"H3 Cache"}};
          modelSrc=[cache,0];
        }
        if(q==="high"){
          const sage=newId();
          wf[sage]={class_type:"MiniMaxH3MemoryEfficientSageAttentionPatch",inputs:{model:modelSrc},_meta:{title:"SageAttn"}};
          modelSrc=[sage,0];
        }
        wf["s:5"].inputs.model=modelSrc;
        wf["s:1"].inputs.clip_name=S.models.clip;
        wf["s:2"].inputs.unet_name=S.models.unetT2V;
        wf["s:3"].inputs.vae_name=S.models.vaeVideo;
        wf["s:4"].inputs.vae_name=S.models.vaeAudio;
        {
          const fpFiles=[];
          S.refImages.forEach(n=>{ if(n) fpFiles.push({type:"image",name:n}); });
          S.refVideos.forEach(v=>{ const n=(typeof v==="string")?v:(v&&v.name); if(n) fpFiles.push({type:"video",name:n}); });
          audioNames.forEach(n=>{ if(n) fpFiles.push({type:"audio",name:n}); });
          const fp=JSON.stringify({
            chain:clips.map(c=>({prompt:_finalPrompt(c.prompt),duration:c.duration})),
            seed:S.seed||0,steps:S.steps,width:res.width,height:res.height,audioLock,files:fpFiles,
            sigmaRefine:S.sigmaRefine,
            dualPass:S.dualPass,
            latentUpscale:S.latentUpscale||{enabled:false},
          });
          wf["s:bust"]={class_type:"H3CacheBust",inputs:{clip:["s:1",0],fingerprint:fp},_meta:{title:"Cache Invalidation"}};
          clips.forEach((_cl,idx)=>{
            const cond=wf["c"+idx+":cond"];
            if(cond&&cond.inputs&&Array.isArray(cond.inputs.clip)) cond.inputs.clip=["s:bust",0];
          });
        }
        // Chain always saves its per-clip files; the final video is assembled
        // from those files on disk, so the optional "preview only" auto-save
        // path cannot apply here.
        return wf;
      };

      genBtn.onclick=async()=>{
        if(S.generating) return;
        _activeNode=self;
        _activeShowOutput=showOutput;
        _activeResetBtn=resetBtn;
        _activeShowError=showError;
        _activeSetStage=setStage;
        _activeShowTime=showTime;
        _activeShowLatest=showLatest;
        _activeRenderChainClips=_renderChainClips;
        _activeShownFiles=[];
        _activeGenStartTs=Date.now();
        showTime(0);
        _activePromptId=null;
        S.generating=true;
        genBtn.disabled=true;tx(genBtnLbl,t("ui.generating"));
        genBtn.style.background="linear-gradient(270deg,var(--h3accent),#e8d5c0,#a259ff,var(--h3accent))";
        genBtn.style.backgroundSize="300% 300%";
        genBtn.style.animation="h3-gradient 2.4s ease infinite";
        genBtn.style.color=C.lime;
        stopBtn.style.maxWidth="120px";stopBtn.style.minWidth="";stopBtn.style.width="";stopBtn.style.opacity="1";stopBtn.style.padding="0 14px";stopBtn.style.marginLeft="6px";
        progWrap.style.display="flex";setStage("Building workflow...",3);
        errorBox.style.display="none";
        try{
          if(S.latentUpscale.enabled && (!S.latentUpscale.model || S.latentUpscale.model==="none" || String(S.latentUpscale.model).startsWith("("))){
            throw new Error(t("err.latent.model"));
          }
          if(S.mode==="chain"){
            const wf=await _buildChain();
            _chainMode=true;
            _chainFinalizing=false;
            _chainClipOutputs=new Array(Math.max(1,(S.chainClips||[]).length)).fill(null);
            _chainFinalOutput=null;
            _activeRenderChainClips=_renderChainClips;
            _renderChainClips();
            const body={prompt:wf,client_id:api.clientId,extra_data:{enable_previews:true}};
            const res=await api.fetchApi("/prompt",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
            const data=await res.json();
            if(data.error||!data.prompt_id){
              throw new Error(data.error?.message||JSON.stringify(data.error)||"Unknown error");
            }
            _batchIds=[data.prompt_id];
            _batchDone=0;
            _activePromptId=data.prompt_id;
            setStage("In queue...",6);
          } else {
            const n=Math.max(1,Math.min(4,S.batch||1));
            const ids=[];
            for(let i=0;i<n;i++){
              if(S.randomizeSeed){ S.seed=Math.floor(Math.random()*9007199254740991); seedNI._inp.value=String(S.seed); }
              const wf=await _buildWorkflow();
              const body={prompt:wf,client_id:api.clientId,extra_data:{enable_previews:true}};
              const res=await api.fetchApi("/prompt",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
              const data=await res.json();
              if(data.error||!data.prompt_id){
                throw new Error(data.error?.message||JSON.stringify(data.error)||"Unknown error");
              }
              ids.push(data.prompt_id);
            }
            _batchIds=ids;
            _batchDone=0;
            _activePromptId=ids[ids.length-1];
            setStage(n>1?`Queued ${n} runs...`:"In queue...",6);
          }
        }catch(e){
          resetBtn();showError(fmtErr(e));
        }
      };

      stopBtn.onclick=async()=>{
        try{await api.fetchApi("/interrupt",{method:"POST"});}catch(e){}
        if(_activePromptId){
          try{await api.fetchApi("/queue",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({delete:[_activePromptId]})});}catch(e){}
          _activePromptId=null;
        }
        resetBtn();
      };

      // -- Models + config loading -------------------------------------------
      const _pickModel=(list,needle)=>{
        const norm=(s)=>(s||"").toLowerCase();
        const exact=list.find(m=>norm(m).includes(norm(needle)));
        if(exact) return exact;
        const heur=list.find(m=>norm(m).includes("h3")||norm(m).includes("minimax"));
        return heur||list[0]||"";
      };
      const _loadModels=async()=>{
        try{
          const r=await fetch("/h3one/models");
          const d=await r.json();
          _M={diffusion:d.diffusion_models||[],text_encoders:d.text_encoders||[],vaes:d.vaes||[],loras:d.loras||[]};
          const has=(arr,v)=>arr.some(m=>(m||"").toLowerCase()===(v||"").toLowerCase());
          if(!has(_M.text_encoders,S.models.clip)) S.models.clip=_pickModel(_M.text_encoders,"qwen3vl_32b_minimax_h3");
          if(!has(_M.diffusion,S.models.unetT2V)) S.models.unetT2V=_pickModel(_M.diffusion,"fl2va");
          if(!has(_M.diffusion,S.models.unetR2V)) S.models.unetR2V=_pickModel(_M.diffusion,"ref2va");
          if(!has(_M.vaes,S.models.vaeVideo)) S.models.vaeVideo=_pickModel(_M.vaes,"video_vae");
          if(!has(_M.vaes,S.models.vaeAudio)) S.models.vaeAudio=_pickModel(_M.vaes,"audio_vae");
          persist();
          modelDDs.unetT2V.updateItems(_M.diffusion);
          modelDDs.unetR2V.updateItems(_M.diffusion);
          modelDDs.clip.updateItems(_M.text_encoders);
          modelDDs.vaeVideo.updateItems(_M.vaes);
          modelDDs.vaeAudio.updateItems(_M.vaes);
          speedLoraDD.updateItems(["none"].concat(_M.loras));
          const loraItems=_M.loras.length?_M.loras:["none"];
          _renderLoras();
          try{
            const sr=await fetch("/h3one/latent_upscaler_models");
            const sd=await sr.json();
            const items=["none"].concat(sd.models||[]);
            if(latentUpscaleDD) latentUpscaleDD.updateItems(items);
            if(S.latentUpscale.model!=="none" && (sd.models||[]).length && !(sd.models||[]).some(m=>m===S.latentUpscale.model)){
              S.latentUpscale.model=sd.models[0];
              S.models.latentUpscaleModel=sd.models[0];
              if(latentUpscaleDD) latentUpscaleDD.set(S.latentUpscale.model);
              persist();
            }
          }catch(e){console.warn("[H3One] latent upscaler models:",e);}
        }catch(e){console.warn("[H3One] load models:",e);}
      };
      const _loadConfig=async()=>{
        try{
          const r=await fetch("/h3one/config");
          const d=await _resJson(r,"/h3one/config");
          if(Array.isArray(d.resolution_presets)&&d.resolution_presets.length){
            _resItems=d.resolution_presets;
          } else {
            _resItems=FALLBACK_RESOLUTIONS.slice();
          }
          _syncAspectFromResolution();
          resDD.updateItems(_aspectItems());
          if(S.resolution!=="Custom"&&!_resItems.some(x=>x.label===S.resolution)&&_resItems.length){
            S.resolution=_resItems[0].label;resDD.set(S.resolution);persist();
          }
          _updResCustom();
          if(saved.sigmaRefine===undefined && d.sigma_refiner && typeof d.sigma_refiner==="object"){
            const cfg=Object.assign({}, SIGMA_REFINE_DEFAULTS, S.sigmaRefineCfg||{}, d.sigma_refiner);
            S.sigmaRefineCfg=cfg;
            if(typeof cfg.extra_steps==="number"){
              S.sigmaRefine=Math.max(0,Math.min(15,Math.round(cfg.extra_steps)));
              sigmaRange.value=String(S.sigmaRefine);
              tx(sigmaVal,String(S.sigmaRefine));
              persist();
            }
          }
          if(saved.dualPass===undefined && d.dual_sampling && typeof d.dual_sampling==="object"){
            const dd=Object.assign({}, DUAL_SAMPLING_DEFAULTS, d.dual_sampling);
            S.dualPass=!!dd.enabled;
            // Parameters stay automatic: only the built-in defaults can vary
            // through config; there is no per-user control.
            S.dualSteps=Math.max(1,Math.min(60,Math.round(Number(dd.steps)||DUAL_SAMPLING_DEFAULTS.steps)));
            S.dualDenoise=Math.max(0.05,Math.min(1,Number(dd.denoise)||DUAL_SAMPLING_DEFAULTS.denoise));
            dualToggle._setChecked(S.dualPass);
            persist();
          }
          _discTmpl=d.prompt_templates||{};
        }catch(e){
          console.warn("[H3One] load config:",e);
          _resItems=FALLBACK_RESOLUTIONS.slice();
          resDD.updateItems(_aspectItems());
          _updResCustom();
        }
      };
      const _updateFramesLabel=()=>{ tx(framesLbl,t("ui.frames.label",{n:snapFrames(S.duration)})); };
      _updateFramesLabel();
      _loadModels();
      _loadConfig();
      _loadGallery();

      // -- Assemble ----------------------------------------------------------
      const mainRow=mk("div",{display:"flex",gap:"12px",alignItems:"stretch",flex:"1",minHeight:"0"});
      const leftPanel=mk("div",{display:"flex",flexDirection:"column",gap:"9px",width:"420px",flexShrink:"0",overflowY:"auto",minHeight:"0",paddingRight:"4px",boxSizing:"border-box",scrollbarWidth:"thin",scrollbarColor:`${C.border} transparent`});
      modeArea.append(i2vArea,chainArea,kfArea,exArea,refArea);
      // -- Card assembly -----------------------------------------------------
      const promptCard=mk("div",{}, {className:"h3-card"});
      promptCard.append(promptHdr,promptWrap);
      const modeCard=mk("div",{}, {className:"h3-card"});
      modeCard.append(modeHdr,modeArea);
      const recipeEl=mk("div",{}, {className:"h3-recipe"});
      const tuneBody=mk("div",{display:"flex",flexDirection:"column",gap:"9px"});
      tuneBody.append(params,seedBody);
      const tuneCard=mk("div",{}, {className:"h3-card"});
      tuneCard.append(paramsHdr,recipeEl,tuneBody);
      const _updRecipe=()=>{
        if(!recipeEl) return;
        recipeEl.innerHTML="";
        const _q=S.quality==="balanced"?"Balanced":S.quality==="speed"?"Speed":S.quality==="high"?"High Quality":"Turbo";
        const r=_resolveRes();
        const chip=(label,value,media)=>{
          const c=mk("span",{}, {className:"h3-chip"+(media?" media":"")});
          if(label) c.appendChild(mk("span",{}, {className:"cl",textContent:label}));
          c.appendChild(mk("span",{}, {className:"cv",textContent:value}));
          recipeEl.appendChild(c);
        };
        chip(null,`${r.width}×${r.height}`,true);
        chip(null,S.mode==="chain"?`${S.chainClips.length} clips`:`${S.duration}s`,true);
        recipeEl.appendChild(mk("span",{}, {className:"h3-gsep","aria-hidden":"true"}));
        chip("steps",String(S.steps));
        chip(null,_q);
        chip(null,`${S.samplerName||"res_multistep"} · ${S.schedulerName||"simple"}`);
        chip("seed",S.randomizeSeed?"random":String(S.seed||0));
        chip(null,`×${S.batch||1}`);
      };
      _updRecipe();
      _updRecipeFn=_updRecipe;
      leftPanel.append(promptCard,modeCard,tuneCard,latentCard,loraArea);
      _applyFold("prompt",promptHdr,promptWrap,promptChev);
      _applyFold("mode",modeHdr,modeArea,modeChev);
      _applyFold("params",paramsHdr,tuneBody,paramsChev);
      _applyFold("latent",latentHdr,latentBody,latentChev);
      _applyFold("lora",loraHdr,loraBody,loraChev);
      mainRow.append(leftPanel,rightPanel);
      pad.append(navRow,mainRow,genRow);
      scrollEl.appendChild(pad);
      root.append(scrollEl,settingsOverlay,historyOverlay,libraryOverlay,discoverOverlay);
      _updateTabs();
      _updateModeSections();
      _restoreModeState();

      // -- Keyboard shortcut: Space = Generate when hovering the node -------
      let _mouseOverRoot=false;
      root.addEventListener("mouseenter",()=>{ _mouseOverRoot=true; });
      root.addEventListener("mouseleave",()=>{ _mouseOverRoot=false; });
      document.addEventListener("keydown",(e)=>{
        if(e.code!=="Space") return;
        if(!_mouseOverRoot) return;
        const tag=(document.activeElement||{}).tagName||"";
        if(tag==="INPUT"||tag==="TEXTAREA") return;
        if(settingsOverlay.style.display!=="none"||historyOverlay.style.display!=="none"||libraryOverlay.style.display!=="none"||discoverOverlay.style.display!=="none") return;
        e.preventDefault();e.stopPropagation();
        genBtn.click();
      });

      document.addEventListener("paste",async(e)=>{
        if(!_mouseOverRoot) return;
        const tag=(document.activeElement||{}).tagName||"";
        if(tag==="INPUT"||tag==="TEXTAREA") return;
        const items=[...(e.clipboardData?.items||[])];
        const imgItem=items.find(i=>i.type.startsWith("image/"));
        if(!imgItem) return;
        e.preventDefault();e.stopPropagation();
        const raw=imgItem.getAsFile();
        if(!raw) return;
        const ext=(raw.type.split("/")[1]||"png").replace("jpeg","jpg");
        const uniqueName=`pasted_${Date.now()}_${Math.floor(Math.random()*1e4)}.${ext}`;
        let file;
        try{ file=new File([raw],uniqueName,{type:raw.type}); }
        catch(_){ file=raw; file.name=uniqueName; }
        if(S.mode==="i2v"){
          if(!S.firstFrame) firstSlot.loadFile(file);
          else lastSlot.loadFile(file);
        } else if(S.mode==="r2v"){
          if(S.refImages.length>=9) return;
          const fd=new FormData();fd.append("image",file);fd.append("overwrite","true");
          try{
            const r=await api.fetchApi("/upload/image",{method:"POST",body:fd});
            const d=await r.json();
            S.refImages.push(d.name||file.name);
            persist();
            _renderRefs();
          }catch(err){ console.warn("[H3One] paste upload:",err); }
        } else if(S.mode==="keyframes"){
          let empty=S.kf.find(k=>!k.img);
          if(!empty){
            if(S.kf.length>=32) return;
            empty={img:null,pos:Math.min(9999,(S.kf.length+1)*62)};
            S.kf.push(empty);
          }
          const fd=new FormData();fd.append("image",file);fd.append("overwrite","true");
          try{
            const r=await api.fetchApi("/upload/image",{method:"POST",body:fd});
            const d=await r.json();
            empty.img=d.name||file.name;
            persist();_renderKf();
          }catch(err){ console.warn("[H3One] paste upload:",err); }
        }
      },{capture:true});

      // -- DOM widget --------------------------------------------------------
      self.addDOMWidget("h3_ui","div",root,{
        getValue(){return null;},setValue(){},serialize:false,
        canvasOnly:!_isVueNodes(),
        computeSize(){const sh=(typeof LiteGraph!=="undefined"&&LiteGraph.NODE_SLOT_HEIGHT)||20;return[NODE_W,NODE_H+sh*3];},
      });
      {const sh=(typeof LiteGraph!=="undefined"&&LiteGraph.NODE_SLOT_HEIGHT)||20;self.setSize([NODE_W,NODE_H+sh*3]);}

      if(!_isVueNodes()){
        requestAnimationFrame(()=>{
          let el=root;
          for(let i=0;i<6;i++){el=el?.parentElement;if(!el)break;el.querySelectorAll("[class*='bg-node-component-surface']").forEach(b=>b.style.display="none");}
        });
      }

      root.addEventListener("pointerdown",()=>{
        _activeNode=self;
        _activeShowOutput=showOutput;
        _activeResetBtn=resetBtn;
        _activeShowError=showError;
        _activeSetStage=setStage;
        _activeShowTime=showTime;
        _activeShowLatest=showLatest;
        _activeRenderChainClips=_renderChainClips;
      });
    };
  },
});

async function _finalizeChain(){
  if(_chainFinalizing) return;
  _chainFinalizing=true;
  try{
    // The executed events can arrive slightly after execution_success on some
    // ComfyUI builds; give the per-clip outputs a moment to land before failing.
    for(let w=0; w<20 && _chainClipOutputs.some(x=>!x); w++){
      await new Promise(r=>setTimeout(r,500));
    }
    if(_chainClipOutputs.some(x=>!x)){
      // Fallback: the executed events can miss node-id metadata on some
      // ComfyUI builds, so discover the clip files on disk for this session.
      try{
        const g=await fetch("/h3one/gallery");
        const gd=await _resJson(g,"/h3one/gallery");
        (gd.videos||[]).forEach(v=>{
          const m=/clip_(\d+)/.exec(v.filename||"");
          if(!m) return;
          if(!String(v.subfolder||"").startsWith(`one-node-minimax-h3/chain/${_chainSession}`)) return;
          const ci=+m[1]-1;
          if(ci>=0&&ci<_chainClipOutputs.length&&!_chainClipOutputs[ci]){
            _chainClipOutputs[ci]={filename:v.filename,subfolder:v.subfolder||""};
          }
        });
        _activeRenderChainClips?.();
      }catch(e){}
    }
    const files=_chainClipOutputs.map((it)=>{
      if(!it) return null;
      return {filename:it.filename,subfolder:it.subfolder||""};
    });
    const missing=_chainClipOutputs.map((x,i)=>x?null:i+1).filter(x=>x!==null);
    if(!files.length || missing.length){
      throw new Error(t("err.chain.missing.clip")+" Missing clip(s): "+(missing.length?missing.join(", "):"none"));
    }
    _activeSetStage?.("Concatenating clips...",97);
    const res=await fetch("/h3one/chain_concat",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({files,session:_chainSession}),
    });
    const data=await _resJson(res,"/h3one/chain_concat");
    if(!data.ok) throw new Error(data.error||"Concat failed");

    const item={filename:data.filename,subfolder:data.subfolder||""};
    _chainFinalOutput=item;
    _activeRenderChainClips?.();
    _activeShowOutput?.(item);
    _activeSetStage?.("Done",100);
    const _elapsed=Date.now()-_activeGenStartTs;
    _activeShowTime?.(_elapsed);
    setTimeout(async()=>{
      await _activeShowLatest?.();
      _activeResetBtn?.();
      const S=_activeNode?._h3_S;
      if(S && S.soundEnabled!==false && S.sound!=="off") playDone(S.sound||"chime");
    },600);
  }catch(e){
    _activeShowError?.(fmtErr(e));
    _activeResetBtn?.();
  }finally{
    _chainFinalizing=false;
  }
}

// -- Global API event listeners (once) ----------------------------------------
(()=>{
  if(_listenersRegistered) return;
  _listenersRegistered=true;

  api.addEventListener("progress",(evt)=>{
    if(!_activeNode) return;
    const {value,max}=evt.detail||{};
    if(max>0&&_activeSetStage) _activeSetStage("Sampling...",8+Math.round(value/max*86));
  });

  api.addEventListener("executed",(evt)=>{
    if(!_activeNode) return;
    const d=evt.detail;
    if(!d||!_batchIds.includes(d.prompt_id)) return;
    const out=d.output;
    if(!out) return;
    const vids=out.videos||out.gifs||null;
    if(!vids||!Array.isArray(vids)||!vids.length) return;
    if(_chainMode){
      const item=vids[vids.length-1];
      const m=/^c(\d+):savevid$/.exec(d.node||"");
      let idx=m?+m[1]:-1;
      if(idx>=0&&idx<_chainClipOutputs.length&&!_chainClipOutputs[idx]){
        _chainClipOutputs[idx]=item;
      } else if(idx<0||idx>=_chainClipOutputs.length){
        const empty=_chainClipOutputs.findIndex(x=>!x);
        if(empty>=0) _chainClipOutputs[empty]=item;
      }
      _activeRenderChainClips?.();
      const done=_chainClipOutputs.filter(Boolean).length;
      const total=_chainClipOutputs.length;
      _activeSetStage?.(`Clip ${Math.min(done+1,total)}/${total} done`,Math.round(Math.min(done/total,1)*95));
      return;
    }
    if(_activeShowOutput){
      _activeShowOutput(vids[vids.length-1]);
      _activeSetStage?.("Done",97);
    }
  });

  api.addEventListener("execution_success",()=>{
    if(!_activeNode) return;
    if(_activeNode._h3_S && _activeNode._h3_S.generating!==true) return;
    if(_batchIds.length){
      _batchDone++;
      if(_batchDone<_batchIds.length){
        _activeSetStage?.(`Done ${_batchDone}/${_batchIds.length}`,Math.round(_batchDone/_batchIds.length*100));
        return;
      }
    }
    if(_chainMode){
      _finalizeChain();
      return;
    }
    _activeSetStage?.("Done",100);
    const _elapsed=Date.now()-_activeGenStartTs;
    _activeShowTime?.(_elapsed);
    setTimeout(async()=>{
      await _activeShowLatest?.();
      _activeResetBtn?.();
      const S=_activeNode?._h3_S;
      if(S && S.soundEnabled!==false && S.sound!=="off") playDone(S.sound||"chime");
    },600);
  });

  api.addEventListener("execution_error",(evt)=>{
    if(!_activeNode) return;
    const d=evt.detail;
    if(d?.prompt_id&&_batchIds.length&&!_batchIds.includes(d.prompt_id)) return;
    const msg=fmtErr(d?.exception_message||d?.error||d||"Execution failed.");
    _activeShowError?.(msg);
    _activeResetBtn?.();
  });
})();
