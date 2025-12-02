export interface SuggestionItem {
    type: 'memory' | 'knowledge';
    id: number;
    title: string;
    content: string;
    score: number;
}

export class SuggestionWidget {
    private shadowRoot: ShadowRoot;
    private container: HTMLElement;
    private host: HTMLElement;
    private onInsert: (text: string) => void;
    private isVisible: boolean = false;

    constructor(onInsert: (text: string) => void) {
        this.onInsert = onInsert;

        // Create host element
        this.host = document.createElement('div');
        this.host.id = 'context-engine-widget-host';
        this.host.style.position = 'absolute';
        this.host.style.zIndex = '9999';
        this.host.style.pointerEvents = 'none'; // Let clicks pass through when hidden/collapsed
        document.body.appendChild(this.host);

        // Create Shadow DOM
        this.shadowRoot = this.host.attachShadow({ mode: 'open' });

        // Create container
        this.container = document.createElement('div');
        this.container.className = 'widget-container hidden';
        this.shadowRoot.appendChild(this.container);

        // Inject Styles
        const style = document.createElement('style');
        style.textContent = `
            .hidden { opacity: 0; pointer-events: none; transform: translateY(10px); }
            .widget-container {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background: rgba(20, 20, 20, 0.95);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                color: #fff;
                width: 320px;
                max-height: 400px;
                overflow: hidden;
                transition: all 0.2s ease;
                pointer-events: auto;
                display: flex;
                flex-direction: column;
            }
            .header {
                padding: 10px 14px;
                background: rgba(255, 255, 255, 0.05);
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
            }
            .header:hover { background: rgba(255, 255, 255, 0.08); }
            .title { font-size: 13px; font-weight: 600; color: #e0e0e0; display: flex; align-items: center; gap: 6px; }
            .badge { background: #6366f1; color: white; font-size: 10px; padding: 1px 5px; border-radius: 4px; }
            .content-list {
                overflow-y: auto;
                max-height: 300px;
                padding: 4px;
            }
            .item {
                padding: 10px;
                border-radius: 8px;
                margin: 4px;
                background: transparent;
                transition: background 0.15s;
                cursor: default;
            }
            .item:hover { background: rgba(255, 255, 255, 0.05); }
            .item-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .item-title { font-size: 12px; font-weight: 600; color: #a0a0a0; }
            .item-score { font-size: 10px; color: #6366f1; }
            .item-preview { font-size: 11px; color: #d0d0d0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
            .insert-btn {
                margin-top: 8px;
                width: 100%;
                padding: 6px;
                background: rgba(99, 102, 241, 0.1);
                border: 1px solid rgba(99, 102, 241, 0.2);
                color: #818cf8;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }
            .insert-btn:hover { background: rgba(99, 102, 241, 0.2); color: #fff; }
            
            /* Scrollbar */
            .content-list::-webkit-scrollbar { width: 4px; }
            .content-list::-webkit-scrollbar-track { background: transparent; }
            .content-list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 2px; }
        `;
        this.shadowRoot.appendChild(style);
    }

    updatePosition(rect: DOMRect) {
        // Position to the right of the active element, or float near it
        const top = rect.top + window.scrollY;
        const left = rect.right + 20 + window.scrollX;

        // Ensure it doesn't go off screen
        const maxLeft = window.innerWidth - 340;

        this.host.style.top = `${top}px`;
        this.host.style.left = `${Math.min(left, maxLeft)}px`;
    }

    show(results: SuggestionItem[]) {
        if (results.length === 0) {
            this.hide();
            return;
        }

        if (this.isVisible) {
            // Update content if already visible
            this.renderContent(results);
            return;
        }

        this.isVisible = true;
        this.container.classList.remove('hidden');
        this.renderContent(results);
    }

    private renderContent(results: SuggestionItem[]) {
        const count = results.length;
        this.container.innerHTML = `
            <div class="header">
                <div class="title">
                    <span>✨ Context Engine</span>
                    <span class="badge">${count} found</span>
                </div>
                <div style="font-size: 16px; color: #888;">×</div>
            </div>
            <div class="content-list">
                ${results.map((item, index) => `
                    <div class="item">
                        <div class="item-header">
                            <span class="item-title">${item.type === 'memory' ? '💬 ' : '📚 '}${item.title}</span>
                            <span class="item-score">${Math.round(item.score * 100)}%</span>
                        </div>
                        <div class="item-preview">${item.content}</div>
                        <button class="insert-btn" data-index="${index}">Insert Context</button>
                    </div>
                `).join('')}
            </div>
        `;

        // Add event listeners
        const closeBtn = this.container.querySelector('.header');
        closeBtn?.addEventListener('click', () => this.hide());

        const insertBtns = this.container.querySelectorAll('.insert-btn');
        insertBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt((e.target as HTMLElement).dataset.index || '0');
                this.onInsert(results[index].content);
            });
        });
    }

    hide() {
        if (!this.isVisible) return;
        this.isVisible = false;
        this.container.classList.add('hidden');
    }
}
