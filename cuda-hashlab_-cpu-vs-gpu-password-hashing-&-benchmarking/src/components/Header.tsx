import React from 'react';
import { Cpu, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onQuickRun: () => void;
  isRunning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onQuickRun,
  isRunning
}) => {
  const navItems = [
    { id: 'benchmark', label: 'Benchmark Lab' },
    { id: 'cuda', label: 'CUDA Architecture' },
    { id: 'internals', label: 'SHA-256 Internals' },
    { id: 'security', label: 'Security & KDFs' },
    { id: 'verify', label: 'NIST Verification' },
    { id: 'errors', label: 'CUDA Error Safety' }
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            CUDA HashLab
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                activeTab === item.id
                  ? 'text-white border-b-2 border-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onQuickRun}
            disabled={isRunning}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
          >
            {isRunning ? 'Benchmarking...' : 'Run Benchmark'}
          </button>
        </div>
      </div>
    </header>
  );
};
