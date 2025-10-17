#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

# Read the file
with open('.claude/commands/response-awareness.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove BOM if present
if content.startswith('\ufeff'):
    content = content[1:]

# Fix encoding issues - comprehensive mapping
encoding_fixes = {
    'â€™': "'",
    'â€œ': '"',
    'â€': '"',
    'â†'': '→',
    'âŒ': '❌',
    'âœ…': '✅',
    'ðŸš¨': '🚨',
    'ðŸ"': '📝',
    'ðŸŽ¯': '🎯',
    'ðŸ›¡ï¸': '🛡️',
    # Common word combinations
    "Claude's": "Claude's",
    "can't": "can't",
    "don't": "don't",
    "You've": "You've",
    "you're": "you're",
    "it's": "it's",
    "wasn't": "wasn't",
    "couldn't": "couldn't",
    "I'll": "I'll",
    "I've": "I've",
    "I'm": "I'm",
    "haven't": "haven't",
    # Pattern fixes
    'â€˜': "'",
    'â€¦': '...',
    'â€"': '—',
    'Ã©': 'é',
    'Ã ': 'à',
}

# Apply fixes
for wrong, right in encoding_fixes.items():
    content = content.replace(wrong, right)

# Additional regex-based fixes for missed patterns
content = re.sub(r'â€[œ]', '"', content)
content = re.sub(r'â€™', "'", content)
content = re.sub(r'â€[^a-zA-Z]', '"', content)

# Write fixed content
with open('.claude/commands/response-awareness.md', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("✅ Fixed encoding issues in response-awareness.md")
