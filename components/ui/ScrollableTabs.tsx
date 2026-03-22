import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface ScrollableTabsProps {
    children: React.ReactNode;
    className?: string;
}

export const ScrollableTabs: React.FC<ScrollableTabsProps> = ({ children, className }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [children]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 200;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className={clsx("relative flex items-center group w-full", className)}>
            {showLeftArrow && (
                <button 
                    onClick={() => scroll('left')}
                    className="absolute left-0 z-10 p-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-full text-white shadow-lg hover:bg-accent transition-colors -ml-2"
                >
                    <ChevronLeft size={16} />
                </button>
            )}
            
            <div 
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex gap-4 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar whitespace-nowrap w-full scroll-smooth"
            >
                {children}
            </div>

            {showRightArrow && (
                <button 
                    onClick={() => scroll('right')}
                    className="absolute right-0 z-10 p-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-full text-white shadow-lg hover:bg-accent transition-colors -mr-2"
                >
                    <ChevronRight size={16} />
                </button>
            )}
        </div>
    );
};
