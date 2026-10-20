"""Direct test bootstrap for SybilShield.

The Windows permission workaround matters because the GenVM direct runner
caches extracted runners and removes temporary files between tests. On Windows
read only handles make os.unlink and os.remove fail, so we clear the write
protection before delegating to the original implementation.
"""

import os
import stat
import sys

if sys.platform == "win32":  # pragma: no cover - platform specific guard
    _original_unlink = os.unlink

    def _force_unlink(path, *args, **kwargs):
        try:
            os.chmod(path, stat.S_IWRITE | stat.S_IREAD)
        except OSError:
            pass
        return _original_unlink(path, *args, **kwargs)

    os.unlink = _force_unlink
    os.remove = _force_unlink
