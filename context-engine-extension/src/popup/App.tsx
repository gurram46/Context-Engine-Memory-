import { useEffect, useState } from 'react'
import { getRecentConversations, deleteConversation, vectorSearch } from '../utils/storage';
import type { Conversation } from '../utils/storage';
import { getAppConfig, saveAppConfig } from '../utils/config'
import { generateEmbedding } from '../services/gemini'
import GraphView from './components/GraphView'
import { Header } from './components/Header'
import { SearchBar } from './components/SearchBar'
import { MemoryCard } from './components/MemoryCard'
import { TabBar } from './components/TabBar'
import { KnowledgeTab } from './components/KnowledgeTab'

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<'home' | 'settings'>('home')
  const [activeTab, setActiveTab] = useState<'list' | 'graph' | 'knowledge'>('list')
  const [apiKey, setApiKey] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    loadConfig()
    loadConversations()
  }, [])

  // Effect to handle search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery)
      } else {
        setFilteredConversations(conversations)
      }
    }, 300) // Debounce

    return () => clearTimeout(timer)
  }, [searchQuery, conversations])


  async function loadConfig() {
    const config = await getAppConfig()
    if (config.geminiApiKey) {
      setApiKey(config.geminiApiKey)
    }
  }

  async function saveSettings() {
    await saveAppConfig({ geminiApiKey: apiKey })
    setView('home')
    loadConversations()
  }

  async function loadConversations() {
    setLoading(true)
    try {
      const recent = await getRecentConversations(100)
      setConversations(recent)
      if (!searchQuery) {
        setFilteredConversations(recent)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(query: string) {
    if (!query.trim()) {
      setFilteredConversations(conversations)
      return
    }

    if (apiKey) {
      setIsSearching(true)
      try {
        const embedding = await generateEmbedding(query)
        if (embedding) {
          const results = await vectorSearch(embedding)
          // @ts-ignore
          setFilteredConversations(results)
        } else {
          fallbackSearch(query)
        }
      } catch (err) {
        console.error('Search error:', err)
        fallbackSearch(query)
      } finally {
        setIsSearching(false)
      }
    } else {
      fallbackSearch(query)
    }
  }

  function fallbackSearch(query: string) {
    const filtered = conversations.filter(conv =>
      (conv.title?.toLowerCase().includes(query.toLowerCase()) || '') ||
      conv.messages.some(m => m.content.toLowerCase().includes(query.toLowerCase()))
    )
    setFilteredConversations(filtered)
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm('Delete this memory?')) {
      await deleteConversation(id)
      loadConversations()
    }
  }

  async function handleCopy(content: string, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(content)
      // Could add a toast here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true);
    // Simulate sync for now or trigger background sync
    setTimeout(() => {
      setIsSyncing(false);
      loadConversations();
    }, 1500);
  }

  // Settings View
  if (view === 'settings') {
    return (
      <div className="min-h-screen bg-surface-1 text-text-primary font-sans p-6 flex flex-col">
        <div className="flex items-center mb-8">
          <button onClick={() => setView('home')} className="mr-4 p-2 hover:bg-surface-3 rounded-full transition-colors text-text-secondary hover:text-text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
              Intelligence Provider
            </label>
            <div className="bg-surface-2 border border-border-muted rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-text-primary">Google Gemini</span>
                <span className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`}></span>
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste API Key..."
                className="w-full bg-surface-1 border border-border-muted rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-zinc-600 transition-colors"
              />
              <p className="text-[11px] text-text-secondary mt-2">
                Required for semantic search. <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-indigo-400 hover:underline">Get key →</a>
              </p>
            </div>
          </div>

          <button
            onClick={saveSettings}
            className="w-full bg-white text-black py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    )
  }

  // Main View
  return (
    <div className="min-h-screen bg-surface-1 text-text-primary font-sans flex flex-col p-4">

      <Header
        active={true}
        isSyncing={isSyncing}
        onSettingsClick={() => setView('settings')}
        onSyncClick={handleSync}
      />

      <div className="mt-2 mb-4">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'list' && (
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            isSearching={isSearching}
          />
        )}
      </div>

      <main className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-4">
        {activeTab === 'list' && (
          <div className="space-y-3">
            {loading ? (
              <div className="py-12 text-center">
                <div className="w-6 h-6 border-2 border-zinc-700 border-t-text-primary rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs text-text-secondary">Loading memories...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4 border border-border-muted">
                  <span className="text-xl">📭</span>
                </div>
                <p className="text-sm font-medium text-text-primary mb-1">No memories found</p>
                <p className="text-xs text-text-secondary">Start chatting to capture context</p>
              </div>
            ) : (
              <div className="space-y-3 animate-slide-up">
                {filteredConversations.map(conv => (
                  <MemoryCard
                    key={conv.id}
                    conversation={conv}
                    onClick={() => { }}
                    onDelete={(e) => conv.id && handleDelete(conv.id, e)}
                    onCopy={(e) => handleCopy(conv.messages.map(m => `${m.role}: ${m.content}`).join('\n\n'), e)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'graph' && (
          <div className="h-[400px] bg-surface-2 rounded-xl border border-border-muted overflow-hidden">
            <GraphView
              conversations={conversations}
              onSelectConversation={(id) => {
                const selected = conversations.find(c => c.id === id)
                if (selected) {
                  setFilteredConversations([selected])
                  setActiveTab('list')
                }
              }}
            />
          </div>
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeTab />
        )}
      </main>
    </div>
  )
}

export default App
