import { LayoutDashboard, Github, Clock } from 'lucide-react';

interface NavbarProps {
    onHistoryClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onHistoryClick }) => {
    return (
        <nav className="w-full border-b-4 border-black bg-black sticky top-0 z-50">
            <div className="max-w-7xl mx-auto p-4 md:p-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary text-white border-2 border-white rounded-lg shadow-neo-sm rotate-[-3deg]">
                        <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-white">BrutViz.</span>
                </div>
                <div className="flex items-center gap-3 md:gap-4 text-white">
                   

                    <a href="https://github.com/Iam-samyog/BrutViz" target="_blank" className="p-2 bg-white text-black border-2 border-black rounded-lg shadow-neo-sm hover:translate-y-[-2px] transition-all">
                        <Github className="w-5 h-5" />
                    </a>
                </div>
            </div>
        </nav>
    );
};
