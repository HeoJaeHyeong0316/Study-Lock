import React from 'react';

interface TimerCircleProps {
    timeLeftSeconds: number;
    totalGoalSeconds: number;
}

export const TimerCircle: React.FC<TimerCircleProps> = ({ timeLeftSeconds, totalGoalSeconds }) => {
    const strokeLength = 691; // 2 * PI * r = 2 * 3.14159 * 110
    
    // Prevent division by zero
    const goal = totalGoalSeconds > 0 ? totalGoalSeconds : 1;
    const percentElapsed = (goal - timeLeftSeconds) / goal;
    const offset = strokeLength - (percentElapsed * strokeLength);

    // Format minutes and seconds digits (e.g. "50:00")
    const mins = Math.floor(timeLeftSeconds / 60);
    const secs = timeLeftSeconds % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    return (
        <div className="circular-timer-box">
            <svg className="timer-circle-svg" viewBox="0 0 240 240">
                <circle className="timer-track-circle" cx="120" cy="120" r="110" />
                <circle 
                    className="timer-fill-circle" 
                    id="timerFillCircle" 
                    cx="120" 
                    cy="120" 
                    r="110"
                    style={{ strokeDashoffset: offset }}
                />
            </svg>
            <div className="timer-digits" id="timerDisplayDigits">{formatted}</div>
        </div>
    );
};
