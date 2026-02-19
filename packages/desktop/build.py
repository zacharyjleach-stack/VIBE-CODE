#!/usr/bin/env python3
"""
Build script for Aegis Desktop App

Usage:
    python build.py          # Build for current platform
    python build.py --clean  # Clean build
"""

import argparse
import subprocess
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Build Aegis Desktop App")
    parser.add_argument("--clean", action="store_true", help="Clean build")
    args = parser.parse_args()

    # Ensure we're in the correct directory
    script_dir = Path(__file__).parent
    spec_file = script_dir / "aegis.spec"

    if not spec_file.exists():
        print("Error: aegis.spec not found")
        sys.exit(1)

    # Build command
    cmd = ["pyinstaller"]

    if args.clean:
        cmd.append("--clean")

    cmd.append(str(spec_file))

    print(f"Running: {' '.join(cmd)}")
    print("-" * 50)

    result = subprocess.run(cmd, cwd=script_dir)

    if result.returncode == 0:
        print("-" * 50)
        print("Build successful!")
        print(f"Output: {script_dir / 'dist'}")
    else:
        print("Build failed!")
        sys.exit(result.returncode)


if __name__ == "__main__":
    main()
