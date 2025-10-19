# Setup New Project with Claude Shared Frameworks
# This script adds the claude-shared repository as a git subtree to a new project

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectPath,

    [string]$SharedRepoUrl = "https://github.com/iamnormalfree/claude-shared.git",

    [string]$Branch = "master"
)

Write-Host "=== Setting Up Claude Frameworks for New Project ===" -ForegroundColor Cyan
Write-Host ""

# Validate project path
if (-not (Test-Path $ProjectPath)) {
    Write-Host "Error: Project path does not exist: $ProjectPath" -ForegroundColor Red
    exit 1
}

# Check if it's a git repository
cd $ProjectPath
$gitCheck = git rev-parse --git-dir 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Not a git repository. Initialize git first:" -ForegroundColor Red
    Write-Host "  cd $ProjectPath" -ForegroundColor Gray
    Write-Host "  git init" -ForegroundColor Gray
    exit 1
}

Write-Host "Project: $ProjectPath" -ForegroundColor White
Write-Host "Shared Repository: $SharedRepoUrl" -ForegroundColor White
Write-Host ""

# Step 1: Create .claude directory structure
Write-Host "Step 1: Creating .claude directory structure..." -ForegroundColor Yellow
New-Item -Path ".claude\config" -ItemType Directory -Force | Out-Null
New-Item -Path ".claude\commands" -ItemType Directory -Force | Out-Null
New-Item -Path ".claude\agents" -ItemType Directory -Force | Out-Null
New-Item -Path ".claude\skills" -ItemType Directory -Force | Out-Null
Write-Host "  Created .claude directories" -ForegroundColor Green
Write-Host ""

# Step 2: Check if subtree already exists
Write-Host "Step 2: Checking for existing subtree..." -ForegroundColor Yellow
if (Test-Path ".claude\frameworks\shared") {
    Write-Host "  Warning: Subtree already exists at .claude\frameworks\shared" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to remove and re-add it? (y/n)"
    if ($overwrite -eq "y") {
        git rm -rf .claude\frameworks\shared
        git commit -m "Remove old claude-shared subtree"
    } else {
        Write-Host "  Skipping subtree add" -ForegroundColor Gray
        $skipSubtree = $true
    }
}

if (-not $skipSubtree) {
    Write-Host "Step 3: Adding git subtree..." -ForegroundColor Yellow
    git subtree add --prefix .claude/frameworks/shared $SharedRepoUrl $Branch --squash

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Subtree added successfully" -ForegroundColor Green
    } else {
        Write-Host "  Error: Failed to add subtree" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Step 3: Skipped (subtree exists)" -ForegroundColor Gray
}
Write-Host ""

# Step 4: Copy config templates
Write-Host "Step 4: Setting up configuration files..." -ForegroundColor Yellow

