#!/bin/bash

# Simple Migration Script for Git Subtree Setup
# Usage: ./migrate-simple.sh /path/to/project

PROJECT_PATH="$1"
SHARED_REPO="https://github.com/iamnormalfree/claude-shared.git"
BRANCH="master"

if [ -z "$PROJECT_PATH" ]; then
    echo "Error: Please provide project path"
    echo "Usage: ./migrate-simple.sh /path/to/project"
    exit 1
fi

echo "=== Migrating $PROJECT_PATH to Git Subtree Setup ==="
echo ""

cd "$PROJECT_PATH" || exit 1

# Step 1: Check git status
echo "Step 1: Checking git status..."
if ! git diff-index --quiet HEAD --; then
    echo "  Error: Uncommitted changes detected. Commit first."
    git status
    exit 1
fi
echo "  ✓ Working tree clean"
echo ""

# Step 2: Archive old response-awareness files
echo "Step 2: Archiving old files..."

# Create archive directories
mkdir -p .claude/skills/archive/2025-10-pre-subtree
mkdir -p .claude/commands/archive/2025-10-pre-subtree

# Move old files from commands/
if [ -d ".claude/commands/response-awareness-full" ]; then
    git mv .claude/commands/response-awareness-full .claude/commands/archive/2025-10-pre-subtree/
    echo "  Archived: commands/response-awareness-full/"
fi

for file in response-awareness-heavy.md response-awareness-light.md response-awareness-medium.md response-awareness-ideology.md response-awareness-teach.md response-awareness-tpi.md response-awareness-trade.md response-awareness-reports.md; do
    if [ -f ".claude/commands/$file" ]; then
        git mv ".claude/commands/$file" .claude/commands/archive/2025-10-pre-subtree/
        echo "  Archived: commands/$file"
    fi
done

# Check if anything was archived
if [ -n "$(ls -A .claude/commands/archive/2025-10-pre-subtree 2>/dev/null)" ] || [ -n "$(ls -A .claude/skills/archive/2025-10-pre-subtree 2>/dev/null)" ]; then
    git commit -m "chore: archive old response-awareness files before migration"
    echo "  ✓ Changes committed"
else
    echo "  No files to archive"
fi
echo ""

# Step 3: Add git subtree
echo "Step 3: Adding git subtree..."
git subtree add --prefix .claude/frameworks/shared "$SHARED_REPO" "$BRANCH" --squash
if [ $? -eq 0 ]; then
    echo "  ✓ Subtree added successfully"
else
    echo "  ✗ Error: Failed to add subtree"
    exit 1
fi
echo ""

# Step 4: Create/update config directory
echo "Step 4: Setting up config files..."
mkdir -p .claude/config

# Copy templates if they don't exist
for config in response-awareness-config.json logging-config.json agents-config.json; do
    if [ ! -f ".claude/config/$config" ] && [ -f ".claude/frameworks/shared/templates/config/$config" ]; then
        cp ".claude/frameworks/shared/templates/config/$config" ".claude/config/"
        echo "  Copied: $config"
    else
        echo "  Exists: $config"
    fi
done
echo ""

# Step 5: Update response-awareness command
echo "Step 5: Updating response-awareness.md..."
if [ -f ".claude/commands/response-awareness.md" ]; then
    # Backup
    cp .claude/commands/response-awareness.md .claude/commands/response-awareness.md.backup-$(date +%Y%m%d-%H%M%S)

    # Update path (if it has the old pattern)
    sed -i 's|\.claude/skills/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS\.md|.claude/frameworks/shared/frameworks/response-awareness/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md|g' .claude/commands/response-awareness.md

    echo "  ✓ Updated path in response-awareness.md"
else
    echo "  ⚠ Warning: response-awareness.md not found"
fi
echo ""

# Step 6: Handle upstream-reference (no longer needed with subtree)
echo "Step 6: Cleaning up upstream-reference (obsolete with subtree)..."
if [ -d ".claude/upstream-reference" ]; then
    # Keep only the README for documentation
    if [ -f ".claude/upstream-reference/README.md" ]; then
        mkdir -p .claude/upstream-reference/archive
        find .claude/upstream-reference -mindepth 1 -maxdepth 1 ! -name "README.md" ! -name "archive" -exec mv {} .claude/upstream-reference/archive/ \; 2>/dev/null
        echo "  Archived: upstream-reference contents (kept README.md)"
    fi

    # Add to .gitignore
    if [ -f ".gitignore" ]; then
        if ! grep -q ".claude/upstream-reference/\*" .gitignore; then
            echo "" >> .gitignore
            echo "# Upstream reference no longer needed with git subtree" >> .gitignore
            echo ".claude/upstream-reference/*" >> .gitignore
            echo "!.claude/upstream-reference/README.md" >> .gitignore
            echo "  Added: upstream-reference to .gitignore"
        fi
    fi
else
    echo "  No upstream-reference directory found"
fi
echo ""

# Step 7: List existing agents (preserved)
echo "Step 7: Checking agents..."
if [ -d ".claude/agents" ]; then
    echo "  ✓ Found existing agents (preserved):"
    ls -1 .claude/agents/*.md 2>/dev/null | while read -r agent; do
        echo "    - $(basename "$agent")"
    done
else
    mkdir -p .claude/agents
    echo "  Created: .claude/agents/"
fi
echo ""

# Step 8: Final commit
echo "Step 8: Final commit..."
git add .claude/
if git diff-index --quiet --cached HEAD --; then
    echo "  No changes to commit"
else
    git commit -m "feat: migrate to git subtree for response-awareness frameworks

- Archived old files to .claude/commands/archive/2025-10-pre-subtree/
- Added git subtree from claude-shared repository
- Updated paths in configuration
- Ready for multi-project framework management"
    echo "  ✓ Changes committed"
fi
echo ""

echo "=== Migration Complete ==="
echo ""
echo "Next steps:"
echo "  1. Test: /response-awareness 'test task'"
echo "  2. Add CLAUDE.md section from: .claude/frameworks/shared/templates/customizations/CLAUDE.md-response-awareness-section.md"
echo "  3. Add to project list: scripts/project-list.txt"
echo ""
