# OneNode-MinimaxH3

![状态：Beta](https://img.shields.io/badge/status-beta-orange)
![许可证：GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue)

> **Fork 说明：** 本项目是
> [LeonQ8/ComfyUI-ALLinONE-MinimaxH3](https://github.com/LeonQ8/ComfyUI-ALLinONE-MinimaxH3)
> 的一个 fork。

一个节点，完成整个 MiniMax H3 视频生成流程——包括**由单个音轨驱动的长视频**。

不需要搭建节点图，不需要手动连线，也不需要为了找对工作流而在十几个自定义节点包里来回翻找。选择一个模式，填入提示词或参考素材，点击 **Generate**，剩下的交给节点完成。

![ALL in ONE MiniMaxH3 — T2V 标签页](assets/t2v_main.png)

---

## Chain——从一个音轨生成长视频

**Chain** 是本节点的核心功能。它会生成一组具有真实运动连续性的片段（H3 Motion Context、latent 路径，片段之间不做重新编码），然后自动拼接成最终视频。

### Audio Lock

在 Chain 中打开 **Audio Lock**，并提供一条音轨，节点会自动处理：

- 读取音轨时长，并**将链自动切分为不超过 15 秒的片段**——每个切分点会贴合最近的停顿（语音静音，或没有静音时音乐的声带间隙），避免句子和歌词被从中间截断。任何片段都不会超过 15 秒。
- 每个片段会使用**自己对应时间段内的音轨**驱动口型同步，不再只是循环使用前 15 秒。
- 音频经过 Motion Context 裁剪，使每个片段的音频长度与画面长度完全一致——拼接结果具有连续、不重复的音轨，并且**不会出现口型漂移**。

### 长视频生成

- 支持任意数量的片段，每个片段都可以有自己的提示词和时长。
- 后续片段通过 latent 路径继承前一个片段的运动（关闭 Audio Lock 时也会继承音频延续）。
- 片段在一个队列任务中按顺序执行，节点使用 ffmpeg 进行拼接（优先 stream copy，必要时回退到重新编码），输出单个 `final_*.mp4`。
- 视频区域会展示所有生成片段以及最终结果，点击任意片段即可查看。

### Chain 中的参考素材

Chain 也支持**图片 / 视频 / 音频参考素材**（身份、运动、配乐），默认使用 `fl2va` UNet 模型。所有片段请保持相同分辨率——latent 路径无法在 Chain 中间改变尺寸。

### 分辨率与宽高比

- 内置 55 种分辨率预设，范围从 **0.2MP 到 1.0MP**，覆盖横屏、竖屏、3:4、4:3、3:2、2:3、1:1、21:9 和 9:21。
- 分辨率下拉框前有一个**宽高比选择器**：选择 16:9、9:16 等比例后，分辨率列表会自动过滤为对应选项。
- 自定义尺寸会吸附到 32 的倍数，并在超出 MiniMax H3 推荐画布范围（短边 ≤ 768，长边 ≤ 1344）时给出警告。

## 快速开始——Chain + Audio Lock

1. 选择 **Chain** 模式。
2. 打开 **Audio Lock**。
3. 选择音轨（Select / Change）。
4. 片段列表会根据音轨长度自动切分（每个片段 15 秒）。
5. 可选添加图片 / 视频参考素材，调整分辨率和质量。
6. 点击 **Generate**——片段会按顺序生成并合并为一个最终视频。

## 所有模式

| 模式 | 作用 |
|------|------|
| **Chain** | 多片段长视频，具备 Motion Context 连续性、图片 / 视频 / 音频参考，以及用于单音轨口型同步的 **Audio Lock** |
| **T2V** | 文本生成视频，支持原生音频（fl2va 模型） |
| **I2V** | 让起始帧动起来，可选过渡到结束帧 |
| **R2V** | 用参考图片 / 视频 / 音频驱动片段（ref2va 模型） |
| **Keyframes** | 在任意帧位置固定静态图片 |
| **Extend** | 无缝续写已有视频 |
| **Upscale** | RTX / SeedVR2 视频超分辨率入口 |

界面支持 **English** 和 **中文**，可从工具栏切换。

## 截图

**History**——可搜索，支持复用提示词，并带每个条目的预览。

![History](assets/history.png)

**Library**——所有输出集中展示：内联预览、收藏、打开文件夹、删除、RTX 超分入口。

![Library](assets/library.png)

**Settings**——主题强调色、声音、模型和微信公众号关注区域。

![Settings](assets/settings.png)

## 环境要求

### 模型

从 [Comfy-Org/MiniMax-H3](https://huggingface.co/Comfy-Org/MiniMax-H3) 下载官方 MiniMax H3 文件，放到 ComfyUI 的标准 `ComfyUI/models/` 目录：

| 文件 | 目录 |
|------|------|
| `minimax_h3_fl2va_pruned_int8_convrot.safetensors` | `diffusion_models/` |
| `minimax_h3_ref2va_pruned_int8_convrot.safetensors` | `diffusion_models/` |
| `qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors` | `text_encoders/` |
| `minimax_h3_video_vae_fp16.safetensors` | `vae/` |
| `minimax_h3_audio_vae_fp32.safetensors` | `vae/` |

### 自定义节点

- **Chain / Keyframes / Extend：** [ComfyUI-H3-Motion-Context-MultiRef](https://github.com/seitanism/ComfyUI-H3-Motion-Context-MultiRef)——在 ComfyUI 0.32 上请固定到已测试提交 `0719855`（当前 `main` 需要 ComfyUI PR #15439 / 0.33+）。详见 [COMPATIBILITY.md](COMPATIBILITY.md)。
- **Audio Lock / Audio Drive：** comfyui-vrgamedevgirl
- **Turbo 预设：** [ComfyUI-MiniMax-H3-Turbo](https://github.com/Larryvrh/ComfyUI-MiniMax-H3-Turbo) + 来自 [larryvrh/MiniMax-H3-Turbo-Lora](https://huggingface.co/larryvrh/MiniMax-H3-Turbo-Lora) 的 turbo LoRA
- **可选（Speed / High Quality 预设）：** ComfyUI-SolAttn_triton、ComfyUI-MiniMaxH3-Cache、SageAttention

所有经过测试的版本都记录在 **[COMPATIBILITY.md](COMPATIBILITY.md)**——更新 ComfyUI 或某个节点包后如果出现异常，请优先查看该文件。

## 安装

```bash
# 在 ComfyUI/custom_nodes/ 目录中执行
git clone https://github.com/AIFSH/OneNode-MinimaxH3.git
```

重启 ComfyUI，然后在画布上双击并搜索 **ALL in ONE MiniMaxH3**。

## 兼容性

本项目的开发和测试基于固定版本组合（ComfyUI 版本、自定义节点提交、模型文件）。完整信息见 **[COMPATIBILITY.md](COMPATIBILITY.md)**——更新某个组件后如果渲染失败，请先从这里排查。

> **Chain / Keyframes / Extend 特别提示：** `ComfyUI-H3-Motion-Context-MultiRef` 当前 `main` 分支已移除旧版 patch 路径，需要 ComfyUI PR #15439（0.33+）。在固定的 ComfyUI 0.32 组合中，必须停留在提交 `0719855`：
>
> ```bash
> cd ComfyUI/custom_nodes/ComfyUI-H3-Motion-Context-MultiRef
> git fetch origin && git checkout 0719855
> ```
>
> 然后重启 ComfyUI（或者将 ComfyUI 升级到 0.33+，再使用当前版本的节点包）。

## 致谢

- “单节点”理念和 UI 方式：Ján——[one-node-flux-2-klein](https://github.com/yanokusnir-ai/one-node-flux-2-klein) 和 [one-node-gemma-4](https://github.com/yanokusnir-ai/one-node-gemma-4)
- Chain / Keyframes / Extend 接线：[ComfyUI-H3-Motion-Context-MultiRef](https://github.com/seitanism/ComfyUI-H3-Motion-Context-MultiRef)，作者 seitanism
- 基础图：Comfy-Org 官方 MiniMax H3 原生工作流
- Turbo 预设：ComfyUI-MiniMax-H3-Turbo 节点包

## 支持

本项目目前处于 **beta** 阶段——如果出现问题，请 [提交 Issue](https://github.com/AIFSH/OneNode-MinimaxH3/issues)，这是最快获得修复的方式。

**关注微信公众号：** 设置面板会直接显示二维码。将二维码图片放到 `web/wechat_qr.png`（或 `assets/wechat_qr.png`；也支持 `.jpg` / `.jpeg` / `.webp` / `.gif`），节点会通过 `/h3one/wechat_qr` 端点提供该图片，图片格式会根据文件内容自动识别。

## 许可证

GPL-3.0——详见 [LICENSE](LICENSE)。
