import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Clock,
  Flame,
  Award,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Users,
  Briefcase,
  AlertTriangle
} from 'lucide-react';
import {
  SPEED_QUIZ_ITEMS,
  SPEED_ATTEMPTS_CONFIG,
  SpeedQuizItem,
  SpeedQuizAttemptResult
} from '../data/speedQuizData';
import { sounds } from '../utils/audio';

interface SpeedQuizProps {
  studentId: string;
  studentName: string;
  soundOn: boolean;
  gasUrl: string;
}

export function SpeedQuiz({ studentId, studentName, soundOn, gasUrl }: SpeedQuizProps) {
  // Attempt tracking (1 -> 2 -> 3)
  const [currentAttemptNumber, setCurrentAttemptNumber] = useState<number>(1);
  const [attemptHistory, setAttemptHistory] = useState<SpeedQuizAttemptResult[]>([]);

  // Game stage: 'intro' | 'playing' | 'result'
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'result'>('intro');

  // Question index in active attempt (0..9)
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<('시민단체' | '이익 집단' | null)[]>(
    new Array(SPEED_QUIZ_ITEMS.length).fill(null)
  );

  // Timer state
  const currentConfig = SPEED_ATTEMPTS_CONFIG.find((c) => c.attempt === currentAttemptNumber) || SPEED_ATTEMPTS_CONFIG[0];
  const [timeLeft, setTimeLeft] = useState<number>(currentConfig.timeLimit);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Submit status
  const [submitStatus, setSubmitStatus] = useState<{
    status: 'idle' | 'sending' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  // Streak counter
  const [streak, setStreak] = useState<number>(0);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer countdown while playing
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeOver();
            return 0;
          }
          if (prev <= 6 && soundOn) {
            sounds.play('connect');
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Start new attempt
  const handleStartAttempt = () => {
    const trimmedId = studentId.trim();
    const trimmedName = studentName.trim();

    if (!trimmedId || !trimmedName) {
      alert('상단 헤더에 학번과 이름을 먼저 입력해 주세요!');
      const idInput = document.getElementById('studentIdInput');
      if (idInput) idInput.focus();
      return;
    }

    const config = SPEED_ATTEMPTS_CONFIG.find((c) => c.attempt === currentAttemptNumber) || SPEED_ATTEMPTS_CONFIG[0];
    setTimeLeft(config.timeLimit);
    setCurrentIndex(0);
    setUserAnswers(new Array(SPEED_QUIZ_ITEMS.length).fill(null));
    setStreak(0);
    setLastFeedback(null);
    setSubmitStatus({ status: 'idle', message: '' });
    startTimeRef.current = Date.now();
    setGameState('playing');
    if (soundOn) sounds.play('select');
  };

  // Student selects an answer
  const handleAnswer = (choice: '시민단체' | '이익 집단') => {
    if (gameState !== 'playing') return;

    const currentItem = SPEED_QUIZ_ITEMS[currentIndex];
    const isCorrect = choice === currentItem.answer;

    if (soundOn) {
      sounds.play(isCorrect ? 'connect' : 'delete');
    }

    setLastFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }

    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentIndex] = choice;
    setUserAnswers(updatedAnswers);

    // If last question, finish attempt!
    if (currentIndex + 1 >= SPEED_QUIZ_ITEMS.length) {
      finishAttempt(updatedAnswers);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Time expired handler
  const handleTimeOver = () => {
    if (soundOn) sounds.play('delete');
    finishAttempt(userAnswers);
  };

  // Finish current attempt and save result
  const finishAttempt = (finalAnswers: ('시민단체' | '이익 집단' | null)[]) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsedSeconds = Math.min(
      currentConfig.timeLimit,
      Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
    );

    let correct = 0;
    const answerBreakdown = SPEED_QUIZ_ITEMS.map((item, idx) => {
      const userChoice: '시민단체' | '이익 집단' | '미응답' = finalAnswers[idx] || '미응답';
      const isCorrect = userChoice === item.answer;
      if (isCorrect) correct++;
      return {
        item,
        userAnswer: userChoice,
        isCorrect
      };
    });

    const timestamp = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const attemptResult: SpeedQuizAttemptResult = {
      attemptNumber: currentAttemptNumber,
      timeLimit: currentConfig.timeLimit,
      timeSpent: elapsedSeconds,
      correctCount: correct,
      totalQuestions: SPEED_QUIZ_ITEMS.length,
      answers: answerBreakdown,
      timestamp
    };

    setAttemptHistory((prev) => [...prev, attemptResult]);
    setGameState('result');

    if (correct >= 8) {
      if (soundOn) sounds.play('complete');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Submit to Google Spreadsheet (Sheet 2)
    submitToGoogleSheet2(attemptResult);
  };

  // Google Sheet 2 Submission
  const submitToGoogleSheet2 = (result: SpeedQuizAttemptResult) => {
    const payload = {
      type: 'speed_quiz',
      quizType: 'speed',
      targetSheet: '시트2',
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      score: Math.round((result.correctCount / result.totalQuestions) * 100),
      attemptNumber: result.attemptNumber,
      timeLimit: result.timeLimit,
      timeSpent: result.timeSpent,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      scoreRate: Math.round((result.correctCount / result.totalQuestions) * 100),
      timestamp: result.timestamp,
      details: result.answers
        .map(
          (a) =>
            `${a.item.id}.${a.item.name}: 선택(${a.userAnswer})/${a.isCorrect ? 'O' : 'X'}`
        )
        .join(' | ')
    };

    setSubmitStatus({
      status: 'sending',
      message: '구글 스프레드시트 [시트2]에 기록 중...'
    });

    // Case 1: Google Apps Script Iframe
    // @ts-ignore
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      // @ts-ignore
      google.script.run
        .withSuccessHandler(() => {
          setSubmitStatus({
            status: 'success',
            message: '구글 스프레드시트 [시트2]에 성공적으로 저장되었습니다!'
          });
        })
        .withFailureHandler((err: any) => {
          setSubmitStatus({
            status: 'error',
            message: '시트 저장 실패: ' + err
          });
        })
        .submitSpeedQuiz(payload);
      return;
    }

    // Case 2: External Webhook POST (Directly to teacher's deployed Apps Script)
    const targetUrl =
      (gasUrl && gasUrl.includes('AKfycbzfEar4EvRv2oWcgiew') ? gasUrl : null) ||
      'https://script.google.com/macros/s/AKfycbzfEar4EvRv2oWcgiew-eO3FmTZdOZntCqGKa2iVeRqsnBiFQy042YRa9A4QPHc-wobvA/exec';

    if (targetUrl && targetUrl.startsWith('http')) {
      const urlWithParams = `${targetUrl}${
        targetUrl.includes('?') ? '&' : '?'
      }type=speed_quiz&sheet=${encodeURIComponent('시트2')}&studentId=${encodeURIComponent(
        payload.studentId
      )}&studentName=${encodeURIComponent(payload.studentName)}&score=${payload.score}&attemptNumber=${
        payload.attemptNumber
      }&correctCount=${payload.correctCount}&totalQuestions=${payload.totalQuestions}&timeSpent=${
        payload.timeSpent
      }`;

      fetch(urlWithParams, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
        .then(() => {
          setSubmitStatus({
            status: 'success',
            message: '구글 스프레드시트 [시트2]에 성공적으로 전송 및 기록되었습니다!'
          });
        })
        .catch(() => {
          // Fallback to GET method if POST is blocked by network
          fetch(urlWithParams, {
            method: 'GET',
            mode: 'no-cors'
          })
            .then(() => {
              setSubmitStatus({
                status: 'success',
                message: '구글 스프레드시트 [시트2]에 성공적으로 전송 및 기록되었습니다!'
              });
            })
            .catch((err) => {
              setSubmitStatus({
                status: 'error',
                message: '전송 오류 발생: ' + err
              });
            });
        });
      return;
    }

    // Case 3: Test mode simulation
    setTimeout(() => {
      setSubmitStatus({
        status: 'success',
        message: '시트 2 저장 완료 (테스트/로컬 모드 - 실시간 연동 준비 완료)'
      });
    }, 600);
  };

  // Move to next attempt (up to 3)
  const handleProceedNextAttempt = () => {
    if (currentAttemptNumber < 3) {
      setCurrentAttemptNumber((prev) => prev + 1);
      setGameState('intro');
    }
  };

  const currentResult = attemptHistory[attemptHistory.length - 1];
  const progressRatio = ((currentConfig.timeLimit - timeLeft) / currentConfig.timeLimit) * 100;
  const isTimeCritical = timeLeft <= 5 && gameState === 'playing';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 w-full">
      {/* Top Attempt Progress Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                시민단체 vs 이익 집단 구별 스피드 퀴즈
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                공익을 위한 '시민단체'인지, 사익을 위한 '이익 집단'인지 빠르게 판별하세요!
              </p>
            </div>
          </div>

          {/* 3 Attempts Badge Steps */}
          <div className="flex items-center gap-2">
            {SPEED_ATTEMPTS_CONFIG.map((cfg) => {
              const attemptRecord = attemptHistory.find((a) => a.attemptNumber === cfg.attempt);
              const isCurrent = cfg.attempt === currentAttemptNumber && gameState !== 'result';
              const isDone = !!attemptRecord;

              return (
                <div
                  key={cfg.attempt}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                    isDone
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : isCurrent
                      ? 'bg-blue-50 border-blue-400 text-blue-800 ring-2 ring-blue-300'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <span>{cfg.attempt}차 ({cfg.timeLimit}초)</span>
                  {isDone && (
                    <span className="bg-emerald-600 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                      {attemptRecord.correctCount}/10
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 1. INTRO SCREEN */}
      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center mb-4">
            <Clock className="w-8 h-8" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 mb-2">
            총 3회 중 제 {currentAttemptNumber}차 도전
          </div>

          <h3 className="text-2xl font-black text-slate-900 mb-2">
            제한시간 <span className="text-amber-600">{currentConfig.timeLimit}초</span> 스피드 도전!
          </h3>

          <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6 leading-relaxed">
            제시되는 10개 가상 단체의 이름과 활동 목적을 보고<br />
            <strong>[시민단체(공익)]</strong>인지 <strong>[이익 집단(사익)]</strong>인지 신속하게 버튼을 눌러주세요.
          </p>

          {/* Quick Concept Hint Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-8 text-left">
            <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/60">
              <div className="flex items-center gap-2 mb-1.5 text-blue-900 font-bold text-sm">
                <Users className="w-4 h-4 text-blue-600" />
                <span>시민단체 (Civil Group)</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                사회 전체의 <strong>보편적 공익 실현</strong>을 목적 (환경 보호, 소비자 권익, 약자 지원, 정치 투명성 등)
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/60">
              <div className="flex items-center gap-2 mb-1.5 text-rose-900 font-bold text-sm">
                <Briefcase className="w-4 h-4 text-rose-600" />
                <span>이익 집단 (Interest Group)</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                특정 직업군이나 조합원 등 <strong>소속 구성원의 특수한 사익·권익</strong> 대변 (수가 인상, 노동 조건, 기업 이익 등)
              </p>
            </div>
          </div>

          <button
            onClick={handleStartAttempt}
            className="px-10 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-lg rounded-2xl shadow-md transition transform active:scale-95 inline-flex items-center gap-2.5"
          >
            <span>{currentAttemptNumber}차 도전 시작하기 ({currentConfig.timeLimit}초)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 2. PLAYING SCREEN */}
      {gameState === 'playing' && (
        <div className="space-y-4">
          {/* Timer and Progress Bar Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {currentAttemptNumber}차 도전
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  문항 {currentIndex + 1} / {SPEED_QUIZ_ITEMS.length}
                </span>
                {streak > 1 && (
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1 animate-bounce">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {streak}연속 정답!
                  </span>
                )}
              </div>

              {/* Countdown Digits */}
              <div
                className={`flex items-center gap-1.5 font-black text-lg sm:text-xl px-3 py-1 rounded-xl transition-all ${
                  isTimeCritical
                    ? 'bg-red-500 text-white animate-pulse shadow-md'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span>{timeLeft}초 남음</span>
              </div>
            </div>

            {/* Time progress bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  isTimeCritical ? 'bg-red-500' : 'bg-amber-500'
                }`}
                style={{ width: `${100 - progressRatio}%` }}
              />
            </div>
          </div>

          {/* Active Question Card */}
          {(() => {
            const currentItem = SPEED_QUIZ_ITEMS[currentIndex];
            return (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Question index badge */}
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-sm mb-3">
                  {currentItem.id}
                </div>

                <div className="text-xs font-semibold text-slate-400 mb-1">단체명</div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-4">
                  {currentItem.name}
                </h3>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-5 max-w-xl mx-auto mb-8 text-left">
                  <div className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>활동 목적</span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium">
                    "{currentItem.purpose}"
                  </p>
                </div>

                {/* Big Choice Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                  <button
                    onClick={() => handleAnswer('시민단체')}
                    className="p-5 rounded-2xl border-2 border-blue-500 bg-blue-50 hover:bg-blue-600 text-blue-900 hover:text-white font-black text-base sm:text-lg transition transform active:scale-95 shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      <span>시민단체</span>
                    </div>
                    <span className="text-xs font-normal opacity-80">(사회 전체 공익 추구)</span>
                  </button>

                  <button
                    onClick={() => handleAnswer('이익 집단')}
                    className="p-5 rounded-2xl border-2 border-rose-500 bg-rose-50 hover:bg-rose-600 text-rose-900 hover:text-white font-black text-base sm:text-lg transition transform active:scale-95 shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      <span>이익 집단</span>
                    </div>
                    <span className="text-xs font-normal opacity-80">(소속 집단 사익 추구)</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 3. RESULT SCREEN */}
      {gameState === 'result' && currentResult && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Result Score Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  {currentResult.attemptNumber}차 도전 결과
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {studentName} 학생: {currentResult.correctCount} / {currentResult.totalQuestions}개 정답!
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  소요 시간: <strong>{currentResult.timeSpent}초</strong> (제한시간: {currentResult.timeLimit}초)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-xs text-slate-400 font-bold">정답률</div>
                  <div className="text-2xl font-black text-blue-600">
                    {Math.round((currentResult.correctCount / currentResult.totalQuestions) * 100)}%
                  </div>
                </div>

                <div className="text-center px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-xs text-slate-400 font-bold">소요 시간</div>
                  <div className="text-2xl font-black text-slate-800">
                    {currentResult.timeSpent}초
                  </div>
                </div>
              </div>
            </div>

            {/* Google Sheets Status Banner */}
            <div
              className={`mt-4 p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                submitStatus.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : submitStatus.status === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <span>{submitStatus.message || '스프레드시트 [시트2] 연동 완료'}</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {currentResult.timestamp}
              </span>
            </div>

            {/* Action Buttons: Next Attempt vs Done */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-medium">
                {currentAttemptNumber < 3 ? (
                  <span>
                    총 3회 중 <strong>{3 - currentAttemptNumber}회</strong>의 도전 기회가 남아 있습니다!
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold">
                    🎉 총 3회의 모든 도전을 완료했습니다!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentAttemptNumber < 3 ? (
                  <button
                    onClick={handleProceedNextAttempt}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <span>
                      {currentAttemptNumber + 1}차 도전하기 (제한시간{' '}
                      {SPEED_ATTEMPTS_CONFIG[currentAttemptNumber].timeLimit}초)
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setCurrentAttemptNumber(1);
                      setGameState('intro');
                    }}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>처음부터 다시 도전하기</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h4 className="font-black text-slate-900 text-base mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>10개 문항 정답 및 해설 복습</span>
            </h4>

            <div className="space-y-3">
              {currentResult.answers.map((ans, idx) => (
                <div
                  key={ans.item.id}
                  className={`p-4 rounded-2xl border transition ${
                    ans.isCorrect
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-red-50/50 border-red-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                          ans.isCorrect ? 'bg-emerald-600' : 'bg-red-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <strong className="text-slate-900 text-sm">{ans.item.name}</strong>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">
                        내가 고른 답:{' '}
                        <strong className={ans.isCorrect ? 'text-emerald-700' : 'text-red-700'}>
                          {ans.userAnswer}
                        </strong>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          ans.isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {ans.isCorrect ? '⭕ 정답' : `❌ 정답: ${ans.item.answer}`}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mb-2 pl-7">
                    <strong>목적:</strong> {ans.item.purpose}
                  </p>

                  <div className="text-xs text-slate-700 bg-white/90 p-2.5 rounded-xl border border-slate-200 pl-3">
                    💡 <strong>해설:</strong> {ans.item.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
