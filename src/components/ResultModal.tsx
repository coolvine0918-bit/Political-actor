import React from 'react';
import { StudentSubmission } from '../types';
import { Award, CheckCircle2, XCircle, RotateCcw, Eye, Printer, Send } from 'lucide-react';

interface ResultModalProps {
  submission: StudentSubmission;
  onClose: () => void;
  onRetry: () => void;
  onToggleShowAnswers: () => void;
  showingAnswers: boolean;
  sheetSubmitStatus: {
    status: 'idle' | 'sending' | 'success' | 'error';
    message: string;
  };
}

export const ResultModal: React.FC<ResultModalProps> = ({
  submission,
  onClose,
  onRetry,
  onToggleShowAnswers,
  showingAnswers,
  sheetSubmitStatus,
}) => {
  const isPerfect = submission.score === 100;
  const isGood = submission.score >= 70;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-slate-100">
        
        {/* Header Banner */}
        <div className={`p-6 sm:p-7 text-white relative ${
          isPerfect 
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700' 
            : isGood 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-700' 
              : 'bg-gradient-to-r from-slate-800 to-slate-900'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Award className="w-5 h-5 text-amber-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                  정치 주체와 역할 탐구 채점 보고서
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {submission.studentName} ({submission.studentId})
              </h2>
              <p className="text-xs sm:text-sm text-white/80 mt-1">
                제출 일시: {submission.timestamp} · 소요 시간: {Math.floor(submission.durationSeconds / 60)}분 {submission.durationSeconds % 60}초
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center min-w-[130px]">
              <span className="text-xs font-semibold text-white/90 block">최종 점수</span>
              <div className="text-4xl sm:text-5xl font-black text-amber-300 tracking-tight my-0.5">
                {submission.score}
                <span className="text-xl font-bold text-white/80">점</span>
              </div>
              <span className="text-xs text-white/90 font-medium">
                {submission.correctCount} / {submission.totalQuestions}개 완전 정답
              </span>
            </div>
          </div>
        </div>

        {/* Google Sheet Sync Status Bar */}
        <div className={`px-6 py-2.5 flex items-center justify-between text-xs font-medium border-b ${
          sheetSubmitStatus.status === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : sheetSubmitStatus.status === 'sending' 
              ? 'bg-blue-50 text-blue-800 border-blue-200' 
              : sheetSubmitStatus.status === 'error'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <Send className="w-3.5 h-3.5 animate-pulse" />
            <span>{sheetSubmitStatus.message}</span>
          </div>
          <span className="text-[11px] opacity-75">구글 스프레드시트 기록 연동</span>
        </div>

        {/* Feedback List & Explanations */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>사례별 상세 채점 및 오답 해설</span>
            </h3>
            <span className="text-xs text-slate-500">
              {isPerfect ? '모든 개념을 정확히 이해했습니다!' : '틀린 부분을 확인하고 해설을 읽어보세요.'}
            </span>
          </div>

          <div className="space-y-4">
            {submission.results.map(({ item, selectedActorText, selectedRoleText, isActorCorrect, isRoleCorrect, isFullyCorrect }) => (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isFullyCorrect
                    ? 'bg-white border-emerald-200 shadow-xs'
                    : 'bg-white border-red-200 shadow-xs ring-1 ring-red-100'
                }`}
              >
                {/* Top Badge & Title */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-lg text-xs font-bold text-white shadow-xs"
                      style={{ backgroundColor: item.color }}
                    >
                      사례 {item.id}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {isFullyCorrect ? (
                        <span className="text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> 정답 (+17점)
                        </span>
                      ) : (
                        <span className="text-rose-700 flex items-center gap-1.5">
                          <XCircle className="w-4 h-4" /> 오답 및 복습 필요
                        </span>
                      )}
                    </h4>
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isFullyCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isFullyCorrect ? '완벽 일치' : isActorCorrect || isRoleCorrect ? '부분 일치' : '불일치'}
                  </span>
                </div>

                {/* Case Text Box */}
                <div className="text-xs sm:text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3 leading-relaxed">
                  <strong className="text-slate-900">상황:</strong> {item.caseText}
                </div>

                {/* Selected vs Correct Comparison Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                  {/* Actor Check */}
                  <div className={`p-3 rounded-xl border ${isActorCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="text-slate-600">1. 정치 주체</span>
                      <span className={isActorCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                        {isActorCorrect ? '⭕ 정답' : '❌ 오답'}
                      </span>
                    </div>
                    <div className="text-slate-700">
                      내 선택: <span className={`font-bold ${isActorCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>{selectedActorText || '(미연결)'}</span>
                    </div>
                    {!isActorCorrect && (
                      <div className="mt-1 text-slate-600">
                        올바른 주체: <span className="font-bold text-blue-700">{item.actor}</span>
                      </div>
                    )}
                  </div>

                  {/* Role Check */}
                  <div className={`p-3 rounded-xl border ${isRoleCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="text-slate-600">2. 정치 주체의 역할</span>
                      <span className={isRoleCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                        {isRoleCorrect ? '⭕ 정답' : '❌ 오답'}
                      </span>
                    </div>
                    <div className="text-slate-700 line-clamp-2" title={selectedRoleText}>
                      내 선택: <span className={`font-bold ${isRoleCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>{selectedRoleText || '(미연결)'}</span>
                    </div>
                    {!isRoleCorrect && (
                      <div className="mt-1 text-slate-600 line-clamp-2">
                        올바른 역할: <span className="font-bold text-blue-700">{item.role}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pedagogical Explanation Box */}
                <div className="bg-blue-50/40 p-3.5 rounded-xl border border-blue-100 text-xs space-y-2">
                  <div className="flex items-start gap-1.5 text-slate-800">
                    <span className="font-bold text-blue-700 whitespace-nowrap">💡 주체 해설:</span>
                    <span className="leading-relaxed">{item.actorExpl}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-800">
                    <span className="font-bold text-indigo-700 whitespace-nowrap">🎯 역할 해설:</span>
                    <span className="leading-relaxed">{item.roleExpl}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-700 pt-1 border-t border-blue-100">
                    <span className="font-bold text-emerald-700 whitespace-nowrap">📌 핵심 정리:</span>
                    <span className="leading-relaxed">{item.keyTakeaway}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onToggleShowAnswers();
                onClose();
              }}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4 text-blue-600" />
              <span>{showingAnswers ? '내 연결선 보기' : '퀴즈 화면에서 정답 선 확인하기'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition hidden sm:flex items-center gap-1"
            >
              <Printer className="w-4 h-4" />
              <span>성적표 인쇄</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRetry}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>다시 풀기</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs"
            >
              닫기
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
