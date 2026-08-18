import os
import json
import glob
import time
import uuid
import shutil
import subprocess
import hashlib
import tempfile
import re
import math
from pathlib import Path

import torch
import folder_paths
import node_helpers
from aiohttp import web
from server import PromptServer

NODE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(NODE_DIR, "config.json")
SUBFOLDER = "one-node-minimax-h3"
MAX_HISTORY = 50


def _ensure_h3_keyframe_ref_merge():
    """ComfyUI 0.32 core bug: a conditioning carrying BOTH minimax_keyframes and
    minimax_refs crashes the sampler - model_base.extra_conds lets the refs
    branch overwrite cond_video_latents, so the fixed-row count no longer
    matches the packed layout (RuntimeError: shape mismatch). The H3 Motion
    Context MultiRef pack ships a standalone, capability-aware repair
    (patch_payload). Apply ONLY that part - not its layout patch, whose
    self-test fails against 0.32 - so our identity anchor and any keyframe+ref
    graph run crash-free. Idempotent and dormant once ComfyUI fixes it natively."""
    try:
        import importlib.util as _ilu
        pack_name = "ComfyUI-H3-Motion-Context-MultiRef"
        root = os.path.dirname(NODE_DIR)
        pack_dir = os.path.join(root, pack_name)
        # The old single-pack "ComfyUI-H3-Motion-Context" (NikoDemon80) predates
        # the MultiRef fork and patches ComfyUI's packed layout with monkey
        # patches whose self-test fails on current core - chain then dies at
        # render time with "the layout patch could not be applied". It also
        # registers the same node class names, so it conflicts with the
        # required pack when both are installed. Surface that up front.
        old_pack_dir = os.path.join(root, "ComfyUI-H3-Motion-Context")
        if os.path.isdir(old_pack_dir):
            print("[H3One] WARNING: found the OLD 'ComfyUI-H3-Motion-Context' pack "
                  "instead of the required 'ComfyUI-H3-Motion-Context-MultiRef'.")
            print("[H3One] Chain / Keyframes / Extend will fail with 'the layout patch could "
                  "not be applied' on current ComfyUI (same class names also conflict). Fix:")
            print("[H3One]   cd ComfyUI/custom_nodes")
            print("[H3One]   git clone https://github.com/seitanism/ComfyUI-H3-Motion-Context-MultiRef.git")
            print("[H3One]   cd ComfyUI-H3-Motion-Context-MultiRef")
            print("[H3One]   git fetch origin && git checkout 0719855   # pinned ComfyUI 0.32 build")
            print("[H3One]   remove or disable the old ComfyUI-H3-Motion-Context folder, then restart.")
            if not os.path.isdir(pack_dir):
                return
        path = os.path.join(pack_dir, "patch_payload.py")
        if not os.path.isfile(path):
            compat_path = os.path.join(pack_dir, "h3_compat.py")
            if os.path.isfile(compat_path):
                try:
                    with open(compat_path, "r", encoding="utf-8", errors="replace") as f:
                        compat_src = f.read() or ""
                except Exception:
                    compat_src = ""
                if "native_guide_status" in compat_src:
                    print("[H3One] WARNING: ComfyUI-H3-Motion-Context-MultiRef is the new native-only "
                          "version and requires ComfyUI PR #15439 (0.33+).")
                    print("[H3One] Chain / Keyframes need the pinned tested commit 0719855 on ComfyUI 0.32. Fix:")
                    print("[H3One]   cd ComfyUI/custom_nodes/ComfyUI-H3-Motion-Context-MultiRef")
                    print("[H3One]   git fetch origin && git checkout 0719855")
                    print("[H3One]   restart ComfyUI (or upgrade ComfyUI to 0.33+).")
                    return
            print("[H3One] %s not found - keyframe+ref payload repair unavailable." % pack_name)
            return
        spec = _ilu.spec_from_file_location("_h3one_patch_payload", path)
        mod = _ilu.module_from_spec(spec)
        spec.loader.exec_module(mod)
        ok = mod.apply_patch(require_merge=True, require_av_masks=False)
        print("[H3One] H3 keyframe+ref payload repair: %s" % ("enabled" if ok else "native or unavailable"))
    except Exception as e:
        print("[H3One] H3 keyframe+ref payload repair failed: %s" % e)


_ensure_h3_keyframe_ref_merge()

# User config and history live OUTSIDE the node folder so they survive
# reinstalls / git pulls. Built-in presets ship in the repo's config.json
# (read-only defaults); user edits are stored here and merged in at read time.
USER_CONFIG_DIR = os.path.join(folder_paths.get_user_directory(), "default", SUBFOLDER)
USER_CONFIG_PATH = os.path.join(USER_CONFIG_DIR, "config.json")
USER_HISTORY_PATH = os.path.join(USER_CONFIG_DIR, "history.json")

_VIDEO_EXTS = (".mp4", ".webm", ".gif", ".mkv", ".mov", ".m4v", ".avi")
_ALLOWED_TEMPLATES = (
    "t2v.json", "i2v.json", "r2v.json", "audio_drive.json",
    "keyframes.json", "video_extend.json", "chain_section.json",
)


