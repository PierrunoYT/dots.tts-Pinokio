module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: [
          "git clone https://github.com/rednote-hilab/dots.tts app",
        ]
      }
    },
    // Windows: pynini (required by WeTextProcessing) has no Windows wheels on PyPI,
    // so install a prebuilt community wheel first, then WeTextProcessing without deps.
    {
      when: "{{platform === 'win32'}}",
      method: "shell.run",
      params: {
        venv: "env",
        path: "app",
        message: [
          "uv pip install https://github.com/billwuhao/pynini-windows-wheels/releases/download/v2.1.6.post1/pynini-2.1.6.post1-cp310-cp310-win_amd64.whl",
          "uv pip install WeTextProcessing --no-deps",
          "uv pip install importlib_resources",
        ]
      }
    },
    // Windows: install dots.tts without deps (its WeTextProcessing dependency would
    // try to rebuild pynini from source and fail), then the remaining deps explicitly.
    {
      when: "{{platform === 'win32'}}",
      method: "shell.run",
      params: {
        venv: "env",
        path: "app",
        message: [
          "uv pip install -e . --no-deps -c constraints/recommended.txt",
          "uv pip install \"transformers>=4.57.0\" huggingface-hub loguru \"langcodes[data]\" gradio einops \"librosa>=0.11.0\" \"soundfile>=0.13.1\" \"numpy>=2.2.6\" \"pydantic>=2.12.5,<3\" \"PyYAML>=6.0.3\" \"safetensors>=0.8.0rc0\" torchdiffeq tqdm lingua-language-detector -c constraints/recommended.txt",
        ]
      }
    },
    {
      when: "{{platform !== 'win32'}}",
      method: "shell.run",
      params: {
        venv: "env",
        path: "app",
        message: [
          "uv pip install -e . -c constraints/recommended.txt",
        ]
      }
    },
    {
      method: "script.start",
      params: {
        uri: "torch.js",
        params: {
          venv: "env",
          path: "app",
        }
      }
    },
    {
      method: "fs.link",
      params: {
        venv: "app/env"
      }
    },
  ]
}
