---
title: roundtable-execution-guide
type: runbook
domain: operations
owner: operations
last-reviewed: 2025-09-30
---

# Roundtable Formats Execution Guide
## Preventing the 10 Critical Problems Through Structured Collaboration

### ðŸŽ¯ **Quick Reference: Problem â†’ Format Mapping**

| Critical Problem | Primary Format | Supporting Formats | Frequency |
|-----------------|----------------|-------------------|-----------|
| Architectural Inconsistency | Architecture Review | Technical Debt Tribunal | Weekly + Monthly |
| Component Coupling | Architecture Review | Pre-Implementation Planning | Weekly + Per Feature |
| AI Integration Brittleness | AI Optimization Lab | Security & Compliance Review | Weekly + Bi-weekly |
| Missing Learning Loops | AI Optimization Lab | Post-Incident Learning | Weekly + After Incidents |
| Database Schema Evolution | Data Pipeline Reliability | Architecture Review | Weekly |
| Configuration Drift | DevOps Deployment Readiness | Daily Standup Plus | Pre-deploy + Daily |
| User Experience Fragmentation | UX Consistency Workshop | Pre-Implementation Planning | Bi-weekly |
| Data Pipeline Brittleness | Data Pipeline Reliability | DevOps Deployment Readiness | Weekly |
| Security as Afterthought | Security & Compliance Review | All Formats (embedded) | Bi-weekly + Pre-release |
| Integration Hell & Scope Creep | Daily Standup Plus | Pre-Implementation Planning | Daily + Per Feature |

---

## ðŸ“‹ **Format Quick Cards**

### **1. Architecture Review Roundtable**
```
When: Weekly, Thursdays 2-3:30 PM
Who: Marcus (Lead), Sarah, Ahmad + optional others
Why: Prevent breaking changes, maintain clean architecture
```
**Quick Checklist:**
- [ ] Review last week's decisions
- [ ] Evaluate new component designs
- [ ] Define TypeScript interfaces
- [ ] Create/Update ADRs
- [ ] Assign implementation tasks

### **2. Pre-Implementation Planning**
```
When: Start of each feature (2-hour block)
Who: Emily (Facilitator), Marcus, Product Owner, relevant specialists
Why: Prevent scope creep, design learning loops upfront
```
**Quick Checklist:**
- [ ] Clarify requirements (20 min)
- [ ] Technical breakdown (40 min)
- [ ] Risk assessment (20 min)
- [ ] Learning loops design (20 min)
- [ ] Estimate & prioritize (15 min)

### **3. Security & Compliance First**
```
When: Bi-weekly Wednesdays + Before each release
Who: Rizwan (Lead), Ahmad, Jason
Why: Build security in, not bolt it on
```
**Quick Checklist:**
- [ ] STRIDE threat modeling
- [ ] PDPA compliance check
- [ ] Code security review
- [ ] Update incident response

### **4. AI Optimization Lab**
```
When: Weekly, Fridays 3-5 PM
Who: Raj (Lead), Jason, Ahmad
Why: Continuous AI improvement, prevent brittleness
```
**Quick Checklist:**
- [ ] Review performance metrics (30 min)
- [ ] A/B test analysis (40 min)
- [ ] Test fallback systems (20 min)
- [ ] Implement learning loops (25 min)
- [ ] Cost optimization (5 min)

### **5. Daily Standup Plus**
```
When: Daily, 9:30 AM (15 minutes sharp)
Who: All active team members
Why: Prevent integration issues, catch scope creep early
```
**Quick Format:**
- 8 min: Updates (1 min/person)
- 3 min: Integration sync needs
- 2 min: Risk radar
- 2 min: Sprint goal check

---

## ðŸš€ **Implementation Playbook**

### **Week 1: Foundation**
Monday: Set up Daily Standup Plus
Tuesday: First Architecture Review
Wednesday: Security & Compliance Review
Thursday: Continue Architecture Review
Friday: Team retrospective on new formats

### **Week 2: Expansion**
- Add Pre-Implementation Planning for next feature
- Start AI Optimization Lab (if applicable)
- Begin Data Pipeline Reliability sessions
- Continue daily standups

### **Week 3: Refinement**
- Add UX Consistency Workshop
- Prepare DevOps Deployment Readiness
- Review format effectiveness
- Adjust timing/participants as needed

### **Week 4: Full Implementation**
- Hold first Technical Debt Tribunal
- Run Post-Incident Learning (if needed)
- Measure KPIs for each format
- Plan next month's schedule

---

## ðŸ“Š **Effectiveness Dashboard**

### **Key Metrics to Track**

```javascript
const roundtableMetrics = {
  architectureReview: {
    metric: "Breaking changes in production",
    target: 0,
    currentMonth: null,
    trend: null
  },
  securityCompliance: {
    metric: "Security vulnerabilities (Critical/High)",
    target: "0/3",
    currentMonth: null,
    trend: null
  },
  aiOptimization: {
    metric: "AI response satisfaction",
    target: ">85%",
    currentMonth: null,
    trend: null
  },
  deploymentReadiness: {
    metric: "Deployment success rate",
    target: ">95%",
    currentMonth: null,
    trend: null
  },
  technicalDebt: {
    metric: "Debt ratio (debt/features)",
    target: "<20%",
    currentMonth: null,
    trend: null
  },
  userExperience: {
    metric: "Conversion rate",
    target: ">15%",
    currentMonth: null,
    trend: null
  },
  dataPipeline: {
    metric: "Pipeline uptime",
    target: ">99.5%",
    currentMonth: null,
    trend: null
  }
};
```

