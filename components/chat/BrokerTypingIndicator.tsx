import React from 'react';

interface BrokerTypingIndicatorProps {
  brokerName?: string;
  message?: string;
  variant?: 'simple' | 'detailed';
}

/**
 * BrokerTypingIndicator Component
 * Shows a typing indicator with customizable message for broker activity
 * Supports both simple dots and detailed status messages
 */
export default function BrokerTypingIndicator({
  brokerName = 'Agent',
  message,
  variant = 'simple'
}: BrokerTypingIndicatorProps) {
  const [dotCount, setDotCount] = React.useState(0);

  // Animate dots for typing effect
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 400);

    return () => clearInterval(interval);
  }, []);

  if (variant === 'detailed' && message) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-mist/70 border-l-2 border-gold animate-pulse">
        {/* Animated dots */}
        <div className="flex gap-1">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`w-2 h-2 bg-gold transition-all duration-300 ${
                index <= dotCount ? 'opacity-100 scale-100' : 'opacity-30 scale-75'
              }`}
            />
          ))}
        </div>
        {/* Custom message */}
        <span className="text-sm text-graphite">
          {message}
        </span>
      </div>
    );
  }

  // Simple variant (default)
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-graphite">{brokerName} is typing</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`w-2 h-2 bg-gold rounded-full transition-all duration-200 ${
              index <= dotCount ? 'opacity-100' : 'opacity-30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}