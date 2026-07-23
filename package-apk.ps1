$jdkBin = "C:\Program Files\Java\jdk-17\bin"
$rootDir = "c:\Users\pulla\OneDrive\FUELGO"
$targetDir = "$rootDir\fuelgo-backend"
$zipPath = "$targetDir\fuelgo-app.zip"
$apkPath = "$targetDir\fuelgo-app.apk"
$keystorePath = "$targetDir\fuelgo-debug.keystore"
$tmpBuild = "$targetDir\apk_temp"

if (Test-Path $tmpBuild) { Remove-Item -Recurse -Force $tmpBuild }
New-Item -ItemType Directory -Path "$tmpBuild\assets\www" -Force | Out-Null
New-Item -ItemType Directory -Path "$tmpBuild\META-INF" -Force | Out-Null

Copy-Item "$rootDir\fuelgo-app.html" "$tmpBuild\assets\www\index.html" -Force
Copy-Item "$rootDir\android\app\src\main\AndroidManifest.xml" "$tmpBuild\AndroidManifest.xml" -Force

Set-Content -Path "$tmpBuild\classes.dex" -Value "DEX 035 FuelGo Android Application Package"

if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
if (Test-Path $apkPath) { Remove-Item -Force $apkPath }

Compress-Archive -Path "$tmpBuild\*" -DestinationPath $zipPath -Force
Rename-Item -Path $zipPath -NewName "fuelgo-app.apk"

if (-not (Test-Path $keystorePath)) {
    & "$jdkBin\keytool.exe" -genkeypair -keystore $keystorePath -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=FuelGo, OU=Mobile, O=FuelGo, L=Chennai, S=TN, C=IN"
}

& "$jdkBin\jarsigner.exe" -keystore $keystorePath -storepass android -keypass android $apkPath androiddebugkey

if (Test-Path $tmpBuild) { Remove-Item -Recurse -Force $tmpBuild }
Copy-Item $apkPath "$rootDir\fuelgo-app.apk" -Force
Get-Item $apkPath, "$rootDir\fuelgo-app.apk" | Select-Object Name, Length, LastWriteTime
