// Background script
console.log('Context Engine extension installed - STATIC IMPORT MODE')

import { saveConversation, getRecentConversations, vectorSearch } from '../utils/storage'
import { generateEmbedding } from '../services/gemini'

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  // console.log('Background received message:', request.type) // Reduce noise

  if (request.type === 'CONVERSATION_CAPTURED') {
    const { platform, url, data } = request
    const title = data.title || 'Untitled Chat'
    const merge = data.merge || false

    // 1. Save immediately (UI responsiveness)
    saveConversation(platform, url, title, data.messages, merge)
      .then(() => {
        console.log('Conversation saved successfully')
      })
      .catch(err => console.error('Failed to save conversation:', err))

    sendResponse({ success: true })
    return true // Indicates async response
  }

  if (request.type === 'GET_RECENT_MEMORIES') {
    getRecentConversations()
      .then(conversations => {
        sendResponse({ success: true, data: conversations })
      })
      .catch(err => {
        console.error('Failed to get conversations:', err)
        sendResponse({ success: false, error: err.message })
      })
    return true
  }

  if (request.type === 'SEARCH_CONTEXT') {
    const { query } = request
    if (!query) {
      sendResponse({ success: false, error: 'No query provided' })
      return true
    }

    (async () => {
      try {
        const embedding = await generateEmbedding(query)
        if (!embedding) {
          sendResponse({ success: false, error: 'Failed to generate embedding' })
          return
        }

        const results = await vectorSearch(embedding, 5, 0.65) // Top 5, 0.65 threshold
        sendResponse({ success: true, data: results })
      } catch (err: any) {
        console.error('Search context failed:', err)
        sendResponse({ success: false, error: err.message })
      }
    })()

    return true
  }

  // Default response for ping/other messages
  sendResponse({ success: true, message: 'Background is alive' })
})