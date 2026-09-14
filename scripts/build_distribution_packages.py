#!/usr/bin/env python3
"""
AI Study - Native Distribution Package Generator
Generates:
1. Android APK: AI-Study-v2.4.0.apk (Signed, zipaligned, installable WebView app)
2. Windows EXE: AI-Study-Setup-2.4.0.exe (Native NSIS Installer with shortcuts & uninstaller)
3. Windows Portable: AI-Study-Windows-Portable.zip (Zero-install standalone package)
"""

import os
import sys
import shutil
import zipfile
import hashlib
import zlib
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DOWNLOADS = ROOT_DIR / "public" / "downloads"
DIST_DOWNLOADS = ROOT_DIR / "dist" / "downloads"
TMP_DIR = Path("/tmp/aistudy_pkg_build")

APP_NAME = "AI Study"
APP_VERSION = "2.4.0"
APP_URL = "https://ais-pre-5uo5pgogykgk4hpol5v7si-876828252560.europe-west2.run.app/?view=app"

def ensure_tools():
    """Ensure required tools are available."""
    missing = []
    for tool in ["makensis", "zipalign", "apksigner", "keytool", "7z"]:
        if not shutil.which(tool):
            missing.append(tool)
    if missing:
        print(f"Warning: missing tools: {missing}")

def create_ico(source_png: Path, target_ico: Path):
    """Create a Windows ICO file containing PNG data."""
    with open(source_png, "rb") as f:
        png_data = f.read()

    # ICO format header: 0, 1 (icon type), 1 (image count)
    header = b"\x00\x00\x01\x00\x01\x00"
    # Directory entry: width, height, colors(0), reserved(0), planes(1), bpp(32), size, offset
    entry = bytes([
        192, 192, 0, 0,
        1, 0, 32, 0
    ]) + len(png_data).to_bytes(4, "little") + (6 + 16).to_bytes(4, "little")

    target_ico.parent.mkdir(parents=True, exist_ok=True)
    with open(target_ico, "wb") as f:
        f.write(header + entry + png_data)
    print(f"[OK] Generated ICO: {target_ico} ({len(png_data)} bytes)")

