import { LayoutDashboard, Github, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarProps {
    onHistoryClick?: () => void;
    isHero?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onHistoryClick, isHero }) => {
    return (
        <nav className={cn(
            "w-full border-b-4 border-border sticky top-0 z-50 transition-colors duration-300",
            isHero ? "bg-black text-white" : "bg-background text-foreground"
        )}>
            <div className="max-w-7xl mx-auto p-4 md:p-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "p-2 border-2 border-border rounded-lg shadow-neo-sm rotate-[-3deg]",
                        isHero ? "bg-primary text-white" : "bg-primary text-primary-foreground"
                    )}>
                        <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <span className={cn(
                        "text-2xl font-black tracking-tighter",
                        isHero ? "text-white" : "text-foreground"
                    )}>BrutViz.</span>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                   
                    <a 
                        href="https://github.com/Iam-samyog/BrutViz" 
                        target="_blank" 
                        className={cn(
                            "p-2 border-2 border-border rounded-lg shadow-neo-sm hover:translate-y-[-2px] transition-all",
                            isHero ? "bg-white text-black" : "bg-card text-foreground"
                        )}
                        aria-label="View BrutViz source code on GitHub"
                        title="GitHub Repository"
                    >
                        <Github className="w-5 h-5" />
                    </a>
                </div>
            </div>
        </nav>
    );
};
