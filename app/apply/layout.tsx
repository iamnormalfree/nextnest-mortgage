import { LoanApplicationProvider } from '@/lib/hooks/useLoanApplicationContext'

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LoanApplicationProvider>
      {children}
    </LoanApplicationProvider>
  )
}