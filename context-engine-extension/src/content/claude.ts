// Content script for Claude platform
import { SuggestionWidget, type SuggestionItem } from './components/SuggestionWidget';

console.log('Context Engine Claude content script loaded')

// Platform detection
const isClaude = () => {
  return window.location.hostname === 'claude.ai'
}

if (isClaude()) {
  console.log('Claude platform detected')

  // Initialize conversation detection (Week 1.2)
  initializeClaudeDetection()

  // Initialize Input Monitor

}

class InputMonitor {
  private widget: SuggestionWidget;
  private debounceTimer: any;
  private lastQuery: string = '';

  constructor() {
    this.widget = new SuggestionWidget((text) => this.insertText(text));
    this.attachListeners();
  }

  attachListeners() {
    document.addEventListener('input', (e) => {
      const target = e.target as HTMLElement;
      if (target.isContentEditable) {
        this.handleInput(target);
      }
    });
  }

  handleInput(inputArea: HTMLElement) {
    const text = inputArea.innerText;
    if (!text || text.length < 15) {
      this.widget.hide();
      return;
    }

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.searchContext(text);
    }, 1000);
  }

  async searchContext(text: string) {
    if (text.trim() === this.lastQuery.trim()) return;
    this.lastQuery = text;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SEARCH_CONTEXT',
        query: text
      });

      if (response && response.success && response.data) {
        const results = response.data as SuggestionItem[];

        if (results.length > 0) {
          const inputArea = document.querySelector('[contenteditable="true"]');
          if (inputArea) {
            this.widget.updatePosition(inputArea.getBoundingClientRect());
            this.widget.show(results);
          }
        } else {
          this.widget.hide();
        }
      }
    } catch (err) {
      console.error('[Context Engine] Search failed:', err);
    }
  }

  insertText(text: string) {
    const inputArea = document.querySelector('[contenteditable="true"]') as HTMLElement;
    if (inputArea) {
      inputArea.focus();
      const textToInsert = `\n\n> [!CONTEXT]\n> ${text.replace(/\n/g, '\n> ')}\n\n`;
      document.execCommand('insertText', false, textToInsert);
      inputArea.dispatchEvent(new Event('input', { bubbles: true }));
      this.widget.hide();
    }
  }
}

function initializeClaudeDetection() {
  console.log('Initializing Claude detection...')

  // Debounce sync to avoid spamming during streaming
  let timeoutId: any
  const debouncedSync = () => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      // Check if generation is complete (Claude usually has a Stop button)
      // The button usually has text "Stop" or aria-label
      const stopButton = document.querySelector('button[aria-label="Stop responding"]') ||
        Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Stop');

      if (!stopButton) {
        syncConversation()
      } else {
        debouncedSync()
      }
    }, 2000) // Wait 2s after last change
  }

  // DOM observation for conversation changes
  const observer = new MutationObserver((mutations) => {
    // Just ensure button is injected
    injectContextEngineButton()
    addSendButtonListener()

    // Check if significant changes happened (nodes added)
    const hasAddedNodes = mutations.some(m => m.addedNodes.length > 0)

    if (hasAddedNodes) {
      debouncedSync()
    }
  })

  // Observe the main chat container
  const targetNode = document.querySelector('body')

  if (targetNode) {
    observer.observe(targetNode, {
      childList: true,
      subtree: true,
      characterData: true
    })
  }

  // Initial injection attempt
  injectContextEngineButton()
  addSendButtonListener()

  // Force check every 2 seconds
  setInterval(() => {
    if (!document.getElementById('ce-input-button')) {
      // console.log('[Context Engine] Button missing in Claude, re-injecting...');
      injectContextEngineButton();
    }
  }, 2000);

  // Initial sync
  setTimeout(syncConversation, 1000)
}

// Mem0-style: Capture on Send
function addSendButtonListener() {
  // Claude's send button usually has an aria-label or specific icon
  const sendButton = document.querySelector('button[aria-label="Send Message"]') || document.querySelector('button[aria-label="Send"]')

  if (sendButton && !sendButton.hasAttribute('data-ce-listener')) {
    sendButton.setAttribute('data-ce-listener', 'true')
    sendButton.addEventListener('click', handleUserSend)
  }

  const inputArea = document.querySelector('[contenteditable="true"]')
  if (inputArea && !inputArea.hasAttribute('data-ce-key-listener')) {
    inputArea.setAttribute('data-ce-key-listener', 'true')
    inputArea.addEventListener('keydown', (e: any) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        handleUserSend()
      }
    })
  }
}

