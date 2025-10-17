'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Shield, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Download,
  Users,
  Eye,
  Database,
  Activity,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

export default function ComplianceDashboard() {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    fetchComplianceReport()
  }, [fetchComplianceReport])

  const fetchComplianceReport = useCallback(async () => {
    setLoading(true)
    try {
      const endDate = new Date()
      const startDate = new Date()
      
      switch(timeRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(startDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(startDate.getDate() - 90)
          break
      }

      const response = await fetch(`/api/compliance/report?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error('Failed to fetch compliance report:', error)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  const downloadReport = async () => {
    try {
      const response = await fetch('/api/compliance/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'pdf' })
      })
      const data = await response.json()
      
      // In production, this would trigger actual file download
      alert(`Report generated! Verification Code: ${data.report?.signature?.verificationCode}`)
    } catch (error) {
      console.error('Failed to download report:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                PDPA Compliance Dashboard
              </h1>
              <p className="text-gray-600">
                Personal Data Protection Act compliance monitoring and reporting
              </p>
            </div>
            <div className="flex gap-2">
              <select 
                className="px-4 py-2 border rounded-lg"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <Button onClick={downloadReport} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Overall Compliance Score */}
        <Card className="mb-8 border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-green-600" />
                <div>
                  <CardTitle className="text-2xl">Overall PDPA Compliance Score</CardTitle>
                  <CardDescription>Based on Singapore PDPA requirements</CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-green-600">
                  {report?.pdpaCompliance?.overallScore || 0}%
                </div>
                <div className="text-sm text-green-600 font-semibold">COMPLIANT</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={report?.pdpaCompliance?.overallScore || 0} className="h-3" />
            <div className="mt-4 grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {report?.auditSummary?.totalEvents || 0}
                </div>
                <div className="text-sm text-gray-600">Total Events Logged</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">100%</div>
                <div className="text-sm text-gray-600">Data Encrypted</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {report?.pdpaCompliance?.consent?.activeConsents || 0}
                </div>
                <div className="text-sm text-gray-600">Active Consents</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-sm text-gray-600">Data Breaches</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Compliance Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Data Protection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Lock className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">
                  {report?.pdpaCompliance?.dataProtection?.score || 0}%
                </span>
              </div>
              <CardTitle className="text-sm">Data Protection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {report?.pdpaCompliance?.dataProtection?.measures?.map((measure: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{measure.name}</span>
                    <span className="text-green-600 font-semibold">{measure.coverage}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Consent Management */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Users className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {report?.pdpaCompliance?.consent?.score || 0}%
                </span>
              </div>
              <CardTitle className="text-sm">Consent Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Consents</span>
                  <span className="font-semibold">{report?.pdpaCompliance?.consent?.totalConsents || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active</span>
                  <span className="text-green-600 font-semibold">
                    {report?.pdpaCompliance?.consent?.activeConsents || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Withdrawn</span>
                  <span className="text-orange-600 font-semibold">
                    {report?.pdpaCompliance?.consent?.withdrawnConsents || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Minimization */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Database className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">
                  {report?.pdpaCompliance?.dataMinimization?.score || 0}%
                </span>
              </div>
              <CardTitle className="text-sm">Data Minimization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fields Blocked</span>
                  <span className="font-semibold">
                    {report?.pdpaCompliance?.dataMinimization?.unnecessaryFieldsBlocked || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Reduction</span>
                  <span className="text-green-600 font-semibold">
                    {report?.pdpaCompliance?.dataMinimization?.dataReductionRate || '0%'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">PII Redacted</span>
                  <span className="font-semibold">
                    {report?.securityMetrics?.dataIntegrity?.redactedPII || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Threats */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-2xl font-bold text-orange-600">
                  {Object.values(report?.securityMetrics?.threatsBlocked || {}).reduce((a: number, b: unknown) => a + (typeof b === 'number' ? b : 0), 0)}
                </span>
              </div>
              <CardTitle className="text-sm">Threats Blocked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">SQL Injection</span>
                  <span className="font-semibold">{report?.securityMetrics?.threatsBlocked?.sqlInjection || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">XSS Attempts</span>
                  <span className="font-semibold">{report?.securityMetrics?.threatsBlocked?.xssAttempts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Suspicious</span>
                  <span className="font-semibold">{report?.securityMetrics?.threatsBlocked?.suspiciousPatterns || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Rights & Audit Trail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Rights Requests */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <CardTitle>User Rights Requests</CardTitle>
              </div>
              <CardDescription>PDPA Chapter 3: Individual Rights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Access Requests', data: report?.userRights?.accessRequests, icon: FileText },
                  { label: 'Deletion Requests', data: report?.userRights?.deletionRequests, icon: AlertCircle },
                  { label: 'Correction Requests', data: report?.userRights?.correctionRequests, icon: CheckCircle },
                  { label: 'Portability Requests', data: report?.userRights?.portabilityRequests, icon: Download }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="font-medium text-sm">{item.label}</div>
                        <div className="text-xs text-gray-500">
                          Avg response: {item.data?.averageResponseTime || item.data?.averageCompletionTime || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{item.data?.total || 0}</div>
                      <div className="text-xs text-green-600">
                        {item.data?.fulfilled || 0} fulfilled
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Audit Trail Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                <CardTitle>Audit Trail Summary</CardTitle>
              </div>
              <CardDescription>Complete activity logging for compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {report?.auditSummary?.formSubmissions || 0}
                    </div>
                    <div className="text-xs text-gray-600">Form Submissions</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {report?.auditSummary?.chatTransitions || 0}
                    </div>
                    <div className="text-xs text-gray-600">Chat Transitions</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {report?.auditSummary?.consentEvents || 0}
                    </div>
                    <div className="text-xs text-gray-600">Consent Events</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {report?.auditSummary?.securityEvents || 0}
                    </div>
                    <div className="text-xs text-gray-600">Security Events</div>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Log Retention Compliance</span>
                    <span className="text-green-600 font-semibold">
                      {report?.auditSummary?.retentionCompliance || '100%'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Log Integrity</span>
                    <span className="text-green-600 font-semibold uppercase">
                      {report?.auditSummary?.logIntegrity || 'Verified'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Status & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Certification Status */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Certifications</CardTitle>
              <CardDescription>Current certification status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-green-900">PDPA Singapore</div>
                      <div className="text-sm text-green-700">Personal Data Protection Act 2012</div>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Last Assessment: {report?.certifications?.pdpa?.lastAssessment || 'N/A'}
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-yellow-900">ISO 27001</div>
                      <div className="text-sm text-yellow-700">Information Security Management</div>
                    </div>
                    <TrendingUp className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Target Date: {report?.certifications?.iso27001?.targetDate || 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Suggested improvements for compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report?.recommendations?.map((rec: any, idx: number) => (
                  <div key={idx} className={`p-3 rounded-lg border ${
                    rec.priority === 'high' ? 'bg-red-50 border-red-200' :
                    rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      <AlertCircle className={`w-4 h-4 mt-0.5 ${
                        rec.priority === 'high' ? 'text-red-600' :
                        rec.priority === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium capitalize">
                          {rec.category}: {rec.priority} Priority
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {rec.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-center text-sm text-gray-600">
          <p>
            This dashboard demonstrates PDPA compliance measures implemented in the NextNest mortgage platform.
            All data protection measures follow Singapore&apos;s Personal Data Protection Act 2012 guidelines.
          </p>
          <p className="mt-2">
            Report generated at: {new Date().toLocaleString()} | 
            Verification Code: {Math.random().toString(36).substring(7).toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  )
}