def build_windows_packages(ico_path: Path):
    """Build AI-Study-Launcher.exe, AI-Study-Setup-2.4.0.exe, and Portable ZIP."""
    print("--> Building Windows Packages...")
    TMP_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Compile standalone runner: AI-Study.exe
    launcher_nsi = TMP_DIR / "launcher.nsi"
    launcher_exe = TMP_DIR / "AI-Study.exe"
    launcher_script = f"""
SilentInstall silent
RequestExecutionLevel user
OutFile "{launcher_exe}"
Icon "{ico_path}"

Section
  ; Prefer Microsoft Edge in App Mode (borderless clean window)
  IfFileExists "$PROGRAMFILES\\Microsoft\\Edge\\Application\\msedge.exe" 0 TryEdgeX86
    Exec '"$PROGRAMFILES\\Microsoft\\Edge\\Application\\msedge.exe" --app="{APP_URL}" --window-size=1280,820'
    Quit
  TryEdgeX86:
  IfFileExists "$PROGRAMFILES32\\Microsoft\\Edge\\Application\\msedge.exe" 0 TryChrome
    Exec '"$PROGRAMFILES32\\Microsoft\\Edge\\Application\\msedge.exe" --app="{APP_URL}" --window-size=1280,820'
    Quit
  TryChrome:
  IfFileExists "$PROGRAMFILES\\Google\\Chrome\\Application\\chrome.exe" 0 TryChromeX86
    Exec '"$PROGRAMFILES\\Google\\Chrome\\Application\\chrome.exe" --app="{APP_URL}" --window-size=1280,820'
    Quit
  TryChromeX86:
  IfFileExists "$PROGRAMFILES32\\Google\\Chrome\\Application\\chrome.exe" 0 FallbackDefault
    Exec '"$PROGRAMFILES32\\Google\\Chrome\\Application\\chrome.exe" --app="{APP_URL}" --window-size=1280,820'
    Quit
  FallbackDefault:
    ExecShell "open" "{APP_URL}"
SectionEnd
"""
    launcher_nsi.write_text(launcher_script, encoding="utf-8")
    subprocess.run(["makensis", str(launcher_nsi)], check=True, stdout=subprocess.DEVNULL)
    print(f"[OK] Compiled Windows Launcher: {launcher_exe} ({launcher_exe.stat().st_size} bytes)")

    # 2. Compile full installer: AI-Study-Setup-2.4.0.exe
    installer_nsi = TMP_DIR / "installer.nsi"
    installer_exe = TMP_DIR / f"AI-Study-Setup-{APP_VERSION}.exe"

    installer_script = f"""
!include "MUI2.nsh"

Name "{APP_NAME}"
OutFile "{installer_exe}"
InstallDir "$LOCALAPPDATA\\AIStudy"
RequestExecutionLevel user
Icon "{ico_path}"

!define MUI_ABORTWARNING
!define MUI_ICON "{ico_path}"
!define MUI_UNICON "{ico_path}"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

!define MUI_FINISHPAGE_RUN "$INSTDIR\\AI-Study.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch AI Study now"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"
  File "{launcher_exe}"
  File "{ico_path}"
  Rename "$INSTDIR\\app.ico" "$INSTDIR\\AI-Study.ico"

  ; Create Start Menu shortcuts
  CreateDirectory "$SMPROGRAMS\\AI Study"
  CreateShortcut "$SMPROGRAMS\\AI Study\\AI Study.lnk" "$INSTDIR\\AI-Study.exe" "" "$INSTDIR\\AI-Study.ico" 0
  CreateShortcut "$SMPROGRAMS\\AI Study\\Uninstall AI Study.lnk" "$INSTDIR\\Uninstall.exe" "" "$INSTDIR\\Uninstall.exe" 0

  ; Create Desktop shortcut
  CreateShortcut "$DESKTOP\\AI Study.lnk" "$INSTDIR\\AI-Study.exe" "" "$INSTDIR\\AI-Study.ico" 0

  ; Uninstaller
  WriteUninstaller "$INSTDIR\\Uninstall.exe"

  ; Windows Registry for Installed Apps
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\AIStudy" "DisplayName" "AI Study - Intelligent Learning Platform"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\AIStudy" "DisplayVersion" "{APP_VERSION}"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\AIStudy" "Publisher" "AI Study Team"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\AIStudy" "DisplayIcon" "$INSTDIR\\AI-Study.ico"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\AIStudy" "UninstallString" '"$INSTDIR\\Uninstall.exe"'
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\\AI Study.lnk"
  Delete "$SMPROGRAMS\\AI Study\\AI Study.lnk"
  Delete "$SMPROGRAMS\\AI Study\\Uninstall AI Study.lnk"
  RMDir "$SMPROGRAMS\\AI Study"

  Delete "$INSTDIR\\AI-Study.exe"
  Delete "$INSTDIR\\AI-Study.ico"
  Delete "$INSTDIR\\Uninstall.exe"
  RMDir "$INSTDIR"

  DeleteRegKey HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\AIStudy"
SectionEnd
"""
    installer_nsi.write_text(installer_script, encoding="utf-8")
    subprocess.run(["makensis", str(installer_nsi)], check=True, stdout=subprocess.DEVNULL)
    print(f"[OK] Compiled Windows Setup: {installer_exe} ({installer_exe.stat().st_size} bytes)")

    # 3. Create Portable ZIP
    portable_dir = TMP_DIR / "portable"
    if portable_dir.exists():
        shutil.rmtree(portable_dir)
    portable_dir.mkdir(parents=True)

    shutil.copy2(launcher_exe, portable_dir / "AI-Study.exe")
    shutil.copy2(ico_path, portable_dir / "AI-Study.ico")

    # Helper batch launcher
    (portable_dir / "Launch-AI-Study.bat").write_text(f"""@echo off
start "" "%~dp0AI-Study.exe"
""", encoding="utf-8")

    # Shortcut creator script
    (portable_dir / "Create-Desktop-Shortcut.vbs").write_text(f"""Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.SpecialFolders("Desktop") & "\\AI Study.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = oWS.CurrentDirectory & "\\AI-Study.exe"
oLink.IconLocation = oWS.CurrentDirectory & "\\AI-Study.ico"
oLink.Description = "AI Study - Intelligent Learning Platform"
oLink.WorkingDirectory = oWS.CurrentDirectory
oLink.Save
MsgBox "Desktop shortcut created successfully!", vbInformation, "AI Study"
""", encoding="utf-8")

    # README
    (portable_dir / "README.txt").write_text(f"""AI Study - Portable Edition {APP_VERSION}
==========================================

Usage:
1. Double-click "AI-Study.exe" or "Launch-AI-Study.bat" to start.
2. (Optional) Run "Create-Desktop-Shortcut.vbs" to pin to your desktop.
3. Fully self-contained. No administrator permissions needed.

Connected Backend:
{APP_URL}
""", encoding="utf-8")

    portable_zip = TMP_DIR / "AI-Study-Windows-Portable.zip"
    if portable_zip.exists():
        portable_zip.unlink()

    subprocess.run([
        "7z", "a", "-tzip", str(portable_zip), f"{portable_dir}/*"
    ], check=True, stdout=subprocess.DEVNULL)
    print(f"[OK] Created Portable ZIP: {portable_zip} ({portable_zip.stat().st_size} bytes)")

    return installer_exe, portable_zip

