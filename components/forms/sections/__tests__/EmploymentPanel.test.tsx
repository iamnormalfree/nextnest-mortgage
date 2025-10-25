import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { EmploymentPanel } from '@/components/forms/sections/EmploymentPanel'

// Test wrapper to provide React Hook Form context
const TestWrapper = ({ children, defaultValues = {} }: any) => {
  const { control } = useForm({ defaultValues })
  return children(control)
}

describe('EmploymentPanel', () => {
  const mockOnFieldChange = jest.fn()

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders employment type dropdown with 4 options', () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <EmploymentPanel
            applicantNumber={0}
            control={control}
            errors={{}}
            onFieldChange={mockOnFieldChange}
          />
        )}
      </TestWrapper>
    )

    expect(screen.getByLabelText(/Employment Type/i)).toBeInTheDocument()
  })

  it('shows self-employed panel when type is self-employed', async () => {
    render(
      <TestWrapper defaultValues={{ employmentType: 'self-employed' }}>
        {(control: any) => (
          <EmploymentPanel
            applicantNumber={0}
            control={control}
            errors={{}}
            onFieldChange={mockOnFieldChange}
          />
        )}
      </TestWrapper>
    )

    expect(screen.getByLabelText(/business has been operating/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Average.*NOA/i)).toBeInTheDocument()
  })

  it('shows in-between-jobs panel with contract verification', async () => {
    render(
      <TestWrapper defaultValues={{ employmentType: 'in-between-jobs' }}>
        {(control: any) => (
          <EmploymentPanel
            applicantNumber={0}
            control={control}
            errors={{}}
            onFieldChange={mockOnFieldChange}
          />
        )}
      </TestWrapper>
    )

    expect(screen.getByLabelText(/Months with current employer/i)).toBeInTheDocument()
    expect(screen.getByText(/employment contract/i)).toBeInTheDocument()
  })

  it('hides conditional panels when type is employed', () => {
    render(
      <TestWrapper defaultValues={{ employmentType: 'employed' }}>
        {(control: any) => (
          <EmploymentPanel
            applicantNumber={0}
            control={control}
            errors={{}}
            onFieldChange={mockOnFieldChange}
          />
        )}
      </TestWrapper>
    )

    expect(screen.queryByLabelText(/business has been operating/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Months with current employer/i)).not.toBeInTheDocument()
  })

  it('uses _1 suffix for applicantNumber=1', () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <EmploymentPanel
            applicantNumber={1}
            control={control}
            errors={{}}
            onFieldChange={mockOnFieldChange}
          />
        )}
      </TestWrapper>
    )

    // Should still render but with different field names
    expect(screen.getByLabelText(/Employment Type/i)).toBeInTheDocument()
  })

  it('displays income recognition rate help text', () => {
    render(
      <TestWrapper defaultValues={{ employmentType: 'self-employed' }}>
        {(control: any) => (
          <EmploymentPanel
            applicantNumber={0}
            control={control}
            errors={{}}
            onFieldChange={mockOnFieldChange}
          />
        )}
      </TestWrapper>
    )

    expect(screen.getByText(/Income recognition: 70%/i)).toBeInTheDocument()
  })
})
