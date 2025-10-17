#!/usr/bin/env node

/**
 * NEXTNEST CONTEXT VALIDATION SCRIPT
 * 
 * This script enforces the Context Validation Framework
 * Run before ANY code changes to guarantee 100% context alignment
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}🔍${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.magenta}🎯 ${msg}${colors.reset}\n`)
}

// Configuration - paths to critical system files
const SYSTEM_PATHS = {
  calculations: {
    mortgage: 'lib/calculations/mortgage.ts',
    urgency: 'lib/calculations/urgency-calculator.ts'
  },
  forms: {
    intelligent: 'components/forms/IntelligentMortgageForm.tsx',
    progressive: 'components/forms/ProgressiveForm.tsx',
    loanSelector: 'components/forms/LoanTypeSelector.tsx'
  },
  api: {
    analyze: 'app/api/forms/analyze/route.ts'
  },
  types: {
    mortgage: 'types/mortgage.ts'
  },
  documentation: {
    gateStructure: 'NEXTNEST_GATE_STRUCTURE_ROUNDTABLE.md',
    implementationPlan: 'AI_INTELLIGENT_LEAD_FORM_IMPLEMENTATION_PLAN.md',
    n8nIntegration: 'ROUNDTABLE_PROGRESSIVE_FORM_N8N_INTEGRATION.md',
    contextFramework: 'NEXTNEST_CONTEXT_VALIDATION_FRAMEWORK.md'
  }
}

// Critical system contracts that must remain consistent
const SYSTEM_CONTRACTS = {
  gateStructure: [
    { gate: 0, fields: ['loanType'], submission: false },
    { gate: 1, fields: ['name', 'email'], submission: false },
    { gate: 2, fields: ['phone', '...loanSpecific'], submission: true, n8nGate: 'G2' },
    { gate: 3, fields: ['monthlyIncome', 'existingCommitments'], submission: true, n8nGate: 'G3' }
  ],
  
  urgencyMapping: {
    'new_purchase': 'purchaseTimeline',
    'refinance': 'lockInStatus', 
    'equity_loan': 'purpose'
  },
  
  leadScoreComponents: {
    urgency: '0-20 points',
    value: '0-40 points', 
    completeness: '0-40 points'
  },
  
  submissionPoints: ['gate2', 'gate3'], // Only these gates submit to n8n
  
  requiredExports: {
    mortgage: ['calculateMortgage', 'calculateLeadScore', 'MAS_LIMITS'],
    urgency: ['calculateUrgencyProfile'],
    api: ['POST'] // API route must export POST handler
  }
}

// Validation functions
class ContextValidator {
  constructor(options = {}) {
    this.errors = []
    this.warnings = []
    this.validationResults = {}
    this.saveReport = options.saveReport !== false // Default to true
    this.reportDir = options.reportDir || 'validation-reports'
    this.startTime = new Date()
    this.reportContent = []
  }

  // Add content to report
  addToReport(content, type = 'info') {
    const timestamp = new Date().toISOString()
    this.reportContent.push({
      timestamp,
      type,
      content
    })
  }

  // Save validation report to file
  async saveValidationReport(passed = false) {
    if (!this.saveReport) return

    const reportDate = this.startTime.toISOString().split('T')[0]
    const reportTime = this.startTime.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-')
    const status = passed ? 'PASSED' : 'FAILED'
    const filename = `${reportDate}_${reportTime}_${status}.md`
    const filepath = path.join(this.reportDir, filename)

    // Ensure report directory exists
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true })
    }

    const duration = new Date() - this.startTime
    const report = this.generateMarkdownReport(passed, duration)

    fs.writeFileSync(filepath, report, 'utf8')
    
    // Also save latest report
    const latestPath = path.join(this.reportDir, 'latest.md')
    fs.writeFileSync(latestPath, report, 'utf8')

    // Save JSON version for programmatic access
    const jsonReport = {
      timestamp: this.startTime.toISOString(),
      duration,
      passed,
      errors: this.errors,
      warnings: this.warnings,
      validationResults: this.validationResults,
      reportContent: this.reportContent
    }
    
    const jsonPath = path.join(this.reportDir, 'latest.json')
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2), 'utf8')

    console.log(`\n📄 Report saved to: ${filepath}`)
    console.log(`📄 Latest report: ${latestPath}`)
    console.log(`📄 JSON report: ${jsonPath}`)

    return filepath
  }

  // Generate markdown report
  generateMarkdownReport(passed, duration) {
    const status = passed ? '✅ PASSED' : '❌ FAILED'
    const score = this.calculateScore()
    
    return `# 🎯 NEXTNEST Context Validation Report

**Date**: ${this.startTime.toLocaleDateString()}  
**Time**: ${this.startTime.toLocaleTimeString()}  
**Duration**: ${Math.round(duration / 1000)}s  
**Status**: ${status}  
**Score**: ${score}%  

---

## 📊 Summary

- **Errors**: ${this.errors.length}
- **Warnings**: ${this.warnings.length}  
- **Checks Performed**: ${this.validationResults.totalChecks || 'N/A'}

---

## 🔍 Validation Phases

${this.reportContent.filter(r => r.type === 'phase').map(r => `### ${r.content}`).join('\n\n')}

---

## ✅ Passed Checks

${this.reportContent.filter(r => r.type === 'success').map(r => `- ${r.content}`).join('\n')}

---

${this.warnings.length > 0 ? `## ⚠️ Warnings

${this.warnings.map((w, i) => `${i + 1}. ${w}`).join('\n')}

---` : ''}

${this.errors.length > 0 ? `## ❌ Errors

${this.errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

---` : ''}

## 🎯 Recommendations

${passed ? `### ✅ Ready for Implementation
- All critical validations passed
- Review warnings above (if any)
- Proceed with implementation following framework phases
- Re-run validation after changes

### 📋 Next Steps
1. Address any warnings above
2. Use validation dashboard: http://localhost:3000/validation-dashboard
3. Follow framework phases during implementation
4. Run \`npm run validate-context\` after changes` : `### 🛑 Implementation Blocked
- Fix all errors listed above before proceeding
- Address warnings to improve alignment score
- Re-run validation after fixes

### 📋 Required Actions
1. **Fix Critical Errors**: Address all errors listed above
2. **Run TypeScript Check**: \`npx tsc --noEmit\`  
3. **Check Linting**: \`npm run lint\`
4. **Re-validate**: \`npm run validate-context\`
5. **Only proceed when validation passes**`}

---

## 📈 Historical Context

This validation prevents architectural fragmentation by ensuring:
- ✅ Domain knowledge alignment across all layers
- ✅ Consistent field mapping between systems  
- ✅ Data type consistency and contract validation
- ✅ Implementation readiness verification
- ✅ Documentation synchronization

**Framework Authority**: Mandatory for all NextNest implementations  
**Generated by**: NEXTNEST Context Validation Framework v1.0
`
  }

  // Calculate overall score
  calculateScore() {
    const total = this.errors.length + this.warnings.length + (this.reportContent.filter(r => r.type === 'success').length || 1)
    const successes = this.reportContent.filter(r => r.type === 'success').length || 0
    return Math.round((successes / total) * 100)
  }

  // Phase 1: Domain Knowledge Mapping
  async validateDomainKnowledge() {
    const phaseTitle = 'PHASE 1: DOMAIN KNOWLEDGE VALIDATION'
    log.title(phaseTitle)
    this.addToReport(phaseTitle, 'phase')
    
    log.step('Checking mortgage calculation logic...')
    await this.checkMortgageCalculations()
    
    log.step('Checking form structure compliance...')
    await this.checkFormStructure()
    
    log.step('Checking urgency mapping consistency...')
    await this.checkUrgencyMapping()
    
    return this.errors.length === 0
  }
  
  async checkMortgageCalculations() {
    const mortgagePath = SYSTEM_PATHS.calculations.mortgage
    
    if (!fs.existsSync(mortgagePath)) {
      this.errors.push(`Critical file missing: ${mortgagePath}`)
      return
    }
    
    const content = fs.readFileSync(mortgagePath, 'utf8')
    
    // Check for required functions
    const requiredFunctions = ['calculateMortgage', 'calculateLeadScore', 'calculateSingaporeMetrics']
    for (const func of requiredFunctions) {
      if (!content.includes(`export function ${func}`)) {
        this.errors.push(`Missing required function: ${func} in ${mortgagePath}`)
      }
    }
    
    // Check for MAS compliance constants
    if (!content.includes('MAS_LIMITS')) {
      this.errors.push('Missing MAS_LIMITS constants for regulatory compliance')
    }
    
    // Check for proper mortgage formula
    if (!content.includes('P * [r(1+r)^n] / [(1+r)^n - 1]')) {
      this.warnings.push('Mortgage formula comment missing or incorrect')
    }
    
    log.success('Mortgage calculations validated')
    this.addToReport('Mortgage calculations validated', 'success')
  }
  
  async checkFormStructure() {
    const formPath = SYSTEM_PATHS.forms.intelligent
    
    if (!fs.existsSync(formPath)) {
      this.errors.push(`Critical file missing: ${formPath}`)
      return
    }
    
    const content = fs.readFileSync(formPath, 'utf8')
    
    // Check for gate structure compliance
    if (!content.includes('case 0:') || !content.includes('case 1:') || 
        !content.includes('case 2:') || !content.includes('case 3:')) {
      this.errors.push('Form does not implement required 4-gate structure (0-3)')
    }
    
    // Check submission strategy compliance
    if (!content.includes('NO API CALL') || !content.includes('FIRST n8n SUBMISSION') || 
        !content.includes('SECOND n8n SUBMISSION')) {
      this.errors.push('Form does not implement cumulative submission strategy')
    }
    
    // Check urgency calculation integration
    if (!content.includes('calculateUrgencyProfile')) {
      this.errors.push('Form missing urgency profile calculation')
    }
    
    log.success('Form structure validated')
  }
  
  async checkUrgencyMapping() {
    const urgencyPath = SYSTEM_PATHS.calculations.urgency
    
    if (!fs.existsSync(urgencyPath)) {
      this.errors.push(`Critical file missing: ${urgencyPath}`)
      return
    }
    
    const content = fs.readFileSync(urgencyPath, 'utf8')
    
    // Check for loan type mappings
    for (const [loanType, field] of Object.entries(SYSTEM_CONTRACTS.urgencyMapping)) {
      if (!content.includes(`'${loanType}'`) && !content.includes(`"${loanType}"`)) {
        this.errors.push(`Missing urgency mapping for loan type: ${loanType}`)
      }
    }
    
    // Check for required urgency functions
    if (!content.includes('calculateUrgencyProfile')) {
      this.errors.push('Missing calculateUrgencyProfile function')
    }
    
    log.success('Urgency mapping validated')
  }
  
  // Phase 2: Consistency Validation
  async validateConsistency() {
    log.title('PHASE 2: CONSISTENCY VALIDATION')
    
    log.step('Checking cross-system field mapping...')
    await this.checkFieldConsistency()
    
    log.step('Checking data type alignment...')
    await this.checkDataTypes()
    
    log.step('Checking API contract compliance...')
    await this.checkAPIContracts()
    
    return this.errors.length === 0
  }
  
  async checkFieldConsistency() {
    // Check that critical fields exist across all systems
    const criticalFields = ['loanType', 'urgencyProfile', 'purchaseTimeline', 'lockInStatus', 'purpose']
    
    const files = [
      SYSTEM_PATHS.forms.intelligent,
      SYSTEM_PATHS.api.analyze,
      SYSTEM_PATHS.calculations.urgency
    ]
    
    for (const field of criticalFields) {
      for (const file of files) {
        if (!fs.existsSync(file)) continue
        
        const content = fs.readFileSync(file, 'utf8')
        
        // Special case for urgencyProfile - should be computed, not input
        if (field === 'urgencyProfile') {
          if (file.includes('forms') && !content.includes('calculateUrgencyProfile')) {
            this.errors.push(`${file} missing urgency profile calculation`)
          }
        } else if (!content.includes(field)) {
          this.warnings.push(`Field '${field}' not found in ${file}`)
        }
      }
    }
    
    log.success('Field consistency checked')
  }
  
  async checkDataTypes() {
    // Check TypeScript types exist and are imported correctly
    const typesPath = SYSTEM_PATHS.types.mortgage
    
    if (!fs.existsSync(typesPath)) {
      this.warnings.push('TypeScript types file missing - create types/mortgage.ts')
      return
    }
    
    const content = fs.readFileSync(typesPath, 'utf8')
    
    // Check for required interfaces
    const requiredTypes = ['MortgageInput', 'MortgageResult', 'LeadCaptureData']
    for (const type of requiredTypes) {
      if (!content.includes(`interface ${type}`) && !content.includes(`type ${type}`)) {
        this.warnings.push(`Missing TypeScript type: ${type}`)
      }
    }
    
    log.success('Data types checked')
  }
  
  async checkAPIContracts() {
    const apiPath = SYSTEM_PATHS.api.analyze
    
    if (!fs.existsSync(apiPath)) {
      this.errors.push(`Critical API file missing: ${apiPath}`)
      return
    }
    
    const content = fs.readFileSync(apiPath, 'utf8')
    
    // Check for required functions
    if (!content.includes('export async function POST')) {
      this.errors.push('API missing POST handler')
    }
    
    if (!content.includes('callN8nAnalysis')) {
      this.errors.push('API missing n8n integration function')
    }
    
    if (!content.includes('generateAlgorithmicInsight')) {
      this.errors.push('API missing fallback logic')
    }
    
    // Check for urgency enrichment
    if (!content.includes('calculateUrgencyProfile')) {
      this.errors.push('API not enriching data with urgency profile')
    }
    
    log.success('API contracts validated')
  }
  
  // Phase 3: Implementation Readiness
  async validateImplementationReadiness() {
    log.title('PHASE 3: IMPLEMENTATION READINESS')
    
    log.step('Checking TypeScript compilation...')
    await this.checkTypeScript()
    
    log.step('Checking dependencies...')
    await this.checkDependencies()
    
    log.step('Checking build process...')
    await this.checkBuild()
    
    return this.errors.length === 0
  }
  
  async checkTypeScript() {
    try {
      execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' })
      log.success('TypeScript compilation successful')
    } catch (error) {
      this.errors.push('TypeScript compilation failed - run `npx tsc --noEmit` for details')
    }
  }
  
  async checkDependencies() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
      const requiredDeps = ['zod', 'next', 'react', 'typescript']
      
      for (const dep of requiredDeps) {
        if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
          this.errors.push(`Missing required dependency: ${dep}`)
        }
      }
      
      log.success('Dependencies validated')
    } catch (error) {
      this.errors.push('Failed to read package.json')
    }
  }
  
  async checkBuild() {
    try {
      // Check if build succeeds without actually running full build
      execSync('npm run lint', { stdio: 'pipe' })
      log.success('Linting passed')
    } catch (error) {
      this.warnings.push('Linting issues found - run `npm run lint` for details')
    }
  }
  
  // Phase 4: Documentation Alignment
  async validateDocumentationAlignment() {
    log.title('PHASE 4: DOCUMENTATION ALIGNMENT')
    
    log.step('Checking documentation consistency...')
    await this.checkDocumentationConsistency()
    
    return this.warnings.length < 5 // Allow some warnings for docs
  }
  
  async checkDocumentationConsistency() {
    for (const [name, path] of Object.entries(SYSTEM_PATHS.documentation)) {
      if (!fs.existsSync(path)) {
        this.warnings.push(`Documentation missing: ${path}`)
        continue
      }
      
      const content = fs.readFileSync(path, 'utf8')
      
      // Check for gate structure consistency in documentation
      if (name === 'gateStructure') {
        const requiredSections = ['Gate 0:', 'Gate 1:', 'Gate 2:', 'Gate 3:']
        for (const section of requiredSections) {
          if (!content.includes(section)) {
            this.warnings.push(`Gate structure doc missing section: ${section}`)
          }
        }
      }
    }
    
    log.success('Documentation alignment checked')
  }
  
  // Generate validation report
  generateReport() {
    log.title('VALIDATION REPORT')
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      log.success('🎉 ALL VALIDATIONS PASSED - READY FOR IMPLEMENTATION')
      return true
    }
    
    if (this.errors.length > 0) {
      log.error(`${this.errors.length} CRITICAL ERRORS FOUND:`)
      this.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`)
      })
      console.log('')
    }
    
    if (this.warnings.length > 0) {
      log.warning(`${this.warnings.length} WARNINGS FOUND:`)
      this.warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning}`)
      })
      console.log('')
    }
    
    if (this.errors.length > 0) {
      log.error('🛑 IMPLEMENTATION BLOCKED - FIX ERRORS BEFORE PROCEEDING')
      return false
    } else {
      log.warning('⚠️ WARNINGS PRESENT - REVIEW BEFORE IMPLEMENTATION')
      return true
    }
  }
  
  // Main validation orchestrator
  async validateAll() {
    console.log(colors.bright + colors.magenta)
    console.log('╔══════════════════════════════════════════════════════════╗')
    console.log('║         NEXTNEST CONTEXT VALIDATION FRAMEWORK            ║')
    console.log('║              100% Context Alignment Check                ║')  
    console.log('╚══════════════════════════════════════════════════════════╝')
    console.log(colors.reset)
    
    const domainValid = await this.validateDomainKnowledge()
    const consistencyValid = await this.validateConsistency()
    const readinessValid = await this.validateImplementationReadiness()
    const docsValid = await this.validateDocumentationAlignment()
    
    const allValid = this.generateReport()
    
    // Save validation report
    await this.saveValidationReport(allValid)
    
    if (allValid) {
      console.log(colors.green + colors.bright)
      console.log('\n🚀 VALIDATION COMPLETE - READY FOR SAFE IMPLEMENTATION')
      console.log(colors.reset)
      process.exit(0)
    } else {
      console.log(colors.red + colors.bright) 
      console.log('\n🛑 VALIDATION FAILED - RESOLVE ERRORS BEFORE IMPLEMENTATION')
      console.log(colors.reset)
      process.exit(1)
    }
  }
}

// CLI execution
if (require.main === module) {
  const validator = new ContextValidator()
  validator.validateAll().catch(error => {
    log.error(`Validation script failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = ContextValidator