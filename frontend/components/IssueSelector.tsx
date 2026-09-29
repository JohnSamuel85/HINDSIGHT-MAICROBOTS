'use client';

import React from 'react';
import { ArrowRight, Clock, Users, CreditCard, ChevronRight, AlertCircle, ArrowUpRight } from 'lucide-react';
import { IssueOption } from '@/types';
import { DEMO_ISSUES } from '@/lib/api';

interface IssueSelectorProps {
  onSelect: (issue: IssueOption) => void;
}

export default function IssueSelector({ onSelect }: IssueSelectorProps) {
  const getIcon = (scenario: string) => {
    switch (scenario) {
      case 'API Timeout':
        return <Clock className="w-5 h-5 text-zinc-800" />;
      case 'Customer Escalation':
        return <Users className="w-5 h-5 text-zinc-800" />;
      case 'Repeated Payment Failure':
        return <CreditCard className="w-5 h-5 text-zinc-800" />;
      default:
        return <Clock className="w-5 h-5 text-zinc-800" />;
    }
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col justify-center animate-in fade-in duration-300">
      
      {/* Section Header */}
      <div className="space-y-2 mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-zinc-500 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
          Select Incident Scenario
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
          What are you dealing with?
        </h2>
        <p className="text-sm text-zinc-600">
          Select an operational challenge to recall relevant historical lessons from Hindsight and reason via Gemini.
        </p>
      </div>

      {/* Issues Grid */}
      <div className="grid gap-4">
        {DEMO_ISSUES.map((issue) => (
          <button
            key={issue.id}
            id={`issue-btn-${issue.id}`}
            onClick={() => onSelect(issue)}
            className="w-full text-left p-6 rounded-2xl border border-zinc-200/90 bg-white hover:border-zinc-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.998] transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-zinc-100/80 border border-zinc-200/70 flex items-center justify-center shrink-0 group-hover:bg-zinc-200/60 group-hover:border-zinc-300 transition-colors">
                {getIcon(issue.scenario)}
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-zinc-950 text-base">
                    {issue.scenario}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200/80">
                    {issue.badge}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono hidden md:inline">
                    · {issue.entity}
                  </span>
                </div>
                <p className="text-sm text-zinc-700 leading-snug">
                  {issue.title}
                </p>
                <p className="text-xs text-zinc-500">
                  <span className="font-medium text-zinc-600">Context:</span> {issue.context}
                </p>
              </div>
            </div>

            <div className="flex items-center self-end sm:self-center gap-1.5 text-xs font-semibold text-zinc-500 group-hover:text-zinc-950 transition-colors shrink-0 px-3 py-1.5 rounded-lg bg-zinc-50 group-hover:bg-zinc-100 border border-zinc-200/60">
              <span>Reason</span>
              <ArrowUpRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 text-center text-xs text-zinc-400">
        Each scenario triggers multi-strategy recall against persistent postmortems in Hindsight bank <span className="font-mono text-zinc-600">MAICROBOTS</span>.
      </div>
    </div>
  );
}
