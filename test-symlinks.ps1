# Test Script: Verify Symlinks/Junctions Work on Windows
# This is a safe test that won't touch any existing files

Write-Host "=== Testing Symlinks/Junctions on Windows ===" -ForegroundColor Cyan
Write-Host ""

# Create test directories
$testRoot = "$env:TEMP\claude-symlink-test"
$libraryPath = "$testRoot\library"
$project1Path = "$testRoot\project1"
$project2Path = "$testRoot\project2"

Write-Host "Step 1: Creating test library..." -ForegroundColor Yellow
New-Item -Path $libraryPath -ItemType Directory -Force | Out-Null
New-Item -Path "$libraryPath\shared-skill" -ItemType Directory -Force | Out-Null

# Create a test file in the library
$testContent = @"
# Shared Skill File

This is a shared file in the library.
It will be accessed by multiple projects via junction.

Last updated: $(Get-Date)
"@

Set-Content -Path "$libraryPath\shared-skill\SKILL.md" -Value $testContent
Write-Host "Created library at: $libraryPath" -ForegroundColor Green
Write-Host "  Contains: shared-skill\SKILL.md" -ForegroundColor Gray
Write-Host ""

# Create project directories
Write-Host "Step 2: Creating test projects..." -ForegroundColor Yellow
New-Item -Path "$project1Path\.claude\skills" -ItemType Directory -Force | Out-Null
New-Item -Path "$project2Path\.claude\skills" -ItemType Directory -Force | Out-Null
Write-Host "Created project1 at: $project1Path" -ForegroundColor Green
Write-Host "Created project2 at: $project2Path" -ForegroundColor Green
Write-Host ""

# Test 1: Directory Junction (recommended for folders)
Write-Host "Step 3: Testing Directory Junction (for folders)..." -ForegroundColor Yellow
try {
    cmd /c mklink /J "$project1Path\.claude\skills\shared-skill" "$libraryPath\shared-skill" 2>&1 | Out-Null

    # Test if it works
    if (Test-Path "$project1Path\.claude\skills\shared-skill\SKILL.md") {
        $content = Get-Content "$project1Path\.claude\skills\shared-skill\SKILL.md" -Raw
        if ($content -eq $testContent) {
            Write-Host "Directory Junction WORKS!" -ForegroundColor Green
            Write-Host "  Project1 can read from library via junction" -ForegroundColor Gray
            $junctionWorks = $true
        } else {
            Write-Host "Directory Junction created but content doesn't match" -ForegroundColor Red
            $junctionWorks = $false
        }
    } else {
        Write-Host "Directory Junction created but file not accessible" -ForegroundColor Red
        $junctionWorks = $false
    }
} catch {
    Write-Host "Directory Junction FAILED: $_" -ForegroundColor Red
    $junctionWorks = $false
}
Write-Host ""

# Test 2: File Symlink (for individual files)
Write-Host "Step 4: Testing File Symlink (for individual files)..." -ForegroundColor Yellow

# Create a single file in library
Set-Content -Path "$libraryPath\shared-agent.md" -Value "# Shared Agent`n`nThis is a shared agent file."

try {
    cmd /c mklink "$project2Path\.claude\shared-agent.md" "$libraryPath\shared-agent.md" 2>&1 | Out-Null

    # Test if it works
    if (Test-Path "$project2Path\.claude\shared-agent.md") {
        $content = Get-Content "$project2Path\.claude\shared-agent.md" -Raw
        if ($content -match "Shared Agent") {
            Write-Host "File Symlink WORKS!" -ForegroundColor Green
            Write-Host "  Project2 can read individual file from library via symlink" -ForegroundColor Gray
            $symlinkWorks = $true
        } else {
            Write-Host "File Symlink created but content doesn't match" -ForegroundColor Red
            $symlinkWorks = $false
        }
    } else {
        Write-Host "File Symlink created but file not accessible" -ForegroundColor Red
        $symlinkWorks = $false
    }
} catch {
    Write-Host "File Symlink FAILED: $_" -ForegroundColor Red
    $symlinkWorks = $false
}
Write-Host ""

