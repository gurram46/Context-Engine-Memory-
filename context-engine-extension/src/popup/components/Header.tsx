import React from 'react';

interface HeaderProps {
    onSettingsClick: () => void;
    onSyncClick: () => void;
    isSyncing?: boolean;
    active: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick, onSyncClick, isSyncing, active }) => {
    return (
        <header className="flex items-center justify-between px-1 py-4 select-none">
            <div className="flex items-center gap-2.5 group cursor-default">
                <div className="relative w-8 h-8 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center shadow-lg shadow-black/20 overflow-hidden">
                    {/* Logo / Icon */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="text-lg relative z-10">🧠</span>
                    
                    {/* Status Dot */}
                    {active && (
                        <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    )}
                </div>
                
                <div className="flex flex-col">
                    <h1 className="text-sm font-semibold text-text-primary tracking-tight">Context Engine</h1>
                    <span className="text-[10px] text-text-secondary font-medium flex items-center gap-1">
                        {isSyncing ? (
                             <span className="text-indigo-400">Syncing...</span>
                        ) : (
                            <>
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                                Active
                            </>
                        )}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button 
                    onClick={onSyncClick}
                    className={`p-2 rounded-full transition-all duration-200 ${isSyncing ? 'text-indigo-400 bg-indigo-500/10 rotate-180' : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'}`}
                    title="Sync Now"
                    disabled={isSyncing}
                >
                    <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                </button>
                <button 
                    onClick={onSettingsClick}
                    className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-3 rounded-full transition-all duration-200"
                    title="Settings"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </button>
            </div>
        </header>
    );
};
