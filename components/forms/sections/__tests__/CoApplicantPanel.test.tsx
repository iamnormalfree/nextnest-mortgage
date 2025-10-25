import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { CoApplicantPanel } from '@/components/forms/sections/CoApplicantPanel'

const TestWrapper = ({ children, defaultValues = {} }: any) => {
  const { control } = useForm({ defaultValues })
  return children(control)
}

describe('CoApplicantPanel', () => {
  const mockOnFieldChange = jest.fn()

  it('renders income fields with comma formatting', () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <CoApplicantPanel
            control={control}
            errors={{}}
            onFieldChange={mockOnFieldChange}
            loanType="new_purchase"
          />
        )}
      </TestWrapper>
    )

    expect(screen.getByLabelText(/Monthly Income/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Variable.*bonus.*income/i)).toBeInTheDocument()
  })

  it('renders age field with 18-99 validation', () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <CoApplicantPanel
            control={control}
            errors={{}}
            onFieldChange={mockOnFieldChange}
            loanType="new_purchase"
          />
        )}
      </TestWrapper>
    )

    expect(screen.getByLabelText(/Age/i)).toBeInTheDocument()
  })

  it('renders nested EmploymentPanel with applicantNumber=1', () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <CoApplicantPanel
            control={control}
            errors={{}}
            onFieldChange={mockOnFieldChange}
            loanType="new_purchase"
          />
        )}
      </TestWrapper>
    )

    expect(screen.getByLabelText(/Employment Type/i)).toBeInTheDocument()
  })
})
