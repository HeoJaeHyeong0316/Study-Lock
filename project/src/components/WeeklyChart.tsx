import React from 'react';

interface Session {
    id: string;
    subject: string;
    date: string;
    duration: number;
    status: 'SUCCESS' | 'FAILED';
}

interface WeeklyChartProps {
    sessions: Session[];
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ sessions }) => {
    // 7 days ago to today calculation
    const now = new Date();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const chartData = [];

    // Build last 7 days metrics
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const label = days[date.getDay()];

        // Accumulate successful session durations on this day
        const dailyDuration = sessions
            .filter(s => s.date === dateStr && s.status === 'SUCCESS')
            .reduce((acc, curr) => acc + curr.duration, 0);

        chartData.push({ label, value: dailyDuration });
    }

    const maxVal = Math.max(...chartData.map(d => d.value), 60); // min ceiling is 60 minutes for proportions
    const svgWidth = 340;
    const svgHeight = 160;
    const barPadding = 16;
    const barWidth = (svgWidth - (barPadding * 8)) / 7;

    return (
        <div className="svg-chart-container" id="barChartContainer">
            <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--accent-cyan)" />
                        <stop offset="100%" stopColor="var(--accent-purple)" />
                    </linearGradient>
                </defs>
                
                {/* Ground grid horizontal floor line */}
                <line x1="10" y1="130" x2={svgWidth - 10} y2="130" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
                
                {chartData.map((d, i) => {
                    const barHeight = (d.value / maxVal) * 110;
                    const x = barPadding + i * (barWidth + barPadding);
                    const y = 130 - barHeight;

                    return (
                        <g key={i}>
                            {/* Background column tracker */}
                            <rect x={x} y="20" width={barWidth} height="110" rx="4" fill="rgba(255,255,255,0.02)"/>
                            
                            {/* Glowing foreground bar */}
                            <rect x={x} y={y} width={barWidth} height={barHeight} rx="4" fill="url(#barGrad)"/>
                            
                            {/* Text tooltips */}
                            {d.value > 0 && (
                                <text x={x + barWidth / 2} y={y - 6} fontSize="9" fill="var(--accent-cyan)" fontWeight="700" textAnchor="middle">
                                    {d.value}m
                                </text>
                            )}
                            
                            {/* X axis weekday labels */}
                            <text x={x + barWidth / 2} y="148" fontSize="11" fill="var(--text-muted)" fontWeight="500" textAnchor="middle">
                                {d.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};
