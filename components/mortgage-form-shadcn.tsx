"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, Calculator, TrendingUp } from "lucide-react"

/**
 * Example showing shadcn/ui components with Bloomberg Terminal design
 * Uses existing shadcn components with Tailwind overrides
 */
export default function MortgageFormShadcn() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4">

        {/* Header with Badge */}
        <div className="text-center mb-12">
          <Badge className="bg-gold/10 text-gold border-0 mb-4">
            AI-POWERED ANALYSIS
          </Badge>
          <h1 className="text-4xl font-light text-ink mb-2">
            Mortgage Intelligence Platform
          </h1>
          <p className="text-lg text-charcoal">
            Analyzing <span className="font-mono font-medium">286</span> packages in real-time
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-silver uppercase mb-2">
            <span>Step 1 of 4</span>
            <span>25% Complete</span>
          </div>
          <Progress value={25} className="h-1" />
        </div>

        {/* Main Form Card */}
        <Card className="border-fog shadow-sm">
          <CardHeader className="border-b border-fog">
            <CardTitle className="text-2xl font-light">Loan Details</CardTitle>
            <CardDescription className="text-charcoal">
              Enter your current mortgage information for analysis
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Property Type */}
            <div className="space-y-2">
              <Label htmlFor="property-type">PROPERTY TYPE</Label>
              <Select>
                <SelectTrigger className="h-12 border-fog focus:border-gold">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hdb">HDB Flat</SelectItem>
                  <SelectItem value="condo">Private Condo</SelectItem>
                  <SelectItem value="landed">Landed Property</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Loan Amount */}
            <div className="space-y-2">
              <Label htmlFor="loan-amount">LOAN AMOUNT</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal">
                  $
                </span>
                <Input
                  id="loan-amount"
                  type="number"
                  placeholder="500,000"
                  className="h-12 pl-8 border-fog focus:border-gold font-mono"
                />
              </div>
            </div>

            {/* Current Rate */}
            <div className="space-y-2">
              <Label htmlFor="current-rate">CURRENT INTEREST RATE</Label>
              <div className="relative">
                <Input
                  id="current-rate"
                  type="number"
                  placeholder="2.6"
                  step="0.1"
                  className="h-12 pr-8 border-fog focus:border-gold font-mono"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal">
                  %
                </span>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="p-4 bg-mist text-center">
                <div className="text-xs text-silver mb-1">BEST RATE</div>
                <div className="text-2xl font-mono font-medium text-gold">1.35%</div>
              </div>
              <div className="p-4 bg-mist text-center">
                <div className="text-xs text-silver mb-1">MONTHLY SAVINGS</div>
                <div className="text-2xl font-mono font-medium text-ink">$480</div>
              </div>
              <div className="p-4 bg-mist text-center">
                <div className="text-xs text-silver mb-1">LIFETIME SAVINGS</div>
                <div className="text-2xl font-mono font-medium text-emerald">$34K</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6">
              <Button
                className="flex-1 h-12 bg-gold hover:bg-gold-dark text-ink hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Savings
              </Button>

              <Button
                variant="outline"
                className="flex-1 h-12 border-fog hover:bg-mist"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                View Trends
              </Button>
            </div>

            {/* Next Step */}
            <Button
              className="w-full h-12 bg-charcoal hover:bg-ink text-white group"
            >
              Continue to AI Analysis
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="flex justify-center gap-8 mt-8 text-xs text-silver uppercase">
          <span>🔒 Bank-Level Security</span>
          <span>PDPA Compliant</span>
          <span>MAS Licensed</span>
        </div>
      </div>
    </div>
  )
}