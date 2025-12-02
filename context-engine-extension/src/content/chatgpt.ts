// Content script for ChatGPT platform
import { SuggestionWidget, type SuggestionItem } from './components/SuggestionWidget';

console.log('Context Engine ChatGPT content script loaded')

// Platform detection
const isChatGPT = () => {
  return window.location.hostname === 'chat.openai.com' ||
    window.location.hostname === 'chatgpt.com'
}

if (isChatGPT()) {
  console.log('ChatGPT platform detected')

  // Initialize conversation detection (Week 1.2)
  initializeChatGPTDetection()

  // Initialize Input Monitor (Week 4)
  // new InputMonitor(); // Moved below class definition
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
    // Delegate listener for input events
    document.addEventListener('input', (e) => {
      const target = e.target as HTMLElement;
      // ChatGPT textarea usually has id="prompt-textarea"
      if (target.id === 'prompt-textarea' || target.getAttribute('data-id') === 'root') {
        this.handleInput(target as HTMLTextAreaElement);
      }
    });
  }

  handleInput(textarea: HTMLTextAreaElement) {
    const text = textarea.value;
    // Only search if text is long enough to be a query
    if (!text || text.length < 15) {
      this.widget.hide();
      return;
    }

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.searchContext(text);
    }, 1000); // 1s debounce to avoid spamming API
  }

  async searchContext(text: string) {
    if (text.trim() === this.lastQuery.trim()) return;
    this.lastQuery = text;

    if (!chrome.runtime?.sendMessage) {
      return; // Extension context invalid
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SEARCH_CONTEXT',
        query: text
      });

      if (response && response.success && response.data) {
        const results = response.data as SuggestionItem[];

        if (results.length > 0) {
          const inputArea = document.getElementById('prompt-textarea') || document.querySelector('textarea[data-id="root"]');
          if (inputArea) {
            this.widget.updatePosition(inputArea.getBoundingClientRect());
            this.widget.show(results);
          }
        } else {
          this.widget.hide();
        }
      }
    } catch (err: any) {
      // Ignore context invalidation errors during typing
      if (err.message?.includes('Extension context invalidated')) {
        console.warn('[Context Engine] Context invalidated during search');
      } else {
        console.error('[Context Engine] Search failed:', err);
      }
    }
  }

  insertText(text: string) {
    const textarea = document.getElementById('prompt-textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Insert with some formatting
      const textToInsert = `\n\n> [!CONTEXT]\n> ${text.replace(/\n/g, '\n> ')}\n\n`;

      // Use execCommand for undo history support if possible, otherwise setRangeText
      if (document.execCommand('insertText', false, textToInsert)) {
        // Success
      } else {
        textarea.setRangeText(textToInsert, start, end, 'select');
      }

      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      this.widget.hide();
    }
  }
}

// Initialize Input Monitor (Week 4)
if (isChatGPT()) {
  new InputMonitor();
}

function initializeChatGPTDetection() {
  console.log('Initializing ChatGPT detection...')

  // Debounce sync to avoid spamming during streaming
  let timeoutId: any
  const debouncedSync = () => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      // Check if generation is likely complete (no stop button)
      const stopButton = document.querySelector('button[aria-label="Stop generating"]')
      if (!stopButton) {
        syncConversation()
      } else {
        // If still generating, wait a bit longer
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
      // Trigger sync on DOM changes (captures AI response)
      debouncedSync()
    }
  })

  // Observe the main chat container (usually main or a specific div)
  const targetNode = document.querySelector('main') || document.body

  observer.observe(targetNode, {
    childList: true,
    subtree: true,
    characterData: true
  })

  // Initial injection attempt
  injectContextEngineButton()
  addSendButtonListener()

  // Force check every 2 seconds (Fallback for MutationObserver misses)
  setInterval(() => {
    if (!document.getElementById('ce-input-button')) {
      // console.log('[Context Engine] Button missing, re-running injection...');
      injectContextEngineButton();
    }
  }, 2000);

  // Initial sync
  setTimeout(syncConversation, 1000)
}

// Mem0-style: Capture on Send
function addSendButtonListener() {
  const sendButton = document.querySelector('[data-testid="send-button"]') || document.querySelector('button[aria-label="Send prompt"]')

  if (sendButton && !sendButton.hasAttribute('data-ce-listener')) {
    sendButton.setAttribute('data-ce-listener', 'true')
    sendButton.addEventListener('click', handleUserSend)
  }

  const textarea = document.getElementById('prompt-textarea')
  if (textarea && !textarea.hasAttribute('data-ce-key-listener')) {
    textarea.setAttribute('data-ce-key-listener', 'true')
    textarea.addEventListener('keydown', (e: any) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        handleUserSend()
      }
    })
  }
}

