#!/usr/bin/env python3
"""
Packages the AI Study project source code into a clean ZIP archive for direct download.
Excludes node_modules, .git, binaries, and temporary caches.
"""

import os
import sys
import zipfile
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DOWNLOADS = ROOT_DIR / "public" / "downloads"
DIST_DOWNLOADS = ROOT_DIR / "dist" / "downloads"
ZIP_NAME = "study-buddy-ai-source.zip"

EXCLUDE_DIRS = {
    "node_modules",
    ".git",
    "dist-electron",
    ".capacitor",
    ".tools",
    "__pycache__",
    ".cache",
    ".npm",
    ".bun",
}

EXCLUDE_EXTENSIONS = {
    ".log",
    ".tmp",
}

def create_source_zip() -> Path:
    PUBLIC_DOWNLOADS.mkdir(parents=True, exist_ok=True)
    DIST_DOWNLOADS.mkdir(parents=True, exist_ok=True)

    target_zip = PUBLIC_DOWNLOADS / ZIP_NAME

    with zipfile.ZipFile(target_zip, "w", zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(ROOT_DIR):
            # Exclude specified directories
            dirs[:] = [
                d for d in dirs
                if d not in EXCLUDE_DIRS and not d.startswith(".git")
            ]

            # Don't archive generated download archives inside public/downloads
            if "public/downloads" in root or "dist/downloads" in root:
                continue

            for file in files:
                if any(file.endswith(ext) for ext in EXCLUDE_EXTENSIONS) or file == ZIP_NAME:
                    continue
                full_path = Path(root) / file
                arcname = full_path.relative_to(ROOT_DIR)
                z.write(full_path, str(arcname))

    # Also copy to dist/downloads if dist exists
    if (ROOT_DIR / "dist").exists():
        import shutil
        shutil.copy2(target_zip, DIST_DOWNLOADS / ZIP_NAME)

    print(f"[OK] Source ZIP created at: {target_zip} ({target_zip.stat().st_size} bytes)")
    return target_zip

if __name__ == "__main__":
    create_source_zip()