# Test 3: Verify updates propagate
Write-Host "Step 5: Testing if updates propagate..." -ForegroundColor Yellow
if ($junctionWorks) {
    # Update the library file
    $updatedContent = $testContent + "`n`nUPDATED: This line was added to test propagation."
    Set-Content -Path "$libraryPath\shared-skill\SKILL.md" -Value $updatedContent

    # Check if project1 sees the update
    $project1Content = Get-Content "$project1Path\.claude\skills\shared-skill\SKILL.md" -Raw
    if ($project1Content -eq $updatedContent) {
        Write-Host "Updates PROPAGATE automatically!" -ForegroundColor Green
        Write-Host "  Changed library file, project1 immediately sees the change" -ForegroundColor Gray
        $propagationWorks = $true
    } else {
        Write-Host "Updates don't propagate" -ForegroundColor Red
        $propagationWorks = $false
    }
} else {
    Write-Host "Skipping (junction didn't work)" -ForegroundColor Gray
    $propagationWorks = $false
}
Write-Host ""

# Summary
Write-Host "=== Test Results ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Directory Junctions (folders): " -NoNewline
if ($junctionWorks) {
    Write-Host "PASS" -ForegroundColor Green
} else {
    Write-Host "FAIL" -ForegroundColor Red
}

Write-Host "File Symlinks (individual files): " -NoNewline
if ($symlinkWorks) {
    Write-Host "PASS" -ForegroundColor Green
} else {
    Write-Host "FAIL" -ForegroundColor Red
}

Write-Host "Update Propagation: " -NoNewline
if ($propagationWorks) {
    Write-Host "PASS" -ForegroundColor Green
} elseif ($junctionWorks) {
    Write-Host "FAIL" -ForegroundColor Red
} else {
    Write-Host "N/A" -ForegroundColor Gray
}
Write-Host ""

# Recommendations
if ($junctionWorks -and $propagationWorks) {
    Write-Host "=== Recommendation ===" -ForegroundColor Cyan
    Write-Host "Your system supports junctions and they work perfectly!" -ForegroundColor Green
    Write-Host "We can proceed with Option 2 (library + junctions approach)" -ForegroundColor Green
    Write-Host ""
    Write-Host "This means:" -ForegroundColor White
    Write-Host "  - We can create a central library for response-awareness" -ForegroundColor Gray
    Write-Host "  - Projects will use junctions to point to library files" -ForegroundColor Gray
    Write-Host "  - Updates to library automatically appear in all projects" -ForegroundColor Gray
} elseif ($junctionWorks -and -not $propagationWorks) {
    Write-Host "=== Recommendation ===" -ForegroundColor Cyan
    Write-Host "Junctions work but updates don't propagate properly" -ForegroundColor Yellow
    Write-Host "  This might be a Windows cache issue" -ForegroundColor Gray
    Write-Host ""
    Write-Host "We could:" -ForegroundColor White
    Write-Host "  - Try git subtree approach instead (more reliable)" -ForegroundColor Gray
    Write-Host "  - Or investigate why propagation isn't working" -ForegroundColor Gray
} else {
    Write-Host "=== Recommendation ===" -ForegroundColor Cyan
    Write-Host "Junctions/Symlinks don't work on your system" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative approaches:" -ForegroundColor White
    Write-Host "  - Git subtree (copy code, track as git subtree)" -ForegroundColor Gray
    Write-Host "  - NPM package (if you're comfortable with npm)" -ForegroundColor Gray
    Write-Host "  - Manual copy with update scripts" -ForegroundColor Gray
}
Write-Host ""

# Show test location
Write-Host "=== Test Files Location ===" -ForegroundColor Cyan
Write-Host "Test created at: $testRoot" -ForegroundColor Gray
Write-Host "You can explore these files to see how junctions work" -ForegroundColor Gray
Write-Host ""

# Cleanup option
Write-Host "=== Cleanup ===" -ForegroundColor Cyan
Write-Host ""
$cleanup = Read-Host "Delete test files? (y/n)"
if ($cleanup -eq "y") {
    Remove-Item -Path $testRoot -Recurse -Force
    Write-Host "Test files deleted" -ForegroundColor Green
} else {
    Write-Host "Test files kept at: $testRoot" -ForegroundColor Gray
    Write-Host "Delete manually when done with: Remove-Item -Path '$testRoot' -Recurse -Force" -ForegroundColor Gray
}
Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
