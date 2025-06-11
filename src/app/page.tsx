'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';
type TimerState = 'idle' | 'running' | 'paused';

interface TimerConfig {
  work: number;
  shortBreak: number;
  longBreak: number;
}

const TIMER_CONFIG: TimerConfig = {
  work: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60 // 15 minutes
};

const MODE_LABELS = {
  work: 'Work',
  shortBreak: 'Short Break',
  longBreak: 'Long Break'
};

const MODE_DISPLAY = {
  work: 'FOCUS TIME',
  shortBreak: 'SHORT BREAK',
  longBreak: 'LONG BREAK'
};

export default function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>('work');
  const [state, setState] = useState<TimerState>('idle');
  const [timeLeft, setTimeLeft] = useState(TIMER_CONFIG.work);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Calculate progress percentage
  const totalTime = TIMER_CONFIG[mode];
  const progressPercentage = ((totalTime - timeLeft) / totalTime) * 100;

  // Format time to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Create audio notification
  useEffect(() => {
    const createBeepSound = () => {
      if (typeof window !== 'undefined') {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
          console.log('Audio not supported');
        }
      }
    };

    audioRef.current = { play: createBeepSound } as any;
  }, []);

  // Timer countdown logic
  useEffect(() => {
    if (state === 'running' && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Timer completed
            setState('idle');
            audioRef.current?.play();
            
            if (mode === 'work') {
              setCompletedPomodoros(prev => prev + 1);
              // After 4 work sessions, take a long break
              if (currentCycle === 4) {
                setMode('longBreak');
                setTimeLeft(TIMER_CONFIG.longBreak);
                setCurrentCycle(1);
              } else {
                setMode('shortBreak');
                setTimeLeft(TIMER_CONFIG.shortBreak);
                setCurrentCycle(prev => prev + 1);
              }
            } else {
              setMode('work');
              setTimeLeft(TIMER_CONFIG.work);
            }
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state, timeLeft, mode, currentCycle]);

  // Control functions
  const startTimer = useCallback(() => {
    setState('running');
  }, []);

  const pauseTimer = useCallback(() => {
    setState('paused');
  }, []);

  const resetTimer = useCallback(() => {
    setState('idle');
    setTimeLeft(TIMER_CONFIG[mode]);
  }, [mode]);

  const changeMode = useCallback((newMode: TimerMode) => {
    setState('idle');
    setMode(newMode);
    setTimeLeft(TIMER_CONFIG[newMode]);
  }, []);

  // Calculate stroke dash array for circular progress
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-auto border border-gray-800">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Pomodoro Timer
          </h1>
          <p className="text-gray-400 text-sm">
            Stay focused and productive
          </p>
        </div>

        {/* Mode Selection */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => changeMode('work')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              mode === 'work'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Work
          </button>
          <button
            onClick={() => changeMode('shortBreak')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              mode === 'shortBreak'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Short Break
          </button>
          <button
            onClick={() => changeMode('longBreak')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              mode === 'longBreak'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Long Break
          </button>
        </div>

        {/* Circular Progress Timer */}
        <div className="relative flex items-center justify-center mb-8">
          <svg
            className="transform -rotate-90 w-64 h-64"
            width="256"
            height="256"
          >
            {/* Background circle */}
            <circle
              cx="128"
              cy="128"
              r={radius}
              fill="none"
              stroke="#374151"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="128"
              cy="128"
              r={radius}
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-in-out"
            />
          </svg>
          
          {/* Timer display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-white mb-2">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-purple-400 font-medium">
              {MODE_DISPLAY[mode]}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          {state === 'idle' || state === 'paused' ? (
            <button
              onClick={startTimer}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Start
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Pause
            </button>
          )}
          
          <button
            onClick={resetTimer}
            className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Reset
          </button>
        </div>

        {/* Session Stats */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white font-medium">Session Stats</h3>
            <div className="text-purple-400 font-bold">{completedPomodoros}</div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-gray-400 text-xs mb-1">Work</div>
              <div className="text-white font-bold">25m</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Short</div>
              <div className="text-white font-bold">5m</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Long</div>
              <div className="text-white font-bold">15m</div>
            </div>
          </div>
        </div>

        {/* Completed Pomodoros Info */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Completed Pomodoros: <strong className="text-purple-400">{completedPomodoros}</strong></span>
          </div>
          <div className="text-gray-500 text-xs">
            25 min work • 5 min short break • 15 min long break
          </div>
        </div>
      </div>
    </div>
  );
}
