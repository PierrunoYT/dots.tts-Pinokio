# dots.tts-base (Pinokio)

One-click Pinokio launcher for [dots.tts-base](https://huggingface.co/rednote-hilab/dots.tts-base) — a 2B-parameter fully continuous, end-to-end autoregressive text-to-speech system with zero-shot voice cloning.

## What it does

This launcher installs [rednote-hilab/dots.tts](https://github.com/rednote-hilab/dots.tts), downloads the **dots.tts-base** checkpoint from Hugging Face on first run, and starts the official Gradio playground.

- **Semantic encoder + LLM + AR flow-matching head** over a 48 kHz AudioVAE
- **Zero-shot voice cloning** from reference audio + transcript
- **Recommended sampling**: 10–32 steps, guidance scale ~1.2

## How to use

1. Open this folder in Pinokio.
2. Click **Install** (clones the repo, creates a Python venv, installs PyTorch and dependencies).
3. Click **Start** (loads the model, runs warmup, opens the Gradio UI).
4. In the web UI:
   - Upload **Prompt Audio** and enter its **Prompt Text** (transcript).
   - Enter the text to synthesize.
   - Click **Generate**.

First launch downloads model weights and runs a synthesis warmup — expect several minutes before the UI is ready.

The launcher checks the installed PyTorch runtime before loading the model. It uses bfloat16 on compatible CUDA/ROCm devices and float32 on CPU or GPUs without bfloat16 support. Compilation is enabled only on compatible GPUs outside Windows. CPU inference (including the upstream runtime's current Mac path) can be slow and needs more memory.

The pinned packages target Windows x64, Linux with a compatible PyTorch wheel, and Apple Silicon Macs. Intel Macs and native Windows ARM64 environments are not supported by this dependency setup. The NVIDIA CUDA 12.8 wheels require compute capability 7.0 or newer; GTX 10-series cards need a different PyTorch build and are not supported by this installer.

### Windows notes

- `pynini` (a dependency of `WeTextProcessing`, used for text normalization) has no official Windows wheels, so the installer uses a prebuilt community wheel from [billwuhao/pynini-windows-wheels](https://github.com/billwuhao/pynini-windows-wheels) and installs `WeTextProcessing` without dependencies.
- The Windows wheel requires x64 Python 3.10; the installer creates that Python environment. Existing environments created with another Python version need a Reset and fresh Install.
- On NVIDIA GPUs, the installer adds [triton-windows](https://github.com/triton-lang/triton-windows) (Triton 3.4 for PyTorch 2.8) for torch.compile support.
- `--optimize` (torch.compile acceleration) is disabled on Windows by default: with the pinned torch 2.8, Dynamo crashes while tracing einops during the optimize warmup (`set.symmetric_difference` unsupported), which kills the server at startup.
- The launcher starts the app with `TORCHINDUCTOR_USE_STATIC_CUDA_LAUNCHER=0` to work around a PyTorch 2.8 Windows bug ([pytorch#162430](https://github.com/pytorch/pytorch/issues/162430)) where the static CUDA launcher crashes with `OverflowError: Python int too large to convert to C long` during torch.compile warmup.

Use **Update** to pull the launcher and upstream code and rerun the complete dependency installation. Updates use fast-forward pulls and stop if local Git history has diverged.

Use **Install** again to repair an interrupted installation without recloning. Start appears only after installation finishes successfully. Existing installations from older launcher versions need to run Install once to create the completion marker.

**Reset** deletes the entire cloned `app` folder, including its environment and any generated audio or custom files inside it. Back up files you want to keep, then click **Install** after Reset to reinstall.

## CLI (inside Pinokio terminal)

After install, from the `app` folder with the `env` venv active:

```bash
dots.tts \
  --model-name-or-path rednote-hilab/dots.tts-base \
  --text "Hello, this is a zero-shot voice cloning demonstration." \
  --prompt-audio /path/to/reference.wav \
  --prompt-text "The exact transcript of the reference audio." \
  --output clone.wav
```

## Python API

```python
from dots_tts.runtime import DotsTtsRuntime
import soundfile as sf
import torch

runtime = DotsTtsRuntime.from_pretrained(
    "rednote-hilab/dots.tts-base",
    precision=("bfloat16" if torch.cuda.is_available()
               and torch.cuda.is_bf16_supported(including_emulation=False) else "float32"),
)

result = runtime.generate(
    text="Hello, this is a quick speech synthesis test.",
    prompt_audio_path="/path/to/reference.wav",
    prompt_text="The exact transcript of the reference audio.",
    num_steps=10,
    guidance_scale=1.2,
)

sf.write("output.wav", result["audio"].float().cpu().squeeze().numpy(), result["sample_rate"])
```

## Programmatic API (Gradio)

When the app is running, Pinokio exposes a local URL (shown as **Open Web UI**). Replace `BASE_URL` with that address.

These examples target the default UI of the current [upstream Gradio app](https://github.com/rednote-hilab/dots.tts/blob/main/apps/gradio/app.py). Debug mode exposes additional parameters; use `view_api()` or the UI's **Use via API** page to inspect your installed version. Client examples upload local audio using Gradio's file helpers rather than passing a client-side path to the server.

### JavaScript

```javascript
import { Client, handle_file } from "@gradio/client";
import { readFile } from "node:fs/promises";

const client = await Client.connect("BASE_URL");
const audio = new Blob([await readFile("/path/to/reference.wav")], { type: "audio/wav" });
const result = await client.predict("/run_synthesis", {
  text: "Hello, this is a quick speech synthesis test.",
  prompt_audio_path: handle_file(audio),
  prompt_text: "The exact transcript of the reference audio.",
  num_steps: 10,
  guidance_scale: 1.2,
  normalize_text: false,
  seed: 42,
});
console.log(result.data);
```

### Python

```python
from gradio_client import Client, handle_file

client = Client("BASE_URL")
result = client.predict(
    text="Hello, this is a quick speech synthesis test.",
    prompt_audio_path=handle_file("/path/to/reference.wav"),
    prompt_text="The exact transcript of the reference audio.",
    num_steps=10,
    guidance_scale=1.2,
    normalize_text=False,
    seed=42,
    api_name="/run_synthesis",
)
print(result)
```

### curl

Discover the Gradio API schema:

```bash
curl -s BASE_URL/gradio_api/info
```

First upload the reference audio (these multiline commands use Bash syntax):

```bash
curl -f -X POST "BASE_URL/gradio_api/upload" \
  -F "files=@/path/to/reference.wav"
```

Copy the returned server-side path into `UPLOADED_PATH` below, preserving JSON escaping, then submit the request. The default UI exposes seven inputs; debug-only state parameters are omitted:

```bash
curl -X POST "BASE_URL/gradio_api/call/run_synthesis" \
  -H "Content-Type: application/json" \
  -d '{"data":["Hello world",{"path":"UPLOADED_PATH","meta":{"_type":"gradio.FileData"}},"transcript",10,1.2,false,42]}'
```

The response contains an `event_id`, not the generated audio. Replace `EVENT_ID` with that value to wait for the result:

```bash
curl -N "BASE_URL/gradio_api/call/run_synthesis/EVENT_ID"
```

The completion event contains the generated audio's file information, including its download URL.

## Recommended settings

| Setting | Value | Notes |
|---------|-------|-------|
| Num steps | 10–32 | Higher = better quality, slower |
| Guidance scale | 1.2 | Standard CFG; raise modestly for stronger adherence |
| Precision | Automatic | bfloat16 on compatible GPUs; float32 otherwise |

## Development checks

Run the launcher regression checks without downloading model weights:

```bash
node --test tests/launcher.test.js
python -m unittest discover -s tests -p "test_*.py"
```

## License

Apache-2.0 — see [dots.tts](https://github.com/rednote-hilab/dots.tts).

## Citation

```bibtex
@article{dotstts2026,
  title   = {dots.tts Technical Report},
  author  = {dots.tts Team},
  journal = {arXiv preprint},
  year    = {2026},
}
```