# ---------------------------------------------------------------------------
# Config (built-in defaults merged with user edits; only the diff is stored)
# ---------------------------------------------------------------------------
def _load_builtin_config():
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _load_user_config():
    try:
        with open(USER_CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _load_config():
    builtin = _load_builtin_config()
    user = _load_user_config()
    merged = dict(builtin)
    merged.update({k: v for k, v in user.items() if k != "prompt_templates"})
    merged["prompt_templates"] = dict(builtin.get("prompt_templates", {}))
    merged["prompt_templates"].update(user.get("prompt_templates", {}))
    merged["custom_presets"] = user.get("custom_presets", {})
    return merged


def _save_config(patch):
    user = _load_user_config()
    for k, v in patch.items():
        user[k] = v
    os.makedirs(USER_CONFIG_DIR, exist_ok=True)
    tmp = USER_CONFIG_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(user, f, ensure_ascii=False, indent=2)
    os.replace(tmp, USER_CONFIG_PATH)


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------
def _load_history():
    try:
        with open(USER_HISTORY_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _save_history(items):
    os.makedirs(USER_CONFIG_DIR, exist_ok=True)
    tmp = USER_HISTORY_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    os.replace(tmp, USER_HISTORY_PATH)


# ---------------------------------------------------------------------------
# Favorites (stored in the user dir so they survive reinstalls)
# ---------------------------------------------------------------------------
def _favorites_path():
    return os.path.join(USER_CONFIG_DIR, "favorites.json")


def _load_favorites():
    try:
        with open(_favorites_path(), "r", encoding="utf-8") as f:
            data = json.load(f)
        return set(data) if isinstance(data, list) else set()
    except Exception:
        return set()


def _save_favorites(favset):
    os.makedirs(USER_CONFIG_DIR, exist_ok=True)
    with open(_favorites_path(), "w", encoding="utf-8") as f:
        json.dump(sorted(favset), f, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# LoRA trigger words (read from the safetensors header, like the flux node)
# ---------------------------------------------------------------------------
def _read_safetensors_header(path):
    try:
        with open(path, "rb") as f:
            length_bytes = f.read(8)
            if len(length_bytes) < 8:
                return None
            import struct
            header_len = struct.unpack("<Q", length_bytes)[0]
            if header_len > 100 * 1024 * 1024:
                return None
            header_bytes = f.read(header_len)
        return json.loads(header_bytes.decode("utf-8"))
    except Exception:
        return None


def _extract_trigger_words(header):
    if not header:
        return []
    meta = header.get("__metadata__", {})
    if not isinstance(meta, dict):
        return []
    triggers = []
    v = meta.get("modelspec.trigger_phrase") or meta.get("trigger_phrase") or meta.get("trigger_word")
    if v and isinstance(v, str) and v.strip():
        triggers.extend([t.strip() for t in v.split(",") if t.strip()])
    raw = meta.get("ss_trigger_words")
    if raw:
        if isinstance(raw, str):
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    triggers.extend([str(t).strip() for t in parsed if str(t).strip()])
                elif isinstance(parsed, str) and parsed.strip():
                    triggers.extend([t.strip() for t in parsed.split(",") if t.strip()])
            except Exception:
                triggers.extend([t.strip() for t in raw.split(",") if t.strip()])
        elif isinstance(raw, list):
            triggers.extend([str(t).strip() for t in raw if str(t).strip()])
    seen = set()
    result = []
    for t in triggers:
        if t.lower() not in seen:
            seen.add(t.lower())
            result.append(t)
    return result


@PromptServer.instance.routes.get("/h3one/lora_triggers")
async def lora_triggers(request):
    lora_name = request.query.get("name", "")
    if not lora_name:
        return web.json_response({"ok": False, "error": "no name"}, status=400)
    try:
        bases = folder_paths.get_folder_paths("loras")
    except Exception:
        return web.json_response({"ok": False, "error": "cannot resolve loras folder"}, status=500)
    for base in bases:
        candidate = os.path.normpath(os.path.join(base, lora_name))
        try:
            Path(candidate).resolve().relative_to(Path(base).resolve())
        except Exception:
            continue
        if os.path.isfile(candidate) and candidate.lower().endswith(".safetensors"):
            header = _read_safetensors_header(candidate)
            triggers = _extract_trigger_words(header)
            return web.json_response({"ok": True, "triggers": triggers, "name": lora_name})
    return web.json_response({"ok": False, "error": "file not found", "triggers": []})


# ---------------------------------------------------------------------------
# Path helpers
# ---------------------------------------------------------------------------
def _get_output_dir():
    try:
        return str(Path(folder_paths.get_output_directory()).resolve())
    except Exception:
        return str(Path(os.path.join(os.path.dirname(NODE_DIR), "output")).resolve())


def _safe_join(base, *parts):
    target = Path(base)
    for p in parts:
        target = target / p
    target = target.resolve()
    try:
        target.relative_to(Path(base).resolve())
    except Exception:
        raise ValueError("invalid path")
    return str(target)


def _find_ffmpeg():
    try:
        import custom_nodes.ComfyUI_VideoHelperSuite.videohelpersuite.ffmpeg_path as vhs_fp  # noqa
        p = vhs_fp.get_ffmpeg_path() if hasattr(vhs_fp, "get_ffmpeg_path") else getattr(vhs_fp, "ffmpeg_path", "")
        if p and os.path.isfile(p):
            return p
    except Exception:
        pass
    exe = "ffmpeg.exe" if os.name == "nt" else "ffmpeg"
    root = NODE_DIR
    for _ in range(6):
        if os.path.isdir(os.path.join(root, "custom_nodes")):
            break
        root = os.path.dirname(root)
    for name in ("ComfyUI-VideoHelperSuite", "ComfyUI_VideoHelperSuite", "comfyui-videohelpersuite"):
        vhs_dir = os.path.join(root, "custom_nodes", name)
        if os.path.isdir(vhs_dir):
            for _r, _d, files in os.walk(vhs_dir):
                if exe in files:
                    return os.path.join(_r, exe)
    portable = os.path.dirname(root)
    for cand in (os.path.join(portable, exe), os.path.join(root, exe), os.path.join(portable, "bin", exe)):
        if os.path.isfile(cand):
            return cand
    return shutil.which("ffmpeg")


_ffmpeg_path = None


def _ff():
    global _ffmpeg_path
    if _ffmpeg_path is None:
        _ffmpeg_path = _find_ffmpeg() or ""
    return _ffmpeg_path or None


# ---------------------------------------------------------------------------
# Model / file scanning
# ---------------------------------------------------------------------------
def _scan(folder_key, extensions=None):
    exts = extensions or [".safetensors", ".ckpt", ".pt", ".pth", ".gguf"]
    try:
        bases = folder_paths.get_folder_paths(folder_key)
    except Exception:
        return []
    found = []
    for base in bases:
        if not os.path.isdir(base):
            continue
        for root, _dirs, files in os.walk(base, followlinks=True):
            for fn in files:
                if any(fn.lower().endswith(e) for e in exts):
                    found.append(os.path.relpath(os.path.join(root, fn), base))
    return sorted(found)


def _scan_output_videos():
    base = Path(_get_output_dir())
    out_dir = base / SUBFOLDER
    if not out_dir.is_dir():
        return []
    found = []
    for root, _dirs, files in os.walk(str(out_dir)):
        for fn in files:
            if fn.lower().endswith(_VIDEO_EXTS):
                full = os.path.join(root, fn)
                found.append({
                    "filename": fn,
                    "subfolder": os.path.relpath(os.path.dirname(full), str(base)).replace("\\", "/"),
                    "mtime": os.path.getmtime(full),
                })
    found.sort(key=lambda x: x["mtime"], reverse=True)
    return found


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@PromptServer.instance.routes.get("/h3one/workflow/{name}")
async def serve_template(request):
    name = request.match_info.get("name", "")
    if name not in _ALLOWED_TEMPLATES:
        return web.Response(status=404, text="template not found")
    path = os.path.join(NODE_DIR, "workflows", name)
    with open(path, "r", encoding="utf-8-sig") as f:
        return web.json_response(json.load(f))


@PromptServer.instance.routes.get("/h3one/models")
async def get_models(request):
    return web.json_response({
        "diffusion_models": _scan("diffusion_models"),
        "text_encoders": _scan("text_encoders"),
        "vaes": _scan("vae"),
        "loras": _scan("loras"),
    })


@PromptServer.instance.routes.get("/h3one/latent_upscaler_models")
async def get_latent_upscaler_models(request):
    """List checkpoints available to the integrated latent upscaler.

    The actual inference is provided by
    Comfyui_Minimax_h3_latent_Upscaler. Its nodes scan
    ComfyUI/models/latent_upscale_models for .safetensors/.pth files.
    """
    try:
        return web.json_response({"models": _scan("latent_upscale_models", [".safetensors", ".pth"])})
    except Exception as e:
        return web.json_response({"models": [], "error": str(e)}, status=500)


@PromptServer.instance.routes.get("/h3one/input_files")
async def list_input_files(request):
    try:
        ftype = request.query.get("type", "video")
        if ftype == "audio":
            exts = (".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac")
        elif ftype == "image":
            exts = (".png", ".jpg", ".jpeg", ".webp", ".bmp")
        else:
            exts = (".mp4", ".webm", ".mkv", ".avi", ".mov")
        input_dir = folder_paths.get_input_directory()
        found = sorted(fn for fn in os.listdir(input_dir) if fn.lower().endswith(exts))
        return web.json_response({"files": found})
    except Exception as e:
        return web.json_response({"files": [], "error": str(e)})


@PromptServer.instance.routes.post("/h3one/upload")
async def upload_file(request):
    try:
        reader = await request.multipart()
        field = await reader.next()
        if field is None or field.name != "file":
            return web.json_response({"ok": False, "error": "no file field"}, status=400)
        filename = field.filename
        if not filename:
            return web.json_response({"ok": False, "error": "no filename"}, status=400)
        filename = Path(filename).name
        input_dir = folder_paths.get_input_directory()
        dest = os.path.join(input_dir, filename)
        with open(dest, "wb") as f:
            while True:
                chunk = await field.read_chunk(65536)
                if not chunk:
                    break
                f.write(chunk)
        return web.json_response({"ok": True, "filename": filename})
    except Exception as e:
        print(f"[H3One] upload error: {e}")
        return web.json_response({"ok": False, "error": str(e)}, status=500)


@PromptServer.instance.routes.get("/h3one/audio_breaks")
async def audio_breaks(request):
    """Detect natural cut points in an input audio file.

    Used by Chain Audio Lock to split the track near natural sentence breaks
    instead of hard-cutting every 15 seconds. Two passes are run:

    - plain silence detection (speech pauses);
    - silence detection on the vocal frequency band (200–4000 Hz), which
      exposes instrumental interludes / vocal phrase gaps in music that has
      no true silence.

    The frontend only uses cut points at or before the 15s boundary, so no
    clip ever exceeds 15 seconds.
    """
    filename = request.query.get("filename", "")
    if not filename:
        return web.json_response({"ok": False, "error": "no filename"}, status=400)
    ff = _ff()
    if not ff:
        return web.json_response({"ok": True, "silences": [], "vocal_breaks": []})
    try:
        path = _safe_join(folder_paths.get_input_directory(), filename)
        if not os.path.isfile(path):
            return web.json_response({"ok": False, "error": "file not found"}, status=404)

        def _run(filter_expr):
            proc = subprocess.run(
                [ff, "-nostdin", "-i", path, "-af", filter_expr, "-f", "null", "-"],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=180, check=False)
            text = (proc.stderr or b"").decode("utf-8", "replace")
            out = []
            start = None
            for line in text.splitlines():
                sm = re.search(r"silence_start:\s*([0-9.]+)", line)
                em = re.search(r"silence_end:\s*([0-9.]+)", line)
                if sm:
                    start = float(sm.group(1))
                if em and start is not None:
                    out.append({"start": start, "end": float(em.group(1))})
                    start = None
            return out

        silences = _run("silencedetect=noise=-30dB:d=0.25")
        vocal_breaks = _run(
            "highpass=f=200,lowpass=f=4000,"
            "silencedetect=noise=-32dB:d=0.3")
        return web.json_response({"ok": True, "silences": silences, "vocal_breaks": vocal_breaks})
    except Exception as e:
        print(f"[H3One] audio_breaks error: {e}")
        return web.json_response({"ok": True, "silences": [], "vocal_breaks": [], "error": str(e)})


@PromptServer.instance.routes.get("/h3one/config")
async def get_config(request):
    try:
        return web.json_response(_load_config())
    except Exception as e:
        print(f"[H3One] config load error: {e}")
        return web.json_response({"ok": False, "error": str(e)}, status=500)


@PromptServer.instance.routes.get("/h3one/wechat_qr")
async def wechat_qr(request):
    """Serve the WeChat QR image for the "scan to follow" area.

    Looks in the node's web/ and assets/ folders so the image path is stable
    regardless of the custom-node folder name on the server. The content type
    is detected from the file header, not the extension, so a JPEG saved as
    wechat_qr.png still renders.
    """
    def _img_mime(path):
        try:
            with open(path, "rb") as f:
                head = f.read(12)
        except Exception:
            return None
        if head.startswith(b"\x89PNG"):
            return "image/png"
        if head.startswith(b"\xff\xd8\xff"):
            return "image/jpeg"
        if head.startswith(b"GIF8"):
            return "image/gif"
        if head.startswith(b"RIFF") and head[8:12] == b"WEBP":
            return "image/webp"
        return None

    names = ("wechat_qr.png", "wechat_qr.jpg", "wechat_qr.jpeg",
             "wechat_qr.webp", "wechat_qr.gif")
    for folder in ("web", "assets"):
        for name in names:
            cand = os.path.join(NODE_DIR, folder, name)
            if not os.path.isfile(cand):
                continue
            mime = _img_mime(cand)
            if mime:
                return web.FileResponse(cand, content_type=mime)
            return web.FileResponse(cand)
    return web.Response(status=404, text="wechat_qr image not found")


@PromptServer.instance.routes.post("/h3one/config")
async def save_config_route(request):
    try:
        patch = await request.json()
        if not isinstance(patch, dict):
            return web.json_response({"ok": False, "error": "invalid payload"}, status=400)
        _save_config(patch)
        return web.json_response({"ok": True})
    except Exception as e:
        print(f"[H3One] config save error: {e}")
        return web.json_response({"ok": False, "error": str(e)}, status=500)


@PromptServer.instance.routes.post("/h3one/presets")
async def save_preset(request):
    """Upsert a custom prompt preset for a mode. Stored in the user config
    (survives reinstalls); merged with the built-in presets at read time."""
    _VALID_MODES = ("t2v", "i2v", "r2v", "audio_drive", "keyframes", "extend", "chain")
    try:
        data = await request.json()
        mode = str(data.get("mode", "")).strip()
        name = str(data.get("name", "")).strip()
        prompt = str(data.get("prompt", "")).strip()
        original_name = str(data.get("original_name", "")).strip()
        if mode not in _VALID_MODES or not name or not prompt:
            return web.json_response({"ok": False, "error": "a valid mode, name and prompt are required"}, status=400)
        user = _load_user_config()
        custom = user.get("custom_presets", {})
        if not isinstance(custom, dict):
            custom = {}
        lst = list(custom.get(mode, []))
        # Remove the entry being edited: drop the original name when renaming,
        # and drop any same-named entry (upsert).
        lst = [p for p in lst
               if (not original_name or str(p.get("name", "")).strip().lower() != original_name.lower())
               and str(p.get("name", "")).strip().lower() != name.lower()]
        lst.append({"name": name, "prompt": prompt})
        custom[mode] = lst
        _save_config({"custom_presets": custom})
        return web.json_response({"ok": True})
    except Exception as e:
        print(f"[H3One] preset save error: {e}")
        return web.json_response({"ok": False, "error": str(e)}, status=500)


@PromptServer.instance.routes.delete("/h3one/presets")
async def delete_preset(request):
    _VALID_MODES = ("t2v", "i2v", "r2v", "audio_drive", "keyframes", "extend", "chain")
    try:
        data = await request.json()
        mode = str(data.get("mode", "")).strip()
        name = str(data.get("name", "")).strip()
        if mode not in _VALID_MODES or not name:
            return web.json_response({"ok": False, "error": "a valid mode and name are required"}, status=400)
        user = _load_user_config()
        custom = user.get("custom_presets", {})
        if not isinstance(custom, dict):
            custom = {}
        lst = list(custom.get(mode, []))
        custom[mode] = [p for p in lst if str(p.get("name", "")).strip().lower() != name.lower()]
        _save_config({"custom_presets": custom})
        return web.json_response({"ok": True})
    except Exception as e:
        print(f"[H3One] preset delete error: {e}")
        return web.json_response({"ok": False, "error": str(e)}, status=500)


@PromptServer.instance.routes.get("/h3one/history")
async def get_history(request):
    return web.json_response({"items": _load_history()})


@PromptServer.instance.routes.post("/h3one/history")
async def add_history(request):
    try:
        data = await request.json()
        entry = {
            "id": str(uuid.uuid4()),
            "timestamp": int(time.time()),
            "mode": data.get("mode", ""),
            "quality": data.get("quality", ""),
            "prompt": data.get("prompt", "")[:2000],
            "duration": data.get("duration", 0),
            "resolution": data.get("resolution", ""),
            "seed": data.get("seed", 0),
            "gen_time": data.get("gen_time", 0),
            "video": data.get("video", ""),
            "subfolder": data.get("subfolder", ""),
        }
        items = _load_history()
        items.insert(0, entry)
        _save_history(items[:MAX_HISTORY])
        return web.json_response({"ok": True, "id": entry["id"]})
    except Exception as e:
        print(f"[H3One] history save error: {e}")
        return web.json_response({"ok": False, "error": str(e)}, status=500)


@PromptServer.instance.routes.delete("/h3one/history/{item_id}")
async def delete_history(request):
    try:
        item_id = request.match_info.get("item_id", "")
        items = [i for i in _load_history() if i.get("id") != item_id]
        _save_history(items)
        return web.json_response({"ok": True})
    except Exception as e:
        return web.json_response({"ok": False, "error": str(e)}, status=500)


@PromptServer.instance.routes.get("/h3one/gallery")
async def get_gallery(request):
    try:
        favs = _load_favorites()
        videos = _scan_output_videos()
        for v in videos:
            v["favorite"] = v["filename"] in favs
        return web.json_response({"videos": videos})
    except Exception as e:
        print(f"[H3One] gallery error: {e}")
        return web.json_response({"videos": [], "error": str(e)}, status=500)


@PromptServer.instance.routes.post("/h3one/stage_input")
async def stage_input(request):
    """Copy an existing output video into the input folder so LoadVideo can read it.
    Returns the input-folder filename."""
    try:
        data = await request.json()
        filename = data.get("filename", "")
        subfolder = data.get("subfolder", "")
        if not filename:
            return web.json_response({"ok": False, "error": "no filename"}, status=400)
        src = _safe_join(_get_output_dir(), subfolder, filename)
        if not os.path.isfile(src):
            return web.json_response({"ok": False, "error": "not found"}, status=404)
        input_dir = Path(folder_paths.get_input_directory()).resolve()
        os.makedirs(str(input_dir), exist_ok=True)
        ext = os.path.splitext(filename)[1] or ".mp4"
        dest_name = f"h3_src_{uuid.uuid4().hex[:10]}{ext}"
        shutil.copy2(src, os.path.join(str(input_dir), dest_name))
        return web.json_response({"ok": True, "name": dest_name})
    except Exception as e:
        return web.json_response({"ok": False, "error": str(e)}, status=500)


@PromptServer.instance.routes.post("/h3one/favorite")
async def toggle_favorite(request):
    try:
        data = await request.json()
        filename = data.get("filename", "")
        fav = bool(data.get("favorite", False))
        if not filename:
            return web.json_response({"ok": False, "error": "no filename"}, status=400)
        favs = _load_favorites()
        if fav:
            favs.add(filename)
        else:
            favs.discard(filename)
        _save_favorites(favs)
        return web.json_response({"ok": True})
    except Exception as e:
        return web.json_response({"ok": False, "error": str(e)}, status=500)


@PromptServer.instance.routes.post("/h3one/open_folder")
async def open_folder(request):
    try:
        data = await request.json()
        filename = data.get("filename", "")
        subfolder = data.get("subfolder", "")
        if not filename:
            return web.json_response({"ok": False, "error": "no filename"})
        vpath = _safe_join(_get_output_dir(), subfolder, filename)
        if not os.path.exists(vpath):
            return web.json_response({"ok": False, "error": "file not found"}, status=404)
        if os.name == "nt":
            subprocess.Popen(["explorer", "/select,", vpath.replace("/", "\\")])
        else:
            subprocess.Popen(["xdg-open", os.path.dirname(vpath)])
        return web.json_response({"ok": True})
    except Exception as e:
        return web.json_response({"ok": False, "error": str(e)}, status=500)


@PromptServer.instance.routes.post("/h3one/delete")
async def delete_file(request):
    try:
        data = await request.json()
        filename = data.get("filename", "")
        subfolder = data.get("subfolder", "")
        if not filename:
            return web.json_response({"ok": False, "error": "filename required"}, status=400)
        vpath = _safe_join(_get_output_dir(), subfolder, filename)
        if not os.path.exists(vpath):
            return web.json_response({"ok": False, "error": "file not found"}, status=404)
        os.remove(vpath)
        return web.json_response({"ok": True})
    except Exception as e:
        return web.json_response({"ok": False, "error": str(e)}, status=500)


@PromptServer.instance.routes.post("/h3one/chain_concat")
async def chain_concat(request):
    """Concatenate a finished chain's per-clip videos into one final video.

    Each clip is already trimmed by H3 Motion Context, so a stream-copy concat
    is normally all that is needed. If stream copy fails (codec/timestamp
    mismatch), fall back to a normal re-encode so the UI still returns a usable
    result.
    """
    try:
        data = await request.json()
        files = data.get("files") or []
        session = str(data.get("session") or uuid.uuid4().hex[:10])
        if not isinstance(files, list) or not files:
            return web.json_response({"ok": False, "error": "no files"}, status=400)

        ff = _ff()
        if not ff:
            return web.json_response({"ok": False, "error": "ffmpeg not found"}, status=500)

        base = _get_output_dir()
        paths = []
        for item in files:
            if isinstance(item, dict):
                filename = str(item.get("filename") or "")
                subfolder = str(item.get("subfolder") or "")
            else:
                filename = str(item or "")
                subfolder = ""
            if not filename:
                return web.json_response({"ok": False, "error": "invalid file entry"}, status=400)
            src = _safe_join(base, subfolder, filename)
            if not os.path.isfile(src):
                return web.json_response({"ok": False, "error": "missing " + filename}, status=404)
            paths.append(src)

        out_dir = Path(_safe_join(base, SUBFOLDER, "chain", session))
        out_dir.mkdir(parents=True, exist_ok=True)
        out_name = "final_%s.mp4" % uuid.uuid4().hex[:10]
        out_path = out_dir / out_name

        list_fd, list_path = tempfile.mkstemp(prefix="h3one_concat_", suffix=".txt")
        try:
            with os.fdopen(list_fd, "w", encoding="utf-8") as f:
                for p in paths:
                    # ffmpeg concat demuxer expects forward-slash paths, and the
                    # file list is written on disk rather than passed to a shell.
                    escaped = p.replace("\\", "/").replace("'", "'\\''")
                    f.write("file '%s'\n" % escaped)

            cmd_copy = [ff, "-y", "-f", "concat", "-safe", "0", "-i", list_path,
                        "-c", "copy", str(out_path)]
            proc = subprocess.run(cmd_copy, stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE, timeout=600, check=False)
            if proc.returncode != 0:
                cmd_reencode = [ff, "-y", "-f", "concat", "-safe", "0", "-i", list_path,
                                "-c:v", "libx264", "-pix_fmt", "yuv420p",
                                "-map", "0:v?", "-map", "0:a?",
                                "-c:a", "aac", "-movflags", "+faststart", str(out_path)]
                proc = subprocess.run(cmd_reencode, stdout=subprocess.PIPE,
                                      stderr=subprocess.PIPE, timeout=1200, check=False)
                if proc.returncode != 0:
                    detail = (proc.stderr or b"").decode("utf-8", "replace")[-800:]
                    print("[H3One] chain concat failed: %s" % detail)
                    return web.json_response({"ok": False, "error": "concat failed"}, status=500)

            rel_subfolder = os.path.relpath(str(out_dir), base).replace("\\", "/")
            return web.json_response({"ok": True, "filename": out_name, "subfolder": rel_subfolder})
        finally:
            try:
                os.remove(list_path)
            except Exception:
                pass
    except Exception as e:
        print(f"[H3One] chain concat error: {e}")
        return web.json_response({"ok": False, "error": str(e)}, status=500)


# Stores the latest output per node instance (keyed by the node's graph id).
# The JS widget POSTs here after each generation; noop() hands it to downstream
# nodes on the next graph run.
_last_output_by_node = {}


@PromptServer.instance.routes.post("/h3one/set_output")
async def set_output(request):
    try:
        data = await request.json()
        node_id = str(data.get("node_id", ""))
        info = data.get("info") or {}
        if node_id:
            _last_output_by_node[node_id] = {
                "filename": info.get("filename", ""),
                "subfolder": info.get("subfolder", ""),
            }
        return web.json_response({"ok": True})
    except Exception as e:
        return web.json_response({"ok": False, "error": str(e)}, status=500)


def _empty_image_tensor():
    import torch
    return torch.zeros((1, 64, 64, 3), dtype=torch.float32)


def _video_poster(path, timeout=20):
    """Extract the first frame of a generated video as an IMAGE tensor."""
    import numpy as np
    from PIL import Image, ImageOps
    ff = _ff()
    if not ff:
        return None
    tmp = os.path.join(folder_paths.get_temp_directory(), f"h3one_poster_{uuid.uuid4().hex[:10]}.png")
    try:
        subprocess.run(
            [ff, "-y", "-ss", "0.1", "-i", path, "-frames:v", "1", "-q:v", "3", tmp],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=timeout, check=False,
        )
        if not os.path.isfile(tmp):
            return None
        img = Image.open(tmp)
        img = ImageOps.exif_transpose(img).convert("RGB")
        arr = np.array(img).astype(np.float32) / 255.0
        import torch
        return torch.from_numpy(arr)[None,]
    except Exception:
        return None
    finally:
        try:
            os.remove(tmp)
        except Exception:
            pass


class H3OneNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {},
            "optional": {"prompt": ("STRING", {"forceInput": True})},
            "hidden": {"unique_id": "UNIQUE_ID"},
        }

    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = ("poster", "video")
    FUNCTION = "noop"
    CATEGORY = "One Node"
    OUTPUT_NODE = True

    def noop(self, unique_id=None, **kwargs):
        info = _last_output_by_node.get(str(unique_id)) or {}
        filename = info.get("filename", "")
        subfolder = info.get("subfolder", "")
        poster = None
        rel = ""
        if filename:
            rel = f"{subfolder}/{filename}" if subfolder else filename
            try:
                path = _safe_join(_get_output_dir(), subfolder, filename)
                if os.path.isfile(path):
                    poster = _video_poster(path)
            except Exception:
                pass
        return {"result": (poster if poster is not None else _empty_image_tensor(), rel)}

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        return float("nan")


class H3CacheBust:
    """Internal cache-invalidation node (inserted by the JS between the CLIP
    loader and the H3 conditioning node).

    Why it exists: ComfyUI's execution cache fingerprints each node from its
    input values AND the fingerprints of the nodes wired into it. V3 autogrow
    inputs (ref_images / ref_audios / ...) arrive as dicts of links - and the
    cache does not traverse links nested inside dicts. A changed reference
    image/audio therefore left the cache signature unchanged and every
    downstream node (conditioning -> sampler -> save) was served stale output.

    This node sits upstream of the conditioning node and returns a digest of
    every input that must invalidate generation: the prompt, all media file
    names, plus the on-disk content of those files (so replacing a file under
    the same name also invalidates)."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "clip": ("CLIP",),
                "fingerprint": ("STRING", {"multiline": True, "default": ""}),
            }
        }

    RETURN_TYPES = ("CLIP",)
    RETURN_NAMES = ("clip",)
    FUNCTION = "passthrough"
    CATEGORY = "One Node"

    def passthrough(self, clip, fingerprint=""):
        return (clip,)

    @classmethod
    def IS_CHANGED(cls, fingerprint, **kwargs):
        h = hashlib.sha256()
        h.update((fingerprint or "").encode("utf-8", "replace"))
        try:
            data = json.loads(fingerprint or "{}") or {}
        except Exception:
            data = {}
        for entry in data.get("files", []) or []:
            name = ""
            if isinstance(entry, dict):
                name = entry.get("name") or ""
            elif isinstance(entry, (list, tuple)) and len(entry) > 1:
                name = entry[1] or ""
            if not name:
                continue
            try:
                path = folder_paths.get_annotated_filepath(str(name))
            except Exception:
                continue
            if not path or not os.path.isfile(path):
                continue
            try:
                with open(path, "rb") as f:
                    while True:
                        chunk = f.read(1 << 20)
                        if not chunk:
                            break
                        h.update(chunk)
            except Exception:
                pass
        return h.digest().hex()


class H3IdentityAnchor:
    """Pins a reference image as a stock first/last keyframe anchor on the H3
    conditioning, so the shot starts (or ends) exactly on that image. Uses only
    core ComfyUI keyframe support - no third-party layout patches required."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "conditioning": ("CONDITIONING",),
                "vae": ("VAE",),
                "latent": ("LATENT",),
                "frame_count": ("INT", {"default": 124, "min": 5, "max": 3600, "step": 1}),
                "width": ("INT", {"default": 1344, "min": 32, "max": 16384, "step": 32}),
                "height": ("INT", {"default": 768, "min": 32, "max": 16384, "step": 32}),
                "anchor": (["first", "last"], {"default": "first"}),
            },
            "optional": {
                "image": ("IMAGE",),
            },
        }

    RETURN_TYPES = ("CONDITIONING",)
    RETURN_NAMES = ("conditioning",)
    FUNCTION = "apply"
    CATEGORY = "One Node"

    def apply(self, conditioning, vae, latent, frame_count=124, width=1344, height=768, anchor="first", image=None):
        if image is None:
            return (conditioning,)
        import comfy.utils as _cu
        # Mirror core MiniMaxH3ImageToVideo's first-frame path exactly: stretch
        # the image to the target canvas, then VAE-encode (BHWC is handled by
        # the comfy VAE wrapper). The keyframe latent MUST have the canvas's
        # latent row count or the packed layout's fixed-row bookkeeping breaks.
        img = image[:1]
        img = img[..., :3].movedim(-1, 1)
        img = _cu.common_upscale(img, int(width), int(height), "lanczos", "disabled")
        img = img.movedim(1, -1)
        z = vae.encode(img)
        idx = 0 if anchor == "first" else max(0, int(frame_count) - 1)
        kf = {"resolved_frame_index": idx, "latent": z}
        cond = node_helpers.conditioning_set_values(conditioning, {
            "minimax_keyframes": [kf],
            "minimax_frame_count": int(frame_count),
        })
        return (cond,)


