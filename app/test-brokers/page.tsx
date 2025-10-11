'use client';

import { useState, useEffect } from 'react';
import BrokerProfile from '@/components/chat/BrokerProfile';
import { BROKER_INFO, getBrokerByScore } from '@/lib/utils/broker-utils';

export default function TestBrokersPage() {
  const [mounted, setMounted] = useState(false);
  const brokers = Object.values(BROKER_INFO);
  
  // Test different lead scores
  const testScores = [95, 85, 75, 65, 45, 30];
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">AI Broker Profiles Test</h1>
      
      {/* Display all brokers */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">All 5 AI Brokers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brokers.map(broker => (
            <div key={broker.slug}>
              <BrokerProfile 
                brokerName={broker.name}
                brokerPhoto={broker.photo}
                brokerRole={broker.role}
                brokerPersonality={broker.personality}
                isOnline={true}
              />
              <div className="ml-4 text-sm text-gray-600">
                <p>Personality: {broker.personality}</p>
                <p>Color: <span style={{ color: broker.color }}>●</span> {broker.color}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Test typing states */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Typing States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg mb-2">Michelle Chen (Typing)</h3>
            <BrokerProfile 
              brokerName="Michelle Chen"
              isTyping={true}
              isOnline={true}
            />
          </div>
          <div>
            <h3 className="text-lg mb-2">Sarah Wong (Online)</h3>
            <BrokerProfile 
              brokerName="Sarah Wong"
              isTyping={false}
              isOnline={true}
            />
          </div>
        </div>
      </section>
      
      {/* Test broker assignment by score */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Broker Assignment by Lead Score</h2>
        <div className="space-y-4">
          {testScores.map(score => {
            const assignedBroker = getBrokerByScore(score);
            return (
              <div key={score} className="border rounded-lg p-4">
                <h3 className="text-lg mb-2">Lead Score: {score}/100</h3>
                <BrokerProfile 
                  brokerName={assignedBroker.name}
                  brokerPhoto={assignedBroker.photo}
                  brokerRole={assignedBroker.role}
                  brokerPersonality={assignedBroker.personality}
                  isOnline={true}
                />
                <p className="text-sm text-gray-600 ml-4">
                  Assigned: {assignedBroker.name} ({assignedBroker.personality} personality)
                </p>
              </div>
            );
          })}
        </div>
      </section>
      
      {/* Instructions */}
      <section className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-3">Next Steps</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Replace SVG avatars with AI-generated photos from:
            <ul className="list-disc list-inside ml-6 mt-1">
              <li><a href="https://thispersondoesnotexist.com/" target="_blank" className="text-blue-600 hover:underline">This Person Does Not Exist</a></li>
              <li><a href="https://generated.photos/" target="_blank" className="text-blue-600 hover:underline">Generated Photos</a></li>
              <li><a href="https://www.bing.com/images/create" target="_blank" className="text-blue-600 hover:underline">Bing Image Creator</a></li>
            </ul>
          </li>
          <li>Test the form submission flow to verify broker assignment</li>
          <li>Check n8n workflow execution logs</li>
          <li>Verify Chatwoot conversation creation with custom attributes</li>
          <li>Test handoff triggers in live chat</li>
        </ol>
      </section>
    </div>
  );
}