import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { Conversation } from '../../utils/storage';

interface GraphViewProps {
    conversations: Conversation[];
    onSelectConversation: (id: number) => void;
}

const GraphView: React.FC<GraphViewProps> = ({ conversations, onSelectConversation }) => {
    const [dimensions, setDimensions] = useState({ width: 400, height: 400 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight
            });
        }
    }, []);

    // Transform conversations into graph data
    const data = React.useMemo(() => {
        const nodes: any[] = [];
        const links: any[] = [];

        conversations.forEach(conv => {
            // Add conversation node
            nodes.push({
                id: conv.id,
                group: 'conversation',
                val: 10,
                name: conv.title || 'Untitled',
                platform: conv.platform
            });

            // Logic to create links (e.g., same platform, same day)
            // For now, link sequential conversations on the same platform
            const samePlatform = conversations.filter(c => c.platform === conv.platform && c.id !== conv.id);
            samePlatform.forEach(other => {
                if (Math.abs(other.timestamp - conv.timestamp) < 86400000) { // Within 24 hours
                    links.push({
                        source: conv.id,
                        target: other.id,
                        value: 1
                    });
                }
            });
        });

        return { nodes, links };
    }, [conversations]);

    return (
        <div ref={containerRef} className="w-full h-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800/50">
            <ForceGraph2D
                width={dimensions.width}
                height={dimensions.height}
                graphData={data}
                nodeLabel="name"
                nodeColor={(node: any) => {
                    switch (node.platform) {
                        case 'chatgpt': return '#10b981'; // emerald-500
                        case 'claude': return '#f97316'; // orange-500
                        default: return '#3b82f6'; // blue-500
                    }
                }}
                nodeRelSize={6}
                linkColor={() => '#27272a'} // zinc-800
                backgroundColor="#09090b" // zinc-950
                onNodeClick={(node: any) => onSelectConversation(node.id)}
            />
        </div>
    );
};

export default GraphView;
