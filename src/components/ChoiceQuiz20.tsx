import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  XCircle,
  Send,
  RotateCcw,
  Award,
  AlertCircle,
  BookOpen,
  HelpCircle,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { QUIZ3_ITEMS, MultipleChoiceItem } from '../data/quiz3Data';
import { sounds } from '../utils/audio';

interface ChoiceQuiz20Props {
  studentId: string;
  studentName: string;
  gasUrl: string;
}

export const ChoiceQuiz20: React.FC<ChoiceQuiz20Props> = ({
  studentId,
  studentName,
  gasUrl
}) => {
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<{
    status: 'idle' | 'sending' | 'success' | 'error';
    message: string;
  }>({
    status: 'idle',
    message: ''
  });

  const CIRCLE_NUMBERS = ['①', '②', '③', '④', '⑤'];

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (isSubmitted) return;
    sounds.play('select');
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx + 1 // 1-indexed
    }));
  };

  const answeredCount = Object.keys(userAnswers).length;
  const totalCount = QUIZ3_ITEMS.length;

  const handleSubmit = () => {
    if (answeredCount < totalCount) {
      const confirmSubmit = window.confirm(
        `아직 풀지 않은 문제가 있습니다. (${answeredCount}/${totalCount} 완료)\n이대로 제출하시겠습니까?`
      );
      if (!confirmSubmit) return;
    }

    sounds.play('complete');

    // Calculate score
    let correct = 0;
    const detailsArr: string[] = [];

    QUIZ3_ITEMS.forEach((item) => {
      const selected = userAnswers[item.id];
      const isCorrect = selected === item.answer;
      if (isCorrect) correct += 1;
      detailsArr.push(
        `[${item.id}번] 선택:${selected ? CIRCLE_NUMBERS[selected - 1] : '미응답'} (정답:${CIRCLE_NUMBERS[item.answer - 1]}) ${isCorrect ? 'O' : 'X'}`
      );
    });

    const calculatedScore = Math.round((correct / totalCount) * 100);
    setCorrectCount(correct);
    setScore(calculatedScore);
    setIsSubmitted(true);

    if (calculatedScore >= 80) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Scroll to top of quiz to view results
    window.scrollTo({ top: 180, behavior: 'smooth' });

    // Send to Google Sheet 3 (시트3)
    const payload = {
      type: 'choice_quiz_20',
      quizType: 'quiz3',
      targetSheet: '시트3',
      sheet: '시트3',
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      score: calculatedScore,
      correctCount: correct,
      totalQuestions: totalCount,
      timestamp: new Date().toLocaleString('ko-KR'),
      details: detailsArr.join(' | ')
    };

    setSubmitStatus({
      status: 'sending',
      message: '구글 스프레드시트 [시트3]에 기록 중...'
    });

    // Check if running in GAS iframe
    // @ts-ignore
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      // @ts-ignore
      google.script.run
        .withSuccessHandler(() => {
          setSubmitStatus({
            status: 'success',
            message: '구글 스프레드시트 [시트3]에 성공적으로 저장되었습니다!'
          });
        })
        .withFailureHandler((err: any) => {
          setSubmitStatus({
            status: 'error',
            message: '시트 저장 실패: ' + err
          });
        })
        .submitQuiz3(payload);
      return;
    }

    // Send to Web App via fetch (POST + GET fallback)
    const targetUrl =
      (gasUrl && gasUrl.includes('AKfycbzfEar4EvRv2oWcgiew') ? gasUrl : null) ||
      'https://script.google.com/macros/s/AKfycbzfEar4EvRv2oWcgiew-eO3FmTZdOZntCqGKa2iVeRqsnBiFQy042YRa9A4QPHc-wobvA/exec';

    if (targetUrl && targetUrl.startsWith('http')) {
      const urlWithParams = `${targetUrl}${
        targetUrl.includes('?') ? '&' : '?'
      }type=choice_quiz_20&sheet=${encodeURIComponent('시트3')}&studentId=${encodeURIComponent(
        payload.studentId
      )}&studentName=${encodeURIComponent(payload.studentName)}&score=${payload.score}&correctCount=${
        payload.correctCount
      }&totalQuestions=${payload.totalQuestions}`;

      fetch(urlWithParams, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
        .then(() => {
          setSubmitStatus({
            status: 'success',
            message: '구글 스프레드시트 [시트3]에 성공적으로 전송 및 기록되었습니다!'
          });
        })
        .catch(() => {
          fetch(urlWithParams, { method: 'GET', mode: 'no-cors' })
            .then(() => {
              setSubmitStatus({
                status: 'success',
                message: '구글 스프레드시트 [시트3]에 성공적으로 전송 및 기록되었습니다!'
              });
            })
            .catch((err) => {
              setSubmitStatus({
                status: 'error',
                message: '전송 오류 발생: ' + err
              });
            });
        });
    } else {
      setTimeout(() => {
        setSubmitStatus({
          status: 'success',
          message: '채점 완료 (테스트 모드: 시트 URL 등록 시 실시간 기록)'
        });
      }, 500);
    }
  };

  const handleRetry = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    setScore(0);
    setCorrectCount(0);
    setSubmitStatus({ status: 'idle', message: '' });
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Activity Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-emerald-100 text-xs font-bold tracking-wide mb-2 backdrop-blur-xs">
              <BookOpen className="w-3.5 h-3.5" />
              <span>활동 3 • 개념 완성 및 성취도 점검</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              정치 주체의 역할과 정치과정 (20문항)
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
              국가기관, 정당, 이익 집단, 시민단체, 언론, 개인의 역할과 상호작용을 객관식 문제를 통해 확인해 보세요.
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 flex items-center justify-between md:flex-col md:items-end gap-1 shrink-0">
            <span className="text-emerald-100 text-xs font-semibold">진행 상황</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black">{answeredCount}</span>
              <span className="text-emerald-200 text-sm font-bold">/ {totalCount}</span>
            </div>
            <span className="text-[11px] text-emerald-200">
              {answeredCount === totalCount ? '✨ 모든 문제 풀이 완료' : '문제를 클릭하여 답을 선택하세요'}
            </span>
          </div>
        </div>
      </div>

      {/* Result Card when Submitted */}
      {isSubmitted && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500 shadow-xl mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  score >= 80 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                }`}
              >
                <Award className="w-9 h-9" />
              </div>
              <div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  활동 3 채점 완료
                </span>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  {studentName ? `${studentName} 학생` : '학생'}의 평가 결과
                </h3>
                <p className="text-xs text-slate-500">
                  학번: {studentId || '미입력'} • 총 20문항 중 {correctCount}문항 정답
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block">최종 점수</span>
                <span className="text-4xl font-black text-emerald-600 tracking-tight">
                  {score}
                  <span className="text-xl font-bold text-slate-400">점</span>
                </span>
              </div>
              <button
                onClick={handleRetry}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-4 h-4" />
                다시 풀기
              </button>
            </div>
          </div>

          {/* Submission Status Message */}
          <div className="mt-4 pt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  submitStatus.status === 'success'
                    ? 'bg-emerald-500'
                    : submitStatus.status === 'sending'
                    ? 'bg-amber-500 animate-ping'
                    : 'bg-slate-400'
                }`}
              />
              <span className="font-semibold text-slate-600">
                {submitStatus.message || '스프레드시트 [시트3] 연동 상태 대기'}
              </span>
            </div>
            <span className="text-slate-400 font-medium">
              💡 아래 각 문제의 정답과 상세 해설을 꼼꼼하게 복습해 보세요!
            </span>
          </div>
        </div>
      )}

      {/* Student Warning Notice if info is missing */}
      {(!studentId.trim() || !studentName.trim()) && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-900 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">학번과 이름이 입력되지 않았습니다.</span> 상단 바에서 학번과 이름을 입력하시면 점수가 선생님의 스프레드시트 [시트3]에 실시간으로 정상 저장됩니다.
          </div>
        </div>
      )}

      {/* Question List */}
      <div className="space-y-6">
        {QUIZ3_ITEMS.map((item, idx) => {
          const selected = userAnswers[item.id];
          const isCorrect = selected === item.answer;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border transition-all p-5 sm:p-6 shadow-xs ${
                isSubmitted
                  ? isCorrect
                    ? 'border-emerald-300 bg-emerald-50/10'
                    : 'border-rose-300 bg-rose-50/10'
                  : selected
                  ? 'border-emerald-300 ring-1 ring-emerald-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      isSubmitted
                        ? isCorrect
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-500 text-white'
                        : selected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.id}
                  </span>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-snug">
                    {item.question}
                  </h3>
                </div>

                {isSubmitted && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shrink-0 ${
                      isCorrect
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : 'bg-rose-100 text-rose-700 border border-rose-300'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" /> 정답
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> 오답
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Passage / Box content if any */}
              {item.passage && (
                <div className="my-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  {item.passage}
                </div>
              )}

              {/* Options */}
              <div className="mt-3 space-y-2">
                {item.options.map((optText, optIdx) => {
                  const optNumber = optIdx + 1;
                  const isUserChosen = selected === optNumber;
                  const isRightAnswer = item.answer === optNumber;

                  let optClass =
                    'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer';

                  if (isSubmitted) {
                    if (isRightAnswer) {
                      optClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                    } else if (isUserChosen && !isCorrect) {
                      optClass = 'border-rose-400 bg-rose-50 text-rose-900 font-medium line-through';
                    } else {
                      optClass = 'border-slate-100 bg-slate-50/50 text-slate-400 opacity-80';
                    }
                  } else if (isUserChosen) {
                    optClass = 'border-emerald-600 bg-emerald-50/70 text-emerald-900 font-bold shadow-2xs';
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => handleSelectOption(item.id, optIdx)}
                      className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition text-xs sm:text-sm ${optClass}`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSubmitted && isRightAnswer
                            ? 'bg-emerald-600 text-white'
                            : isUserChosen
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {CIRCLE_NUMBERS[optIdx]}
                      </span>
                      <span className="flex-1">{optText}</span>
                      {isSubmitted && isRightAnswer && (
                        <span className="text-[11px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md shrink-0">
                          정답
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Box (Visible after submission) */}
              {isSubmitted && (
                <div className="mt-4 pt-3.5 border-t border-slate-100 bg-slate-50/80 rounded-xl p-3 text-xs leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    <span>정답 및 해설 (정답: {CIRCLE_NUMBERS[item.answer - 1]})</span>
                  </div>
                  <p className="text-slate-600 pl-5">{item.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky Submission Bar */}
      {!isSubmitted ? (
        <div className="sticky bottom-4 mt-8 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-xl flex items-center justify-between gap-4 z-20">
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              답안 선택 완료: <strong className="text-emerald-700 font-bold">{answeredCount}</strong> / {totalCount}
            </span>
            <span className="text-[11px] text-slate-400">
              제출을 누르면 즉시 자동 채점 및 구글 시트 3에 기록됩니다.
            </span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            최종 제출 및 채점하기
          </button>
        </div>
      ) : (
        <div className="mt-8 text-center pb-8">
          <button
            onClick={handleRetry}
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm shadow-md transition inline-flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            20문항 다시 풀기
          </button>
        </div>
      )}
    </div>
  );
};
