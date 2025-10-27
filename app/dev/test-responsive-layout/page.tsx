// ABOUTME: Development test page for ResponsiveFormLayout visual verification

'use client'

import { ResponsiveFormLayout } from '@/components/forms/layout/ResponsiveFormLayout'

export default function TestResponsiveLayoutPage() {
  return (
    <ResponsiveFormLayout
      sidebar={
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Sidebar Content</h2>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-sm font-medium">Instant Analysis</p>
              <p className="text-xs text-gray-600 mt-1">This should be sticky on desktop</p>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <p className="text-sm font-medium">Affordability</p>
              <p className="text-xs text-gray-600 mt-1">Updates as you type</p>
            </div>
            <div className="p-3 bg-purple-50 rounded">
              <p className="text-sm font-medium">MAS Readiness</p>
              <p className="text-xs text-gray-600 mt-1">Scroll test content</p>
            </div>
            {/* Add more content to test scrolling */}
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="p-2 bg-gray-50 rounded">
                <p className="text-xs">Scroll test item {i + 1}</p>
              </div>
            ))}
          </div>
        </div>
      }
      showSidebar={true}
    >
      <div className="space-y-6 p-6 bg-white rounded-lg">
        <h1 className="text-2xl font-bold">Form Content Area</h1>

        <div className="space-y-4">
          <p className="text-gray-700">
            This is the main form content area. On mobile (&lt;768px), this should be full width with no sidebar.
          </p>

          <div className="p-4 bg-blue-50 rounded">
            <p className="font-medium">Mobile (&lt;768px):</p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>Single column</li>
              <li>No sidebar visible</li>
              <li>Full width content</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 rounded">
            <p className="font-medium">Tablet (768px - 1023px):</p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>Single column</li>
              <li>Sidebar hidden</li>
              <li>More padding</li>
            </ul>
          </div>

          <div className="p-4 bg-purple-50 rounded">
            <p className="font-medium">Desktop (≥1024px):</p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>Two-column grid</li>
              <li>Sidebar visible (380px width)</li>
              <li>Sidebar is sticky</li>
              <li>Content max-width 720px</li>
            </ul>
          </div>

          {/* Add more content to test scrolling */}
          {Array.from({ length: 15 }, (_, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded">
              <h3 className="font-semibold">Form Section {i + 1}</h3>
              <p className="text-sm text-gray-600 mt-2">
                Scroll down to test sidebar stickiness. The sidebar should stay visible at the top of the viewport on desktop.
              </p>
            </div>
          ))}
        </div>
      </div>
    </ResponsiveFormLayout>
  )
}
