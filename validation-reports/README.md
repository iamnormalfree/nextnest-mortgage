# 📊 Validation Reports

This directory contains generated reports from the NextNest Context Validation Framework.

## 📋 Report Types

### **Markdown Reports (.md)**
- **`latest.md`** - Most recent validation report (human-readable)
- **`YYYY-MM-DD_HH-MM-SS_STATUS.md`** - Timestamped reports with PASSED/FAILED status

### **JSON Reports (.json)**
- **`latest.json`** - Most recent report in JSON format (programmatic access)

## 🔍 Report Contents

Each report includes:
- **Summary**: Errors, warnings, and validation score
- **Phase Results**: Domain knowledge, consistency, implementation readiness, documentation
- **Detailed Findings**: Specific errors, warnings, and passed checks
- **Recommendations**: Next steps and required actions
- **Historical Context**: Framework purpose and validation goals

## 🛠️ Commands

```bash
# Generate new validation report
npm run validate-context

# View latest report
npm run validation-report

# View all reports
npm run validation-history

# Clean old reports
npm run clean-reports
```

## 📈 Understanding Scores

- **90-100%**: ✅ Ready for implementation
- **70-89%**: ⚠️ Address warnings before proceeding  
- **Below 70%**: ❌ Fix errors before implementation

## 🎯 Framework Purpose

These reports prevent architectural fragmentation by ensuring:
- ✅ Domain knowledge alignment across all layers
- ✅ Consistent field mapping between systems
- ✅ Data type consistency and contract validation
- ✅ Implementation readiness verification
- ✅ Documentation synchronization

**Framework Authority**: Mandatory for all NextNest implementations

---

*Reports are automatically generated and should not be manually edited*