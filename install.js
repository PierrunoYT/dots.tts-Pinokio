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
    // The wheel is built for cp310, so venv_python pins the venv to Python 3.10 -
    // set on every Windows step below since it's only honored at venv-creation time
    // but harmless to repeat, so the pin doesn't depend on step ordering.
    {
      when: "{{platform === 'win32'}}",
      method: "shell.run",
      params: {
        venv: "env",
        venv_python: "3.10",
        path: "app",
        message: [
          "uv pip install https://github.com/billwuhao/pynini-windows-wheels/releases/download/v2.1.6.post1/pynini-2.1.6.post1-cp310-cp310-win_amd64.whl",
          "uv pip install WeTextProcessing --no-deps",
          "uv pip install importlib_resources",
        ]
      }
    },
    // Windows: install dots.tts without deps (its WeTextProcessing dependency would
    // try to rebuild pynini from source and fail), then the remaining deps explicitly
    // from requirements-windows.txt (kept in sync with upstream's pyproject.toml).
    {
      when: "{{platform === 'win32'}}",
      method: "shell.run",
      params: {
        venv: "env",
        venv_python: "3.10",
        path: "app",
        message: [
          "uv pip install -e . --no-deps -c constraints/recommended.txt",
          "uv pip install -r ../requirements-windows.txt -c constraints/recommended.txt",
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
          triton: true
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