function handleUserSend() {
  const inputArea = document.querySelector('[contenteditable="true"]') as HTMLElement
  if (inputArea && inputArea.innerText.trim()) {
    const content = inputArea.innerText.trim()
    console.log('[Context Engine] Capturing User Input:', content)

    // Send immediately as a single user message
    sendMessage('CONVERSATION_CAPTURED', {
      title: 'User Input',
      messages: [{ role: 'user', content }],
      merge: true,
      timestamp: Date.now()
    })
  }
}

// Initialize Input Monitor
if (isClaude()) {
  new InputMonitor();
}

function injectContextEngineButton() {
  // Check if already injected
  if (document.getElementById('ce-input-button')) return

  // Find the input area in Claude (just to check if we SHOULD inject)
  let inputArea = document.querySelector('[contenteditable="true"]') ||
    document.querySelector('.ProseMirror')

  // Inject FAB regardless of input area visibility initially

  const button = document.createElement('button')
  button.id = 'ce-input-button'
  button.innerHTML = '🧠'
  button.title = 'Context Engine'

  // Floating Action Button (FAB) style
  button.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 2147483647;
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            font-size: 24px;
            cursor: pointer;
            opacity: 1;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        `

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
    button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
  })
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
  })

  button.addEventListener('click', async (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Find input area NOW
    inputArea = document.querySelector('[contenteditable="true"]') ||
      document.querySelector('.ProseMirror')

    if (!inputArea) {
      alert('Context Engine: Could not find chat input area. Please click inside the chat box first.');
      return;
    }

    // Toggle menu if already open
    const existingMenu = document.getElementById('ce-memory-menu')
    if (existingMenu) {
      existingMenu.remove()
      return
    }

    if (!chrome.runtime?.sendMessage) {
      alert('Context Engine: Extension context invalidated. Please refresh the page.')
      return
    }

    // Fetch memories
    const originalText = button.innerHTML
    button.innerHTML = '⏳'

    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_RECENT_MEMORIES' })

      if (response && response.success && response.data) {
        showMemoryMenu(response.data, button, inputArea)
      } else {
        console.warn('[Context Engine] No memories or success=false', JSON.stringify(response))
        showMemoryMenu([], button, inputArea)
      }
    } catch (err: any) {
      console.error('[Context Engine] Error fetching memories:', err)
      if (err.message?.includes('Extension context invalidated')) {
        alert('Context Engine: Extension updated. Please refresh the page.')
      } else {
        alert('Context Engine Error: Could not fetch memories. Check console for details.')
      }
      showMemoryMenu([], button, inputArea)
    } finally {
      button.innerHTML = originalText
    }
  })

  document.body.appendChild(button)
  console.log('[Context Engine] FAB injected into Claude body')
}

function showMemoryMenu(memories: any[], button: HTMLElement, inputArea: Element) {
  const menu = document.createElement('div')
  menu.id = 'ce-memory-menu'

  // Get button position for fixed positioning
  const rect = button.getBoundingClientRect()

  menu.style.cssText = `
    position: fixed;
    bottom: ${window.innerHeight - rect.top + 10}px;
    left: ${rect.left - 250}px; /* Shift left to align */
    width: 300px;
    max-height: 400px;
    overflow-y: auto;
    background: #1e1e1e; /* Dark mode default */
    border: 1px solid #333;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    padding: 8px;
    color: #fff;
    font-family: sans-serif;
    font-size: 14px;
  `

  // Header with Sync Button
  const header = document.createElement('div')
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 8px;
    border-bottom: 1px solid #333;
    margin-bottom: 8px;
  `
  header.innerHTML = '<span style="font-weight:bold; color:#ccc;">Context Engine</span>'

  const syncBtn = document.createElement('button')
  syncBtn.textContent = '🔄 Sync Page'
  syncBtn.style.cssText = `
    background: #d97757; /* Claude-ish accent */
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 12px;
  `
  syncBtn.onclick = () => {
    syncBtn.textContent = 'Syncing...'
    syncConversation()
    setTimeout(() => {
      syncBtn.textContent = 'Synced!'
      setTimeout(() => menu.remove(), 1000)
    }, 800)
  }
  header.appendChild(syncBtn)
  menu.appendChild(header)

  if (memories.length === 0) {
    const empty = document.createElement('div')
    empty.textContent = 'No memories found.'
    empty.style.padding = '8px'
    empty.style.color = '#888'
    menu.appendChild(empty)
  } else {
    memories.forEach(mem => {
      const item = document.createElement('div')
      item.style.cssText = `
        padding: 8px;
        cursor: pointer;
        border-bottom: 1px solid #333;
        transition: background 0.2s;
      `
      item.onmouseover = () => item.style.background = '#333'
      item.onmouseout = () => item.style.background = 'transparent'

      // Title
      const title = document.createElement('div')
      title.style.fontWeight = 'bold'
      title.style.marginBottom = '4px'
      title.textContent = mem.title || 'Untitled'

      // Preview (last message or summary)
      const preview = document.createElement('div')
      preview.style.fontSize = '12px'
      preview.style.color = '#aaa'
      // Show the last user message or just the first message
      const lastMsg = mem.messages.findLast((m: any) => m.role === 'user') || mem.messages[0]
      preview.textContent = lastMsg ? lastMsg.content.substring(0, 60) + '...' : 'No content'

      item.appendChild(title)
      item.appendChild(preview)

      item.onclick = () => {
        // Insert into input
        if (inputArea instanceof HTMLElement) {
          inputArea.focus()
          const textToInsert = `[Memory: ${mem.title}]\n${lastMsg.content}`
          const success = document.execCommand('insertText', false, textToInsert)
          if (!success) {
            inputArea.textContent += textToInsert
          }
        }
        menu.remove()
      }

      menu.appendChild(item)
    })
  }

  // Close on click outside
  const closeHandler = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node) && e.target !== button) {
      menu.remove()
      document.removeEventListener('click', closeHandler)
    }
  }
  setTimeout(() => document.addEventListener('click', closeHandler), 100)

  document.body.appendChild(menu)
}

