import React, { useMemo } from 'react';
import {
    AreaChart,
    Area,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import type { Conversation } from '../../utils/storage';

interface TimelineViewProps {
    conversations: Conversation[];
    onSelectDate: (date: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ conversations, onSelectDate }) => {
    const data = useMemo(() => {
        const grouped = conversations.reduce((acc, curr) => {
            const date = new Date(curr.timestamp).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = { date, count: 0, fullDate: curr.timestamp };
            }
            acc[date].count += 1;
            return acc;
        }, {} as Record<string, { date: string; count: number; fullDate: number }>);

        // Fill in missing days for the last 7 days to make a proper sparkline
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString();
            result.push(grouped[dateStr] || { date: dateStr, count: 0, fullDate: d.getTime() });
        }
        return result;
    }, [conversations]);

    const totalCount = useMemo(() => data.reduce((acc, curr) => acc + curr.count, 0), [data]);

    return (
        <div className="flex items-center justify-between w-full h-full">
            <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Last 7 Days</span>
                <span className="text-2xl font-bold text-zinc-100">{totalCount} <span className="text-xs font-normal text-zinc-500">memories</span></span>
            </div>
            <div className="w-24 h-12">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} onClick={(data: any) => data && data.activePayload && onSelectDate(data.activePayload[0].payload.date)}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '4px', fontSize: '10px', padding: '4px' }}
                            itemStyle={{ color: '#e4e4e7' }}
                            cursor={{ stroke: '#52525b', strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#818cf8"
                            fillOpacity={1}
                            fill="url(#colorCount)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