class H3AudioTrim:
    """Trims an AUDIO input to a target duration (clamped to the 15s H3 ref
    spec). MiniMax H3 reference audio clips are specified as 2-15 seconds, and
    an audio ref longer than the target video is out-of-distribution for the
    packed layout - this node keeps ref audio within spec."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "audio": ("AUDIO",),
                "trim_seconds": ("FLOAT", {"default": 5.0, "min": 0.5, "max": 15.0, "step": 0.1}),
            }
        }

    RETURN_TYPES = ("AUDIO",)
    RETURN_NAMES = ("audio",)
    FUNCTION = "apply"
    CATEGORY = "One Node"

    def apply(self, audio, trim_seconds=5.0):
        if not isinstance(audio, dict) or "waveform" not in audio:
            return (audio,)
        try:
            secs = min(15.0, max(0.5, float(trim_seconds)))
        except Exception:
            secs = 15.0
        sr = int(audio.get("sample_rate", 32000) or 32000)
        n = int(secs * sr)
        waveform = audio["waveform"]
        if waveform.ndim >= 2 and waveform.shape[-1] > n:
            out = dict(audio)
            out["waveform"] = waveform[..., :n]
            return (out,)
        return (audio,)


class H3AudioSlice:
    """Slice an AUDIO input to [start_seconds, start_seconds + duration_seconds).

    Used by Chain Audio Lock: each clip is driven by its own segment of the
    source track (15s units), instead of every clip reusing the start of the
    track. Offsets are computed by the JS so the concatenated timeline stays
    continuous even after Motion Context trims each clip's pinned head.
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "audio": ("AUDIO",),
                "start_seconds": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 86400.0, "step": 0.01}),
                "duration_seconds": ("FLOAT", {"default": 15.0, "min": 0.1, "max": 3600.0, "step": 0.01}),
            }
        }

    RETURN_TYPES = ("AUDIO",)
    RETURN_NAMES = ("audio",)
    FUNCTION = "slice"
    CATEGORY = "One Node"

    def slice(self, audio, start_seconds=0.0, duration_seconds=15.0):
        if not isinstance(audio, dict) or "waveform" not in audio:
            return (audio,)
        try:
            start = max(0, int(round(float(start_seconds) * 32000)))
            dur = max(0, int(round(float(duration_seconds) * 32000)))
        except Exception:
            start, dur = 0, 0
        sr = int(audio.get("sample_rate", 32000) or 32000)
        if sr != 32000:
            start = int(start * sr / 32000.0)
            dur = int(dur * sr / 32000.0)
        waveform = audio["waveform"]
        total = int(waveform.shape[-1]) if waveform.ndim >= 2 else 0
        end = min(total, start + dur)
        if total <= start or end <= start:
            import torch
            shape = list(waveform.shape)
            if shape:
                n = max(1, min(int(dur), total if total > 0 else 1))
                shape[-1] = n
                out = dict(audio)
                out["waveform"] = torch.zeros(tuple(shape), dtype=waveform.dtype, device=waveform.device)
                return (out,)
            return (audio,)
        out = dict(audio)
        out["waveform"] = waveform[..., start:end]
        return (out,)


