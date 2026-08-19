# FuelGo: Build Web App & Copy to Android
# Run this every time you update the web app, before building the APK
Write-Host "`n FuelGo App Builder" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

# Step 1: Build the React frontend
Write-Host "`n Step 1: Building React frontend..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\fuelgo-frontend"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n Build failed! Fix the errors above and try again." -ForegroundColor Red
    Read-Host "Press Enter to exit"; exit 1
}
Write-Host "`n Build complete!" -ForegroundColor Green

# Step 2: Clear old Android assets
Write-Host "`n Step 2: Clearing old Android assets..." -ForegroundColor Cyan
$androidWww = "$PSScriptRoot\android\app\src\main\assets\www"
Remove-Item -Path "$androidWww\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   Old files cleared." -ForegroundColor Green

# Step 3: Copy new build to Android
Write-Host "`n Step 3: Copying new build to Android assets..." -ForegroundColor Cyan
Copy-Item -Path "$PSScriptRoot\fuelgo-frontend\dist\*" -Destination $androidWww -Recurse -Force
Write-Host "   Files copied!" -ForegroundColor Green

Write-Host "`n Done! Now open Android Studio and click Run." -ForegroundColor Green
Read-Host "Press Enter to exit"