function syncConversation() {
  const messages: { role: string, content: string }[] = []

  // Claude selectors
  // Usually messages are in divs with specific classes
  // We look for the chat container

  // Updated selectors for Claude
  const chatRows = document.querySelectorAll('.font-claude-message, .font-user-message, [data-test-id="chat-message-content"]')

  if (chatRows.length > 0) {
    chatRows.forEach(row => {
      let role = 'unknown'

      // Explicit class checks
      if (row.classList.contains('font-user-message')) {
        role = 'user'
      } else if (row.classList.contains('font-claude-message')) {
        role = 'assistant'
      } else {
        // Fallback: check parent or data attributes
        const container = row.closest('.grid') || row.parentElement

        if (container) {
          // Look for "You" or "Claude" labels
          const senderLabel = container.querySelector('.font-bold, .font-semibold');
          if (senderLabel) {
            if (senderLabel.textContent?.includes('You')) role = 'user';
            else if (senderLabel.textContent?.includes('Claude')) role = 'assistant';
          }

          // If still unknown, try to infer from position/structure
          // Claude messages usually have an icon
          if (role === 'unknown' && container.querySelector('img[alt*="Claude"]')) {
            role = 'assistant'
          }
        }
      }

      // Extract content
      // For Claude, the text is usually direct innerText of the row, 
      // but we might want to strip out artifacts
      let content = (row as HTMLElement).innerText

      // Clean up
      if (role !== 'unknown' && content && content.trim().length > 0) {
        messages.push({ role, content: content.trim() })
      }
    })
  }

  if (messages.length > 0) {
    console.log(`Captured ${messages.length} messages from Claude`)
    sendMessage('CONVERSATION_CAPTURED', { messages, timestamp: Date.now() })
  }
}

// Send messages to background script
function sendMessage(type: string, data: any) {
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
    console.warn('[Context Engine] Extension context invalidated. Please refresh the page.')
    return
  }

  console.log(`[Context Engine] Sending message: ${type}`, data)

  try {
    chrome.runtime.sendMessage({
      type,
      data,
      platform: 'claude',
      url: window.location.href
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Context Engine] SendMessage Error:', chrome.runtime.lastError)
      } else {
        console.log('[Context Engine] SendMessage Response:', response)
      }
    })
  } catch (error) {
    console.error('[Context Engine] Failed to send message:', error)
  }
}

// Export for future use
export { sendMessage }
