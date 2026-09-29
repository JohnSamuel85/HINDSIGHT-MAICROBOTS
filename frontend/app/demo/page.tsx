'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import IssueSelector from '@/components/IssueSelector';
import AnalysisFlow from '@/components/AnalysisFlow';
import MemoryResult from '@/components/MemoryResult';
import { AnalysisResult, AnalysisStep, HealthStatus, IssueOption } from '@/types';
import { fetchHealth, streamIssueAnalysis } from '@/lib/api';

type Screen = 'select' | 'analysis' | 'result';

export default function DemoPage() {
  const [screen, setScreen] = useState<Screen>('select');
  const [selectedIssue, setSelectedIssue] = useState<IssueOption | null>(null);
  const [steps, setSteps] = useState<AnalysisStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    fetchHealth()
      .then((data) => setHealth(data))
      .catch((err) => {
        console.warn('Backend health check warning:', err);
      });
  }, []);

  // Automatically scroll to the top whenever navigating between screens/steps
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [screen]);

  const handleSelectIssue = (issue: IssueOption) => {
    setSelectedIssue(issue);
    setScreen('analysis');
    setSteps([]);
    setCurrentStepIndex(0);
    setError(null);
    setAnalysisResult(null);

    streamIssueAnalysis(
      issue,
      (newStep) => {
        setSteps((prev) => {
          const existingIdx = prev.findIndex((s) => s.id === newStep.id);
          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = newStep;
            return updated;
          }
          return [...prev, newStep];
        });
        // Advance visual step index accurately from step ID
        const stepNum = parseInt(newStep.id.replace('step-', ''), 10) - 1;
        if (!isNaN(stepNum) && stepNum >= 0) {
          setCurrentStepIndex(stepNum);
        }
      },
      (result) => {
        setAnalysisResult(result);
        if (result.steps && result.steps.length > 0) {
          setSteps(result.steps);
          setCurrentStepIndex(result.steps.length);
        }
      },
      (errMessage) => {
        setError(errMessage);
      }
    );
  };

  const handleReset = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setSelectedIssue(null);
    setSteps([]);
    setCurrentStepIndex(0);
    setAnalysisResult(null);
    setError(null);
    setScreen('select');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header health={health} onReset={() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        setScreen('select');
      }} />

      <main className="flex-1 flex flex-col">
        {screen === 'select' && (
          <IssueSelector onSelect={handleSelectIssue} />
        )}

        {screen === 'analysis' && selectedIssue && (
          <AnalysisFlow
            issue={selectedIssue}
            steps={steps}
            currentStepIndex={currentStepIndex}
            error={error}
            isComplete={Boolean(analysisResult)}
            onProceed={() => {
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              setScreen('result');
            }}
          />
        )}

        {screen === 'result' && selectedIssue && analysisResult && (
          <MemoryResult
            issue={selectedIssue}
            result={analysisResult}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="border-t border-zinc-100 py-4 text-center text-xs text-zinc-400">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Organizational Memory & Reasoning System</span>
          <span className="font-mono text-[11px] text-zinc-400">Direct Demo Route (/demo)</span>
        </div>
      </footer>
    </div>
  );
}
