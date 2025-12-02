import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    isLoading?: boolean;
}

export const Input: React.FC<InputProps> = ({
    icon,
    isLoading,
    className = '',
    ...props
}) => {
    return (
        <div className="relative group">
            {icon && (
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-indigo-500 transition-colors">
                    {icon}
                </div>
            )}
            <input
                className={`
          w-full bg-zinc-50 dark:bg-zinc-900/50 
          border border-zinc-200 dark:border-zinc-800 
          rounded-lg py-2.5 text-sm 
          text-zinc-900 dark:text-zinc-100 
          placeholder-zinc-500 dark:placeholder-zinc-500 
          focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 
          transition-all
          ${icon ? 'pl-10' : 'pl-3'}
          ${className}
        `}
                {...props}
            />
            {isLoading && (
                <div className="absolute right-3 top-2.5">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
};
