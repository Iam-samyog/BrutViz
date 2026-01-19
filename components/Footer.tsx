import React from 'react';
import { LayoutDashboard, Twitter } from 'lucide-react';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full p-8 border-t-4 border-black bg-black text-white">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="space-y-2 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                        <div className="p-1 bg-white text-black border border-white rounded shadow-neo-sm">
                            <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <span className="text-xl font-black">BrutViz.</span>
                    </div>
                    <p className="text-sm font-bold text-white/40 max-w-xs">Built for speed, privacy, and beautiful data storytelling.</p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-8 text-sm font-black text-white/60">
                    <a href="#" className="hover:text-primary transition-colors uppercase">Product</a>
                    <a href="#" className="hover:text-primary transition-colors uppercase">Security</a>
                    
                    <a href="#" className="hover:text-primary transition-colors uppercase">Privacy</a>
                </div>

                <div className="text-center md:text-right space-y-2">
                    <p className="text-xs text-white uppercase text-white/50">&copy; 2026 BRUTVIZ.IO ALL RIGHTS RESERVED.</p>
                    
                </div>
            </div>
        </footer>
    );
};
