'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  Lock, 
  CheckCircle, 
  FileText,
  Eye,
  Database,
  Key,
  Users,
  AlertTriangle,
  Download
} from 'lucide-react'

export default function PDPADocumentation() {
  const [activeSection, setActiveSection] = useState('overview')

  const sections = {
    overview: 'Overview',
    measures: 'Technical Measures',
    rights: 'User Rights',
    processes: 'Our Processes',
    audit: 'Audit & Compliance'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center gap-4 mb-4">
            <Shield className="w-12 h-12" />
            <div>
              <h1 className="text-4xl font-bold">PDPA Compliance</h1>
              <p className="text-xl mt-2 text-blue-100">
                Personal Data Protection Act - Our Commitment to Your Privacy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex gap-8 py-4">
            {Object.entries(sections).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`pb-2 border-b-2 transition-colors ${
                  activeSection === key 
                    ? 'border-blue-600 text-blue-600 font-semibold' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {activeSection === 'overview' && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Our PDPA Compliance Framework</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p className="text-gray-600 mb-6">
                  NextNest is fully committed to protecting your personal data in accordance with Singapore&apos;s
                  Personal Data Protection Act 2012 (PDPA). Our comprehensive framework ensures your data is 
                  handled with the highest standards of security and privacy.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-2">96.5%</div>
                    <div className="text-sm text-gray-600">Overall Compliance Score</div>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
                    <div className="text-sm text-gray-600">Data Encryption Coverage</div>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
                    <div className="text-sm text-gray-600">Data Breaches</div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-4">Key Compliance Principles</h3>
                <div className="space-y-4">
                  {[
                    {
                      icon: CheckCircle,
                      title: 'Consent',
                      description: 'We obtain clear, voluntary consent before collecting any personal data'
                    },
                    {
                      icon: Eye,
                      title: 'Purpose Limitation',
                      description: 'Data is only used for mortgage processing and related services as disclosed'
                    },
                    {
                      icon: Database,
                      title: 'Data Minimization',
                      description: 'We only collect data that is necessary for providing our services'
                    },
                    {
                      icon: Lock,
                      title: 'Security',
                      description: 'Industry-standard encryption and security measures protect your data'
                    },
                    {
                      icon: Users,
                      title: 'Access Rights',
                      description: 'You can access, correct, or delete your personal data at any time'
                    },
                    {
                      icon: FileText,
                      title: 'Accountability',
                      description: 'Complete audit trails and regular compliance assessments'
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <item.icon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                      <div>
                        <div className="font-semibold text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-600">{item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'measures' && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Technical Security Measures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-blue-600" />
                      Data Encryption
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                        <span>256-bit AES encryption for all data at rest</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                        <span>TLS 1.3 for all data in transit</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                        <span>End-to-end encryption for sensitive communications</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      PII Protection
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                        <span>Automatic detection and redaction of NRIC, passport, and financial account numbers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                        <span>Data sanitization before any external transmission</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                        <span>Field-level encryption for sensitive data elements</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-600" />
                      Security Controls
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-semibold text-gray-900">SQL Injection Protection</div>
                          <div className="text-gray-600">Parameterized queries, input validation</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">XSS Prevention</div>
                          <div className="text-gray-600">Content Security Policy, output encoding</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Rate Limiting</div>
                          <div className="text-gray-600">API throttling, DDoS protection</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Access Control</div>
                          <div className="text-gray-600">Role-based permissions, MFA</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'rights' && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Your Rights Under PDPA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    {
                      icon: Eye,
                      title: 'Right to Access',
                      description: 'Request a copy of all personal data we hold about you',
                      action: 'Request takes 24 hours to process',
                      color: 'blue'
                    },
                    {
                      icon: FileText,
                      title: 'Right to Correction',
                      description: 'Update or correct any inaccurate personal data',
                      action: 'Updates processed within 12 hours',
                      color: 'green'
                    },
                    {
                      icon: AlertTriangle,
                      title: 'Right to Deletion',
                      description: 'Request complete deletion of your personal data',
                      action: 'Deletion completed within 48 hours',
                      color: 'orange'
                    },
                    {
                      icon: Download,
                      title: 'Right to Data Portability',
                      description: 'Receive your data in a structured, machine-readable format',
                      action: 'Export available in JSON/CSV formats',
                      color: 'purple'
                    },
                    {
                      icon: Lock,
                      title: 'Right to Withdraw Consent',
                      description: 'Withdraw consent for data processing at any time',
                      action: 'Immediate effect upon withdrawal',
                      color: 'red'
                    }
                  ].map((right, idx) => (
                    <div key={idx} className={`border rounded-lg p-6 bg-${right.color}-50 border-${right.color}-200`}>
                      <div className="flex items-start gap-4">
                        <right.icon className={`w-8 h-8 text-${right.color}-600 flex-shrink-0`} />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{right.title}</h3>
                          <p className="text-gray-600 mb-3">{right.description}</p>
                          <div className={`inline-block px-3 py-1 bg-${right.color}-100 text-${right.color}-700 rounded-full text-sm font-medium`}>
                            {right.action}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">How to Exercise Your Rights</h3>
                  <div className="space-y-2 text-gray-600">
                    <p>To exercise any of your rights under PDPA:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Email us at dpo@nextnest.sg with your request</li>
                      <li>Include your account details for verification</li>
                      <li>Specify which right you wish to exercise</li>
                      <li>We will respond within the timeframes stated above</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'processes' && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Our Data Protection Processes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Data Collection & Processing</h3>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                          1
                        </div>
                        <div>
                          <div className="font-semibold">Consent Collection</div>
                          <div className="text-sm text-gray-600">
                            Explicit consent obtained before any data collection with clear purpose statement
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                          2
                        </div>
                        <div>
                          <div className="font-semibold">Data Sanitization</div>
                          <div className="text-sm text-gray-600">
                            All input data sanitized for security threats and PII detection
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                          3
                        </div>
                        <div>
                          <div className="font-semibold">Secure Processing</div>
                          <div className="text-sm text-gray-600">
                            Encrypted processing with complete audit trail
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                          4
                        </div>
                        <div>
                          <div className="font-semibold">Retention & Deletion</div>
                          <div className="text-sm text-gray-600">
                            Automatic deletion after 90 days unless legitimate business need
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Data Breach Response Plan</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-red-700 font-semibold">
                          <AlertTriangle className="w-5 h-5" />
                          In Case of Data Breach
                        </div>
                        <ul className="space-y-2 text-sm text-gray-700">
                          <li className="flex items-start gap-2">
                            <span className="font-semibold">Within 1 hour:</span>
                            <span>Incident containment and initial assessment</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold">Within 24 hours:</span>
                            <span>Notify affected individuals if high risk</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold">Within 72 hours:</span>
                            <span>Report to PDPC if required under PDPA</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold">Within 7 days:</span>
                            <span>Complete incident report and remediation plan</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'audit' && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Audit & Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">What We Track</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Form Submissions', desc: 'Every form submission logged with sanitized data' },
                        { label: 'Consent Events', desc: 'All consent given/withdrawn actions tracked' },
                        { label: 'Data Access', desc: 'Every data access request logged with purpose' },
                        { label: 'Security Events', desc: 'Suspicious activities and threats blocked' },
                        { label: 'User Rights', desc: 'All PDPA rights requests and fulfillment' },
                        { label: 'API Calls', desc: 'External data transfers with encryption status' }
                      ].map((item, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                          <div className="font-semibold text-gray-900">{item.label}</div>
                          <div className="text-sm text-gray-600 mt-1">{item.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Compliance Reporting</h3>
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="font-semibold text-gray-900">Monthly Compliance Report</div>
                          <div className="text-sm text-gray-600">Comprehensive PDPA compliance metrics</div>
                        </div>
                        <Button className="flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          Download Sample
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">15,420</div>
                          <div className="text-xs text-gray-600">Events Logged</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">100%</div>
                          <div className="text-xs text-gray-600">Audit Coverage</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">90 days</div>
                          <div className="text-xs text-gray-600">Log Retention</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Regular Assessments</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-semibold">Internal PDPA Audit</div>
                          <div className="text-sm text-gray-600">Monthly self-assessment</div>
                        </div>
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div>
                          <div className="font-semibold">External Compliance Review</div>
                          <div className="text-sm text-gray-600">Quarterly third-party assessment</div>
                        </div>
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                        <div>
                          <div className="font-semibold">Penetration Testing</div>
                          <div className="text-sm text-gray-600">Annual security assessment</div>
                        </div>
                        <CheckCircle className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              <strong>Data Protection Officer:</strong> dpo@nextnest.sg | +65 8334 1445
            </p>
            <p>
              This documentation is updated regularly to reflect our current PDPA compliance measures.
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}