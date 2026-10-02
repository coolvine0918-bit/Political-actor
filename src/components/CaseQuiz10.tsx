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
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { QUIZ5_ITEMS } from '../data/quiz5Data';
import { sounds } from '../utils/audio';

interface CaseQuiz10Props {
  studentId: string;
  studentName: string;
  gasUrl: string;
}

export const CaseQuiz10: React.FC<CaseQuiz10Props> = ({
  studentId,
  studentName,
  gasUrl
}) => {
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showTableGuide, setShowTableGuide] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    status: 'idle' | 'sending' | 'success' | 'error';
    message: string;
  }>({
    status: 'idle',
    message: ''
  });

  const CIRCLE_NUMBERS = ['①', '②', '③', '④'];

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (isSubmitted) return;
    sounds.play('select');
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx + 1
    }));
  };

  const answeredCount = Object.keys(userAnswers).length;
  const totalCount = QUIZ5_ITEMS.length;

  const handleSubmit = () => {
    if (answeredCount < totalCount) {
      const confirmSubmit = window.confirm(
        `아직 풀지 않은 문제가 있습니다. (${answeredCount}/${totalCount} 완료)\n이대로 제출하시겠습니까?`
      );
      if (!confirmSubmit) return;
    }

    sounds.play('complete');

    let correct = 0;
    const detailsArr: string[] = [];

    QUIZ5_ITEMS.forEach((item) => {
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

    window.scrollTo({ top: 180, behavior: 'smooth' });

    // Send to Google Sheet 5 (시트5)
    const payload = {
      type: 'case_quiz_10',
      quizType: 'quiz5',
      targetSheet: '시트5',
      sheet: '시트5',
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
      message: '구글 스프레드시트 [시트5]에 기록 중...'
    });

    // GAS Iframe
    // @ts-ignore
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      // @ts-ignore
      google.script.run
        .withSuccessHandler(() => {
          setSubmitStatus({
            status: 'success',
            message: '구글 스프레드시트 [시트5]에 성공적으로 저장되었습니다!'
          });
        })
        .withFailureHandler((err: any) => {
          setSubmitStatus({
            status: 'error',
            message: '시트 저장 실패: ' + err
          });
        })
        .submitQuiz5(payload);
      return;
    }

    // Web App URL POST / GET fallback
    const targetUrl =
      (gasUrl && gasUrl.includes('AKfycbzfEar4EvRv2oWcgiew') ? gasUrl : null) ||
      'https://script.google.com/macros/s/AKfycbzfEar4EvRv2oWcgiew-eO3FmTZdOZntCqGKa2iVeRqsnBiFQy042YRa9A4QPHc-wobvA/exec';

    if (targetUrl && targetUrl.startsWith('http')) {
      const urlWithParams = `${targetUrl}${
        targetUrl.includes('?') ? '&' : '?'
      }type=case_quiz_10&sheet=${encodeURIComponent('시트5')}&studentId=${encodeURIComponent(
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
            message: '구글 스프레드시트 [시트5]에 성공적으로 전송 및 기록되었습니다!'
          });
        })
        .catch(() => {
          fetch(urlWithParams, { method: 'GET', mode: 'no-cors' })
            .then(() => {
              setSubmitStatus({
                status: 'success',
                message: '구글 스프레드시트 [시트5]에 성공적으로 전송 및 기록되었습니다!'
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
      <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-red-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-rose-100 text-xs font-bold tracking-wide mb-2 backdrop-blur-xs">
              <FileText className="w-3.5 h-3.5" />
              <span>활동 5 • 개념 평가 및 실전 사례 중심</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              정치 과정과 정치 주체 실전 평가 (10문항)
            </h2>
            <p className="text-rose-100 text-xs sm:text-sm mt-1">
              청소년 대중교통 요금, 일회용 플라스틱 규제, 전동 킥보드 안전 관리 등 실전 3대 시나리오를 심층 분석합니다.
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 flex items-center justify-between md:flex-col md:items-end gap-1 shrink-0">
            <span className="text-rose-100 text-xs font-semibold">진행 상황</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black">{answeredCount}</span>
              <span className="text-rose-200 text-sm font-bold">/ {totalCount}</span>
            </div>
            <span className="text-[11px] text-rose-200">
              {answeredCount === totalCount ? '✨ 모든 문제 풀이 완료' : '문제를 풀고 정답을 선택하세요'}
            </span>
          </div>
        </div>
      </div>

      {/* Collapsible Concept Table Guide */}
      <div className="bg-white rounded-2xl border border-rose-200 shadow-xs mb-8 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTableGuide(!showTableGuide)}
          className="w-full px-5 py-4 flex items-center justify-between bg-rose-50/50 hover:bg-rose-50 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-rose-600" />
            <span className="font-bold text-slate-800 text-xs sm:text-sm">
              [개념 핵심 요약] 정치 과정 5단계 및 공식/비공식 정치 주체 구분표
            </span>
          </div>
          {showTableGuide ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showTableGuide && (
          <div className="p-5 border-t border-rose-100 bg-white overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-rose-100/60 text-rose-950 font-bold border-b border-rose-200">
                  <th className="p-2.5 rounded-l-lg">정치 과정 단계</th>
                  <th className="p-2.5">주요 역할 및 내용</th>
                  <th className="p-2.5">대표적 정치 주체</th>
                  <th className="p-2.5 rounded-r-lg">주체 구분</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-blue-700">1. 이익 표출</td>
                  <td className="p-2.5">개인이나 집단의 요구와 이익을 사회에 제안</td>
                  <td className="p-2.5 font-medium">시민, 이익집단, 시민단체</td>
                  <td className="p-2.5 text-slate-500 font-semibold">비공식적 주체</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-amber-700">2. 이익 집약</td>
                  <td className="p-2.5">다양한 이익을 수렴, 조정, 체계화하여 공약·정책화</td>
                  <td className="p-2.5 font-medium">정당, 언론</td>
                  <td className="p-2.5 text-slate-500 font-semibold">비공식적 주체</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-purple-700">3. 정책 결정</td>
                  <td className="p-2.5">구속력 있는 법률이나 정책으로 최종 확정</td>
                  <td className="p-2.5 font-medium">국회(입법부), 정부</td>
                  <td className="p-2.5 text-emerald-700 font-black">공식적 주체</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-emerald-700">4. 정책 집행</td>
                  <td className="p-2.5">결정된 법률과 정책을 실제로 적용하고 실행</td>
                  <td className="p-2.5 font-medium">행정부(부처, 경찰청, 지자체)</td>
                  <td className="p-2.5 text-emerald-700 font-black">공식적 주체</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-rose-700">5. 정책 평가</td>
                  <td className="p-2.5">정책의 성과, 문제점, 영향 등을 측정 및 분석 (환류)</td>
                  <td className="p-2.5 font-medium">연구기관, 시민단체, 언론 등</td>
                  <td className="p-2.5 text-slate-600 font-semibold">공식/비공식 복합</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Result Card when Submitted */}
      {isSubmitted && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-rose-500 shadow-xl mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  score >= 80 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                }`}
              >
                <Award className="w-9 h-9" />
              </div>
              <div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  활동 5 채점 완료
                </span>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  {studentName ? `${studentName} 학생` : '학생'}의 평가 결과
                </h3>
                <p className="text-xs text-slate-500">
                  학번: {studentId || '미입력'} • 총 10문항 중 {correctCount}문항 정답
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block">최종 점수</span>
                <span className="text-4xl font-black text-rose-600 tracking-tight">
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
                {submitStatus.message || '스프레드시트 [시트5] 연동 상태 대기'}
              </span>
            </div>
            <span className="text-slate-400 font-medium">
              💡 실전 시나리오별 정답과 오답 해설을 꼼꼼히 확인해 보세요!
            </span>
          </div>
        </div>
      )}

      {/* Warning if ID is missing */}
      {(!studentId.trim() || !studentName.trim()) && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-900 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">학번과 이름이 입력되지 않았습니다.</span> 상단 바에서 학번과 이름을 입력하시면 점수가 선생님의 스프레드시트 [시트5]에 실시간으로 정상 저장됩니다.
          </div>
        </div>
      )}

      {/* Question List */}
      <div className="space-y-6">
        {QUIZ5_ITEMS.map((item) => {
          const selected = userAnswers[item.id];
          const isCorrect = selected === item.answer;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border transition-all p-5 sm:p-6 shadow-xs ${
                isSubmitted
                  ? isCorrect
                    ? 'border-rose-300 bg-rose-50/10'
                    : 'border-slate-300 bg-slate-50/10'
                  : selected
                  ? 'border-rose-300 ring-1 ring-rose-200'
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
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-600 text-white'
                        : selected
                        ? 'bg-rose-600 text-white'
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

              {/* Passage Box */}
              {item.passage && (
                <div className="my-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                  {item.passage}
                </div>
              )}

              {/* Options (4 options) */}
              <div className="mt-3 space-y-2">
                {item.options.map((optText, optIdx) => {
                  const optNumber = optIdx + 1;
                  const isUserChosen = selected === optNumber;
                  const isRightAnswer = item.answer === optNumber;

                  let optClass =
                    'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer';

                  if (isSubmitted) {
                    if (isRightAnswer) {
                      optClass = 'border-rose-500 bg-rose-50 text-rose-950 font-bold';
                    } else if (isUserChosen && !isCorrect) {
                      optClass = 'border-slate-300 bg-slate-100 text-slate-500 font-medium line-through';
                    } else {
                      optClass = 'border-slate-100 bg-slate-50/50 text-slate-400 opacity-80';
                    }
                  } else if (isUserChosen) {
                    optClass = 'border-rose-600 bg-rose-50/70 text-rose-950 font-bold shadow-2xs';
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
                            ? 'bg-rose-600 text-white'
                            : isUserChosen
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {CIRCLE_NUMBERS[optIdx]}
                      </span>
                      <span className="flex-1">{optText}</span>
                      {isSubmitted && isRightAnswer && (
                        <span className="text-[11px] font-black text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md shrink-0">
                          정답
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Box */}
              {isSubmitted && (
                <div className="mt-4 pt-3.5 border-t border-slate-100 bg-slate-50/80 rounded-xl p-3 text-xs leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                    <BookOpen className="w-3.5 h-3.5 text-rose-600" />
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
              답안 선택 완료: <strong className="text-rose-700 font-bold">{answeredCount}</strong> / {totalCount}
            </span>
            <span className="text-[11px] text-slate-400">
              제출을 누르면 즉시 자동 채점 및 구글 시트 5에 기록됩니다.
            </span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
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
            10문항 다시 풀기
          </button>
        </div>
      )}
    </div>
  );
};
