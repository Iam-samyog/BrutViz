"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedBackgroundProps {
    count?: number;
    opacity?: number;
}

export default function AnimatedBackground({ count = 40, opacity = 0.15 }: AnimatedBackgroundProps) {
    const colors = ['bg-primary', 'bg-[#FF2D55]', 'bg-[#AF52DE]', 'bg-[#22c55e]', 'bg-[#FFCC00]', 'bg-[#FF9500]'];

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {Array.from({ length: count }).map((_, i) => {
                const size = Math.random() * 50 + 15;
                const color = colors[Math.floor(Math.random() * colors.length)];
                const top = Math.random() * 100 + '%';
                const left = Math.random() * 100 + '%';
                const delay = Math.random() * 3;
                const duration = Math.random() * 8 + 6;

                return (
                    <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                            scale: [0, 1.1, 1],
                            opacity: [0, opacity * 2, opacity],
                            y: [0, Math.random() * -30 - 10, 0],
                            x: [0, Math.random() * 15 - 7, 0]
                        }}
                        transition={{
                            scale: { duration: 0.6, delay: delay },
                            opacity: { duration: 0.6, delay: delay },
                            y: { duration: duration, repeat: Infinity, ease: "easeInOut", delay: delay + 0.6 },
                            x: { duration: duration, repeat: Infinity, ease: "easeInOut", delay: delay + 0.6 }
                        }}
                        className={`absolute rounded-full border border-border/10 ${color}`}
                        style={{ 
                            top, 
                            left, 
                            width: size, 
                            height: size,
                            filter: 'blur(0.5px)'
                        }}
                    />
                );
            })}
        </div>
    );
}
