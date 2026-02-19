# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for Aegis Desktop App

Build commands:
    pyinstaller aegis.spec                    # Standard build
    pyinstaller --clean aegis.spec            # Clean build

Output:
    dist/Aegis.exe (Windows)
    dist/Aegis.app (macOS)
    dist/Aegis (Linux)
"""

import sys
from pathlib import Path

# Get the directory containing this spec file
spec_dir = Path(SPECPATH)

block_cipher = None

# Collect all Python files from aegis_app
a = Analysis(
    ['main.py'],
    pathex=[str(spec_dir)],
    binaries=[],
    datas=[
        # Include assets directory if it exists
        ('assets', 'assets'),
    ],
    hiddenimports=[
        'customtkinter',
        'PIL',
        'PIL._tkinter_finder',
        'requests',
        'keyring',
        'keyring.backends',
        'cryptography',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Exclude unnecessary modules to reduce size
        'matplotlib',
        'numpy',
        'pandas',
        'scipy',
        'tkinter.test',
        'unittest',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(
    a.pure,
    a.zipped_data,
    cipher=block_cipher,
)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='Aegis',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    # CRITICAL: --noconsole flag - no terminal window
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    # Icon (create icon.ico/icon.icns in assets/)
    icon='assets/icon.ico' if sys.platform == 'win32' else 'assets/icon.icns',
)

# macOS app bundle
if sys.platform == 'darwin':
    app = BUNDLE(
        exe,
        name='Aegis.app',
        icon='assets/icon.icns',
        bundle_identifier='uk.co.aegissolutions.aegis',
        info_plist={
            'CFBundleName': 'Aegis',
            'CFBundleDisplayName': 'Aegis',
            'CFBundleVersion': '1.0.0',
            'CFBundleShortVersionString': '1.0.0',
            'NSHighResolutionCapable': True,
            'LSMinimumSystemVersion': '10.15',
        },
    )
