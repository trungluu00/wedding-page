# Tao anh giu cho (JPG nho, nen trung tinh, chu "Anh cuoi") vao thu muc photos/.
# Chi can chay lai neu lo xoa anh mau: npm run photos  (can Windows PowerShell)
# Dung ma ky tu de khong phu thuoc encoding cua file .ps1.
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'photos'
New-Item -ItemType Directory -Force $out | Out-Null

$label = ([char]0x1EA2) + 'nh c' + ([char]0x01B0) + ([char]0x1EDB) + 'i'   # "Anh cuoi" co dau

$items = @(
    @('hero', 1080, 1350, 'bia'),
    @('statement', 1080, 1350, 'loi moi'),
    @('groom', 800, 1000, 'chu re'),
    @('bride', 800, 1000, 'co dau'),
    @('middle-1', 1080, 720, 'giua 1'),
    @('middle-2', 1080, 720, 'giua 2'),
    @('ending', 1080, 1350, 'cuoi thiep'),
    @('album-1', 1080, 1350, 'album 1'),
    @('album-2', 1080, 1350, 'album 2'),
    @('album-3', 1080, 1350, 'album 3'),
    @('album-4', 1080, 1350, 'album 4'),
    @('album-5', 1080, 1350, 'album 5'),
    @('album-6', 1080, 1350, 'album 6'),
    @('share-1200x630', 1200, 630, 'Trung & Nhi')
)

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]60)

foreach ($it in $items) {
    $name, $w, $h, $sub = $it
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.TextRenderingHint = 'AntiAliasGridFit'
    $g.Clear([System.Drawing.Color]::FromArgb(232, 226, 214))

    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(196, 186, 168)), 4
    $m = [int]([Math]::Min($w, $h) * 0.05)
    $g.DrawRectangle($pen, $m, $m, $w - 2 * $m, $h - 2 * $m)

    $fmt = New-Object System.Drawing.StringFormat
    $fmt.Alignment = 'Center'
    $fmt.LineAlignment = 'Center'
    $big = New-Object System.Drawing.Font 'Segoe UI', ([float]([Math]::Min($w, $h) * 0.09)), ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
    $small = New-Object System.Drawing.Font 'Segoe UI', ([float]([Math]::Min($w, $h) * 0.04)), ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(120, 110, 95))

    $g.DrawString($label, $big, $brush, (New-Object System.Drawing.RectangleF 0, (-$h * 0.04), $w, $h), $fmt)
    $g.DrawString("($sub)", $small, $brush, (New-Object System.Drawing.RectangleF 0, ($h * 0.07), $w, $h), $fmt)

    $file = Join-Path $out "$name.jpg"
    $bmp.Save($file, $codec, $params)
    $g.Dispose(); $bmp.Dispose()
    Write-Output "  $name.jpg  ${w}x${h}"
}
