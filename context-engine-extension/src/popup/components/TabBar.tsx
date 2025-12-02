import React from 'react';

interface TabBarProps {
    activeTab: 'list' | 'graph' | 'knowledge';
    onTabChange: (tab: 'list' | 'graph' | 'knowledge') => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="bg-surface-2 p-1 rounded-xl flex items-center gap-1 border border-border-muted mb-6">
            <button
                onClick={() => onTabChange('list')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-[13px] font-medium transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'list'
                        ? 'bg-surface-3 text-text-primary shadow-sm shadow-black/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    }`}
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                Feed
            </button>
            <button
                onClick={() => onTabChange('knowledge')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-[13px] font-medium transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'knowledge'
                        ? 'bg-surface-3 text-text-primary shadow-sm shadow-black/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    }`}
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                Learn
            </button>
            <button
                onClick={() => onTabChange('graph')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-[13px] font-medium transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'graph'
                        ? 'bg-surface-3 text-text-primary shadow-sm shadow-black/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    }`}
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                Graph
            </button>
        </div>
    );
};
