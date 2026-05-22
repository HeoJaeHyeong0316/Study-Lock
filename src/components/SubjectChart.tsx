import React from 'react';

interface Session {
    id: string;
    subject: string;
    date: string;
    duration: number;
    status: 'SUCCESS' | 'FAILED';
}

interface SubjectChartProps {
    sessions: Session[];
}

export const SubjectChart: React.FC<SubjectChartProps> = ({ sessions }) => {
    const subjectTimes: Record<string, number> = {};
    let totalFocusTime = 0;

    // Calculate time per subject
    sessions
        .filter(s => s.status === 'SUCCESS')
        .forEach(s => {
            subjectTimes[s.subject] = (subjectTimes[s.subject] || 0) + s.duration;
            totalFocusTime += s.duration;
        });

    if (totalFocusTime === 0) {
        return (
            <div className="svg-chart-container" id="donutChartContainer" style={{ justifyContent: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    아직 성공한 집중 세션이 없습니다.
                </span>
            </div>
        );
    }

    const chartColors = ['#00e1ff', '#8b5cf6', '#ff4e50', '#00ff88', '#f9d423'];
    const slices = Object.entries(subjectTimes).map(([subj, time], index) => ({
        label: subj,
        value: time,
        percent: time / totalFocusTime,
        color: chartColors[index % chartColors.length]
    }));

    const radius = 50;
    const strokeWidth = 12;
    const center = 80;
    const circumference = 2 * Math.PI * radius; // 314.159

    let currentOffset = 0;

    return (
        <div className="svg-chart-container" id="donutChartContainer">
            <svg width="100%" height="100%" viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
                {/* Center hole background shadow */}
                <circle cx={center} cy={center} r={radius} fill="var(--bg-deep)" />
                
                {/* Silent Base track ring */}
                <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth={strokeWidth} />
                
                {slices.map((slice, i) => {
                    const strokeDash = slice.percent * circumference;
                    const strokeOffset = circumference - strokeDash + currentOffset;
                    currentOffset -= strokeDash;

                    return (
                        <circle 
                            key={i}
                            cx={center} 
                            cy={center} 
                            r={radius} 
                            fill="none"
                            stroke={slice.color} 
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference} 
                            strokeDashoffset={strokeOffset}
                            strokeLinecap="round" 
                        />
                    );
                })}
                
                {/* Central Total metric text */}
                <text x={center} y={center - 3} fontSize="8.5" fontWeight="600" fill="var(--text-muted)" textAnchor="middle">
                    총 시간
                </text>
                <text x={center} y={center + 11} fontSize="13" fontWeight="800" fill="var(--text-pure)" textAnchor="middle">
                    {totalFocusTime}분
                </text>
                
                {slices.map((slice, i) => {
                    const legendY = 32 + (i * 20);
                    return (
                        <g key={i}>
                            <circle cx="160" cy={legendY - 4} r="5" fill={slice.color} />
                            <text x="172" y={legendY} fontSize="10.5" fontWeight="600" fill="var(--text-pure)">
                                {slice.label}
                            </text>
                            <text x="280" y={legendY} fontSize="10.5" fontWeight="700" fill="var(--text-muted)" textAnchor="end">
                                {Math.round(slice.percent * 100)}% ({slice.value}m)
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};
