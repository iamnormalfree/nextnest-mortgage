# Setup Claude Shared Repository
# This script creates a shared repository for response-awareness and superpowers

$sharedPath = "$env:USERPROFILE\.config\claude-shared"
$nextNestPath = "C:\Users\HomePC\Desktop\Code\NextNest"

Write-Host "=== Setting up Claude Shared Repository ===" -ForegroundColor Cyan
Write-Host ""

# Create directory structure
Write-Host "Step 1: Creating directory structure..." -ForegroundColor Yellow
New-Item -Path "$sharedPath\frameworks\response-awareness" -ItemType Directory -Force | Out-Null
New-Item -Path "$sharedPath\frameworks\superpowers" -ItemType Directory -Force | Out-Null
New-Item -Path "$sharedPath\templates\config" -ItemType Directory -Force | Out-Null
New-Item -Path "$sharedPath\templates\agents" -ItemType Directory -Force | Out-Null
New-Item -Path "$sharedPath\templates\customizations" -ItemType Directory -Force | Out-Null
New-Item -Path "$sharedPath\scripts" -ItemType Directory -Force | Out-Null
Write-Host "Created: $sharedPath" -ForegroundColor Green
Write-Host ""

# Copy response-awareness frameworks from NextNest
Write-Host "Step 2: Copying response-awareness tiers..." -ForegroundColor Yellow
$tiers = @("response-awareness-light", "response-awareness-medium", "response-awareness-heavy", "response-awareness-full", "response-awareness-shared")
foreach ($tier in $tiers) {
    $source = "$nextNestPath\.claude\skills\$tier"
    $dest = "$sharedPath\frameworks\response-awareness\$tier"
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $dest -Recurse -Force
        Write-Host "  Copied: $tier" -ForegroundColor Gray
    } else {
        Write-Host "  Skipped: $tier (not found)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Copy Superpowers skills
Write-Host "Step 3: Copying Superpowers skills..." -ForegroundColor Yellow
$skills = @("brainstorming.md", "systematic-debugging.md")
foreach ($skill in $skills) {
    $source = "$nextNestPath\.claude\skills\$skill"
    $dest = "$sharedPath\frameworks\superpowers\$skill"
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $dest -Force
        Write-Host "  Copied: $skill" -ForegroundColor Gray
    } else {
        Write-Host "  Skipped: $skill (not found)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Copy templates (config files, agents)
Write-Host "Step 4: Copying templates..." -ForegroundColor Yellow
Copy-Item -Path "$nextNestPath\.claude\config\*" -Destination "$sharedPath\templates\config\" -Force
Write-Host "  Copied: config templates" -ForegroundColor Gray

Copy-Item -Path "$nextNestPath\.claude\agents\worktree-helper.md" -Destination "$sharedPath\templates\agents\" -Force
Write-Host "  Copied: worktree-helper agent" -ForegroundColor Gray
Write-Host ""

# Create README
Write-Host "Step 5: Creating README..." -ForegroundColor Yellow
$readme = @"
# Claude Shared Repository

This repository contains shared response-awareness framework, Superpowers skills, and templates for use across multiple projects.

## Structure

\`\`\`
claude-shared/
├── frameworks/
│   ├── response-awareness/          # Response-awareness tiers
│   │   ├── response-awareness-light/
│   │   ├── response-awareness-medium/
│   │   ├── response-awareness-heavy/
│   │   ├── response-awareness-full/
│   │   └── response-awareness-shared/
│   └── superpowers/                 # Superpowers skills
│       ├── brainstorming.md
│       └── systematic-debugging.md
│
├── templates/                       # Templates for new projects
│   ├── config/                      # Config file templates
│   ├── agents/                      # Reusable agents
│   └── customizations/              # Customization templates
│
└── scripts/                         # Helper scripts
\`\`\`

## Usage

### For New Projects

Use git subtree to add this shared code to your project:

\`\`\`bash
cd your-project
git subtree add --prefix .claude/frameworks/shared \
  https://github.com/YOUR_USERNAME/claude-shared.git main --squash
\`\`\`

### To Update Projects

When shared code updates, pull changes:

\`\`\`bash
cd your-project
git subtree pull --prefix .claude/frameworks/shared \
  https://github.com/YOUR_USERNAME/claude-shared.git main --squash
\`\`\`

## Projects Using This

- NextNest
- (Add your other projects here)

## Last Updated

$(Get-Date -Format "yyyy-MM-dd")
"@
Set-Content -Path "$sharedPath\README.md" -Value $readme
Write-Host "Created: README.md" -ForegroundColor Gray
Write-Host ""

# Initialize git
Write-Host "Step 6: Initializing git repository..." -ForegroundColor Yellow
cd $sharedPath
git init | Out-Null
git add .
git commit -m "Initial commit: Claude shared repository" | Out-Null
Write-Host "Git repository initialized" -ForegroundColor Green
Write-Host ""

# Show summary
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Shared repository created at:" -ForegroundColor White
Write-Host "  $sharedPath" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Create a GitHub repository (e.g., 'claude-shared')" -ForegroundColor Gray
Write-Host "  2. Run these commands:" -ForegroundColor Gray
Write-Host ""
Write-Host "     cd $sharedPath" -ForegroundColor Cyan
Write-Host "     git remote add origin https://github.com/YOUR_USERNAME/claude-shared.git" -ForegroundColor Cyan
Write-Host "     git branch -M main" -ForegroundColor Cyan
Write-Host "     git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Then we'll add this as a subtree to NextNest" -ForegroundColor Gray
Write-Host ""
