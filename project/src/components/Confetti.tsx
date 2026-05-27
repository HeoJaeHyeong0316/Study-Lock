import React, { useEffect, useRef } from 'react';

interface ConfettiProps {
    active: boolean;
}

interface Particle {
    x: number;
    y: number;
    r: number;
    d: number;
    color: string;
    tilt: number;
    tiltAngleIncremental: number;
    tiltAngle: number;
    speedY: number;
    speedX: number;
}

export const Confetti: React.FC<ConfettiProps> = ({ active }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const isRunning = useRef<boolean>(false);
    const particles = useRef<Particle[]>([]);

    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            if (!canvas || !canvas.parentElement) return;
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

    useEffect(() => {
        if (active) {
            launch();
        } else {
            stop();
        }
    }, [active]);

    const launch = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        // Resize first
        const rect = canvas.parentElement?.getBoundingClientRect();
        if (rect) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }

        isRunning.current = true;
        const colors = ['#00e1ff', '#8b5cf6', '#ff4e50', '#00ff88', '#f9d423'];
        
        // Seed 120 confetti chips
        const pArray: Particle[] = [];
        for (let i = 0; i < 120; i++) {
            pArray.push({
                x: Math.random() * canvas.width,
                y: Math.random() * -100 - 20,
                r: Math.random() * 6 + 4,
                d: Math.random() * canvas.height,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.random() * 10 - 5,
                tiltAngleIncremental: Math.random() * 0.07 + 0.02,
                tiltAngle: 0,
                speedY: Math.random() * 2 + 3,
                speedX: Math.random() * 2 - 1
            });
        }
        particles.current = pArray;

        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        animate();
    };

    const animate = () => {
        if (!isRunning.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let activeCount = 0;

        particles.current.forEach(p => {
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += p.speedY;
            p.x += p.speedX + Math.sin(p.tiltAngle) * 0.5;
            p.tilt = Math.sin(p.tiltAngle - (p.r / 2)) * 10;

            if (p.y <= canvas.height + 20) {
                activeCount++;
            }

            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + (p.r / 2), p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + (p.r / 2));
            ctx.stroke();
        });

        if (activeCount > 0) {
            animationFrameId.current = requestAnimationFrame(animate);
        } else {
            stop();
        }
    };

    const stop = () => {
        isRunning.current = false;
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    return (
        <canvas
            ref={canvasRef}
            className="completion-canvas"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}
        />
    );
};
