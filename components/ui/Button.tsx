import React from 'react';
import clsx from 'clsx';
import { sound } from '../../utils/sound';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
    children, 
    className, 
    variant = 'primary', 
    size = 'md',
    onClick,
    ...props 
}) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        sound.playClick();
        onClick?.(e);
    };

    const variants = {
        primary: "bg-gradient-to-r from-accent to-accent-dark text-white shadow-lg shadow-accent/20 hover:shadow-accent/40 border border-transparent",
        secondary: "bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-accent/50",
        danger: "bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20",
        ghost: "bg-transparent text-gray-400 hover:text-white"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-5 py-2.5 text-base",
        lg: "px-8 py-3.5 text-lg font-bold"
    };

    return (
        <button
            onClick={handleClick}
            className={clsx(
                "rounded-xl font-heading font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
};