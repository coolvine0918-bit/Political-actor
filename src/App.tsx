import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  CheckCircle,
  ArrowRight,
  Eye,
  Info
} from 'lucide-react';
import { QUIZ_ITEMS, ACTOR_NODES, ROLE_NODES } from './data/quizData';
import { ConnectionMap, StudentSubmission, GradeResult } from './types';
import { ConnectionsSvg } from './components/ConnectionsSvg';
import { ResultModal } from './components/ResultModal';
import { sounds } from './utils/audio';

export default function App() {
  // Student Info
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [startTime] = useState<number>(() => Date.now());

  // Connection State: caseId -> { actorNodeId, roleNodeId }
  const [connections, setConnections] = useState<ConnectionMap>(() => {
    const init: ConnectionMap = {};
    QUIZ_ITEMS.forEach((item) => {
      init[item.id] = { actorNodeId: null, roleNodeId: null };
    });
    return init;
  });

  // Active selection for click-to-connect
  const [activeSelection, setActiveSelection] = useState<{
    type: 'case' | 'actor' | 'role';
    id: number | string;
  } | null>(null);

  // Dragging state for drag-to-connect
  const [draggingState, setDraggingState] = useState<{
    fromType: 'case' | 'actor';
    fromId: number | string;
    fromDotId: string;
    startPoint: { x: number; y: number };
    currentPoint: { x: number; y: number };
    color: string;
  } | null>(null);

  // Sound toggle
  const [soundOn, setSoundOn] = useState(true);

  // Answer display toggle (review mode)
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

  // Modals
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<StudentSubmission | null>(null);

  // Google Apps Script Web App URL (stored in localStorage)
  const [gasUrl, setGasUrl] = useState<string>(() => {
    return localStorage.getItem('gas_quiz_webhook_url') || '';
  });

  const [sheetSubmitStatus, setSheetSubmitStatus] = useState<{
    status: 'idle' | 'sending' | 'success' | 'error';
    message: string;
  }>({
    status: 'idle',
    message: '대기 중',
  });

  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Keep sound manager in sync
  useEffect(() => {
    sounds.enabled = soundOn;
  }, [soundOn]);

  // Handle Save Gas URL
  const handleSaveGasUrl = (url: string) => {
    setGasUrl(url);
    localStorage.setItem('gas_quiz_webhook_url', url);
  };

  // Click-to-connect Handler
  const handleCardClick = (type: 'case' | 'actor' | 'role', id: number | string) => {
    sounds.play('select');

    if (!activeSelection) {
      setActiveSelection({ type, id });
      return;
    }

    // Clicking the same card clears selection
    if (activeSelection.type === type && activeSelection.id === id) {
      setActiveSelection(null);
      return;
    }

    // 1. Case -> Actor
    if (activeSelection.type === 'case' && type === 'actor') {
      const caseId = Number(activeSelection.id);
      const actorId = String(id);
      makeConnectionCaseToActor(caseId, actorId);
      // Keep actor selected so user can immediately click a role!
      setActiveSelection({ type: 'actor', id: actorId });
      sounds.play('connect');
      return;
    }

    // 2. Actor -> Case
    if (activeSelection.type === 'actor' && type === 'case') {
      const actorId = String(activeSelection.id);
      const caseId = Number(id);
      makeConnectionCaseToActor(caseId, actorId);
      setActiveSelection(null);
      sounds.play('connect');
      return;
    }

    // 3. Actor -> Role
    if (activeSelection.type === 'actor' && type === 'role') {
      const actorId = String(activeSelection.id);
      const roleId = String(id);
      makeConnectionActorToRole(actorId, roleId);
      setActiveSelection(null);
      sounds.play('connect');
      return;
    }

    // 4. Role -> Actor
    if (activeSelection.type === 'role' && type === 'actor') {
      const roleId = String(activeSelection.id);
      const actorId = String(id);
      makeConnectionActorToRole(actorId, roleId);
      setActiveSelection(null);
      sounds.play('connect');
      return;
    }

    // Switch selection to new type
    setActiveSelection({ type, id });
  };

  const makeConnectionCaseToActor = (caseId: number, actorId: string) => {
    setConnections((prev) => {
      const next = { ...prev };
      // Free this actor from other cases to keep it 1:1
      Object.keys(next).forEach((cId) => {
        const numId = Number(cId);
        if (numId !== caseId && next[numId].actorNodeId === actorId) {
          next[numId] = { ...next[numId], actorNodeId: null };
        }
      });
      next[caseId] = { ...next[caseId], actorNodeId: actorId };
      return next;
    });
  };

  const makeConnectionActorToRole = (actorId: string, roleId: string) => {
    // Find which case is attached to this actor
    let parentCaseId: number | null = null;
    Object.keys(connections).forEach((cId) => {
      const numId = Number(cId);
      if (connections[numId].actorNodeId === actorId) {
        parentCaseId = numId;
      }
    });

    if (parentCaseId === null) {
      alert('먼저 이 정치 주체와 연결할 왼쪽 [사례]를 선택해 주세요!');
      return;
    }

    const targetCaseId: number = parentCaseId;

    setConnections((prev) => {
      const next = { ...prev };
      // Free role from other cases
      Object.keys(next).forEach((cId) => {
        const numId = Number(cId);
        if (numId !== targetCaseId && next[numId].roleNodeId === roleId) {
          next[numId] = { ...next[numId], roleNodeId: null };
        }
      });
      next[targetCaseId] = { ...next[targetCaseId], roleNodeId: roleId };
      return next;
    });
  };

  // Remove connection
  const handleRemoveConnection = (caseId: number, type: 'actor' | 'role') => {
    sounds.play('delete');
    setConnections((prev) => {
      const next = { ...prev };
      if (type === 'actor') {
        next[caseId] = { actorNodeId: null, roleNodeId: null };
      } else {
        next[caseId] = { ...next[caseId], roleNodeId: null };
      }
      return next;
    });
  };

  // Reset all
  const handleResetAll = () => {
    if (confirm('모든 연결선을 초기화하고 다시 시작할까요?')) {
      sounds.play('delete');
      const reset: ConnectionMap = {};
      QUIZ_ITEMS.forEach((item) => {
        reset[item.id] = { actorNodeId: null, roleNodeId: null };
      });
      setConnections(reset);
      setActiveSelection(null);
      setShowCorrectAnswers(false);
    }
  };

  // Drag-and-drop pointer events
  const handleDotPointerDown = (
    e: React.PointerEvent,
    fromType: 'case' | 'actor',
    fromId: number | string,
    dotId: string,
    color: string
  ) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    if (!mainContainerRef.current) return;
    const containerRect = mainContainerRef.current.getBoundingClientRect();
    const startPoint = {
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
    };

    setDraggingState({
      fromType,
      fromId,
      fromDotId: dotId,
      startPoint,
      currentPoint: startPoint,
      color,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingState || !mainContainerRef.current) return;
    const containerRect = mainContainerRef.current.getBoundingClientRect();
    setDraggingState((prev) =>
      prev
        ? {
            ...prev,
            currentPoint: {
              x: e.clientX - containerRect.left,
              y: e.clientY - containerRect.top,
            },
          }
        : null
    );
  };

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!draggingState) return;

    // Detect element under pointer
    const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
    const dropTarget = elemBelow?.closest('[data-droptarget]');

    if (dropTarget) {
      const targetType = dropTarget.getAttribute('data-droptype');
      const targetId = dropTarget.getAttribute('data-dropid');

      if (draggingState.fromType === 'case' && targetType === 'actor' && targetId) {
        makeConnectionCaseToActor(Number(draggingState.fromId), targetId);
        sounds.play('connect');
      } else if (draggingState.fromType === 'actor' && targetType === 'role' && targetId) {
        makeConnectionActorToRole(String(draggingState.fromId), targetId);
        sounds.play('connect');
      }
    }

    setDraggingState(null);
  }, [draggingState, makeConnectionActorToRole]);

  // Submission & Grading
  const handleSubmit = async () => {
    const trimmedId = studentId.trim();
    const trimmedName = studentName.trim();

    if (!trimmedId || !trimmedName) {
      alert('학번과 이름을 모두 입력해 주세요!');
      const el = document.getElementById('studentIdInput');
      if (el) el.focus();
      return;
    }

    // Check unanswered items
    const incomplete = QUIZ_ITEMS.filter(
      (item) => !connections[item.id].actorNodeId || !connections[item.id].roleNodeId
    );

    if (incomplete.length > 0) {
      const names = incomplete.map((i) => `사례 ${i.id}`).join(', ');
      if (!confirm(`아직 ${names}이(가) 완전히 연결되지 않았습니다. 그래도 제출하시겠습니까?`)) {
        return;
      }
    }

    // Grade
    let correctCount = 0;
    const scorePerItem = Math.round(100 / QUIZ_ITEMS.length);
    let totalScore = 0;

    const results: GradeResult[] = QUIZ_ITEMS.map((item) => {
      const conn = connections[item.id];
      const selectedActor = ACTOR_NODES.find((a) => a.id === conn.actorNodeId);
      const selectedRole = ROLE_NODES.find((r) => r.id === conn.roleNodeId);

      const selectedActorText = selectedActor ? selectedActor.text : '(선택 안 됨)';
      const selectedRoleText = selectedRole ? selectedRole.text : '(선택 안 됨)';

      const isActorCorrect = selectedActorText === item.actor;
      const isRoleCorrect =
        !!selectedRole &&
        (selectedRole.targetCaseId === item.id ||
          ((item.id === 3 || item.id === 5) &&
            (selectedRole.targetCaseId === 3 || selectedRole.targetCaseId === 5)));
      const isFullyCorrect = isActorCorrect && isRoleCorrect;

      if (isFullyCorrect) {
        correctCount++;
        totalScore += scorePerItem;
      }

      return {
        item,
        selectedActorText,
        selectedRoleText,
        isActorCorrect,
        isRoleCorrect,
        isFullyCorrect,
      };
    });

    if (correctCount === QUIZ_ITEMS.length) {
      totalScore = 100;
    }

    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    const timestamp = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const submission: StudentSubmission = {
      studentId: trimmedId,
      studentName: trimmedName,
      score: totalScore,
      correctCount,
      totalQuestions: QUIZ_ITEMS.length,
      timestamp,
      durationSeconds,
      results,
    };

    setCurrentSubmission(submission);
    setIsResultOpen(true);

    if (totalScore >= 80) {
      sounds.play('complete');
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } else {
      sounds.play('success');
    }

    // Submit to Google Sheets (via Apps Script Webhook or Local Simulation)
    sendToGoogleSheet(submission);
  };

  const sendToGoogleSheet = async (sub: StudentSubmission) => {
    setSheetSubmitStatus({
      status: 'sending',
      message: '스프레드시트에 성적 기록 전송 중...',
    });

    const detailsStr = sub.results
      .map(
        (r) =>
          `[사례${r.item.id}] 주체:${r.selectedActorText}(${r.isActorCorrect ? 'O' : 'X'}) / 역할:${r.isRoleCorrect ? 'O' : 'X'}`
      )
      .join(' | ');

    const payload = {
      studentId: sub.studentId,
      studentName: sub.studentName,
      score: sub.score,
      correctCount: sub.correctCount,
      totalQuestions: sub.totalQuestions,
      details: detailsStr,
      timestamp: sub.timestamp,
    };

    if (gasUrl) {
      try {
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setSheetSubmitStatus({
          status: 'success',
          message: '구글 스프레드시트에 성공적으로 기록되었습니다!',
        });
      } catch {
        setSheetSubmitStatus({
          status: 'error',
          message: '시트 전송 중 통신 오류가 발생했습니다. (앱스스크립트 배포 설정을 확인하세요)',
        });
      }
    } else {
      // Local preview / test simulation
      setTimeout(() => {
        setSheetSubmitStatus({
          status: 'success',
          message: '학번, 이름, 점수 저장 완료 (테스트 모드 / 시트 URL 등록 시 실시간 기록)',
        });
      }, 700);
    }
  };

  // Completion count
  const completedCasesCount = QUIZ_ITEMS.filter(
    (item) => connections[item.id].actorNodeId && connections[item.id].roleNodeId
  ).length;

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased selection:bg-blue-100"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Subject Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              政
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                  중·고등 사회 탐구
                </span>
                <span className="text-[10px] text-slate-400 font-medium">단원: 정치 과정과 정치 주체</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                정치 주체와 역할 3단 선긋기 퀴즈
              </h1>
            </div>
          </div>

          {/* Student Info Inputs & Quick Actions */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center bg-slate-100 px-2 py-1 rounded-xl border border-slate-200 gap-1.5">
              <label htmlFor="studentIdInput" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                학번
              </label>
              <input
                id="studentIdInput"
                type="text"
                placeholder="예: 20315"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-20 px-2 py-1 text-xs bg-white rounded-lg border border-slate-300 focus:outline-blue-500 font-medium"
              />
              <span className="text-slate-300">|</span>
              <label htmlFor="studentNameInput" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                이름
              </label>
              <input
                id="studentNameInput"
                type="text"
                placeholder="예: 홍길동"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-20 px-2 py-1 text-xs bg-white rounded-lg border border-slate-300 focus:outline-blue-500 font-medium"
              />
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundOn(!soundOn)}
              title={soundOn ? '소리 끄기' : '소리 켜기'}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition"
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

        </div>
      </header>

      {/* Guide & Controls Strip */}
      <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 border-b border-slate-200/80 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs sm:text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <span className="font-bold text-blue-900">선긋기 방법:</span>
            <span className="text-slate-600 text-xs sm:text-sm">
              [사례] 클릭 ➔ [주체] 클릭 ➔ [역할] 클릭 (또는 원형 핸들을 드래그하여 연결)
            </span>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
              진행도: {completedCasesCount} / {QUIZ_ITEMS.length}개 완료
            </span>

            {showCorrectAnswers && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>정답 선 확인 중</span>
              </span>
            )}

            <button
              onClick={handleResetAll}
              className="text-xs text-slate-500 hover:text-red-600 font-medium underline transition"
            >
              선 모두 지우기
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Workspace */}
      <main
        ref={mainContainerRef}
        className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 relative select-none"
      >
        {/* SVG Bezier Lines Canvas */}
        <ConnectionsSvg
          connections={connections}
          onRemoveConnection={handleRemoveConnection}
          showCorrectAnswers={showCorrectAnswers}
          draggingState={draggingState}
        />

        {/* 3 Columns Layout (사례 - 정치주체 - 역할) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 relative z-10">
          
          {/* ========================================================
              COLUMN 1: 사례 (Cases)
             ======================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b-2 border-blue-500">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h2 className="font-black text-slate-900 text-base">상황 (사례)</h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">6개 실제 사례</span>
            </div>

            <div className="space-y-3">
              {QUIZ_ITEMS.map((item) => {
                const conn = connections[item.id];
                const isSelected = activeSelection?.type === 'case' && activeSelection.id === item.id;
                const isCompleted = conn.actorNodeId && conn.roleNodeId;
                const hasActor = !!conn.actorNodeId;

                return (
                  <div
                    key={item.id}
                    id={`case-card-${item.id}`}
                    onClick={() => handleCardClick('case', item.id)}
                    className={`p-4 rounded-2xl bg-white border transition-all duration-150 relative cursor-pointer group shadow-xs ${
                      isSelected
                        ? 'ring-2 ring-blue-500 border-transparent shadow-md bg-blue-50/20'
                        : isCompleted
                          ? 'border-emerald-200 hover:border-emerald-300'
                          : 'border-slate-200 hover:border-blue-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Header line of card */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="px-2.5 py-0.5 rounded-lg text-xs font-bold text-white shadow-xs"
                        style={{ backgroundColor: item.color }}
                      >
                        사례 {item.id}
                      </span>

                      <div className="text-[11px] font-semibold">
                        {isCompleted ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> 연결 완료
                          </span>
                        ) : hasActor ? (
                          <span className="text-blue-600 font-medium">주체 연결됨</span>
                        ) : (
                          <span className="text-slate-400">미연결</span>
                        )}
                      </div>
                    </div>

                    {/* Case Text */}
                    <p className="text-xs sm:text-sm text-slate-700 font-normal leading-relaxed pr-3">
                      {item.caseText}
                    </p>

                    {/* Right Connector Handle */}
                    <div
                      id={`case-dot-${item.id}`}
                      onPointerDown={(e) =>
                        handleDotPointerDown(e, 'case', item.id, `case-dot-${item.id}`, item.color)
                      }
                      title="클릭하거나 드래그하여 정치 주체에 연결"
                      className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-125 z-20"
                      style={{
                        backgroundColor: hasActor ? item.color : '#cbd5e1',
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================
              COLUMN 2: 정치 주체 (Actors)
             ======================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b-2 border-indigo-500">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <h2 className="font-black text-slate-900 text-base">정치 주체</h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">선택 및 연결</span>
            </div>

            <div className="space-y-3">
              {ACTOR_NODES.map((actor, idx) => {
                const isSelected = activeSelection?.type === 'actor' && activeSelection.id === actor.id;

                // Find which cases are connected to this actor
                const connectedCaseIds = Object.keys(connections)
                  .map(Number)
                  .filter((cId) => connections[cId].actorNodeId === actor.id);

                const firstCase = connectedCaseIds.length > 0 ? QUIZ_ITEMS.find((q) => q.id === connectedCaseIds[0]) : null;

                return (
                  <div
                    key={actor.id}
                    id={`actor-card-${actor.id}`}
                    data-droptarget="true"
                    data-droptype="actor"
                    data-dropid={actor.id}
                    onClick={() => handleCardClick('actor', actor.id)}
                    className={`p-4 rounded-2xl bg-white border transition-all duration-150 relative cursor-pointer min-h-[96px] flex flex-col justify-center items-center text-center shadow-xs ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 border-transparent shadow-md bg-indigo-50/20'
                        : connectedCaseIds.length > 0
                          ? 'border-indigo-200'
                          : 'border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Left Connector Handle (Receives from Case) */}
                    <div
                      id={`actor-dot-left-${actor.id}`}
                      title="사례의 연결을 받는 핸들"
                      className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-125 z-20"
                      style={{
                        backgroundColor: firstCase ? firstCase.color : '#cbd5e1',
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-400">
                          선택지 {idx + 1}
                        </span>
                        {connectedCaseIds.length > 0 && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[10px] font-bold text-white"
                            style={{ backgroundColor: firstCase?.color }}
                          >
                            사례 {connectedCaseIds.join(', ')} 연결됨
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        {actor.text}
                      </h3>
                    </div>

                    {/* Right Connector Handle (Sends to Role) */}
                    <div
                      id={`actor-dot-right-${actor.id}`}
                      onPointerDown={(e) =>
                        handleDotPointerDown(
                          e,
                          'actor',
                          actor.id,
                          `actor-dot-right-${actor.id}`,
                          firstCase ? firstCase.color : '#4f46e5'
                        )
                      }
                      title="클릭하거나 드래그하여 역할에 연결"
                      className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-125 z-20"
                      style={{
                        backgroundColor: firstCase?.color || '#cbd5e1',
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================
              COLUMN 3: 역할 (Roles)
             ======================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-500">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <h2 className="font-black text-slate-900 text-base">정치 주체의 역할</h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">최종 매칭</span>
            </div>

            <div className="space-y-3">
              {ROLE_NODES.map((role, idx) => {
                const isSelected = activeSelection?.type === 'role' && activeSelection.id === role.id;

                // Find which case is connected to this role
                const connectedCaseId = Object.keys(connections)
                  .map(Number)
                  .find((cId) => connections[cId].roleNodeId === role.id);

                const connectedCase = connectedCaseId ? QUIZ_ITEMS.find((q) => q.id === connectedCaseId) : null;

                return (
                  <div
                    key={role.id}
                    id={`role-card-${role.id}`}
                    data-droptarget="true"
                    data-droptype="role"
                    data-dropid={role.id}
                    onClick={() => handleCardClick('role', role.id)}
                    className={`p-4 rounded-2xl bg-white border transition-all duration-150 relative cursor-pointer min-h-[96px] flex flex-col justify-center shadow-xs ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 border-transparent shadow-md bg-emerald-50/20'
                        : connectedCase
                          ? 'border-emerald-200'
                          : 'border-slate-200 hover:border-emerald-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Left Connector Handle (Receives from Actor) */}
                    <div
                      id={`role-dot-${role.id}`}
                      title="주체의 역할을 받는 핸들"
                      className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-125 z-20"
                      style={{
                        backgroundColor: connectedCase ? connectedCase.color : '#cbd5e1',
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>

                    <div className="flex items-center justify-between mb-1.5 pl-3">
                      <span className="text-[11px] font-semibold text-slate-400">
                        역할 설명 {String.fromCharCode(65 + idx)}
                      </span>
                      {connectedCase && (
                        <span
                          className="px-2 py-0.2 rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: connectedCase.color }}
                        >
                          사례 {connectedCase.id} 매칭됨
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 font-normal leading-relaxed pl-3 pr-1">
                      {role.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Bottom Submission Bar */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2.5 text-xs text-slate-600">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              선택한 연결선을 클릭하면 연결을 삭제할 수 있으며, 모든 사례를 주체와 역할까지 이어야 100점 채점이 완료됩니다.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {showCorrectAnswers && (
              <button
                onClick={() => setShowCorrectAnswers(false)}
                className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition"
              >
                내 답안 보기
              </button>
            )}

            <button
              onClick={handleSubmit}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
            >
              <span>답안 제출 및 자동 채점하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </main>

      {/* Result Modal */}
      {isResultOpen && currentSubmission && (
        <ResultModal
          submission={currentSubmission}
          onClose={() => setIsResultOpen(false)}
          onRetry={() => {
            setIsResultOpen(false);
            const reset: ConnectionMap = {};
            QUIZ_ITEMS.forEach((item) => {
              reset[item.id] = { actorNodeId: null, roleNodeId: null };
            });
            setConnections(reset);
            setActiveSelection(null);
            setShowCorrectAnswers(false);
          }}
          onToggleShowAnswers={() => setShowCorrectAnswers(!showCorrectAnswers)}
          showingAnswers={showCorrectAnswers}
          sheetSubmitStatus={sheetSubmitStatus}
        />
      )}
    </div>
  );
}
