'use client';

import React from 'react';
import { Database, Sparkles, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import { HealthStatus } from '@/types';

interface HeaderProps {
  health: HealthStatus | null;
  onReset: () => void;
}

export default function Header({ health, onReset }: HeaderProps) {
  const isHealthy = health?.status === 'healthy';

  return (
    <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50 transition-all">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo / Brand */}
        <button
          onClick={onReset}
          id="header-logo-btn"
          aria-label="Our Projects logo"
          className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
          title="Our Projects logo"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-semibold text-xs shadow-sm ring-1 ring-zinc-900/10 group-hover:bg-zinc-800 transition-all">
            OM
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-zinc-900 tracking-tight text-sm">
                Organizational Memory
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200/60">
                MVP
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 block leading-tight">
              Hindsight Memory + Gemini 2.5 Flash
            </span>
          </div>
        </button>

        {/* Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">

          {/* Hindsight Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-200/70 bg-zinc-50/80 text-zinc-700 shadow-2xs">
            <Database className="w-3.5 h-3.5 text-zinc-500" />
            <span className="font-medium text-zinc-600">Memory:</span>
            <span className="font-mono text-[11px] font-semibold text-zinc-900">
              {health?.bank_id || 'MAICROBOTS'}
            </span>
            {isHealthy ? (
              <span className="relative flex h-2 w-2 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </div>

          {/* Gemini Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-200/70 bg-zinc-50/80 text-zinc-700 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
            <span className="font-medium text-zinc-600">Reasoning:</span>
            <span className="font-mono text-[11px] font-semibold text-zinc-900">
              {health?.model || 'gemini-2.5-flash'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>

          {/* System Health Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border border-zinc-200 bg-white text-zinc-700 shadow-2xs">
            <Activity className={`w-3 h-3 ${isHealthy ? 'text-emerald-600' : 'text-amber-500'}`} />
            <span>{isHealthy ? 'Ready' : 'Connecting'}</span>
          </div>

        </div>
      </div>
    </header>
  );
}
