'use client';

import React from 'react';
import { ArrowRight, Database, Sparkles, AlertOctagon, CheckCheck, Lightbulb, ShieldCheck } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const steps = [
    { title: 'New Problem', desc: 'Operational incident', icon: AlertOctagon },
    { title: 'Remember', desc: 'Hindsight recall', icon: Database, highlight: true },
    { title: 'Reason', desc: 'Gemini 2.5 Flash', icon: Sparkles, highlight: true },
    { title: 'Recommend', desc: 'Actionable fix', icon: Lightbulb },
    { title: 'Learn', desc: 'Store experience', icon: CheckCheck, isFinal: true },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-12">

        {/* Subtle pill badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-200/80 bg-white shadow-2xs text-xs text-zinc-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
          <span>Institutional Memory & Reasoning Engine</span>
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-950 leading-[1.12]">
            Your organization remembers.
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 font-normal leading-relaxed max-w-2xl mx-auto">
            An AI system that uses previous organizational experience to reason about new problems.
          </p>
        </div>

        {/* Workflow Stepper Grid */}
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/80 bg-white/70 backdrop-blur-xs shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-2.5">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  id={`landing-step-box-${idx + 1}`}
                  className={`group p-3.5 rounded-xl border text-left flex flex-col justify-between cursor-pointer select-none transition-all duration-300 ease-out transform-gpu hover:-translate-y-1 hover:shadow-md ${step.isFinal
                      ? 'border-emerald-200/90 bg-emerald-50/40 text-emerald-950 hover:border-emerald-500 hover:bg-emerald-50/90 hover:shadow-emerald-500/10 hover:ring-1 hover:ring-emerald-500/20'
                      : step.highlight
                        ? 'border-zinc-300/90 bg-zinc-50/80 hover:border-zinc-900 hover:bg-white hover:shadow-zinc-900/5 hover:ring-1 hover:ring-zinc-900/15'
                        : 'border-zinc-200/80 bg-white hover:border-zinc-900 hover:bg-zinc-50/40 hover:shadow-zinc-900/5 hover:ring-1 hover:ring-zinc-900/15'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-mono font-medium text-zinc-400 group-hover:text-zinc-700 transition-colors duration-200">
                      0{idx + 1}
                    </span>
                    <div className="p-1 rounded-md transition-all duration-300 transform-gpu group-hover:scale-115">
                      <Icon className={`w-3.5 h-3.5 transition-colors duration-200 ${step.isFinal
                          ? 'text-emerald-700 group-hover:text-emerald-900'
                          : 'text-zinc-600 group-hover:text-zinc-950'
                        }`} />
                    </div>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold transition-colors duration-200 ${step.isFinal
                        ? 'text-emerald-950 group-hover:text-emerald-950'
                        : 'text-zinc-900 group-hover:text-zinc-950'
                      }`}>
                      {step.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 group-hover:text-zinc-600 leading-tight mt-0.5 transition-colors duration-200">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Primary Action Button */}
        <div>
          <button
            onClick={onStart}
            id="start-btn"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-zinc-950 text-white font-medium text-sm hover:bg-zinc-800 active:scale-[0.99] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 cursor-pointer group"
          >
            <span>Start </span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Minimal Footer Note */}
        <p className="text-xs text-zinc-400 pt-2">
          Demonstrating persistent memory recall across three core enterprise operational incidents.
        </p>

      </div>
    </div>
  );
}
