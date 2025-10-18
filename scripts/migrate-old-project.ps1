# Migrate Old Project to Git Subtree Setup
# This script migrates a project with inline response-awareness files to use the git subtree approach

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectPath,

    [string]$SharedRepoUrl = "https://github.com/iamnormalfree/claude-shared.git",

    [string]$Branch = "master",

    [switch]$DryRun
)

Write-Host "=== Migrating Project to Git Subtree Setup ===" -ForegroundColor Cyan
Write-Host ""

# Validate project path
if (-not (Test-Path $ProjectPath)) {
    Write-Host "Error: Project path does not exist: $ProjectPath" -ForegroundColor Red
    exit 1
}

cd $ProjectPath

# Check if it's a git repository
$gitCheck = git rev-parse --git-dir 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Not a git repository" -ForegroundColor Red
    exit 1
}

Write-Host "Project: $ProjectPath" -ForegroundColor White
Write-Host "Mode: $(if ($DryRun) { 'DRY RUN' } else { 'LIVE' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Green' })
Write-Host ""

# Step 1: Check for uncommitted changes
Write-Host "Step 1: Checking for uncommitted changes..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "  ✗ Error: Uncommitted changes detected" -ForegroundColor Red
    Write-Host "    Please commit or stash changes before migrating" -ForegroundColor Gray
    Write-Host ""
    git status
    exit 1
}
Write-Host "  ✓ Working tree clean" -ForegroundColor Green
Write-Host ""

# Step 2: Detect old setup
Write-Host "Step 2: Detecting old response-awareness setup..." -ForegroundColor Yellow

$oldFiles = @()
$oldDirs = @()

# Check for old skill files
if (Test-Path ".claude\skills\response-awareness-light") { $oldDirs += "response-awareness-light" }
if (Test-Path ".claude\skills\response-awareness-medium") { $oldDirs += "response-awareness-medium" }
if (Test-Path ".claude\skills\response-awareness-heavy") { $oldDirs += "response-awareness-heavy" }
if (Test-Path ".claude\skills\response-awareness-full") { $oldDirs += "response-awareness-full" }
if (Test-Path ".claude\skills\response-awareness-shared") { $oldDirs += "response-awareness-shared" }
if (Test-Path ".claude\skills\brainstorming.md") { $oldFiles += "brainstorming.md" }
if (Test-Path ".claude\skills\systematic-debugging.md") { $oldFiles += "systematic-debugging.md" }

if ($oldDirs.Count -eq 0 -and $oldFiles.Count -eq 0) {
    Write-Host "  ℹ No old setup detected" -ForegroundColor Gray
    Write-Host "    This project may already be migrated or never had response-awareness" -ForegroundColor Gray
    Write-Host ""
    $continueAnyway = Read-Host "Continue with subtree setup anyway? (y/n)"
    if ($continueAnyway -ne "y") {
        Write-Host "Migration cancelled" -ForegroundColor Gray
        exit 0
    }
} else {
    Write-Host "  Found old files/directories:" -ForegroundColor White
    foreach ($dir in $oldDirs) {
        Write-Host "    - .claude\skills\$dir\" -ForegroundColor Gray
    }
    foreach ($file in $oldFiles) {
        Write-Host "    - .claude\skills\$file" -ForegroundColor Gray
    }
}
Write-Host ""

# Step 3: Archive old files
if ($oldDirs.Count -gt 0 -or $oldFiles.Count -gt 0) {
    Write-Host "Step 3: Archiving old files..." -ForegroundColor Yellow

    $archivePath = ".claude\skills\archive\2025-10-pre-subtree"

    if ($DryRun) {
        Write-Host "  [DRY RUN] Would create: $archivePath" -ForegroundColor Gray
        Write-Host "  [DRY RUN] Would move:" -ForegroundColor Gray
        foreach ($dir in $oldDirs) {
            Write-Host "    - .claude\skills\$dir\ → $archivePath\$dir\" -ForegroundColor Gray
        }
        foreach ($file in $oldFiles) {
            Write-Host "    - .claude\skills\$file → $archivePath\$file" -ForegroundColor Gray
        }
    } else {
        New-Item -Path $archivePath -ItemType Directory -Force | Out-Null

        foreach ($dir in $oldDirs) {
            git mv ".claude\skills\$dir" "$archivePath\" | Out-Null
            Write-Host "  Archived: $dir\" -ForegroundColor Green
        }
        foreach ($file in $oldFiles) {
            git mv ".claude\skills\$file" "$archivePath\" | Out-Null
            Write-Host "  Archived: $file" -ForegroundColor Green
        }

        git commit -m "chore: archive old response-awareness files before migration" | Out-Null
        Write-Host "  ✓ Changes committed" -ForegroundColor Green
    }
} else {
    Write-Host "Step 3: No files to archive (skipped)" -ForegroundColor Gray
}
Write-Host ""

