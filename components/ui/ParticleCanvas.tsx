import React, { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

interface ParticleCanvasProps {
    active: boolean;
    color?: string;
    count?: number;
}

export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({ active, color = '#9d4edd', count = 50 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const animationId = useRef<number>(0);

    const spawnParticles = (width: number, height: number) => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 2;
            newParticles.push({
                x: width / 2,
                y: height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
        particles.current = newParticles;
    };

    useEffect(() => {
        if (active && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Handle High-DPI
            const rect = canvas.parentElement?.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            if (rect) {
                // Buffer size = physical pixels
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                // CSS size = logical pixels
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;
                // Scale context
                ctx.scale(dpr, dpr);
                // Logic uses logical coords
                spawnParticles(rect.width, rect.height); 
            }

            let lastTime = performance.now();

            const animate = (timestamp: number) => {
                if (!ctx || particles.current.length === 0) return;
                
                const deltaMs = timestamp - lastTime;
                lastTime = timestamp;
                const dt = Math.max(0.1, Math.min(3.0, deltaMs / 16.667));
                
                // Clear using logical coords
                ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
                const height = canvas.height / dpr;
                
                particles.current.forEach((p) => {
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.vy += 0.15 * dt; // Gravity
                    p.life -= 0.02 * dt; // Decay
                    p.size *= Math.pow(0.95, dt); // Shrink

                    ctx.globalAlpha = Math.max(0, p.life);
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();

                    // Boundary bounce (floor)
                    if (p.y > height && p.vy > 0) {
                        p.vy *= -0.6;
                        p.y = height;
                    }
                });

                particles.current = particles.current.filter(p => p.life > 0);

                if (particles.current.length > 0) {
                    animationId.current = requestAnimationFrame(animate);
                }
            };

            cancelAnimationFrame(animationId.current);
            lastTime = performance.now();
            animationId.current = requestAnimationFrame(animate);
        }

        return () => cancelAnimationFrame(animationId.current);
    }, [active, color, count]);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 pointer-events-none z-50 w-full h-full"
        />
    );
};