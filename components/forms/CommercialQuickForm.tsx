'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'

interface CommercialQuickFormProps {
  sessionId: string
  className?: string
}

type Purpose = 'new_purchase' | 'refinancing'

export default function CommercialQuickForm({ sessionId, className = '' }: CommercialQuickFormProps) {
  const [purpose, setPurpose] = useState<Purpose>('new_purchase')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [uen, setUen] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedRef, setSubmittedRef] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Simple validators (align with API expectations)
  const validate = () => {
    if (!name || name.trim().length < 2) return 'Please enter your full name'
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email'
    if (!phone || !/^[689]\d{7}$/.test(phone)) return 'Enter a valid Singapore phone (8 digits starting with 6, 8 or 9)'
    if (!uen || !/^[0-9]{9}[A-Z]$/.test(uen.toUpperCase())) return 'Enter a valid UEN (e.g., 201234567A)'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const v = validate()
    if (v) {
      setError(v)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/forms/commercial-broker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          uen: uen.toUpperCase().trim(),
          commercialLoanType: purpose,
          sessionId,
          timestamp: new Date().toISOString(),
          directToBroker: true,
        })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Submission failed')
      }

      const data = await res.json()
      setSubmittedRef(data.referenceId || 'COM-REF')
    } catch (err: any) {
      setError(err?.message || 'Failed to submit form')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submittedRef) {
    return (
      <div className={`bg-white border border-fog p-6 ${className}`}>
        <div className="text-ink text-lg font-semibold">Submission received</div>
        <div className="text-sm text-graphite mt-1">Our commercial mortgage specialist will contact you within 24 hours.</div>
        <div className="text-xs text-silver mt-3">Reference ID: {submittedRef}</div>
      </div>
    )
  }

  return (
    <div className={`bg-white border border-fog p-6 ${className}`}>
      {/* Purpose selector */}
      <div className="mb-4">
        <div className="text-xs font-medium text-charcoal mb-2">Loan purpose</div>
        <SegmentedControl
          size="md"
          value={purpose}
          onValueChange={(value) => setPurpose(value as Purpose)}
          options={[
            { value: 'new_purchase', label: 'New purchase' },
            { value: 'refinancing', label: 'Refinance' }
          ]}
          className="w-full md:max-w-md"
        />
        <p className="mt-2 text-xs leading-snug text-silver">
          Select the outcome you need so our broker prep stays targeted while desktop spacing remains intact.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name */}
        <div>
          <label className="block text-xs text-graphite mb-1">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="md:h-10" placeholder="Your full name" />
        </div>
        {/* Email */}
        <div>
          <label className="block text-xs text-graphite mb-1">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="md:h-10" placeholder="you@example.com" />
        </div>
        {/* Phone */}
        <div>
          <label className="block text-xs text-graphite mb-1">Phone</label>
          <Input inputMode="numeric" maxLength={8} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} className="md:h-10" placeholder="91234567" />
        </div>
        {/* UEN */}
        <div>
          <label className="block text-xs text-graphite mb-1">Company UEN</label>
          <Input value={uen} onChange={(e) => setUen(e.target.value.toUpperCase())} className="md:h-10" placeholder="201234567A" />
          <div className="text-xs text-silver mt-1">Format: 9 digits followed by a capital letter</div>
        </div>

        {error && (
          <div className="text-xs text-ruby">{error}</div>
        )}

        <Button type="submit" disabled={isSubmitting} className={`w-full md:h-10 ${!isSubmitting ? 'bg-gold text-ink hover:bg-gold-dark' : ''}`}>
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="text-sm">Submitting...</span>
            </span>
          ) : (
            'Submit for broker consultation'
          )}
        </Button>
      </form>

      <div className="mt-4 text-xs text-graphite">
        Direct to human broker. No AI processing for commercial loans.
      </div>
    </div>
  )
}
