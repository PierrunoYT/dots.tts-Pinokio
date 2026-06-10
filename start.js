module.exports = {
  daemon: true,
  run: [
    {
      method: "local.set",
      params: {
        port: "{{port}}"
      }
    },
    {
      method: "shell.run",
      params: {
        venv: "env",
        env: {
          PYTHONUTF8: 1,
          // PyTorch 2.8 bug on Windows: StaticCudaLauncher parses the CUDA stream
          // as a 32-bit C long and crashes with "OverflowError: Python int too large
          // to convert to C long" (pytorch/pytorch#162430). Fall back to triton's
          // own launcher instead. Harmless on other platforms.
          TORCHINDUCTOR_USE_STATIC_CUDA_LAUNCHER: 0
        },
        path: "app",
        message: [
          "python apps/gradio/app.py --model-name-or-path rednote-hilab/dots.tts-base --host 127.0.0.1 --port {{local.port}}{{platform === 'win32' ? '' : ' --optimize'}}",
        ],
        on: [{
          event: "/(http:\\/\\/[0-9.:]+)/",
          done: true
        }]
      }
    },
    {
      method: "local.set",
      params: {
        url: "{{input.event[1]}}"
      }
    }
  ]
}
