'use client'

import React, { useState } from 'react'
import { Building2, AlertCircle, CheckCircle } from 'lucide-react'

interface CommercialFormData {
  name: string
  email: string
  phone: string
  uen: string
  commercialLoanType: 'new_purchase' | 'refinancing'
}

interface CommercialQuickFormProps {
  onSubmit: (data: CommercialFormData) => void
  className?: string
}

export default function CommercialQuickForm({ onSubmit, className }: CommercialQuickFormProps) {
  const [formData, setFormData] = useState<CommercialFormData>({
    name: '',
    email: '',
    phone: '',
    uen: '',
    commercialLoanType: 'new_purchase'
  })
  
  const [errors, setErrors] = useState<Partial<Record<keyof CommercialFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const validateField = (name: keyof CommercialFormData, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required'
        if (value.length < 2) return 'Name must be at least 2 characters'
        break
      case 'email':
        if (!value.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format'
        break
      case 'phone':
        if (!value.trim()) return 'Phone number is required'
        if (!/^[689]\d{7}$/.test(value.replace(/\s/g, ''))) return 'Enter a valid Singapore phone number'
        break
      case 'uen':
        if (!value.trim()) return 'Company UEN is required'
        if (!/^[0-9]{9}[A-Z]$/.test(value.toUpperCase())) return 'Invalid UEN format (e.g., 201234567A)'
        break
    }
    return undefined
  }

  const handleChange = (field: keyof CommercialFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    const newErrors: Partial<Record<keyof CommercialFormData, string>> = {}
    let hasErrors = false
    
    Object.keys(formData).forEach((key) => {
      if (key !== 'commercialLoanType') {
        const error = validateField(key as keyof CommercialFormData, formData[key as keyof CommercialFormData])
        if (error) {
          newErrors[key as keyof CommercialFormData] = error
          hasErrors = true
        }
      }
    })
    
    if (hasErrors) {
      setErrors(newErrors)
      return
    }
    
    setIsSubmitting(true)
    
    // Format UEN to uppercase
    const submitData = {
      ...formData,
      uen: formData.uen.toUpperCase()
    }
    
    // Simulate submission
    setTimeout(() => {
      onSubmit(submitData)
      setSubmitted(true)
      setIsSubmitting(false)
    }, 1000)
  }

  if (submitted) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-8 ${className}`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-gilda text-[#0D1B2A]">Submission Received!</h3>
          <p className="text-gray-600">
            Our commercial property specialist will contact you within 24 hours to discuss your financing needs.
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-purple-800">
              <span className="font-semibold">Direct Broker Line:</span> Your inquiry has been routed directly to our commercial lending expert for immediate attention.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-8 ${className}`}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-100 rounded-full">
            <Building2 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-gilda text-[#0D1B2A]">Commercial Property Financing</h2>
            <p className="text-sm text-gray-600">Quick form for immediate broker consultation</p>
          </div>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Commercial loans require specialized assessment. Complete these 5 fields for direct broker assistance.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Commercial Loan Type Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loan Purpose <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.commercialLoanType}
            onChange={(e) => handleChange('commercialLoanType', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="new_purchase">New Purchase</option>
            <option value="refinancing">Refinancing</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {formData.commercialLoanType === 'new_purchase' 
              ? 'Purchasing commercial property for business or investment'
              : 'Refinancing existing commercial property loan'}
          </p>
        </div>

        {/* Contact Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Business Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="company@example.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Contact Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="9123 4567"
            maxLength={8}
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Company UEN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company UEN <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.uen}
            onChange={(e) => handleChange('uen', e.target.value.toUpperCase())}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
              errors.uen ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="201234567A"
            maxLength={10}
          />
          {errors.uen && (
            <p className="text-red-500 text-sm mt-1">{errors.uen}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Singapore Unique Entity Number for verification
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-4 px-6 rounded-lg font-medium transition-all ${
            isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </span>
          ) : (
            'Submit for Broker Consultation'
          )}
        </button>

        {/* Trust Signals */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Direct to Broker
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            24-Hour Response
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
            </svg>
            Specialized Service
          </div>
        </div>
      </form>
    </div>
  )
}