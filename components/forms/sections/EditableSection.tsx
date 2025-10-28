// ABOUTME: Reusable collapsible section wrapper for employment forms with visual completion states

'use client'

export interface EditableSectionProps {
  title: string
  isExpanded: boolean
  isComplete: boolean
  onEdit: () => void
  summaryText: string
  children: React.ReactNode
}

export function EditableSection({
  title,
  isExpanded,
  isComplete,
  onEdit,
  summaryText,
  children
}: EditableSectionProps) {
  if (isExpanded) {
    return (
      <div className="space-y-4 p-4 border border-[#E5E5E5] bg-white rounded">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-black">{title}</h3>
          <button
            type="button"
            onClick={onEdit}
            className="text-sm text-[#666666] hover:text-black underline"
          >
            Done
          </button>
        </div>
        {children}
      </div>
    )
  }

  return (
    <div
      className={`p-4 border rounded flex justify-between items-center ${
        !isComplete
          ? 'border-[#FCD34D] bg-[#FFFBEB]'
          : 'border-[#10B981] bg-[#F0FDF4]'
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-black">{title}</p>
          {!isComplete && (
            <span className="text-xs font-normal text-[#92400E] bg-[#FCD34D] px-2 py-0.5 rounded">
              Required
            </span>
          )}
          {isComplete && (
            <span className="text-[#10B981]" aria-label="Complete">
              ✓
            </span>
          )}
        </div>
        <p className="text-xs text-[#666666] mt-1">{summaryText}</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-sm text-[#666666] hover:text-black underline"
        aria-label={`Edit ${title}`}
      >
        {isComplete ? 'Edit' : 'Complete'}
      </button>
    </div>
  )
}