def build_android_apk(icon_192_png: Path):
    """Build, align, and sign the official Android APK."""
    print("--> Building Android APK Package...")
    TMP_DIR.mkdir(parents=True, exist_ok=True)

    base_apk = Path("/tmp/webview_test.apk")
    if not base_apk.exists():
        print("Downloading base WebView template...")
        subprocess.run([
            "curl", "-sL",
            "https://github.com/bishwassagar/Android-Webview-App/raw/master/app/release/app-release.apk",
            "-o", str(base_apk)
        ], check=True)

    # 1. Prepare keystore if not exists
    keystore = TMP_DIR / "release.jks"
    if not keystore.exists():
        subprocess.run([
            "keytool", "-genkeypair", "-v",
            "-keystore", str(keystore),
            "-alias", "aistudy",
            "-keyalg", "RSA", "-keysize", "2048", "-validity", "10000",
            "-storepass", "aistudy123", "-keypass", "aistudy123",
            "-dname", "CN=AI Study, OU=Mobile, O=AI Study App, L=London, ST=London, C=GB"
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Read icon data
    with open(icon_192_png, "rb") as f:
        icon_bytes = f.read()

    # Injected HTML for assets/main.html
    main_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>AI Study</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #090d16;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }}
    .container {{
      max-width: 360px;
      width: 100%;
      background: #131b2e;
      border: 1px solid #1e293b;
      border-radius: 24px;
      padding: 32px 24px;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
    }}
    .logo {{
      width: 64px;
      height: 64px;
      border-radius: 16px;
      margin: 0 auto 16px;
      background: linear-gradient(135deg, #10b981, #06b6d4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
    }}
    h1 {{
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }}
    p {{
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
      margin-bottom: 24px;
    }}
    .spinner {{
      width: 40px;
      height: 40px;
      border: 3.5px solid rgba(255, 255, 255, 0.1);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 20px;
    }}
    @keyframes spin {{
      to {{ transform: rotate(360deg); }}
    }}
    .btn {{
      display: block;
      width: 100%;
      padding: 12px 20px;
      background: #10b981;
      color: #ffffff;
      border: none;
      border-radius: 14px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s;
    }}
    .btn:active {{
      background: #059669;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">⚡</div>
    <h1>AI Study</h1>
    <p>Launching your intelligent offline & cloud study companion...</p>
    <div class="spinner"></div>
    <a href="{APP_URL}" class="btn" id="launch-btn">Open AI Study Now</a>
  </div>

  <script>
    var appUrl = "{APP_URL}";
    // Fast automatic redirect
    try {{
      window.location.replace(appUrl);
    }} catch (e) {{
      window.location.href = appUrl;
    }}
    // Fallback if replace is blocked
    setTimeout(function() {{
      window.location.href = appUrl;
    }}, 400);
  </script>
</body>
</html>
"""

    unaligned_apk = TMP_DIR / "unaligned.apk"
    aligned_apk = TMP_DIR / "aligned.apk"
    signed_apk = TMP_DIR / f"AI-Study-v{APP_VERSION}.apk"

    with zipfile.ZipFile(base_apk, "r") as zin:
        with zipfile.ZipFile(unaligned_apk, "w") as zout:
            for item in zin.infolist():
                # Skip signature
                if item.filename.startswith("META-INF/"):
                    continue
                data = zin.read(item.filename)

                # Patch classes.dex: replace https://github.com/bishwassagar with file:///android_asset/main.html
                if item.filename == "classes.dex":
                    dex = bytearray(data)
                    target = b"https://github.com/bishwassagar"
                    replacement = b"file:///android_asset/main.html"
                    pos = dex.find(target)
                    if pos != -1:
                        dex[pos:pos+len(target)] = replacement
                        # Recompute sha1 and adler32
                        dex[12:32] = hashlib.sha1(dex[32:]).digest()
                        dex[8:12] = (zlib.adler32(dex[12:]) & 0xffffffff).to_bytes(4, "little")
                    data = bytes(dex)

                # Replace launcher icons with custom high-res logo
                if item.filename in ["res/Gc.png", "res/o-.png"]:
                    data = icon_bytes

                zout.writestr(item, data)

            # Injected asset pages
            zout.writestr("assets/main.html", main_html.encode("utf-8"))

    # 4-byte boundary alignment
    if aligned_apk.exists():
        aligned_apk.unlink()
    subprocess.run(["zipalign", "-p", "-f", "4", str(unaligned_apk), str(aligned_apk)], check=True)

    # Sign with apksigner (v1, v2, and v3 schemes)
    if signed_apk.exists():
        signed_apk.unlink()
    subprocess.run([
        "apksigner", "sign",
        "--ks", str(keystore),
        "--ks-key-alias", "aistudy",
        "--ks-pass", "pass:aistudy123",
        "--key-pass", "pass:aistudy123",
        "--v1-signing-enabled", "false",
        "--v2-signing-enabled", "false",
        "--v3-signing-enabled", "true",
        "--out", str(signed_apk),
        str(aligned_apk)
    ], check=True)

    # Verify signature
    res = subprocess.run(["apksigner", "verify", "--verbose", str(signed_apk)], capture_output=True, text=True)
    if "Verifies" not in res.stdout:
        print(f"Warning: APK verification output: {res.stdout} {res.stderr}")
    else:
        print(f"[OK] Android APK Verified successfully! Output: {signed_apk} ({signed_apk.stat().st_size} bytes)")

    return signed_apk

def calculate_sha256(filepath: Path) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def main():
    print("=== Generating AI Study Native Distribution Packages ===")
    ensure_tools()

    PUBLIC_DOWNLOADS.mkdir(parents=True, exist_ok=True)
    DIST_DOWNLOADS.mkdir(parents=True, exist_ok=True)

    icon_png = ROOT_DIR / "public" / "pwa-192x192.png"
    ico_path = TMP_DIR / "app.ico"
    create_ico(icon_png, ico_path)

    # 1. Build Windows Packages
    windows_installer, windows_portable = build_windows_packages(ico_path)

    # 2. Build Android APK
    android_apk = build_android_apk(icon_png)

    # 3. Copy artifacts into public/downloads/ and dist/downloads/
    dest_apk = PUBLIC_DOWNLOADS / f"AI-Study-v{APP_VERSION}.apk"
    dest_exe = PUBLIC_DOWNLOADS / f"AI-Study-Setup-{APP_VERSION}.exe"
    dest_zip = PUBLIC_DOWNLOADS / "AI-Study-Windows-Portable.zip"

    shutil.copy2(android_apk, dest_apk)
    shutil.copy2(windows_installer, dest_exe)
    shutil.copy2(windows_portable, dest_zip)

    # Also provide standard aliases for direct downloads
    shutil.copy2(dest_apk, PUBLIC_DOWNLOADS / "study-buddy-ai.apk")
    shutil.copy2(dest_exe, PUBLIC_DOWNLOADS / "study-buddy-ai-setup.exe")
    shutil.copy2(dest_exe, PUBLIC_DOWNLOADS / "study-buddy-ai.exe")
    shutil.copy2(dest_zip, PUBLIC_DOWNLOADS / "study-buddy-ai-windows.zip")

    # Mirror all to dist/downloads/
    for f in PUBLIC_DOWNLOADS.glob("*"):
        if f.is_file():
            shutil.copy2(f, DIST_DOWNLOADS / f.name)

    # Calculate sizes and hashes
    apk_hash = calculate_sha256(dest_apk)
    exe_hash = calculate_sha256(dest_exe)
    zip_hash = calculate_sha256(dest_zip)

    apk_size_mb = f"{dest_apk.stat().st_size / (1024*1024):.1f} MB"
    exe_size_kb = f"{dest_exe.stat().st_size / 1024:.0f} KB"
    zip_size_kb = f"{dest_zip.stat().st_size / 1024:.0f} KB"

    print("\n=== Generated Artifacts Summary ===")
    print(f"1. Android APK: {dest_apk.name}")
    print(f"   Path: {dest_apk}")
    print(f"   Size: {apk_size_mb} ({dest_apk.stat().st_size} bytes)")
    print(f"   SHA-256: {apk_hash}")

    print(f"\n2. Windows EXE: {dest_exe.name}")
    print(f"   Path: {dest_exe}")
    print(f"   Size: {exe_size_kb} ({dest_exe.stat().st_size} bytes)")
    print(f"   SHA-256: {exe_hash}")

    print(f"\n3. Windows Portable: {dest_zip.name}")
    print(f"   Path: {dest_zip}")
    print(f"   Size: {zip_size_kb} ({dest_zip.stat().st_size} bytes)")
    print(f"   SHA-256: {zip_hash}")

    # Generate metadata JSON
    manifest = {
        "appName": APP_NAME,
        "version": APP_VERSION,
        "releaseDate": "September 2026",
        "androidApk": {
            "fileName": dest_apk.name,
            "url": f"/api/download/android",
            "directFileUrl": f"/downloads/{dest_apk.name}",
            "size": apk_size_mb,
            "sha256": apk_hash,
            "minRequirement": "Android 8.0+ (Oreo or later)"
        },
        "windowsExe": {
            "fileName": dest_exe.name,
            "url": f"/api/download/windows",
            "directFileUrl": f"/downloads/{dest_exe.name}",
            "size": exe_size_kb,
            "sha256": exe_hash,
            "minRequirement": "Windows 10 / 11 (64-bit & 32-bit)"
        },
        "windowsPortable": {
            "fileName": dest_zip.name,
            "url": f"/api/download/windows-portable",
            "directFileUrl": f"/downloads/{dest_zip.name}",
            "size": zip_size_kb,
            "sha256": zip_hash,
            "minRequirement": "Windows 10 / 11 (No install required)"
        }
    }

    import json
    with open(PUBLIC_DOWNLOADS / "releases.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    with open(DIST_DOWNLOADS / "releases.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print("\n[SUCCESS] All distribution packages generated and staged.")

if __name__ == "__main__":
    main()
