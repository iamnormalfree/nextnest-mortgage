import React from 'react';
import Image from 'next/image';
import { getBrokerInfo } from '@/lib/utils/broker-utils';

interface BrokerProfileProps {
  brokerName?: string;
  brokerPhoto?: string;
  brokerRole?: string;
  brokerPersonality?: string;
  isTyping?: boolean;
  isOnline?: boolean;
}

export default function BrokerProfile({ 
  brokerName = "AI Assistant",
  brokerPhoto,
  brokerRole,
  brokerPersonality,
  isTyping = false,
  isOnline = true
}: BrokerProfileProps) {
  
  // Get broker info
  const brokerInfo = getBrokerInfo(brokerName);
  const displayPhoto = brokerPhoto || brokerInfo.photo;
  const displayRole = brokerRole || brokerInfo.role;

  return (
    <div className="flex items-center gap-3 p-4 bg-mist shadow-sm mb-3 border border-fog">
      <div className="relative">
        <Image
          src={displayPhoto}
          alt={brokerName}
          width={56}
          height={56}
          className="object-cover border-2 border-white shadow-md"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald border-2 border-white" />
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-ink">{brokerName}</h4>
          {isTyping && (
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-gold opacity-30 transition-opacity duration-200" />
              <span className="w-1.5 h-1.5 bg-gold opacity-60 transition-opacity duration-200" />
              <span className="w-1.5 h-1.5 bg-gold opacity-100 transition-opacity duration-200" />
            </div>
          )}
        </div>
        <p className="text-xs text-graphite">{displayRole}</p>
        {isTyping && (
          <p className="text-xs text-gold mt-1 italic">typing...</p>
        )}
      </div>
    </div>
  );
}