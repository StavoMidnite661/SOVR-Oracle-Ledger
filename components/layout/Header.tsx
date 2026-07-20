
import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
    currentViewName: string;
    isConsoleOpen: boolean;
    onMenuToggle?: () => void;
    onToggleConsole?: () => void;
    isDemoMode?: boolean; // NEW: For Vercel / fallback indicator
}

export const Header: React.FC<HeaderProps> = ({ 
  currentViewName, 
  isConsoleOpen,
  onMenuToggle, 
  onToggleConsole
}) => {
  return (
    <header className="bg-black/40 backdrop-blur-xl px-3 sm:px-6 py-3 flex justify-between items-center border-b border-white/5 relative z-40">
      <div className="flex items-center space-x-3 sm:space-x-6 min-w-0">
        {/* Mobile hamburger */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-1 text-sov-light-alt hover:text-sov-accent transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        )}

        <h2 className="text-lg sm:text-xl font-black italic tracking-tighter uppercase truncate flex items-center gap-2">
          <span className="text-sov-light">{currentViewName.split(/_| /)[0]}</span>
          <span className="text-sov-accent">{currentViewName.split(/_| /).slice(1).join(' ')}</span>
        </h2>
        
        {/* Telemetry Module — hidden below md */}
        <div className="hidden md:flex items-center space-x-6 border-l border-white/10 pl-6">
           <div>
             <p className="text-[8px] font-black text-sov-light-alt uppercase tracking-[0.2em] mb-0.5 opacity-50">Pulse Frequency</p>
             <p className="text-[10px] font-mono text-sov-accent">2.44 GHz</p>
           </div>
           <div>
             <p className="text-[8px] font-black text-sov-light-alt uppercase tracking-[0.2em] mb-0.5 opacity-50">Uptime State</p>
             <p className="text-[10px] font-mono text-sov-green">99.98% OPS</p>
           </div>
           <div>
             <p className="text-[8px] font-black text-sov-light-alt uppercase tracking-[0.2em] mb-0.5 opacity-50">Active Node</p>
             <p className="text-[10px] font-mono uppercase text-sov-primary">
               SOVR-MAIN-1
             </p>
           </div>
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-6 flex-shrink-0">
        {/* Matrix Status — compact inline badge (Hardcoded Live) */}
        <div 
          className="hidden sm:flex items-center space-x-2 bg-black/20 px-3 py-1.5 rounded-full border border-sov-green/20 transition-all"
        >
          <div className="w-2 h-2 rounded-full bg-sov-green shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="text-[9px] font-black text-sov-light-alt uppercase tracking-[0.2em]">Matrix:</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-sov-green">
            Live
          </span>
        </div>

        <button 
          onClick={onToggleConsole}
          className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer group/console ${isConsoleOpen ? 'bg-sov-blue/20 border-sov-blue/50' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
          title="Toggle System Console (Ctrl+`)"
        >
          <div className={`w-2 h-2 rounded-full transition-all ${isConsoleOpen ? 'bg-sov-blue animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-sov-light/30 shadow-[0_0_8px_rgba(255,255,255,0.2)]'}`} />
          <span className="text-[9px] font-black text-sov-light-alt uppercase tracking-[0.2em]">Console:</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${isConsoleOpen ? 'text-sov-blue' : 'text-sov-light/50'}`}>
            {isConsoleOpen ? 'Active' : 'Standby'}
          </span>
        </button>

        <div className="text-right hidden sm:block">
          <p className="text-xs font-black text-sov-light uppercase tracking-widest">SOVR Development Holdings LLC</p>
          <div className="flex items-center justify-end space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-sov-green shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <p className="text-[10px] text-sov-light-alt font-black uppercase tracking-widest opacity-60">Auth Verified</p>
          </div>
        </div>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-sov-accent to-sov-primary rounded-full opacity-25 group-hover:opacity-50 blur transition-all duration-300"></div>
          <img
            className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-white/10 grayscale hover:grayscale-0 transition-all duration-500"
            src="https://picsum.photos/id/64/100/100"
            alt="User avatar"
          />
        </div>
      </div>
    </header>
  );
};
