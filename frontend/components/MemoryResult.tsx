'use client';

import React from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Database, Sparkles, RefreshCw, ShieldAlert, CheckCheck, Lightbulb } from 'lucide-react';
import { AnalysisResult, IssueOption } from '@/types';

interface MemoryResultProps {
  issue: IssueOption;
  result: AnalysisResult;
  onReset: () => void;
}

export default function MemoryResult({
  issue,
  result,
  onReset
}: MemoryResultProps) {
  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 space-y-8 animate-in fade-in duration-300">
      
      {/* Incident Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-mono font-medium text-zinc-500 uppercase tracking-wider">
              Diagnosis & Recommended Resolution
            </span>
          </div>
          <h2 className="text-xl font-semibold text-zinc-950 mt-1">
            {issue.title}
          </h2>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200/80 self-start sm:self-center shrink-0">
          {issue.scenario}
        </span>
      </div>

      {/* Recommended Action Hero Box */}
      <div className="border border-zinc-900 rounded-2xl bg-zinc-950 text-white p-6 sm:p-7 shadow-sm space-y-3 relative overflow-hidden">
        <div className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase text-zinc-400">
          <Lightbulb className="w-4 h-4 text-amber-300" />
          <span>Recommended Action</span>
        </div>
        <p className="text-lg sm:text-xl font-medium leading-relaxed text-zinc-100">
          {result.recommendation}
        </p>
      </div>

      {/* Institutional Rationale */}
      {result.reasoning && (
        <div className="border border-zinc-200/90 rounded-2xl bg-white p-6 shadow-2xs space-y-2.5">
          <h4 className="text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-zinc-700" />
            Institutional Reasoning
          </h4>
          <p className="text-sm text-zinc-700 leading-relaxed">
            {result.reasoning}
          </p>
        </div>
      )}

      {/* Based on previous organizational experience */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-950 tracking-tight flex items-center gap-2">
            <Database className="w-4 h-4 text-zinc-700" />
            Based on previous organizational experience
          </h3>
          <span className="text-xs text-zinc-400 font-mono">
            Hindsight Verified Precedents
          </span>
        </div>

        <div className="grid gap-3">
          {result.similar_cases && result.similar_cases.length > 0 ? (
            result.similar_cases.map((mem, idx) => {
              const isFailed = mem.outcome === 'FAILED' || (mem.worked_or_failed && mem.worked_or_failed.toLowerCase() === 'failed');
              
              let snippet = mem.summary || mem.text;
              if (mem.case_id && snippet.startsWith(`[${mem.case_id}]`)) {
                snippet = snippet.replace(`[${mem.case_id}]`, '').trim();
              }
              if (snippet.includes('Lesson Learned:')) {
                snippet = snippet.split('Lesson Learned:')[1].split('\n')[0].trim();
              } else if (snippet.includes('Action Attempted:')) {
                const actionPart = snippet.split('Action Attempted:')[1].split('\n')[0].trim();
                const outcomePart = isFailed ? 'previously failed.' : 'previously resolved the issue.';
                snippet = `${actionPart} — ${outcomePart}`;
              }

              return (
                <div
                  key={idx}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                    isFailed 
                      ? 'border-rose-200/80 bg-rose-50/20 hover:border-rose-300' 
                      : 'border-emerald-200/80 bg-emerald-50/20 hover:border-emerald-300'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {isFailed ? (
                      <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                        <XCircle className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {mem.case_id && (
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white border border-zinc-200 text-zinc-900 shadow-2xs">
                          {mem.case_id}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                        isFailed 
                          ? 'bg-rose-100/60 text-rose-800 border-rose-200' 
                          : 'bg-emerald-100/60 text-emerald-800 border-emerald-200'
                      }`}>
                        {isFailed ? 'Historical Failure (Avoid)' : 'Verified Resolution'}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-800 leading-snug">
                      {snippet}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
              Historical memories were analyzed by Gemini to synthesize this recommendation.
            </div>
          )}
        </div>
      </div>

      {/* Memory Updated Indicator */}
      <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-center justify-between text-xs text-emerald-950 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <CheckCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <div>
            <span className="font-semibold block sm:inline">Memory updated ✓</span>{' '}
            <span className="text-emerald-800 text-[11px] block sm:inline">
              {result.retained_memory_summary || 'Incident diagnosis and resolution stored in Hindsight.'}
            </span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-emerald-800 bg-white/60 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
          BANK: MAICROBOTS
        </span>
      </div>

      {/* Action Button */}
      <div className="pt-2 flex justify-center">
        <button
          onClick={onReset}
          id="analyze-another-btn"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 hover:border-zinc-400 text-zinc-950 text-sm font-medium transition-all shadow-xs cursor-pointer group"
        >
          <RefreshCw className="w-4 h-4 text-zinc-500 group-hover:rotate-45 transition-transform" />
          <span>Analyze Another Incident</span>
        </button>
      </div>

    </div>
  );
}
