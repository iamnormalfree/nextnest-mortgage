'use client'

import { useState } from 'react'

const Dashboard = () => {
  const [loanAmount, setLoanAmount] = useState(500000)
  const [interestRate, setInterestRate] = useState(2.5)
  const [loanTerm, setLoanTerm] = useState(25)

  const calculateMonthlyPayment = () => {
    const monthlyRate = interestRate / 100 / 12
    const numPayments = loanTerm * 12
    const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1)
    return monthlyPayment
  }

  const monthlyPayment = calculateMonthlyPayment()
  const totalPayment = monthlyPayment * loanTerm * 12
  const totalInterest = totalPayment - loanAmount

  return (
    <div className="min-h-screen pt-24 pb-16 bg-nn-grey-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-gilda font-bold text-nn-grey-dark mb-4">
              Mortgage Calculator
            </h1>
            <p className="text-lg text-nn-grey-medium">
              Calculate your monthly payments and explore different scenarios
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calculator Inputs */}
            <div className="bg-white rounded-xl shadow-lg border p-8">
              <h2 className="text-2xl font-gilda font-semibold text-nn-grey-dark mb-6">
                Loan Details
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-nn-grey-dark mb-2">
                    Loan Amount: ${loanAmount.toLocaleString()}
                  </label>
                  <input
                    type="range"
                    min="100000"
                    max="3000000"
                    step="10000"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full h-2 bg-nn-grey-medium/30 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-nn-grey-medium mt-1">
                    <span>$100K</span>
                    <span>$3M</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-nn-grey-dark mb-2">
                    Interest Rate: {interestRate}%
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full h-2 bg-nn-grey-medium/30 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-nn-grey-medium mt-1">
                    <span>1%</span>
                    <span>6%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-nn-grey-dark mb-2">
                    Loan Term: {loanTerm} years
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="35"
                    step="1"
                    value={loanTerm}
                    onChange={(e) => setLoanTerm(Number(e.target.value))}
                    className="w-full h-2 bg-nn-grey-medium/30 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-nn-grey-medium mt-1">
                    <span>5 years</span>
                    <span>35 years</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-nn-grey-light rounded-lg">
                <h3 className="font-medium text-nn-grey-dark mb-2">Quick Scenarios</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setLoanAmount(400000)
                      setInterestRate(2.3)
                      setLoanTerm(25)
                    }}
                    className="text-sm bg-white hover:bg-nn-grey-light border border-nn-grey-medium/30 rounded px-3 py-2 transition"
                  >
                    HDB Flat
                  </button>
                  <button
                    onClick={() => {
                      setLoanAmount(800000)
                      setInterestRate(2.8)
                      setLoanTerm(30)
                    }}
                    className="text-sm bg-white hover:bg-nn-grey-light border border-nn-grey-medium/30 rounded px-3 py-2 transition"
                  >
                    Private Condo
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="bg-white rounded-xl shadow-lg border p-8">
              <h2 className="text-2xl font-gilda font-semibold text-nn-grey-dark mb-6">
                Payment Summary
              </h2>

              <div className="space-y-6">
                <div className="bg-nn-gradient-gold text-nn-grey-dark rounded-lg p-6">
                  <div className="text-center">
                    <div className="text-sm opacity-90 mb-1">Monthly Payment</div>
                    <div className="text-3xl font-gilda font-bold">
                      ${monthlyPayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-nn-grey-light rounded-lg p-4">
                    <div className="text-sm text-nn-grey-medium mb-1">Total Payment</div>
                    <div className="text-xl font-semibold text-nn-grey-dark">
                      ${totalPayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="bg-nn-grey-light rounded-lg p-4">
                    <div className="text-sm text-nn-grey-medium mb-1">Total Interest</div>
                    <div className="text-xl font-semibold text-nn-grey-dark">
                      ${totalInterest.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>

                <div className="border-t border-nn-grey-medium/30 pt-6">
                  <h3 className="font-medium text-nn-grey-dark mb-4">Payment Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-nn-grey-medium">Principal</span>
                      <span className="font-medium">${loanAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nn-grey-medium">Interest ({interestRate}%)</span>
                      <span className="font-medium">${totalInterest.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Total</span>
                      <span className="font-bold">${totalPayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <a
                  href="#contact"
                  className="btn-primary w-full rounded-md transition text-center block"
                >
                  Get Better Rates
                </a>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-12 bg-white rounded-xl shadow-lg border p-8">
            <h2 className="text-2xl font-gilda font-semibold text-nn-grey-dark mb-6">
              Why Choose NextNest?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-gilda font-bold text-nn-gold mb-2">15+</div>
                <div className="text-sm text-nn-grey-medium">Banks Compared</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-gilda font-bold text-nn-gold mb-2">24h</div>
                <div className="text-sm text-nn-grey-medium">Pre-approval Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-gilda font-bold text-nn-gold mb-2">1.5%</div>
                <div className="text-sm text-nn-grey-medium">Average Savings</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
