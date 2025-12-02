import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverable?: boolean;
    glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    hoverable = false,
    glass = false,
    ...props
}) => {
    const baseStyles = "rounded-xl border transition-all duration-200";

    const styles = glass
        ? "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-zinc-200/50 dark:border-zinc-800/50"
        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800";

    const hoverStyles = hoverable
        ? "hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm cursor-pointer"
        : "";

    return (
        <div
            className={`${baseStyles} ${styles} ${hoverStyles} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};
