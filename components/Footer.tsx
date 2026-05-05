import React from 'react';
import { LayoutDashboard, Twitter } from 'lucide-react';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full p-8 border-t-4 border-border bg-foreground text-background">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="space-y-2 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                        <div className="p-1 bg-background text-foreground border border-background rounded shadow-neo-sm">
                            <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <span className="text-xl font-black">BrutViz.</span>
                    </div>
                    <p className="text-sm font-bold text-background/40 max-w-xs">Built for speed, privacy, and beautiful data storytelling.</p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-8 text-sm font-black text-background/60">
                    <a href="#" className="hover:text-primary transition-colors">Product</a>
                    <a href="#" className="hover:text-primary transition-colors">Security</a>
                    
                    <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                </div>

                <div className="text-center md:text-right space-y-2">
                    <p className="text-xs text-background text-background/50">&copy; 2026 BRUTVIZ.IO ALL RIGHTS RESERVED.</p>
                    
                </div>
            </div>
        </footer>
    );
};
