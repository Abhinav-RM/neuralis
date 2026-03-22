import React, { useEffect, useRef } from 'react';

interface HologramHeartProps {
    className?: string;
}

export const HologramHeart: React.FC<HologramHeartProps> = ({ className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        let beatPhase = 0;
        let time = 0;

        const drawMainHeart = (size: number, pulse: number) => {
            ctx.beginPath();
            ctx.fillStyle = `rgba(180, 40, 45, ${0.85 * pulse})`;
            ctx.strokeStyle = `rgba(220, 60, 65, ${0.9 * pulse})`;
            ctx.lineWidth = 2;
            
            ctx.moveTo(0, -size * 0.3);
            ctx.bezierCurveTo(-size * 0.5, -size * 0.7, -size * 0.9, -size * 0.4, -size * 0.7, 0);
            ctx.bezierCurveTo(-size * 0.7, size * 0.3, -size * 0.4, size * 0.9, 0, size * 1.1);
            ctx.bezierCurveTo(size * 0.4, size * 0.9, size * 0.6, size * 0.3, size * 0.6, 0);
            ctx.bezierCurveTo(size * 0.8, -size * 0.4, size * 0.4, -size * 0.7, 0, -size * 0.3);
            
            ctx.fill();
            ctx.stroke();
            
            ctx.strokeStyle = `rgba(150, 30, 35, ${0.4 * pulse})`;
            ctx.lineWidth = 1;
            for (let i = 0; i < 15; i++) {
                const angle = (i / 15) * Math.PI * 2;
                const startR = size * 0.3;
                const endR = size * 0.8;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * startR, Math.sin(angle) * startR);
                ctx.lineTo(Math.cos(angle) * endR, Math.sin(angle) * endR);
                ctx.stroke();
            }
        };

        const drawAorta = (size: number, pulse: number) => {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(200, 60, 70, ${0.9 * pulse})`;
            ctx.fillStyle = `rgba(190, 50, 60, ${0.7 * pulse})`;
            ctx.lineWidth = size * 0.15;
            
            ctx.moveTo(-size * 0.2, -size * 0.3);
            ctx.bezierCurveTo(-size * 0.3, -size * 0.6, -size * 0.4, -size * 0.9, -size * 0.3, -size * 1.2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.lineWidth = size * 0.12;
            ctx.moveTo(-size * 0.3, -size * 1.2);
            ctx.bezierCurveTo(-size * 0.1, -size * 1.3, size * 0.1, -size * 1.2, size * 0.2, -size * 0.9);
            ctx.stroke();
        };

        const drawPulmonaryArteries = (size: number, pulse: number) => {
            ctx.strokeStyle = `rgba(200, 70, 80, ${0.8 * pulse})`;
            ctx.lineWidth = size * 0.1;
            
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.4);
            ctx.bezierCurveTo(-size * 0.2, -size * 0.7, -size * 0.5, -size * 0.8, -size * 0.7, -size * 0.7);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(size * 0.1, -size * 0.4);
            ctx.bezierCurveTo(size * 0.3, -size * 0.7, size * 0.5, -size * 0.8, size * 0.6, -size * 0.6);
            ctx.stroke();
        };

        const drawVentricles = (size: number, pulse: number) => {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(120, 20, 25, ${0.6 * pulse})`;
            ctx.lineWidth = 3;
            ctx.moveTo(0, -size * 0.2);
            ctx.lineTo(size * 0.1, size * 0.9);
            ctx.stroke();
            
            ctx.strokeStyle = `rgba(220, 80, 90, ${0.7 * pulse})`;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.moveTo(-size * 0.3, -size * 0.1);
            ctx.bezierCurveTo(-size * 0.5, size * 0.2, -size * 0.4, size * 0.5, -size * 0.2, size * 0.7);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(size * 0.3, -size * 0.1);
            ctx.bezierCurveTo(size * 0.5, size * 0.2, size * 0.4, size * 0.5, size * 0.2, size * 0.6);
            ctx.stroke();
        };

        const drawVeins = (size: number, pulse: number) => {
            ctx.strokeStyle = `rgba(150, 50, 70, ${0.7 * pulse})`;
            ctx.lineWidth = size * 0.08;
            
            ctx.beginPath();
            ctx.moveTo(size * 0.2, -size * 0.3);
            ctx.lineTo(size * 0.3, -size * 0.8);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(size * 0.3, size * 0.2);
            ctx.lineTo(size * 0.4, size * 0.7);
            ctx.stroke();
        };

        const drawHologramLines = (size: number) => {
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 + Math.sin(time * 2) * 0.05})`;
            ctx.lineWidth = 1;
            
            for (let i = 0; i < 20; i++) {
                const y = -size * 1.5 + (i * size * 0.15) + (time * 50) % (size * 3);
                ctx.beginPath();
                ctx.moveTo(-size * 1.2, y);
                ctx.lineTo(size * 1.2, y);
                ctx.stroke();
            }
            
            ctx.fillStyle = `rgba(255, 100, 100, ${0.3 + Math.sin(time * 3) * 0.2})`;
            for (let i = 0; i < 10; i++) {
                const angle = (time + i) * 0.5;
                const radius = size * (0.8 + Math.sin(time * 2 + i) * 0.3);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const scale = Math.min(canvas.width, canvas.height) / 600;
            const baseSize = 150 * scale;
            
            beatPhase += 0.08;
            const beat = 1 + Math.sin(beatPhase) * 0.1 + Math.sin(beatPhase * 2) * 0.05;
            const pulse = 1 + Math.sin(beatPhase * 0.5) * 0.02;
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.scale(beat, beat);
            
            // Optimized glow: Use multiple strokes instead of shadowBlur
            ctx.shadowBlur = 0; 
            
            // Outer glow effect
            ctx.strokeStyle = `rgba(255, 50, 50, ${0.2 * pulse})`;
            ctx.lineWidth = 15;
            drawMainHeart(baseSize, pulse);
            ctx.lineWidth = 8;
            drawMainHeart(baseSize, pulse);

            drawMainHeart(baseSize, pulse);
            drawAorta(baseSize, pulse);
            drawPulmonaryArteries(baseSize, pulse);
            drawVentricles(baseSize, pulse);
            drawVeins(baseSize, pulse);
            drawHologramLines(baseSize);
            
            ctx.restore();
            
            time += 0.01;
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    return (
        <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}>
            {/* Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-20"
                 style={{
                     backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)`,
                     backgroundSize: '40px 40px'
                 }} />
            
            {/* Scanline */}
            <div className="absolute w-full h-0.5 bg-cyan-500/30 blur-sm animate-[scan_4s_linear_infinite] z-10 pointer-events-none" />
            
            <canvas ref={canvasRef} className="relative z-0 block" />
            
            <style>{`
                @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
            `}</style>
        </div>
    );
};
