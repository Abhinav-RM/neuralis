import React from 'react';

interface NeuralisLogoProps {
    className?: string;
    size?: number;
    glow?: boolean;
}

export const NeuralisLogo: React.FC<NeuralisLogoProps> = ({ className, size = 64, glow = true }) => {
    // Coordinate layout representing the abstract neural 'N'
    const nodes = [
        { id: 'L1', x: 28, y: 22 },
        { id: 'L2', x: 18, y: 44 },
        { id: 'L3', x: 18, y: 64 },
        { id: 'L4', x: 28, y: 78 },
        { id: 'LI1', x: 42, y: 36 },
        { id: 'LI2', x: 42, y: 64 },
        
        { id: 'C1', x: 50, y: 50 }, // Central junction node
        
        { id: 'RI1', x: 58, y: 36 },
        { id: 'RI2', x: 58, y: 64 },
        { id: 'R1', x: 72, y: 22 },
        { id: 'R2', x: 82, y: 44 },
        { id: 'R3', x: 82, y: 64 },
        { id: 'R4', x: 72, y: 78 },
    ];

    // Node connections that form the neural network letter N
    const connections = [
        // Left column vertical boundary
        { from: 'L1', to: 'L2', type: 'primary' },
        { from: 'L2', to: 'L3', type: 'primary' },
        { from: 'L3', to: 'L4', type: 'primary' },

        // Left section mesh details
        { from: 'L1', to: 'LI1', type: 'primary' },
        { from: 'L2', to: 'LI1', type: 'secondary' },
        { from: 'L2', to: 'LI2', type: 'secondary' },
        { from: 'L3', to: 'LI2', type: 'secondary' },
        { from: 'L4', to: 'LI2', type: 'primary' },
        { from: 'LI1', to: 'LI2', type: 'primary' },

        // Internal stabilization lines
        { from: 'L1', to: 'L3', type: 'faint' },
        { from: 'L2', to: 'L4', type: 'faint' },

        // Connecting diagonal bridge
        { from: 'LI1', to: 'C1', type: 'heavy' },
        { from: 'C1', to: 'RI2', type: 'heavy' },
        { from: 'L1', to: 'C1', type: 'secondary' },
        { from: 'C1', to: 'R4', type: 'secondary' },
        { from: 'LI2', to: 'C1', type: 'faint' },
        { from: 'C1', to: 'RI1', type: 'faint' },

        // Right section mesh details
        { from: 'RI1', to: 'RI2', type: 'primary' },
        { from: 'R1', to: 'RI1', type: 'primary' },
        { from: 'R2', to: 'RI1', type: 'secondary' },
        { from: 'R2', to: 'RI2', type: 'secondary' },
        { from: 'R3', to: 'RI2', type: 'secondary' },
        { from: 'R4', to: 'RI2', type: 'primary' },

        // Right column vertical boundary
        { from: 'R1', to: 'R2', type: 'primary' },
        { from: 'R2', to: 'R3', type: 'primary' },
        { from: 'R3', to: 'R4', type: 'primary' },

        // Internal stabilization lines
        { from: 'R1', to: 'R3', type: 'faint' },
        { from: 'R2', to: 'R4', type: 'faint' },
    ];

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ overflow: 'visible' }}
        >
            <defs>
                {glow && (
                    <filter id="neuralis-glow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                )}
                
                {/* Responsive color gradients leveraging theme variables */}
                <linearGradient id="neuralis-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent-color, #3b82f6)" />
                    <stop offset="100%" stopColor="#00f2fe" />
                </linearGradient>

                <linearGradient id="neuralis-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00f2fe" />
                    <stop offset="100%" stopColor="var(--accent-light, #60a5fa)" />
                </linearGradient>
            </defs>

            {/* Soft background glow */}
            {glow && (
                <circle 
                    cx="50" 
                    cy="50" 
                    r="28" 
                    fill="var(--accent-color, #3b82f6)" 
                    opacity="0.1" 
                    filter="url(#neuralis-glow)" 
                />
            )}

            {/* Glowing lines */}
            <g filter={glow ? "url(#neuralis-glow)" : undefined}>
                {connections.map((conn, idx) => {
                    const fromNode = nodeMap.get(conn.from);
                    const toNode = nodeMap.get(conn.to);
                    if (!fromNode || !toNode) return null;

                    let stroke = "url(#neuralis-grad-1)";
                    let strokeWidth = 1.2;
                    let opacity = 0.75;

                    if (conn.type === 'heavy') {
                        strokeWidth = 1.8;
                        opacity = 0.95;
                    } else if (conn.type === 'secondary') {
                        stroke = "url(#neuralis-grad-2)";
                        strokeWidth = 1.0;
                        opacity = 0.55;
                    } else if (conn.type === 'faint') {
                        stroke = "var(--accent-color, #3b82f6)";
                        strokeWidth = 0.6;
                        opacity = 0.2;
                    }

                    return (
                        <line
                            key={`line-${idx}`}
                            x1={fromNode.x}
                            y1={fromNode.y}
                            x2={toNode.x}
                            y2={toNode.y}
                            stroke={stroke}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            opacity={opacity}
                        />
                    );
                })}
            </g>

            {/* Interactive nodes */}
            <g>
                {nodes.map((node) => {
                    const isCore = ['L1', 'L4', 'C1', 'R1', 'R4'].includes(node.id);
                    const r = isCore ? 2.2 : 1.6;
                    const fill = isCore ? "#ffffff" : "var(--accent-light, #60a5fa)";
                    
                    return (
                        <circle
                            key={`node-${node.id}`}
                            cx={node.x}
                            cy={node.y}
                            r={r}
                            fill={fill}
                            stroke="url(#neuralis-grad-1)"
                            strokeWidth={0.8}
                            filter={glow ? "url(#neuralis-glow)" : undefined}
                            style={{ transition: 'all 0.3s ease' }}
                        />
                    );
                })}
            </g>
        </svg>
    );
};