---

## ðŸŽ­ **Role Rotation Schedule**

### **Facilitator Rotation (Prevents Groupthink)**

| Week | Mon (Standup) | Tue | Wed | Thu | Fri |
|------|---------------|-----|-----|-----|-----|
| 1 | Emily | Marcus | Rizwan | Marcus | Raj |
| 2 | Marcus | Sarah | Rizwan | Ahmad | Jason |
| 3 | Sarah | Priya | Rizwan | Kelly | Raj |
| 4 | Ahmad | Marcus | Rizwan | Jason | Kelly |

---

## ðŸš¨ **Red Flags: When to Call Emergency Roundtable**

### **Immediate Triggers:**
1. Production incident (P1/P2)
2. Security breach detected
3. Data loss or corruption
4. AI system complete failure
5. Deployment rollback needed

### **Format: Emergency Response Roundtable**
```
Duration: 30 minutes initial, extend as needed
Participants: Incident commander + relevant specialists
Agenda:
1. Situation assessment (5 min)
2. Immediate actions (10 min)
3. Communication plan (5 min)
4. Recovery strategy (10 min)
5. Follow-up scheduling
```

---

## ðŸ’¡ **Pro Tips from the Team**

### **Marcus (Lead Architect):**
> "Always define interfaces before implementation. If you can't draw it on a whiteboard, you can't code it cleanly."

### **Sarah (Frontend):**
> "Bring mockups to Architecture Review. Visual + technical = fewer misunderstandings."

### **Raj (AI Engineer):**
> "Track every AI interaction. You can't optimize what you don't measure."

### **Kelly (DevOps):**
> "Test your rollback before you deploy. The middle of an incident is the wrong time to discover it doesn't work."

### **Rizwan (Security):**
> "Security in every roundtable > security roundtable alone."

### **Emily (Coordinator):**
> "Action items without owners and deadlines are just wishes."

---

## ðŸ“… **Sample Monthly Calendar**

```
Week 1:
Mon: Daily Standup + Technical Debt Planning
Tue: Architecture Review
Wed: Security & Compliance Review
Thu: Architecture Review (continued)
Fri: AI Optimization Lab

Week 2:
Mon: Daily Standup + Sprint Planning
Tue: Pre-Implementation Planning (Feature A)
Wed: Data Pipeline Reliability
Thu: UX Consistency Workshop
Fri: AI Optimization Lab

Week 3:
Mon: Daily Standup + Mid-Sprint Review
Tue: Architecture Review
Wed: Security & Compliance Review
Thu: DevOps Deployment Readiness
Fri: AI Optimization Lab

Week 4:
Mon: Daily Standup + Sprint Retrospective
Tue: Technical Debt Tribunal
Wed: Data Pipeline Reliability
Thu: Post-Incident Learning (if needed)
Fri: AI Optimization Lab + Month Review
```

---

## âœ… **Success Criteria**

### **You're doing it right if:**
- Zero unplanned breaking changes
- Security issues caught before production
- AI performance improving week-over-week
- Deployment success rate >95%
- Technical debt decreasing
- Team knows what everyone is working on
- Incidents have clear learning outcomes
- Features ship on time with quality

### **You need to adjust if:**
- Same issues keep recurring
- Meetings feel like status updates only
- No clear action items emerge
- Team skips sessions when "busy"
- Decisions aren't documented
- Integration surprises still happen
- Security is still an afterthought

---

## ðŸ”„ **Continuous Improvement**

### **Monthly Roundtable Retrospective**
Last Friday of each month, 30 minutes:
1. Which formats provided most value?
2. Which should we adjust/remove?
3. What problems are we still seeing?
4. How can we improve efficiency?
5. Are we measuring the right things?

### **Quarterly Format Evolution**
- Survey team on format effectiveness
- Analyze metrics trends
- Adjust formats based on learnings
- Share improvements with other teams
- Update this guide

---

## ðŸ“š **Resources & Tools**

### **Templates:**
- [ADR Template](./templates/adr-template.md)
- [Incident Report Template](./templates/incident-template.md)
- [Technical Spec Template](./templates/tech-spec-template.md)
- [Risk Register Template](./templates/risk-register.xlsx)

### **Tools We Use:**
- **Facilitation**: Zoom + Miro
- **Documentation**: Confluence
- **Tracking**: JIRA + Linear
- **Monitoring**: DataDog + Grafana
- **Diagrams**: Lucidchart
- **Code Review**: GitHub

### **Reading List:**
- "Accelerate" - DevOps metrics that matter
- "Site Reliability Engineering" - Google's approach
- "Design It!" - Architecture thinking
- "The Phoenix Project" - DevOps transformation
- "Clean Architecture" - Robert Martin

---

## ðŸŽ¯ **The Bottom Line**

These roundtable formats aren't meetings for the sake of meetings. They're deliberate, structured interventions designed to prevent the 10 critical problems that kill software projects.

**Investment**: ~8 hours/week in roundtables
**Return**: Avoided disasters, faster delivery, happier team, better code

Remember Emily's mantra: **"An hour of planning saves ten hours of debugging."**

Now go forth and roundtable like pros! ðŸš€
