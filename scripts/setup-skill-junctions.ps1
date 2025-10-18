# Setup Skill Junctions
# Creates Windows junctions from .claude/skills/ to subtree framework locations
# Run this after git subtree pull or on fresh clone

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$skillsDir = Join-Path $repoRoot ".claude\skills"
$frameworksDir = Join-Path $repoRoot ".claude\frameworks\shared\frameworks"

Write-Host "Setting up skill junctions..." -ForegroundColor Cyan
Write-Host ""

# Response-Awareness Tiers
$tiers = @("light", "medium", "heavy", "full")
foreach ($tier in $tiers) {
    $junctionPath = Join-Path $skillsDir "response-awareness-$tier"
    $targetPath = Join-Path $frameworksDir "response-awareness\response-awareness-$tier"

    if (Test-Path $junctionPath) {
        Write-Host "  [SKIP] response-awareness-$tier (already exists)" -ForegroundColor Yellow
    } else {
        New-Item -ItemType Junction -Path $junctionPath -Target $targetPath | Out-Null
        Write-Host "  [OK] response-awareness-$tier -> subtree" -ForegroundColor Green
    }
}

# Superpowers (brainstorming, systematic-debugging)
$superpowersJunction = Join-Path $skillsDir "brainstorming"
$superpowersTarget = Join-Path $frameworksDir "superpowers"

if (Test-Path $superpowersJunction) {
    Write-Host "  [SKIP] brainstorming (already exists)" -ForegroundColor Yellow
} else {
    New-Item -ItemType Junction -Path $superpowersJunction -Target $superpowersTarget | Out-Null
    Write-Host "  [OK] brainstorming -> subtree/superpowers" -ForegroundColor Green
}

Write-Host ""
Write-Host "Skill junctions created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Junctions are local only (not committed to git)" -ForegroundColor Gray
Write-Host "      Run this script again if you delete .claude/skills/ folder" -ForegroundColor Gray
