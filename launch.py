"""Choose runtime-safe defaults before starting the upstream Gradio app."""

import runpy
import sys
from pathlib import Path


def runtime_args(torch, platform):
    # ROCm also exposes its device through torch.cuda. The upstream runtime
    # currently uses CPU on Macs, even when MPS is available.
    accelerated = torch.cuda.is_available()
    bf16 = accelerated and torch.cuda.is_bf16_supported(including_emulation=False)
    args = ["--precision", "bfloat16" if bf16 else "float32"]
    if bf16 and platform != "win32":
        args.append("--optimize")
    return args


def main():
    import torch

    app = Path(__file__).resolve().parent / "app" / "apps" / "gradio" / "app.py"
    # User-supplied options follow the defaults so argparse can override them.
    sys.argv = [str(app), *runtime_args(torch, sys.platform), *sys.argv[1:]]
    runpy.run_path(str(app), run_name="__main__")


if __name__ == "__main__":
    main()