if (Test-Path ".claude\frameworks\shared\templates\config") {
    # Copy config templates
    $configs = @(
        "response-awareness-config.json",
        "logging-config.json",
        "agents-config.json"
    )

    foreach ($config in $configs) {
        $source = ".claude\frameworks\shared\templates\config\$config"
        $dest = ".claude\config\$config"

        if (Test-Path $source) {
            if (-not (Test-Path $dest)) {
                Copy-Item -Path $source -Destination $dest -Force
                Write-Host "  Copied: $config" -ForegroundColor Gray
            } else {
                Write-Host "  Skipped: $config (already exists)" -ForegroundColor Gray
            }
        }
    }
} else {
    Write-Host "  Warning: Templates not found in subtree" -ForegroundColor Yellow
    Write-Host "  You'll need to create config files manually" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Create response-awareness command
Write-Host "Step 5: Creating response-awareness command..." -ForegroundColor Yellow

$commandContent = @"
# /response-awareness - Universal Smart Router

## Purpose
Universal entry point that assesses task complexity and routes to the appropriate orchestration tier.

**Core Innovation**: Dynamic routing based on actual complexity, not guesswork.

---

## Load Project Customizations

Read file ``.claude/frameworks/shared/frameworks/response-awareness/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md``

**Apply Phase 0 Extensions before standard complexity assessment:**
- Extension 0.1: Git worktree check (if uncommitted changes detected)
- Extension 0.2: Brainstorming pre-check (if vague language detected)
- Extension 0.3: Debug task detection (if bug keywords detected)

**Load configurations:**
- ``.claude/config/response-awareness-config.json``
- ``.claude/config/logging-config.json``
- ``.claude/config/agents-config.json``

---

## Your Role as Router

You analyze the user's request, score its complexity, and invoke the appropriate Response Awareness tier Skill.

**You do NOT execute the workflow yourself** - you route to the Skill that contains the workflow.

---

For the full router documentation, see:
``.claude/frameworks/shared/frameworks/SKILL.md``
"@

$commandPath = ".claude\commands\response-awareness.md"
if (-not (Test-Path $commandPath)) {
    Set-Content -Path $commandPath -Value $commandContent
    Write-Host "  Created: response-awareness.md" -ForegroundColor Green
} else {
    Write-Host "  Skipped: response-awareness.md (already exists)" -ForegroundColor Gray
}
Write-Host ""

# Step 6: Create worktree-helper agent (if doesn't exist)
Write-Host "Step 6: Checking for worktree-helper agent..." -ForegroundColor Yellow
$agentPath = ".claude\agents\worktree-helper.md"
if (Test-Path ".claude\frameworks\shared\templates\agents\worktree-helper.md") {
    if (-not (Test-Path $agentPath)) {
        Copy-Item -Path ".claude\frameworks\shared\templates\agents\worktree-helper.md" -Destination $agentPath -Force
        Write-Host "  Copied: worktree-helper.md" -ForegroundColor Green
    } else {
        Write-Host "  Exists: worktree-helper.md" -ForegroundColor Gray
    }
} else {
    Write-Host "  Note: worktree-helper template not found (optional)" -ForegroundColor Gray
}
Write-Host ""

# Step 7: Create skill junctions
Write-Host "Step 7: Creating skill junctions..." -ForegroundColor Yellow

$skillsDir = ".claude\skills"
$frameworksDir = ".claude\frameworks\shared\frameworks"

# Response-Awareness Tiers
$tiers = @("light", "medium", "heavy", "full")
foreach ($tier in $tiers) {
    $junctionPath = Join-Path $skillsDir "response-awareness-$tier"
    $targetPath = Join-Path $frameworksDir "response-awareness\response-awareness-$tier"

    if (Test-Path $junctionPath) {
        Write-Host "  Skipped: response-awareness-$tier (already exists)" -ForegroundColor Gray
    } else {
        New-Item -ItemType Junction -Path $junctionPath -Target $targetPath | Out-Null
        Write-Host "  Created: response-awareness-$tier" -ForegroundColor Green
    }
}

# Superpowers (brainstorming, systematic-debugging)
$superpowersJunction = Join-Path $skillsDir "brainstorming"
$superpowersTarget = Join-Path $frameworksDir "superpowers"

if (Test-Path $superpowersJunction) {
    Write-Host "  Skipped: brainstorming (already exists)" -ForegroundColor Gray
} else {
    New-Item -ItemType Junction -Path $superpowersJunction -Target $superpowersTarget | Out-Null
    Write-Host "  Created: brainstorming" -ForegroundColor Green
}
Write-Host ""

# Step 8: Update .gitignore
Write-Host "Step 8: Updating .gitignore..." -ForegroundColor Yellow

$gitignorePath = ".gitignore"
$junctionEntries = @"

# Skill symlinks/junctions to subtree (managed locally, not committed)
.claude/skills/response-awareness-light
.claude/skills/response-awareness-medium
.claude/skills/response-awareness-heavy
.claude/skills/response-awareness-full
.claude/skills/brainstorming
"@

if (Test-Path $gitignorePath) {
    $existingContent = Get-Content $gitignorePath -Raw
    if ($existingContent -notmatch "\.claude/skills/response-awareness-light") {
        Add-Content -Path $gitignorePath -Value $junctionEntries
        Write-Host "  Added junction entries to .gitignore" -ForegroundColor Green
    } else {
        Write-Host "  Junction entries already in .gitignore" -ForegroundColor Gray
    }
} else {
    Set-Content -Path $gitignorePath -Value $junctionEntries.TrimStart()
    Write-Host "  Created .gitignore with junction entries" -ForegroundColor Green
}
Write-Host ""

# Step 9: Commit changes
Write-Host "Step 9: Committing changes..." -ForegroundColor Yellow
git add .claude/ .gitignore
git commit -m "feat: add claude-shared frameworks via git subtree

- Added git subtree at .claude/frameworks/shared
- Set up config files from templates
- Created response-awareness command
- Created skill junctions (local only, in .gitignore)
- Ready for multi-project framework usage"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Changes committed" -ForegroundColor Green
} else {
    Write-Host "  Warning: Commit may have failed (check git status)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Claude frameworks installed at:" -ForegroundColor White
Write-Host "  $ProjectPath\.claude\frameworks\shared" -ForegroundColor Gray
Write-Host ""
Write-Host "Configuration files:" -ForegroundColor White
Write-Host "  $ProjectPath\.claude\config\" -ForegroundColor Gray
Write-Host ""
Write-Host "Skills available:" -ForegroundColor White
Write-Host "  response-awareness-light, medium, heavy, full" -ForegroundColor Gray
Write-Host "  brainstorming, systematic-debugging" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Customize .claude\config\response-awareness-config.json for your project" -ForegroundColor Gray
Write-Host "  2. Test: /response-awareness 'test task'" -ForegroundColor Gray
Write-Host "  3. To update frameworks: git subtree pull --prefix .claude/frameworks/shared $SharedRepoUrl $Branch --squash" -ForegroundColor Gray
Write-Host ""
Write-Host "Note: Skill junctions are local only (not committed to git)" -ForegroundColor Gray
Write-Host "      On fresh clone: Run .\scripts\setup-skill-junctions.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "See UPDATE_GUIDE.md (in NextNest repo) for full documentation" -ForegroundColor Gray
Write-Host ""
