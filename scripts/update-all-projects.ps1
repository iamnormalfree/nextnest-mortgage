# Update Claude Shared Frameworks Across All Projects
# This script pulls the latest claude-shared updates to multiple projects

param(
    [Parameter(Mandatory=$false)]
    [string[]]$ProjectPaths,

    [string]$SharedRepoUrl = "https://github.com/iamnormalfree/claude-shared.git",

    [string]$Branch = "master",

    [switch]$DryRun
)

Write-Host "=== Updating Claude Frameworks Across Projects ===" -ForegroundColor Cyan
Write-Host ""

# Default project paths if none specified
if (-not $ProjectPaths) {
    Write-Host "No project paths specified. Please provide paths:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor White
    Write-Host "  .\update-all-projects.ps1 -ProjectPaths @(" -ForegroundColor Gray
    Write-Host "    'C:\Projects\Project1'," -ForegroundColor Gray
    Write-Host "    'C:\Projects\Project2'" -ForegroundColor Gray
    Write-Host "  )" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or create a config file at scripts\project-list.txt with one path per line" -ForegroundColor Gray
    Write-Host ""

    # Try to load from config file
    $configPath = Join-Path $PSScriptRoot "project-list.txt"
    if (Test-Path $configPath) {
        Write-Host "Loading projects from: $configPath" -ForegroundColor Yellow
        $ProjectPaths = Get-Content $configPath | Where-Object { $_ -and $_ -notmatch "^#" }
        Write-Host "Found $($ProjectPaths.Count) projects" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "Error: No projects specified and no config file found" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Shared Repository: $SharedRepoUrl" -ForegroundColor White
Write-Host "Branch: $Branch" -ForegroundColor White
if ($DryRun) {
    Write-Host "Mode: DRY RUN (no changes will be made)" -ForegroundColor Yellow
}
Write-Host ""

# Track results
$results = @()

foreach ($projectPath in $ProjectPaths) {
    Write-Host "---" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Processing: $projectPath" -ForegroundColor Cyan

    # Validate project
    if (-not (Test-Path $projectPath)) {
        Write-Host "  ✗ Error: Path does not exist" -ForegroundColor Red
        $results += [PSCustomObject]@{
            Project = $projectPath
            Status = "Failed"
            Reason = "Path not found"
        }
        Write-Host ""
        continue
    }

    cd $projectPath

    # Check if git repo
    $gitCheck = git rev-parse --git-dir 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ Error: Not a git repository" -ForegroundColor Red
        $results += [PSCustomObject]@{
            Project = $projectPath
            Status = "Failed"
            Reason = "Not a git repo"
        }
        Write-Host ""
        continue
    }

    # Check if subtree exists
    if (-not (Test-Path ".claude\frameworks\shared")) {
        Write-Host "  ✗ Warning: Subtree not found at .claude\frameworks\shared" -ForegroundColor Yellow
        Write-Host "    Run setup-new-project.ps1 first" -ForegroundColor Gray
        $results += [PSCustomObject]@{
            Project = $projectPath
            Status = "Skipped"
            Reason = "No subtree"
        }
        Write-Host ""
        continue
    }

    # Check for uncommitted changes
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "  ⚠ Warning: Uncommitted changes detected" -ForegroundColor Yellow
        Write-Host "    Commit or stash before updating" -ForegroundColor Gray
        $results += [PSCustomObject]@{
            Project = $projectPath
            Status = "Skipped"
            Reason = "Uncommitted changes"
        }
        Write-Host ""
        continue
    }

    # Pull subtree updates
    Write-Host "  → Pulling subtree updates..." -ForegroundColor White

    if ($DryRun) {
        Write-Host "    [DRY RUN] Would run:" -ForegroundColor Gray
        Write-Host "    git subtree pull --prefix .claude/frameworks/shared $SharedRepoUrl $Branch --squash" -ForegroundColor Gray
        $results += [PSCustomObject]@{
            Project = $projectPath
            Status = "Dry Run"
            Reason = "Would update"
        }
    } else {
        $pullOutput = git subtree pull --prefix .claude/frameworks/shared $SharedRepoUrl $Branch --squash 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Updated successfully" -ForegroundColor Green

            # Check if anything actually changed
            if ($pullOutput -match "Already up to date") {
                $results += [PSCustomObject]@{
                    Project = $projectPath
                    Status = "No Changes"
                    Reason = "Already up to date"
                }
            } else {
                $results += [PSCustomObject]@{
                    Project = $projectPath
                    Status = "Updated"
                    Reason = "Successfully pulled updates"
                }
            }
        } else {
            Write-Host "  ✗ Error: Failed to pull updates" -ForegroundColor Red
            Write-Host "    $pullOutput" -ForegroundColor Gray
            $results += [PSCustomObject]@{
                Project = $projectPath
                Status = "Failed"
                Reason = "Git error"
            }
        }
    }

    Write-Host ""
}

# Summary
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor White
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$results | Format-Table -AutoSize

Write-Host ""
$updated = ($results | Where-Object { $_.Status -eq "Updated" }).Count
$failed = ($results | Where-Object { $_.Status -eq "Failed" }).Count
$skipped = ($results | Where-Object { $_.Status -in @("Skipped", "No Changes") }).Count

Write-Host "Updated: $updated" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })
Write-Host "Skipped/No Changes: $skipped" -ForegroundColor Gray
Write-Host ""

if ($failed -gt 0) {
    Write-Host "⚠ Some projects failed to update. Review errors above." -ForegroundColor Yellow
} elseif ($updated -gt 0) {
    Write-Host "✓ All projects updated successfully!" -ForegroundColor Green
} else {
    Write-Host "ℹ All projects were already up to date" -ForegroundColor Gray
}

Write-Host ""