class H3OneSigmaRefiner:
    """Low-sigma detail refiner for MiniMax H3 (internal).

    Re-implemented from yichengup/ComfyUI-YCNodes-MiniMax-H3's H3SigmaRefiner
    (no third-party dependencies): the scheduler's noise schedule keeps its
    high-sigma head untouched, while the low-sigma tail is resampled into a
    longer, denser, smoother curve so the model spends extra iterations on
    fine detail. This removes pixel grain / flicker on fast-moving edges
    without re-encoding anything upstream.

    Graph wiring (done by the frontend):
        BasicScheduler -> (sigmas) -> H3OneSigmaRefiner -> (sigmas) ->
        SamplerCustomAdvanced

    The UI exposes a single slider (extra_steps, 0 = node removed / passthrough);
    start_at_sigma / end_at_sigma / spacing keep the upstream defaults.
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "sigmas": ("SIGMAS",),
                "extra_steps": ("INT", {"default": 1, "min": 0, "max": 15, "step": 1}),
                "start_at_sigma": ("FLOAT", {"default": 0.7, "min": 0.0, "max": 20.0, "step": 0.01}),
                "end_at_sigma": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 5.0, "step": 0.01}),
                "spacing": (["cosine", "linear", "exponential"], {"default": "cosine"}),
            }
        }

    RETURN_TYPES = ("SIGMAS",)
    RETURN_NAMES = ("sigmas",)
    FUNCTION = "refine"
    CATEGORY = "One Node"

    def refine(self, sigmas, extra_steps, start_at_sigma, end_at_sigma, spacing):
        if extra_steps <= 0:
            return (sigmas,)

        # Work on a CPU copy; the schedule is tiny.
        sigmas_cpu = sigmas.detach().cpu()

        # First index where the schedule drops to (or below) the start threshold.
        idx = -1
        for i, s in enumerate(sigmas_cpu):
            if s <= start_at_sigma:
                idx = i
                break

        # Threshold never reached, or only the terminal 0.0 remains - nothing to refine.
        if idx == -1 or idx >= len(sigmas_cpu) - 1:
            return (sigmas,)

        unmodified_head = sigmas_cpu[:idx]
        A = sigmas_cpu[idx].item()
        B = max(end_at_sigma, sigmas_cpu[-1].item())

        original_tail_len = len(sigmas_cpu) - idx
        new_tail_len = original_tail_len + extra_steps

        t = torch.linspace(0.0, 1.0, steps=new_tail_len)
        if spacing == "cosine":
            factor = (1.0 - torch.cos(t * math.pi)) / 2.0
        elif spacing == "exponential":
            alpha = 3.0
            factor = (torch.exp(t * alpha) - 1.0) / (math.exp(alpha) - 1.0)
        else:  # linear
            factor = t

        new_tail = A + (B - A) * factor

        # Keep the schedule's absolute convergence point at 0.0 when present.
        if sigmas_cpu[-1].item() == 0.0 and B > 0.0:
            new_tail = torch.cat([new_tail, torch.tensor([0.0])])

        new_sigmas = torch.cat([unmodified_head, new_tail])
        return (new_sigmas.to(device=sigmas.device, dtype=sigmas.dtype),)


class H3NestedLatentUpscaler:
    """NestedTensor-aware wrapper around Comfyui_Minimax_h3_latent_Upscaler.

    MiniMax H3 sampler outputs a comfy.nested_tensor.NestedTensor containing the
    video latent (member 0) and the audio latent (member 1). The upstream 2D/3D
    nodes assume a plain torch.Tensor and call .clone(), which fails on the nested
    value. This wrapper unpacks the nested value, sends only the video tensor to
    the upstream node, then rebuilds the original NestedTensor with the untouched
    audio members.

    The optional `trigger` input is a STRING dependency used by the Chain
    deferred two-stage layout: the frontend wires it to the LAST clip's saved
    latent path, so the upscaler (and therefore the second pass downstream)
    only runs after every clip's first pass has finished. The value itself is
    ignored - it exists purely to carry the graph dependency.
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "latent": ("LATENT",),
                "model_name": ("STRING", {"default": "none"}),
                "variant": (["2D", "3D"], {"default": "2D"}),
                "scale": ("FLOAT", {"default": 2.0, "min": 1.0, "max": 4.0, "step": 0.1}),
                "device": (["cuda", "cpu"], {"default": "cuda"}),
                "precision": (["fp32", "fp16", "bf16"], {"default": "fp32"}),
            },
            "optional": {
                "trigger": ("STRING", {"default": ""}),
            },
        }

    RETURN_TYPES = ("LATENT",)
    RETURN_NAMES = ("latent",)
    FUNCTION = "run"
    CATEGORY = "One Node"

    def run(self, latent, model_name="none", variant="2D", scale=2.0, device="cuda", precision="fp32", trigger=""):
        if not isinstance(latent, dict) or "samples" not in latent:
            return (latent,)
        if not model_name or model_name == "none" or str(model_name).startswith("("):
            raise ValueError("请选择 latent upscaler 模型")

        import torch
        samples = latent["samples"]
        nested = False
        members = None
        nested = bool(getattr(samples, "is_nested", False)) or type(samples).__name__ == "NestedTensor"
        if nested:
            members = list(samples.unbind())
            if not members or not isinstance(members[0], torch.Tensor):
                raise ValueError("NestedTensor 没有可用的视频 latent")

        video = members[0] if nested else samples
        suffix = "3d" if str(variant).lower().startswith("3") else "2d"
        module_name = (
            "Comfyui_Minimax_h3_latent_Upscaler.nodes."
            "minimax_h3_latent_upscaler_" + suffix
        )
        try:
            import importlib
            mod = importlib.import_module(module_name)
        except Exception as e:
            raise RuntimeError(
                "无法导入 Comfyui_Minimax_h3_latent_Upscaler，请确认该扩展已安装: " + module_name
            ) from e

        node_cls = getattr(
            mod,
            "MinimaxH3LatentUpscalerNode" + ("3D" if suffix == "3d" else "2D"),
        )
        up_result = node_cls().run(
            {"samples": video},
            model_name,
            scale,
            device,
            precision,
        )
        up_samples = up_result[0]["samples"] if isinstance(up_result, tuple) else up_result

        out = dict(latent)
        if nested:
            out["samples"] = type(samples)([up_samples, *members[1:]])
        else:
            out["samples"] = up_samples
        return (out,)


NODE_CLASS_MAPPINGS = {
    "H3OneNode": H3OneNode,
    "H3CacheBust": H3CacheBust,
    "H3IdentityAnchor": H3IdentityAnchor,
    "H3AudioTrim": H3AudioTrim,
    "H3AudioSlice": H3AudioSlice,
    "H3OneSigmaRefiner": H3OneSigmaRefiner,
    "H3NestedLatentUpscaler": H3NestedLatentUpscaler,
}
NODE_DISPLAY_NAME_MAPPINGS = {
    "H3OneNode": "ALL in ONE MiniMaxH3",
    "H3CacheBust": "H3 Cache Fingerprint (internal)",
    "H3IdentityAnchor": "H3 Identity Anchor (internal)",
    "H3AudioTrim": "H3 Audio Trim (internal)",
    "H3AudioSlice": "H3 Audio Slice (internal)",
    "H3OneSigmaRefiner": "H3 Sigma Refiner (internal)",
    "H3NestedLatentUpscaler": "H3 Nested Latent Upscaler (internal)",
}
