'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Conversation {
  id: number
  status: string
  contactName: string
  contactEmail: string
  brokerName: string
  brokerId: string | null
  messageCount: number
  lastMessageAt: number
  lastMessageContent: string
  leadScore: number | null
  createdAt: number
}

interface Message {
  id: number
  content: string
  messageType: number
  createdAt: number
  sender: {
    type: string
    name: string
    email: string
  }
  private: boolean
  contentType: string
}

interface ConversationDetails {
  id: number
  status: string
  contactName: string
  contactEmail: string
  contactPhone: string
  brokerName: string
  brokerId: string | null
  messageCount: number
  leadScore: number | null
  createdAt: number
  lastActivityAt: number
  inboxId: number
  customAttributes: any
  messages: Message[]
}

export default function ConversationMonitoringPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch conversations list
  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/test-conversations')
      const data = await response.json()

      if (data.success) {
        setConversations(data.conversations)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch conversations')
      }
    } catch (err) {
      setError('Network error fetching conversations')
      console.error('Error fetching conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch conversation details
  const fetchConversationDetails = async (id: number) => {
    setDetailsLoading(true)
    try {
      const response = await fetch(`/api/test-conversations?id=${id}`)
      const data = await response.json()

      if (data.success) {
        setSelectedConversation(data.conversation)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch conversation details')
      }
    } catch (err) {
      setError('Network error fetching conversation details')
      console.error('Error fetching conversation details:', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchConversations()
  }, [])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchConversations()
      if (selectedConversation) {
        fetchConversationDetails(selectedConversation.id)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [autoRefresh, selectedConversation])

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return 'N/A'
    const date = new Date(timestamp * 1000)
    return date.toLocaleString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-emerald text-white'
      case 'pending': return 'bg-gold text-ink'
      case 'resolved': return 'bg-graphite text-white'
      case 'bot': return 'bg-gold-pale text-ink'
      default: return 'bg-fog text-charcoal'
    }
  }

  const getMessageTypeLabel = (type: number) => {
    switch (type) {
      case 0: return 'Incoming'
      case 1: return 'Outgoing'
      case 2: return 'Activity'
      default: return 'Unknown'
    }
  }

  const getSenderColor = (senderType: string) => {
    switch (senderType) {
      case 'contact': return 'bg-mist text-charcoal border-fog'
      case 'agent': return 'bg-gold-pale text-ink border-gold'
      default: return 'bg-fog text-graphite'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-mist p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-xl text-graphite">Loading conversations...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-mist p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-medium text-ink mb-1">Conversation Monitor</h1>
            <p className="text-sm text-graphite">Chatwoot conversation monitoring dashboard</p>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchConversations()
                if (selectedConversation) {
                  fetchConversationDetails(selectedConversation.id)
                }
              }}
            >
              Refresh Now
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-ruby text-white border border-ruby">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Conversations List */}
          <div>
            <Card size="compact" className="h-[calc(100vh-200px)] overflow-hidden flex flex-col">
              <div className="p-3 border-b border-fog">
                <h2 className="text-lg font-medium text-ink">
                  Recent Conversations ({conversations.length})
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-graphite">
                    No conversations found
                  </div>
                ) : (
                  <div className="divide-y divide-fog">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`p-3 cursor-pointer hover:bg-mist transition-colors ${
                          selectedConversation?.id === conv.id ? 'bg-gold-pale' : 'bg-white'
                        }`}
                        onClick={() => fetchConversationDetails(conv.id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-ink truncate">
                                {conv.contactName}
                              </span>
                              <Badge className={getStatusColor(conv.status)}>
                                {conv.status}
                              </Badge>
                            </div>
                            {conv.contactEmail && (
                              <div className="text-xs text-graphite truncate">
                                {conv.contactEmail}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-silver ml-2 shrink-0">
                            #{conv.id}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-graphite mb-1">
                          <span>Broker: {conv.brokerName}</span>
                          <span>•</span>
                          <span>{conv.messageCount} msg</span>
                          {conv.leadScore && (
                            <>
                              <span>•</span>
                              <span>Score: {conv.leadScore}</span>
                            </>
                          )}
                        </div>

                        <div className="text-xs text-silver">
                          {formatTimestamp(conv.lastMessageAt)}
                        </div>

                        {conv.lastMessageContent && (
                          <div className="text-xs text-graphite mt-2 truncate">
                            {conv.lastMessageContent}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Conversation Details */}
          <div>
            <Card size="compact" className="h-[calc(100vh-200px)] overflow-hidden flex flex-col">
              {!selectedConversation ? (
                <div className="flex-1 flex items-center justify-center text-graphite">
                  Select a conversation to view details
                </div>
              ) : detailsLoading ? (
                <div className="flex-1 flex items-center justify-center text-graphite">
                  Loading conversation details...
                </div>
              ) : (
                <>
                  {/* Conversation Header */}
                  <div className="p-3 border-b border-fog">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h2 className="text-lg font-medium text-ink mb-1">
                          {selectedConversation.contactName}
                        </h2>
                        <div className="text-sm text-graphite">
                          {selectedConversation.contactEmail}
                          {selectedConversation.contactPhone && (
                            <> • {selectedConversation.contactPhone}</>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedConversation(null)}
                      >
                        Close
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge className={getStatusColor(selectedConversation.status)}>
                        {selectedConversation.status}
                      </Badge>
                      <Badge variant="outline">
                        ID: {selectedConversation.id}
                      </Badge>
                      <Badge variant="outline">
                        Broker: {selectedConversation.brokerName}
                      </Badge>
                      {selectedConversation.leadScore && (
                        <Badge variant="outline">
                          Score: {selectedConversation.leadScore}
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {selectedConversation.messageCount} messages
                      </Badge>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {selectedConversation.messages.length === 0 ? (
                      <div className="text-center text-graphite py-4">
                        No messages in this conversation
                      </div>
                    ) : (
                      selectedConversation.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 border ${
                            msg.private ? 'border-gold bg-gold-pale' : 'border-fog bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getSenderColor(msg.sender.type)}>
                                {msg.sender.name || msg.sender.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {getMessageTypeLabel(msg.messageType)}
                              </Badge>
                              {msg.private && (
                                <Badge variant="outline" className="text-xs bg-gold text-ink">
                                  Private
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-silver shrink-0 ml-2">
                              {formatTimestamp(msg.createdAt)}
                            </span>
                          </div>

                          <div className="text-sm text-ink whitespace-pre-wrap break-words">
                            {msg.content}
                          </div>

                          <div className="text-xs text-silver mt-2">
                            ID: {msg.id} • Type: {msg.contentType}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 text-xs text-silver text-center">
          Connected to: {process.env.NEXT_PUBLIC_CHATWOOT_URL || 'https://chat.nextnest.sg'} •
          Auto-refresh: {autoRefresh ? 'Every 10s' : 'Disabled'}
        </div>
      </div>
    </div>
  )
}
