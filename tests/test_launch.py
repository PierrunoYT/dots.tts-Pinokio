import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

import launch
from launch import runtime_args


class RuntimeArgsTests(unittest.TestCase):
    def test_main_forwards_options_to_the_upstream_entrypoint(self):
        torch = SimpleNamespace(cuda=SimpleNamespace(is_available=lambda: False))
        with patch.dict("sys.modules", {"torch": torch}), \
                patch.object(launch.sys, "argv", ["launch.py", "--port", "54321"]), \
                patch.object(launch.runpy, "run_path") as run:
            launch.main()
            app = str(launch.Path(launch.__file__).resolve().parent / "app" / "apps" / "gradio" / "app.py")
            run.assert_called_once_with(app, run_name="__main__")
            self.assertEqual(launch.sys.argv, [app, "--precision", "float32", "--port", "54321"])

    def test_cpu_does_not_probe_bf16_or_enable_compilation(self):
        for platform in ("win32", "linux", "darwin"):
            cuda = SimpleNamespace(
                is_available=Mock(return_value=False),
                is_bf16_supported=Mock(side_effect=AssertionError("No GPU")),
            )
            self.assertEqual(
                runtime_args(SimpleNamespace(cuda=cuda), platform),
                ["--precision", "float32"],
            )

    def test_gpu_defaults_follow_precision_support_and_platform(self):
        for platform in ("win32", "linux"):
            for bf16 in (True, False):
                with self.subTest(platform=platform, bf16=bf16):
                    torch = SimpleNamespace(cuda=SimpleNamespace(
                        is_available=lambda: True,
                        is_bf16_supported=Mock(return_value=bf16),
                    ))
                    args = runtime_args(torch, platform)
                    torch.cuda.is_bf16_supported.assert_called_once_with(including_emulation=False)
                    self.assertEqual(args[1], "bfloat16" if bf16 else "float32")
                    self.assertEqual("--optimize" in args, bf16 and platform != "win32")


if __name__ == "__main__":
    unittest.main()
