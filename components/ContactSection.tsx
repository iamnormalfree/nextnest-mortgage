'use client'

import { useState } from 'react'

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    loanAmount: '',
    propertyType: '',
    currentBank: '',
    timeline: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitted(true)
        setFormData({
          name: '',
          email: '',
          phone: '',
          loanAmount: '',
          propertyType: '',
          currentBank: '',
          timeline: '',
          message: ''
        })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <section id="contact" className="py-16 bg-nn-grey-light">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-gilda font-normal text-nn-grey-dark mb-4">
                Thank you for your interest!
              </h3>
              <p className="text-nn-grey-medium mb-6 font-inter">
                We&apos;ve received your information and will provide your complete mortgage analysis within 48 hours. We&apos;ll show you all options transparently.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-nn-gold hover:text-nn-gold font-medium font-inter"
              >
                Submit another inquiry
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="contact" className="py-16 bg-nn-grey-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-gilda font-normal text-nn-grey-dark mb-4">
            Get Your Complete Mortgage Analysis - Free
          </h2>
          <p className="text-lg text-nn-grey-medium max-w-2xl mx-auto font-inter">
            Tell us about your situation and we&apos;ll show you ALL your options - including repricing and staying put - within 48 hours.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-nn-grey-dark mb-2 font-inter">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input w-full"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-nn-grey-dark mb-2 font-inter">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input w-full"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-nn-grey-dark mb-2 font-inter">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input w-full"
                  placeholder="+65 9123 4567"
                />
              </div>

              <div>
                <label htmlFor="loanAmount" className="block text-sm font-medium text-nn-grey-dark mb-2 font-inter">
                  Loan Amount *
                </label>
                <select
                  id="loanAmount"
                  name="loanAmount"
                  required
                  value={formData.loanAmount}
                  onChange={handleChange}
                  className="form-input w-full"
                >
                  <option value="">Select amount</option>
                  <option value="under-500k">Under $500K</option>
                  <option value="500k-1m">$500K - $1M</option>
                  <option value="1m-2m">$1M - $2M</option>
                  <option value="over-2m">Over $2M</option>
                </select>
              </div>

              <div>
                <label htmlFor="propertyType" className="block text-sm font-medium text-nn-grey-dark mb-2 font-inter">
                  Property Type *
                </label>
                <select
                  id="propertyType"
                  name="propertyType"
                  required
                  value={formData.propertyType}
                  onChange={handleChange}
                  className="form-input w-full"
                >
                  <option value="">Select property type</option>
                  <option value="hdb">HDB</option>
                  <option value="private-condo">Private Condo</option>
                  <option value="landed">Landed Property</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              <div>
                <label htmlFor="currentBank" className="block text-sm font-medium text-nn-grey-dark mb-2 font-inter">
                  Current Bank
                </label>
                <select
                  id="currentBank"
                  name="currentBank"
                  value={formData.currentBank}
                  onChange={handleChange}
                  className="form-input w-full"
                >
                  <option value="">Select current bank</option>
                  <option value="dbs">DBS/POSB</option>
                  <option value="ocbc">OCBC</option>
                  <option value="uob">UOB</option>
                  <option value="maybank">Maybank</option>
                  <option value="cimb">CIMB</option>
                  <option value="hsbc">HSBC</option>
                  <option value="sc">Standard Chartered</option>
                  <option value="other">Other</option>
                  <option value="new-purchase">New Purchase</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="timeline" className="block text-sm font-medium text-nn-grey-dark mb-2 font-inter">
                  Timeline
                </label>
                <select
                  id="timeline"
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleChange}
                  className="form-input w-full"
                >
                  <option value="">Select timeline</option>
                  <option value="urgent">Urgent (within 2 weeks)</option>
                  <option value="soon">Soon (within 1 month)</option>
                  <option value="planning">Planning (1-3 months)</option>
                  <option value="exploring">Just exploring options</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="message" className="block text-sm font-medium text-nn-grey-dark mb-2 font-inter">
                  Additional Information
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className="form-input w-full resize-none"
                  placeholder="Tell us about your specific needs, timeline, or any questions you have..."
                />
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
{isSubmitting ? 'Submitting...' : 'Get Complete Mortgage Analysis - Free'}
              </button>
            </div>

            <p className="text-xs text-nn-grey-medium mt-4 text-center font-inter">
              We earn referral fees from banks you choose to switch to, but nothing if you reprice or stay put. We&apos;ll be transparent about all options. By submitting, you agree to be contacted.
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}

export default ContactSection
