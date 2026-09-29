'use client';

import React, { useRef, useEffect } from 'react';
import { CheckCircle2, Loader2, Circle, AlertCircle, Database, Sparkles, Brain, ArrowRight, CheckCheck } from 'lucide-react';
import { AnalysisStep, IssueOption } from '@/types';

interface AnalysisFlowProps {
  issue: IssueOption;
  steps: AnalysisStep[];
  currentStepIndex: number;
  error?: string | null;
  isComplete?: boolean;
  onProceed?: () => void;
}

const ALL_STEP_LABELS = [
  'Understanding the issue...',
  'Searching organizational memory...',
  'Hindsight found relevant memories...',
  'Sending historical context to Gemini...',
  'Gemini is reasoning...',
  'Recommendation generated...',
  'Saving useful experience to memory...'
];

export default function AnalysisFlow({
  issue,
  steps,
  currentStepIndex,
  error,
  isComplete,
  onProceed
}: AnalysisFlowProps) {
  const stepCount = ALL_STEP_LABELS.length;
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const isFinished = isComplete || completedSteps >= stepCount || steps.some(s => s.id === 'step-7' && s.status === 'completed');

  // Ref tracking for active step and results ready card
  const activeStepRef = useRef<HTMLDivElement | null>(null);
  const proceedCardRef = useRef<HTMLDivElement | null>(null);

  // Automatically scroll down to follow process steps and completed card
  useEffect(() => {
    if (isFinished && proceedCardRef.current) {
      proceedCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (activeStepRef.current) {
      activeStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStepIndex, isFinished]);

  // Compute live progress percentage with actual numbers
  const livePercentage = isFinished
    ? 100
    : Math.min(95, Math.max(14, Math.round(((Math.max(currentStepIndex, completedSteps) + 0.6) / stepCount) * 100)));

  // Progress line height percentage (0% to 100%)
  const lineProgress = isFinished
    ? 100
    : Math.min(100, Math.max(0, (Math.max(currentStepIndex, completedSteps) / (stepCount - 1)) * 100));

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 flex flex-col justify-center animate-in fade-in duration-300">
      
      {/* Active Incident Banner */}
      <div className="p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-xs mb-8 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isFinished ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider">
              {isFinished ? 'Incident Diagnosed' : 'Diagnosing Incident'}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
            {issue.scenario}
          </span>
        </div>
        <h3 className="text-base font-semibold text-zinc-950 leading-snug">
          {issue.title}
        </h3>
        <p className="text-xs text-zinc-500">
          <span className="font-medium text-zinc-600">Context:</span> {issue.context}
        </p>
      </div>

      {/* Progress Stepper Card */}
      <div className="border border-zinc-200/90 rounded-2xl bg-white p-6 sm:p-7 shadow-xs space-y-6">
        
        {/* Pipeline Header with Live % and Progress Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center shadow-xs">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-zinc-950 block leading-tight">
                Orchestration Pipeline
              </span>
              <span className="text-[11px] text-zinc-500 block">
                Hindsight recall & Gemini reasoning
              </span>
            </div>
          </div>

          {/* Live Percentage Indicator replacing LIVE STREAM text */}
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <div className="w-24 sm:w-28 h-2 rounded-full bg-zinc-100 overflow-hidden border border-zinc-200/80 p-0.5 shadow-inner">
              <div 
                className="h-full bg-zinc-950 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${livePercentage}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100/90 border border-zinc-200/80 shadow-2xs">
              <span className={`w-1.5 h-1.5 rounded-full ${isFinished ? 'bg-emerald-500' : 'bg-zinc-900 animate-pulse'}`} />
              <span className="text-xs font-mono font-bold text-zinc-950 tabular-nums">
                {livePercentage}%
              </span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Analysis Pipeline Notice</p>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        ) : (
          <div className="relative pl-1 sm:pl-2 space-y-3 sm:space-y-4">
            
            {/* Dynamic Connected Progress Line */}
            <div className="absolute left-[18px] sm:left-[22px] top-4 bottom-4 w-[2px] bg-zinc-100 rounded-full z-0" />
            <div 
              className="absolute left-[18px] sm:left-[22px] top-4 w-[2px] bg-zinc-950 rounded-full transition-all duration-500 ease-out z-0"
              style={{ height: `${lineProgress}%` }}
            />

            {ALL_STEP_LABELS.map((label, index) => {
              const stepRecord = steps.find(s => s.label.toLowerCase().includes(label.slice(0, 15).toLowerCase())) || steps[index];
              const isStepDone = isFinished || index < currentStepIndex || (stepRecord && stepRecord.status === 'completed');
              const isCurrent = !isFinished && index === currentStepIndex && (!stepRecord || stepRecord.status !== 'completed');
              const isPending = !isFinished && index > currentStepIndex;

              return (
                <div
                  key={index}
                  ref={isCurrent ? activeStepRef : null}
                  className={`flex items-start gap-3.5 relative z-10 transition-all duration-300 transform-gpu ${
                    isCurrent
                      ? 'p-3 -mx-2.5 rounded-xl bg-zinc-50/90 border border-zinc-200/90 shadow-2xs scale-[1.01]'
                      : 'p-1.5 -mx-1.5 rounded-lg'
                  } ${isPending ? 'opacity-30' : 'opacity-100'}`}
                >
                  {/* Step Status Icon */}
                  <div className="shrink-0 mt-0.5 relative">
                    {isStepDone ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 animate-in zoom-in-75 duration-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    ) : isCurrent ? (
                      <div className="relative flex items-center justify-center">
                        <span className="absolute -inset-1 rounded-full bg-zinc-900/10 animate-ping opacity-75" />
                        <div className="w-6 h-6 rounded-full bg-zinc-950 text-white flex items-center justify-center shadow-xs">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 font-mono text-[10px]">
                        0{index + 1}
                      </div>
                    )}
                  </div>

                  {/* Step Label & Dynamic Monospace Details */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm ${
                        isCurrent 
                          ? 'font-semibold text-zinc-950' 
                          : isStepDone 
                          ? 'font-medium text-zinc-800' 
                          : 'font-normal text-zinc-400'
                      }`}>
                        {label}
                      </p>
                      {isCurrent && (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-1.5 py-0.5 rounded bg-white border border-zinc-200/70 shrink-0">
                          Active
                        </span>
                      )}
                    </div>

                    {stepRecord?.detail && (isStepDone || isCurrent) && (
                      <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                        <p className={`text-xs font-mono leading-relaxed p-2 rounded-lg border ${
                          isCurrent 
                            ? 'bg-white text-zinc-700 border-zinc-200/80 shadow-2xs' 
                            : 'bg-zinc-50/50 text-zinc-500 border-zinc-100'
                        }`}>
                          {stepRecord.detail}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Results are Ready - Engaging Callout Card & Proceed Button */}
        {isFinished && onProceed && (
          <div 
            ref={proceedCardRef}
            className="p-5 sm:p-6 rounded-2xl bg-zinc-950 text-white border border-zinc-800 shadow-md animate-in zoom-in-95 duration-300 space-y-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-white tracking-tight">
                    Results are ready!
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    100% Complete
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Institutional memories recalled from Hindsight · Gemini reasoning evaluated past failures and fixes · New experience saved.
                </p>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-zinc-800">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                Actionable recommendation synthesized
              </span>
              <button
                id="proceed-results-btn"
                onClick={onProceed}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 active:scale-[0.99] transition-all shadow-sm cursor-pointer group"
              >
                <span>Proceed to Results</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Footer Info */}
      <div className="mt-6 flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>Step {Math.min(stepCount, isFinished ? stepCount : currentStepIndex + 1)} of {stepCount}</span>
        <span className="font-mono text-[11px]">Real backend SSE stream</span>
      </div>

    </div>
  );
}
