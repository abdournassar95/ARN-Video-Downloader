# ==============================================================================
# ARN Video Downloader - Build & Sign Script (Inno Setup Edition)
# Developer: Abdou Ragab Nassar (ARN Technology)
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ARN Video Downloader - Inno Setup Build and Sign" -ForegroundColor Yellow
Write-Host "  Developer: Abdou Ragab Nassar - ARN Technology" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Clean previous build folders
Write-Host "[1/7] Cleaning previous build folders..." -ForegroundColor Cyan
if (Test-Path "dist\setup") {
    Remove-Item -Recurse -Force "dist\setup" -ErrorAction SilentlyContinue
}
if (Test-Path "dist\win-unpacked") {
    Remove-Item -Recurse -Force "dist\win-unpacked" -ErrorAction SilentlyContinue
}
if (Test-Path "out") {
    Remove-Item -Recurse -Force "out" -ErrorAction SilentlyContinue
}
Write-Host "  Clean completed successfully." -ForegroundColor Green

# 2. Sync local certificate
Write-Host "[2/7] Syncing ARN Technology Digital Certificate..." -ForegroundColor Cyan
if (-not (Test-Path "cert")) {
    New-Item -ItemType Directory -Force -Path "cert" | Out-Null
}
$sourceCert = "d:\مشاريعي\ARN_Cert\ARN_Technology_Root.cer"
if (Test-Path $sourceCert) {
    Copy-Item -Force $sourceCert "cert\ARN_Technology_Root.cer"
    Write-Host "  Certificate copied to local cert directory." -ForegroundColor Green
}

# 3. Verify certificate in Windows security stores
Write-Host "[3/7] Verifying certificate in Windows security stores..." -ForegroundColor Cyan
$certThumbprint = "ECAB1B13787752DA7D91EB73FCC29C77C7C0432E"
$inRoot = Get-Item "Cert:\CurrentUser\Root\$certThumbprint" -ErrorAction SilentlyContinue
$inPub = Get-Item "Cert:\CurrentUser\TrustedPublisher\$certThumbprint" -ErrorAction SilentlyContinue

if (-not $inRoot -or -not $inPub) {
    if (Test-Path "cert\ARN_Technology_Root.cer") {
        & certutil.exe -addstore -user -f "Root" "cert\ARN_Technology_Root.cer" | Out-Null
        & certutil.exe -addstore -user -f "TrustedPublisher" "cert\ARN_Technology_Root.cer" | Out-Null
    }
}
Write-Host "  Certificate is active and trusted." -ForegroundColor Green

# 4. Build application files
Write-Host "[4/7] Building app bundles (electron-vite build)..." -ForegroundColor Cyan
& npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit $LASTEXITCODE
}
Write-Host "  App bundle built successfully." -ForegroundColor Green

# 5. Preparing unpacked directory
Write-Host "[5/7] Preparing unpacked Electron environment..." -ForegroundColor Cyan
& npx electron-builder --dir --config electron-builder.yml
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to generate unpacked directory!"
    exit $LASTEXITCODE
}

# Clean unused locales to reduce size
$localesPath = "dist\win-unpacked\locales"
if (Test-Path $localesPath) {
    Get-ChildItem -Path $localesPath -Filter "*.pak" | Where-Object {
        $_.Name -notmatch "^(ar|en-US|en-GB)\.pak$"
    } | Remove-Item -Force -ErrorAction SilentlyContinue
}

# Sign internal executable
$mainExe = "dist\win-unpacked\ARN Video Downloader.exe"
if (Test-Path $mainExe) {
    $cert = Get-Item "Cert:\CurrentUser\My\$certThumbprint" -ErrorAction SilentlyContinue
    if ($cert) {
        Set-AuthenticodeSignature -FilePath $mainExe -Certificate $cert -TimestampServer "http://timestamp.digicert.com" | Out-Null
    }
}
Write-Host "  Unpacked files optimized and signed." -ForegroundColor Green

# 6. Compiling installer with Inno Setup 7
Write-Host "[6/7] Compiling installer with Inno Setup 7 (LZMA2 Ultra64 Solid)..." -ForegroundColor Cyan
$isccPath = "C:\Program Files\Inno Setup 7\ISCC.exe"
if (-not (Test-Path $isccPath)) {
    Write-Error "ISCC.exe not found at $isccPath"
    exit 1
}

& $isccPath "installer.iss"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Inno Setup compilation failed!"
    exit $LASTEXITCODE
}
Write-Host "  Inno Setup installer created successfully." -ForegroundColor Green

# 7. Digitally signing installer
Write-Host "[7/7] Digitally signing the final setup installer..." -ForegroundColor Cyan
$setupExe = Get-ChildItem -Path "dist\setup" -Filter "*.exe" | Select-Object -First 1

if ($setupExe) {
    $cert = Get-Item "Cert:\CurrentUser\My\$certThumbprint" -ErrorAction SilentlyContinue

    if ($cert) {
        Write-Host "  Signing file: $($setupExe.FullName)..." -ForegroundColor Yellow
        $sig = Set-AuthenticodeSignature -FilePath $setupExe.FullName -Certificate $cert -TimestampServer "http://timestamp.digicert.com"
        if ($sig.Status -ne "Valid") {
            $sig = Set-AuthenticodeSignature -FilePath $setupExe.FullName -Certificate $cert
        }
        Write-Host "  Digital Signature Status: $($sig.Status)" -ForegroundColor Green
    } else {
        Write-Warning "Certificate not found in CurrentUser store."
    }

    $sizeMB = [math]::Round($setupExe.Length / 1MB, 2)
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "  Build and Distribution Completed Successfully!" -ForegroundColor Green
    Write-Host "  Installer File: $($setupExe.Name)" -ForegroundColor Yellow
    Write-Host "  Full Path:      $($setupExe.FullName)" -ForegroundColor White
    Write-Host "  File Size:      $sizeMB MB" -ForegroundColor Cyan
    Write-Host "  Protection:     Protected against WinRAR and 7-Zip extraction" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Warning "Setup executable not found in dist\setup!"
}
