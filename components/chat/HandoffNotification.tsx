import { AlertCircle, UserCheck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface HandoffNotificationProps {
  reason?: string
  urgencyLevel?: 'normal' | 'medium' | 'high' | 'urgent'
}

export default function HandoffNotification({ 
  reason = 'Your query requires specialized attention',
  urgencyLevel = 'normal'
}: HandoffNotificationProps) {
  const getUrgencyColor = () => {
    switch (urgencyLevel) {
      case 'urgent':
      case 'high':
        return 'border-ruby bg-ruby/10'
      case 'medium':
        return 'border-gold bg-gold/10'
      default:
        return 'border-fog bg-mist'
    }
  }

  const getUrgencyText = () => {
    switch (urgencyLevel) {
      case 'urgent':
        return 'Connecting you immediately...'
      case 'high':
        return 'Prioritizing your request...'
      case 'medium':
        return 'Transferring to specialist...'
      default:
        return 'Connecting you to an expert...'
    }
  }

  return (
    <Alert className={`mb-4 ${getUrgencyColor()}`}>
      <UserCheck className="h-4 w-4" />
      <AlertTitle className="font-semibold">
        {getUrgencyText()}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm">{reason}</p>
        <p className="text-xs mt-2 opacity-75">
          A human specialist will join this conversation shortly.
        </p>
      </AlertDescription>
    </Alert>
  )
}