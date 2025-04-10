$directories = @(
    "src/app",
    "src/components/dashboard",
    "src/components/members",
    "src/components/donors",
    "src/components/expenses",
    "src/components/activities",
    "src/components/admin",
    "src/lib",
    "src/types",
    "src/hooks"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path $dir
    Write-Host "Created directory: $dir"
} 