function handleUserSend() {
  // Try multiple selectors to find the input area
  let inputArea = document.getElementById('prompt-textarea') as HTMLTextAreaElement | HTMLElement

  if (!inputArea) {
    inputArea = document.querySelector('textarea[data-id="root"]') as HTMLTextAreaElement
  }

  if (!inputArea) {
    inputArea = document.querySelector('div[contenteditable="true"]') as HTMLElement
  }

  if (inputArea) {
    const value = (inputArea as HTMLTextAreaElement).value || inputArea.innerText

    if (value && value.trim()) {
      const content = value.trim()
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
}

function injectContextEngineButton() {
  // Check if already injected
  if (document.getElementById('ce-input-button')) return

  // Find the input area in ChatGPT (just to check if we SHOULD inject)
  // We'll look for it again on click to be safe.
  let inputArea = document.getElementById('prompt-textarea') ||
    document.querySelector('textarea[data-id="root"]') ||
    document.querySelector('div[contenteditable="true"]');

  // If we can't find the input area, we might be on a non-chat page or it's not loaded yet.
  // But let's try to inject anyway if we are on the right domain, to prove the extension is running.
  // We'll disable the button if input is missing.

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
          border-radius: 50%; /* Round for FAB */
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
    inputArea = document.getElementById('prompt-textarea') ||
      document.querySelector('textarea[data-id="root"]') ||
      document.querySelector('div[contenteditable="true"]');

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
        console.warn('[Context Engine] No memories or success=false', response)
        showMemoryMenu([], button, inputArea)
      }
    } catch (err) {
      console.error('[Context Engine] Error fetching memories:', err)
      if (err instanceof Error && err.message?.includes('Extension context invalidated')) {
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
  console.log('[Context Engine] FAB injected into body')
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
    background: #202123; /* ChatGPT Dark mode bg */
    border: 1px solid #444;
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
    border-bottom: 1px solid #444;
    margin-bottom: 8px;
  `
  header.innerHTML = '<span style="font-weight:bold; color:#ccc;">Context Engine</span>'

  const syncBtn = document.createElement('button')
  syncBtn.textContent = '🔄 Sync Page'
  syncBtn.style.cssText = `
    background: #10a37f;
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
        border-bottom: 1px solid #444;
        transition: background 0.2s;
      `
      item.onmouseover = () => item.style.background = '#343541'
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
        if (inputArea instanceof HTMLTextAreaElement) {
          inputArea.focus()
          const textToInsert = `[Memory: ${mem.title}]\n${lastMsg.content}`

          // For textarea, we can use setRangeText or just value
          const start = inputArea.selectionStart
          const end = inputArea.selectionEnd
          inputArea.setRangeText(textToInsert, start, end, 'select')

          // Trigger input event for React/frameworks to pick it up
          inputArea.dispatchEvent(new Event('input', { bubbles: true }))
        } else if ((inputArea as HTMLElement).isContentEditable) {
          // Fallback for contenteditable div (some versions of ChatGPT)
          (inputArea as HTMLElement).focus()
          const textToInsert = `[Memory: ${mem.title}]\n${lastMsg.content}`
          document.execCommand('insertText', false, textToInsert)
          inputArea.dispatchEvent(new Event('input', { bubbles: true }))
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

  // Extract conversation title from page
  let title = 'Untitled Chat'

  // Try multiple selectors for the title
  const titleElement = document.querySelector('h1') ||
    document.querySelector('title') ||
    document.querySelector('[data-testid="conversation-title"]')

  if (titleElement) {
    const extractedTitle = titleElement.textContent?.trim()
    if (extractedTitle && extractedTitle.length > 0 && extractedTitle !== 'ChatGPT') {
      title = extractedTitle
    }
  }

  // If no good title found, use first user message as title
  const firstUserMessage = document.querySelector('[data-message-author-role="user"]')
  if (title === 'Untitled Chat' && firstUserMessage) {
    const firstText = firstUserMessage.textContent?.trim()
    if (firstText) {
      title = firstText.substring(0, 50) + (firstText.length > 50 ? '...' : '')
    }
  }

  // ChatGPT selectors (updated for late 2024/2025)
  // ChatGPT selectors (updated for late 2024/2025)
  // 1. Try standard data attribute (Most reliable)
  let messageElements = document.querySelectorAll('[data-message-author-role]')

  // 2. If none, try the 'article' approach (Standard in most views)
  if (messageElements.length === 0) {
    messageElements = document.querySelectorAll('article')
  }

  // REMOVED: The .group selector was too broad and captured sidebar items.

  console.log(`[Context Engine] Found ${messageElements.length} potential message elements`)

  if (messageElements.length > 0) {
    messageElements.forEach((el) => {
      let role = 'unknown'

      // Check attribute
      if (el.hasAttribute('data-message-author-role')) {
        role = el.getAttribute('data-message-author-role') || 'unknown'
      }
      // Check for specific user/assistant indicators
      else if (el.querySelector('[data-testid="user-message"]')) {
        role = 'user'
      }
      else if (el.querySelector('.whitespace-pre-wrap')) {
        // Heuristic: User messages usually have an icon or specific class
        if (el.innerHTML.includes('data-testid="user-icon"') || el.innerHTML.includes('alt="User"')) {
          role = 'user'
        } else {
          role = 'assistant'
        }
      }

      // Extract text
      // We want to avoid capturing "Copy", "Regenerate" button text if possible.
      // Usually the text is in a specific child div.
      const textContainer = el.querySelector('.markdown') || el.querySelector('.whitespace-pre-wrap') || el

      // Exclude sidebar items by checking if it's inside a nav or sidebar
      if (el.closest('nav') || el.closest('.sidebar')) {
        return;
      }

      const content = (textContainer as HTMLElement).innerText

      // Filter out common UI noise
      const isUINoise = content === 'ChatGPT' || content === 'New chat' || content.includes('Upgrade plan');

      if (content && content.trim().length > 0 && !isUINoise) {
        messages.push({ role, content })
      }
    })
  }

  // Deduplicate messages (simple check)
  const uniqueMessages = messages.filter((msg, index, self) =>
    index === self.findIndex((t) => (
      t.content === msg.content && t.role === msg.role
    ))
  )

  if (uniqueMessages.length > 0) {
    console.log(`[Context Engine] Captured ${uniqueMessages.length} unique messages with title: "${title}"`)
    sendMessage('CONVERSATION_CAPTURED', { title, messages: uniqueMessages, timestamp: Date.now() })
  }
}

// Send messages to background script
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
      platform: 'chatgpt',
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