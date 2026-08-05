# Loads .env into real environment variables, then starts the backend.
# Spring Boot doesn't read .env files itself - this does it for you on Windows.
# Usage: .\run.ps1

if (-not (Test-Path .env)) {
    Write-Host "No .env found - copy .env.example to .env first."
    exit 1
}

Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($name, $value)
    }
}

mvn spring-boot:run