# Step 4: Check if subtree already exists
Write-Host "Step 4: Checking for existing subtree..." -ForegroundColor Yellow
if (Test-Path ".claude\frameworks\shared") {
    Write-Host "  ⚠ Warning: Subtree already exists at .claude\frameworks\shared" -ForegroundColor Yellow
    $overwrite = Read-Host "Remove and re-add? (y/n)"
    if ($overwrite -eq "y") {
        if ($DryRun) {
            Write-Host "  [DRY RUN] Would remove existing subtree" -ForegroundColor Gray
        } else {
            git rm -rf .claude\frameworks\shared
            git commit -m "Remove old subtree before migration"
            Write-Host "  ✓ Removed old subtree" -ForegroundColor Green
        }
    } else {
        Write-Host "  Keeping existing subtree" -ForegroundColor Gray
        $skipSubtree = $true
    }
} else {
    Write-Host "  ✓ No existing subtree" -ForegroundColor Green
}
Write-Host ""

# Step 5: Add git subtree
if (-not $skipSubtree) {
    Write-Host "Step 5: Adding git subtree..." -ForegroundColor Yellow

    if ($DryRun) {
        Write-Host "  [DRY RUN] Would run:" -ForegroundColor Gray
        Write-Host "    git subtree add --prefix .claude/frameworks/shared $SharedRepoUrl $Branch --squash" -ForegroundColor Gray
    } else {
        git subtree add --prefix .claude/frameworks/shared $SharedRepoUrl $Branch --squash

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Subtree added successfully" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Error: Failed to add subtree" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "Step 5: Skipped (subtree exists)" -ForegroundColor Gray
}
Write-Host ""

# Step 6: Update response-awareness command
Write-Host "Step 6: Updating response-awareness command..." -ForegroundColor Yellow

$commandPath = ".claude\commands\response-awareness.md"

if (Test-Path $commandPath) {
    if ($DryRun) {
        Write-Host "  [DRY RUN] Would update: $commandPath" -ForegroundColor Gray
        Write-Host "    Old path: .claude/skills/response-awareness-shared/..." -ForegroundColor Gray
        Write-Host "    New path: .claude/frameworks/shared/frameworks/response-awareness/..." -ForegroundColor Gray
    } else {
        # Backup original
        $backupPath = ".claude\commands\response-awareness.md.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $commandPath $backupPath

        # Update path in command file
        $content = Get-Content $commandPath -Raw
        $oldPattern = '\.claude/skills/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS\.md'
        $newPath = '.claude/frameworks/shared/frameworks/response-awareness/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md'

        if ($content -match $oldPattern) {
            $content = $content -replace [regex]::Escape('.claude/skills/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md'), $newPath
            Set-Content $commandPath $content
            Write-Host "  ✓ Updated path in response-awareness.md" -ForegroundColor Green
            Write-Host "  ℹ Backup saved: $backupPath" -ForegroundColor Gray
        } else {
            Write-Host "  ⚠ Pattern not found - may need manual update" -ForegroundColor Yellow
            Write-Host "    Check if path is already correct or different" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  ⚠ Warning: response-awareness.md not found" -ForegroundColor Yellow
    Write-Host "    You may need to create it manually" -ForegroundColor Gray
    Write-Host "    See: scripts/setup-new-project.ps1 for template" -ForegroundColor Gray
}
Write-Host ""

# Step 7: Ensure config files exist
Write-Host "Step 7: Checking config files..." -ForegroundColor Yellow

if (-not (Test-Path ".claude\config")) {
    if ($DryRun) {
        Write-Host "  [DRY RUN] Would create: .claude\config\" -ForegroundColor Gray
    } else {
        New-Item -Path ".claude\config" -ItemType Directory -Force | Out-Null
        Write-Host "  Created: .claude\config\" -ForegroundColor Green
    }
}

$configs = @(
    "response-awareness-config.json",
    "logging-config.json",
    "agents-config.json"
)

$missingConfigs = @()
foreach ($config in $configs) {
    if (-not (Test-Path ".claude\config\$config")) {
        $missingConfigs += $config
    }
}

if ($missingConfigs.Count -gt 0) {
    Write-Host "  Missing configs:" -ForegroundColor Yellow
    foreach ($config in $missingConfigs) {
        Write-Host "    - $config" -ForegroundColor Gray
    }

    if ($DryRun) {
        Write-Host "  [DRY RUN] Would copy from templates" -ForegroundColor Gray
    } else {
        if (Test-Path ".claude\frameworks\shared\templates\config") {
            foreach ($config in $missingConfigs) {
                $source = ".claude\frameworks\shared\templates\config\$config"
                $dest = ".claude\config\$config"
                if (Test-Path $source) {
                    Copy-Item $source $dest
                    Write-Host "  Copied: $config" -ForegroundColor Green
                }
            }
        } else {
            Write-Host "  ⚠ Templates not found - you'll need to create configs manually" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  ✓ All config files exist" -ForegroundColor Green
}
Write-Host ""

# Step 8: Final commit
if (-not $DryRun) {
    Write-Host "Step 8: Final commit..." -ForegroundColor Yellow

    $hasChanges = git status --porcelain
    if ($hasChanges) {
        git add .claude/
        git commit -m "feat: migrate to git subtree for response-awareness frameworks

- Archived old files to .claude/skills/archive/2025-10-pre-subtree/
- Added git subtree from claude-shared repository
- Updated response-awareness.md to use subtree paths
- Ready for multi-project framework management"

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Changes committed" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ Commit may have failed - check git status" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  No changes to commit" -ForegroundColor Gray
    }
} else {
    Write-Host "Step 8: Skipped (dry run)" -ForegroundColor Gray
}
Write-Host ""

# Summary
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Migration Summary" -ForegroundColor White
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "DRY RUN COMPLETE" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "This was a test run. No changes were made." -ForegroundColor Gray
    Write-Host "Run without -DryRun to perform actual migration:" -ForegroundColor Gray
    Write-Host "  .\migrate-old-project.ps1 -ProjectPath '$ProjectPath'" -ForegroundColor Cyan
} else {
    Write-Host "✅ MIGRATION COMPLETE" -ForegroundColor Green
    Write-Host ""
    Write-Host "What was done:" -ForegroundColor White
    if ($oldDirs.Count -gt 0 -or $oldFiles.Count -gt 0) {
        Write-Host "  ✓ Archived old files to .claude\skills\archive\2025-10-pre-subtree\" -ForegroundColor Gray
    }
    if (-not $skipSubtree) {
        Write-Host "  ✓ Added git subtree at .claude\frameworks\shared\" -ForegroundColor Gray
    }
    Write-Host "  ✓ Updated configuration" -ForegroundColor Gray
    Write-Host "  ✓ Committed changes" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "  1. Test: /response-awareness 'test task'" -ForegroundColor Gray
    Write-Host "  2. Add to project list: scripts\project-list.txt" -ForegroundColor Gray
    Write-Host "  3. Future updates: git subtree pull --prefix .claude/frameworks/shared $SharedRepoUrl $Branch --squash" -ForegroundColor Gray
}

Write-Host ""
Write-Host "For more info, see:" -ForegroundColor White
Write-Host "  - docs\guides\MULTI_PROJECT_SETUP.md (section: Migration from Old Setup)" -ForegroundColor Gray
Write-Host "  - UPDATE_GUIDE.md" -ForegroundColor Gray
Write-Host ""
