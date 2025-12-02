import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  isSearching: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, isSearching }) => {
  return (
    <div className="relative group z-10">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <svg className={`w-4 h-4 transition-colors duration-200 ${value ? 'text-accent-primary' : 'text-text-secondary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search memories..."
        className="w-full h-11 pl-10 pr-4 bg-surface-2 border border-border-muted rounded-[14px] text-sm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600/50 focus:bg-surface-3 transition-all duration-200 shadow-sm"
      />
      
      <div className="absolute inset-y-0 right-3 flex items-center">
        {isSearching ? (
           <div className="w-4 h-4 border-2 border-text-secondary border-t-transparent rounded-full animate-spin"></div>
        ) : (
            <div className="text-[10px] font-medium text-text-secondary bg-surface-3 border border-border-muted px-1.5 py-0.5 rounded opacity-60">
                ⌘K
            </div>
        )}
      </div>
    </div>
  );
};
