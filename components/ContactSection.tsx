'use client'

import { useState } from 'react'

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    loanAmount: '',
    propertyType: '',
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
      <section id="contact" className="py-16 bg-[#FAF9F8]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-xl shadow-lg border p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-gilda font-bold text-[#0D1B2A] mb-4">
                Thank you for your interest!
              </h3>
              <p className="text-gray-600 mb-6">
                We've received your information and one of our mortgage experts will contact you within 24 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-[#4A90E2] hover:text-[#3A80D2] font-medium"
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
    <section id="contact" className="py-16 bg-[#FAF9F8]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-gilda font-bold text-[#0D1B2A] mb-4">
            Get Your Free Mortgage Consultation
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tell us about your needs and we'll provide personalized recommendations within 24 hours.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                  placeholder="+65 9123 4567"
                />
              </div>

              <div>
                <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Amount *
                </label>
                <select
                  id="loanAmount"
                  name="loanAmount"
                  required
                  value={formData.loanAmount}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                >
                  <option value="">Select amount</option>
                  <option value="under-500k">Under $500K</option>
                  <option value="500k-1m">$500K - $1M</option>
                  <option value="1m-2m">$1M - $2M</option>
                  <option value="over-2m">Over $2M</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type *
                </label>
                <select
                  id="propertyType"
                  name="propertyType"
                  required
                  value={formData.propertyType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                >
                  <option value="">Select property type</option>
                  <option value="hdb">HDB</option>
                  <option value="private-condo">Private Condo</option>
                  <option value="landed">Landed Property</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                  placeholder="Tell us about your specific needs, timeline, or any questions you have..."
                />
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#4A90E2] hover:bg-[#3A80D2] disabled:bg-gray-400 text-white font-medium py-4 px-6 rounded-md transition"
              >
                {isSubmitting ? 'Submitting...' : 'Get Free Consultation'}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              By submitting this form, you agree to be contacted by our mortgage experts. We respect your privacy and will never share your information.
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}

export default ContactSection
