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

### Windows notes

- `pynini` (a dependency of `WeTextProcessing`, used for text normalization) has no official Windows wheels, so the installer uses a prebuilt community wheel from [billwuhao/pynini-windows-wheels](https://github.com/billwuhao/pynini-windows-wheels) and installs `WeTextProcessing` without dependencies.
- `--optimize` (torch.compile acceleration) is disabled on Windows; generation works the same, just without the compiled steady-state speedup.

Use **Update** to pull the latest upstream code. Use **Reset** to remove the cloned `app` folder and reinstall from scratch.

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

runtime = DotsTtsRuntime.from_pretrained(
    "rednote-hilab/dots.tts-base",
    precision="bfloat16",
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

### JavaScript

```javascript
import { Client } from "@gradio/client";

const client = await Client.connect("BASE_URL");
const result = await client.predict("/run_synthesis", {
  text: "Hello, this is a quick speech synthesis test.",
  synthesis_mode: "tts",
  prompt_audio_path: "/path/to/reference.wav",
  prompt_text: "The exact transcript of the reference audio.",
  ode_method: "euler",
  num_steps: 10,
  guidance_scale: 1.2,
  speaker_scale: 1.5,
  normalize_text: false,
  seed: 42,
});
console.log(result.data);
```

### Python

```python
from gradio_client import Client

client = Client("BASE_URL")
result = client.predict(
    text="Hello, this is a quick speech synthesis test.",
    synthesis_mode="tts",
    prompt_audio_path="/path/to/reference.wav",
    prompt_text="The exact transcript of the reference audio.",
    ode_method="euler",
    num_steps=10,
    guidance_scale=1.2,
    speaker_scale=1.5,
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

Then POST to the synthesis endpoint (exact path from the schema above):

```bash
curl -X POST "BASE_URL/gradio_api/call/run_synthesis" \
  -H "Content-Type: application/json" \
  -d '{"data":["Hello world","tts",{"path":"/path/to/reference.wav"},"transcript","euler",10,1.2,1.5,false,42]}'
```

## Recommended settings

| Setting | Value | Notes |
|---------|-------|-------|
| Num steps | 10–32 | Higher = better quality, slower |
| Guidance scale | 1.2 | Standard CFG; raise modestly for stronger adherence |
| Precision | bfloat16 | Default at startup |

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
