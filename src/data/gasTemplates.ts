export const CODE_GS_TEMPLATE = `/**
 * ====================================================================
 * 정치 주체와 역할 3단 선긋기 퀴즈 - Google Apps Script 백엔드 (Code.gs)
 * ====================================================================
 * 
 * [배포 안내]
 * 1. 구글 드라이브에서 새 'Google 스프레드시트' 생성
 * 2. 상단 메뉴 [확장 프로그램] > [Apps Script] 클릭
 * 3. 기본 Code.gs 내용을 모두 지우고 이 코드를 붙여넣기 후 저장(Ctrl+S)
 * 4. [+] 파일 추가 > [HTML] 선택 > 파일명을 'Index'로 입력하고 Index.html 내용 붙여넣기 후 저장
 * 5. 우측 상단 [배포] > [새 배포] 클릭
 *    - 유형: 웹 앱
 *    - 다음 사용자 권한으로 실행: '나(내 계정)'
 *    - 액세스 권한이 있는 사용자: '모든 사용자(Anyone)' 선택 (학생 로그인 불필요)
 * 6. 발급된 '웹 앱 URL'을 학생들에게 공유하면 끝!
 */

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('정치 주체와 역할 3단 선긋기 퀴즈')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function submitQuiz(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // 첫 행에 헤더가 없으면 자동 생성
    if (sheet.getLastRow() === 0) {
      var headers = ['제출일시', '학번', '이름', '점수', '정답수', '총문항', '세부 채점 내역'];
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#2563eb');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    }
    
    var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var studentId = data.studentId || '-';
    var studentName = data.studentName || '-';
    var score = Number(data.score) || 0;
    var correctCount = Number(data.correctCount) || 0;
    var totalQuestions = Number(data.totalQuestions) || 6;
    var details = data.details || '';
    
    // 학생 제출 성적 행 추가
    sheet.appendRow([
      timestamp,
      studentId,
      studentName,
      score,
      correctCount,
      totalQuestions,
      details
    ]);
    
    sheet.autoResizeColumns(1, 7);
    
    return {
      success: true,
      message: '성공적으로 스프레드시트에 저장되었습니다.'
    };
  } catch (error) {
    Logger.log('Error in submitQuiz: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

// 외부 프론트엔드에서 fetch POST 전송 시 처리
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    var result = submitQuiz(data);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

export const INDEX_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>정치 주체와 역할 3단 선긋기 퀴즈</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"><\/script>
  <style>
    body { font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif; }
    .card-active { ring: 3px solid #3b82f6; box-shadow: 0 0 15px rgba(59, 130, 246, 0.4); }
    .connector-dot {
      width: 14px;
      height: 14px;
      border-radius: 9999px;
      border: 2px solid white;
      transition: transform 0.15s ease, background-color 0.15s ease;
      cursor: pointer;
    }
    .connector-dot:hover {
      transform: scale(1.4);
    }
    svg.connections-svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
    }
    .line-clickable {
      pointer-events: stroke;
      cursor: pointer;
    }
    .line-clickable:hover {
      stroke-width: 6;
      filter: drop-shadow(0 0 4px currentColor);
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col antialiased selection:bg-blue-100">

  <!-- Header -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
          정
        </div>
        <div>
          <span class="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 mb-0.5">중·고등 사회 탐구</span>
          <h1 class="text-lg md:text-xl font-bold text-slate-900 tracking-tight">정치 주체와 역할 3단 선긋기</h1>
        </div>
      </div>
      
      <!-- Student Info Form in Header -->
      <div class="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        <div class="flex items-center gap-1.5 px-2">
          <label for="studentId" class="text-xs font-medium text-slate-600 whitespace-nowrap">학번</label>
          <input type="text" id="studentId" placeholder="예: 20315" class="w-24 px-2 py-1 text-sm bg-white rounded border border-slate-300 focus:outline-blue-500 font-medium">
        </div>
        <div class="h-4 w-px bg-slate-300"></div>
        <div class="flex items-center gap-1.5 px-2">
          <label for="studentName" class="text-xs font-medium text-slate-600 whitespace-nowrap">이름</label>
          <input type="text" id="studentName" placeholder="예: 홍길동" class="w-24 px-2 py-1 text-sm bg-white rounded border border-slate-300 focus:outline-blue-500 font-medium">
        </div>
        <button id="clearLinesBtn" class="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-white rounded transition">
          선 초기화
        </button>
      </div>
    </div>
  </header>

  <!-- Main Instructions Banner -->
  <div class="bg-gradient-to-r from-blue-50 via-indigo-50 to-white border-b border-blue-100 py-3 px-4">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-slate-700">
      <div class="flex items-center gap-2">
        <span class="flex h-2.5 w-2.5 relative">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
        </span>
        <span class="font-medium text-blue-900">연결 방법:</span>
        <span>왼쪽 <strong>[사례]</strong> 카드를 클릭한 뒤, 가운데 <strong>[정치 주체]</strong>를 클릭하고, 이어서 오른쪽 <strong>[역할]</strong>을 클릭하세요! (또는 동그라미를 드래그)</span>
      </div>
      <div id="connectionProgress" class="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 self-start sm:self-auto">
        연결 완료: 0 / 6개 사례
      </div>
    </div>
  </div>

  <!-- Quiz Playground Area -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-4 relative" id="quizPlayground">
    
    <!-- SVG Overlay for drawing connections -->
    <svg id="svgOverlay" class="connections-svg"></svg>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
      
      <!-- Column 1: 사례 (Cases) -->
      <div>
        <div class="flex items-center justify-between pb-2 mb-3 border-b-2 border-blue-500">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
            <h2 class="font-bold text-slate-900 text-base">상황 (사례)</h2>
          </div>
          <span class="text-xs text-slate-500 font-medium">6개 문항</span>
        </div>
        <div class="space-y-4" id="casesContainer"></div>
      </div>

      <!-- Column 2: 정치 주체 (Actors) -->
      <div>
        <div class="flex items-center justify-between pb-2 mb-3 border-b-2 border-indigo-500">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</span>
            <h2 class="font-bold text-slate-900 text-base">정치 주체</h2>
          </div>
          <span class="text-xs text-slate-500 font-medium">선택 연결</span>
        </div>
        <div class="space-y-4" id="actorsContainer"></div>
      </div>

      <!-- Column 3: 역할 (Roles) -->
      <div>
        <div class="flex items-center justify-between pb-2 mb-3 border-b-2 border-emerald-500">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">3</span>
            <h2 class="font-bold text-slate-900 text-base">정치 주체의 역할</h2>
          </div>
          <span class="text-xs text-slate-500 font-medium">최종 매칭</span>
        </div>
        <div class="space-y-4" id="rolesContainer"></div>
      </div>

    </div>

    <!-- Bottom Submit Bar -->
    <div class="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-xs">
      <div class="text-sm text-slate-600">
        💡 연결선이나 카드를 다시 클릭하면 언제든지 연결을 변경하거나 취소할 수 있습니다.
      </div>
      <button id="submitBtn" class="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 text-base">
        <span>답안 제출 및 자동 채점하기</span>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
      </button>
    </div>
  </main>

  <!-- Result Modal -->
  <div id="resultModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden overflow-y-auto">
    <div class="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Modal Header -->
      <div class="p-6 bg-gradient-to-br from-slate-900 to-blue-950 text-white flex items-center justify-between">
        <div>
          <span class="text-xs uppercase tracking-wider font-semibold text-blue-300">채점 결과 및 정답 해설</span>
          <h2 class="text-2xl font-black mt-1" id="modalScoreTitle">채점 완료</h2>
        </div>
        <div class="text-right">
          <div class="text-4xl font-black text-amber-300" id="modalFinalScore">0점</div>
          <div class="text-xs text-slate-300" id="modalScoreFraction">0 / 6 정답</div>
        </div>
      </div>

      <!-- Submission Status Banner -->
      <div id="submitStatusBanner" class="px-6 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-xs font-medium text-blue-800">
        <span id="submitStatusText">구글 스프레드시트에 기록 중...</span>
        <span id="submitTimestamp"></span>
      </div>

      <!-- Modal Body (Explanations) -->
      <div class="p-6 overflow-y-auto flex-1 space-y-4" id="explanationList">
        <!-- Dynamic items -->
      </div>

      <!-- Modal Footer -->
      <div class="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <button id="viewLinesAgainBtn" class="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition">
          내 연결선 다시 보기 (창 닫기)
        </button>
        <div class="flex items-center gap-2">
          <button id="retryBtn" class="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition">
            다시 풀기
          </button>
        </div>
      </div>

    </div>
  </div>

  <script>
    // Quiz Data
    const QUIZ_ITEMS = [
      {
        id: 1,
        color: '#2563eb',
        caseText: "우리 동네 횡단보도에 신호등이 없어 학생들의 교통사고 위험이 크자, 학부모들이 시청 누리집에 민원을 제기하고 서명 운동을 벌였다.",
        actor: "개인",
        role: "선거 참여, 민원 제기 등을 통해 자신의 의견을 정당하게 표현하고 공공의 문제 해결에 직접 참여한다.",
        actorExpl: "학부모 개개인이 민원 제기와 서명 운동이라는 참여 수단을 통해 동네 안전 문제(공공 문제)를 해결하고자 행동하였으므로 정치 주체는 '개인'입니다.",
        roleExpl: "신호등 설치를 위해 시청에 민원을 넣고 서명 운동을 벌인 것은 '민원 제기 등을 통해 의견을 표현하고 공공 문제 해결에 직접 참여'하는 역할입니다."
      },
      {
        id: 2,
        color: '#059669',
        caseText: "환경 보호를 위해 일회용 플라스틱 컵 사용을 전면 금지하자는 캠페인을 전국적으로 벌이며, 정부에 관련 법규 강화를 촉구하는 단체가 있다.",
        actor: "시민단체",
        role: "사회 전체의 공익 실현을 위해 활동하며, 정부 정책을 감시하고 비판하거나 대안을 제시한다.",
        actorExpl: "특정 집단의 사리사욕이 아닌 '환경 보호'라는 사회 전체의 보편적 '공익'을 목적으로 활동하므로 정치 주체는 '시민단체'입니다.",
        roleExpl: "전국적 캠페인 및 법규 강화 촉구 활동은 '공익 실현을 위해 활동하고 정부 정책에 대안을 제시'하는 전형적인 시민단체의 역할입니다."
      },
      {
        id: 3,
        color: '#d97706',
        caseText: "A아파트 주변에 쓰레기 소각장이 들어온다는 소식에 A아파트 입주민 단체에서 쓰레기 소각장 반대시위를 연일 하고 있다.",
        actor: "이익 집단",
        role: "특정 지역이나 집단의 이익을 대변하여 요구 사항을 전달하고 정책 반영을 유도한다.",
        actorExpl: "해당 아파트 입주민이라는 특정 구성원의 주거 환경과 부동산 가치 등 '특정한 사적 이익'을 지키기 위해 결성된 단체이므로 '이익 집단'입니다.",
        roleExpl: "특정 지역 주민들의 이익을 대변하여 소각장 반대 요구 사항을 전달하고 정책 반영을 유도하는 역할을 보여줍니다."
      },
      {
        id: 4,
        color: '#7c3aed',
        caseText: "한 방송사 심층 보도 프로그램에서 최근 늘어나는 '청소년 SNS 범죄 노출'의 심각성을 집중 취재하고, 해외의 규제 사례를 소개했다.",
        actor: "언론",
        role: "사회적 의제에 대한 정보를 제공하고 여론을 형성하며, 권력을 비판하고 감시한다.",
        actorExpl: "방송사 취재 및 심층 보도를 통해 사회적 문제를 대중에게 널리 전달하는 매체이므로 정치 주체는 '언론'입니다.",
        roleExpl: "사회적 위험 의제를 알리고 해외 대안을 소개해 사람들의 관심을 환기하고 '여론을 형성'하는 역할을 수행하고 있습니다."
      },
      {
        id: 5,
        color: '#db2777',
        caseText: "의사협회와 간호사협회가 각 직역의 업무 범위와 처우 개선을 두고 서로 다른 법안 통과를 국회에 요구하며 팽팽하게 대립하고 있다.",
        actor: "이익 집단",
        role: "소속 집단의 특정한 사적 이익이나 요구를 실현하기 위해 정책 결정 과정에 영향력을 행사한다.",
        actorExpl: "의사, 간호사 등 같은 직업군(직역)의 권익과 처우 개선을 대변하는 전문 직능 단체이므로 정치 주체는 '이익 집단'입니다.",
        roleExpl: "소속 집단의 특정한 사적 이익과 처우 개선을 법안에 반영시키기 위해 국회에 요구하고 로비·교섭하는 역할입니다."
      },
      {
        id: 6,
        color: '#0891b2',
        caseText: "A기업이 정부의 새로운 세금 부과 정책이 부당하다며 취소해 달라는 소송을 제기했고, 판사는 A기업의 손을 들어주었다.",
        actor: "법원",
        role: "법을 적용하여 분쟁을 해결하고 법질서를 유지하며, 행정부의 입법 및 집행 과정의 위법성을 심판한다.",
        actorExpl: "소송 사건에서 법률을 해석하고 판결을 내린 국가 사법 기관이므로 정치 주체는 '법원'입니다.",
        roleExpl: "행정부의 과세 처분이 적법한지 심판하여 기업의 권익을 구제하고 법질서를 수호하는 역할을 수행합니다."
      }
    ];

    const ACTOR_NODES = [
      { id: 'actor-1', text: '개인' },
      { id: 'actor-2', text: '시민단체' },
      { id: 'actor-3', text: '이익 집단' },
      { id: 'actor-4', text: '언론' },
      { id: 'actor-5', text: '이익 집단' },
      { id: 'actor-6', text: '법원' }
    ];

    const ROLE_NODES = [
      { id: 'role-1', targetCaseId: 1, text: QUIZ_ITEMS[0].role },
      { id: 'role-5', targetCaseId: 5, text: QUIZ_ITEMS[4].role },
      { id: 'role-6', targetCaseId: 6, text: QUIZ_ITEMS[5].role },
      { id: 'role-2', targetCaseId: 2, text: QUIZ_ITEMS[1].role },
      { id: 'role-3', targetCaseId: 3, text: QUIZ_ITEMS[2].role },
      { id: 'role-4', targetCaseId: 4, text: QUIZ_ITEMS[3].role }
    ];

    let connections = {};
    QUIZ_ITEMS.forEach(item => {
      connections[item.id] = { actorNodeId: null, roleNodeId: null };
    });

    let activeSelected = null;

    function playSfx(type) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const t = ctx.currentTime;
        if (type === 'click') {
          osc.frequency.setValueAtTime(440, t);
          osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);
          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
          osc.start(t);
          osc.stop(t + 0.08);
        } else if (type === 'connect') {
          osc.frequency.setValueAtTime(523.25, t);
          osc.frequency.exponentialRampToValueAtTime(659.25, t + 0.12);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
          osc.start(t);
          osc.stop(t + 0.14);
        } else if (type === 'success') {
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.frequency.setValueAtTime(freq, t + idx * 0.09);
            g.gain.setValueAtTime(0.15, t + idx * 0.09);
            g.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.09 + 0.15);
            o.start(t + idx * 0.09);
            o.stop(t + idx * 0.09 + 0.15);
          });
        }
      } catch (e) {}
    }

    function renderCards() {
      const casesContainer = document.getElementById('casesContainer');
      casesContainer.innerHTML = '';
      QUIZ_ITEMS.forEach(item => {
        const card = document.createElement('div');
        card.id = \`case-card-\${item.id}\`;
        card.className = \`p-4 rounded-xl border bg-white shadow-xs hover:shadow-md transition relative cursor-pointer border-slate-200 select-none\`;
        card.innerHTML = \`
          <div class="flex items-start justify-between gap-2">
            <span class="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold text-white" style="background-color: \${item.color}">
              사례 \${item.id}
            </span>
            <div id="case-badge-\${item.id}" class="text-xs font-medium text-slate-400">미연결</div>
          </div>
          <p class="mt-2 text-xs md:text-sm text-slate-700 leading-relaxed font-normal">\${item.caseText}</p>
          <div class="connector-dot bg-slate-300 absolute -right-2 top-1/2 -translate-y-1/2" id="case-dot-\${item.id}"></div>
        \`;
        card.addEventListener('click', () => handleCardClick('case', item.id));
        casesContainer.appendChild(card);
      });

      const actorsContainer = document.getElementById('actorsContainer');
      actorsContainer.innerHTML = '';
      ACTOR_NODES.forEach((node, idx) => {
        const card = document.createElement('div');
        card.id = \`actor-card-\${node.id}\`;
        card.className = \`p-4 rounded-xl border bg-white shadow-xs hover:shadow-md transition relative cursor-pointer border-slate-200 select-none flex items-center justify-center min-h-[92px] text-center\`;
        card.innerHTML = \`
          <div class="connector-dot bg-slate-300 absolute -left-2 top-1/2 -translate-y-1/2" id="actor-dot-left-\${node.id}"></div>
          <div>
            <span class="text-xs text-slate-400 font-medium block mb-1">주체 \${idx + 1}</span>
            <span class="text-base md:text-lg font-bold text-slate-900">\${node.text}</span>
          </div>
          <div class="connector-dot bg-slate-300 absolute -right-2 top-1/2 -translate-y-1/2" id="actor-dot-right-\${node.id}"></div>
        \`;
        card.addEventListener('click', () => handleCardClick('actor', node.id));
        actorsContainer.appendChild(card);
      });

      const rolesContainer = document.getElementById('rolesContainer');
      rolesContainer.innerHTML = '';
      ROLE_NODES.forEach((node, idx) => {
        const card = document.createElement('div');
        card.id = \`role-card-\${node.id}\`;
        card.className = \`p-4 rounded-xl border bg-white shadow-xs hover:shadow-md transition relative cursor-pointer border-slate-200 select-none min-h-[92px] flex items-center\`;
        card.innerHTML = \`
          <div class="connector-dot bg-slate-300 absolute -left-2 top-1/2 -translate-y-1/2" id="role-dot-\${node.id}"></div>
          <div class="w-full">
            <span class="text-xs text-slate-400 font-medium block mb-1">역할 \${idx + 1}</span>
            <p class="text-xs md:text-sm text-slate-700 leading-relaxed font-normal">\${node.text}</p>
          </div>
        \`;
        card.addEventListener('click', () => handleCardClick('role', node.id));
        rolesContainer.appendChild(card);
      });
    }

    function handleCardClick(type, id) {
      playSfx('click');

      if (!activeSelected) {
        setActive(type, id);
        return;
      }

      if (activeSelected.type === type && activeSelected.id === id) {
        clearActive();
        return;
      }

      if (activeSelected.type === 'case' && type === 'actor') {
        connectCaseToActor(activeSelected.id, id);
        setActive('actor', id);
        playSfx('connect');
        return;
      }

      if (activeSelected.type === 'actor' && type === 'case') {
        connectCaseToActor(id, activeSelected.id);
        clearActive();
        playSfx('connect');
        return;
      }

      if (activeSelected.type === 'actor' && type === 'role') {
        connectActorToRole(activeSelected.id, id);
        clearActive();
        playSfx('connect');
        return;
      }

      if (activeSelected.type === 'role' && type === 'actor') {
        connectActorToRole(id, activeSelected.id);
        clearActive();
        playSfx('connect');
        return;
      }

      if (activeSelected.type === 'case' && type === 'role') {
        alert('먼저 가운데 [정치 주체]를 연결한 후 [역할]을 연결해 주세요!');
        return;
      }

      setActive(type, id);
    }

    function setActive(type, id) {
      clearActive();
      activeSelected = { type, id };
      const el = document.getElementById(\`\${type}-card-\${id}\`);
      if (el) el.classList.add('card-active');
    }

    function clearActive() {
      if (activeSelected) {
        const el = document.getElementById(\`\${activeSelected.type}-card-\${activeSelected.id}\`);
        if (el) el.classList.remove('card-active');
      }
      activeSelected = null;
    }

    function connectCaseToActor(caseId, actorNodeId) {
      Object.keys(connections).forEach(cId => {
        if (connections[cId].actorNodeId === actorNodeId && Number(cId) !== Number(caseId)) {
          connections[cId].actorNodeId = null;
        }
      });
      connections[caseId].actorNodeId = actorNodeId;
      drawLines();
      updateProgress();
    }

    function connectActorToRole(actorNodeId, roleNodeId) {
      let linkedCaseId = null;
      Object.keys(connections).forEach(cId => {
        if (connections[cId].actorNodeId === actorNodeId) {
          linkedCaseId = Number(cId);
        }
      });

      if (!linkedCaseId) {
        alert('먼저 이 주체와 연결할 [사례]를 선택해 주세요!');
        return;
      }

      Object.keys(connections).forEach(cId => {
        if (connections[cId].roleNodeId === roleNodeId && Number(cId) !== linkedCaseId) {
          connections[cId].roleNodeId = null;
        }
      });

      connections[linkedCaseId].roleNodeId = roleNodeId;
      drawLines();
      updateProgress();
    }

    function getPoint(elementId) {
      const el = document.getElementById(elementId);
      const svg = document.getElementById('svgOverlay');
      if (!el || !svg) return { x: 0, y: 0 };
      const elRect = el.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      return {
        x: elRect.left + elRect.width / 2 - svgRect.left,
        y: elRect.top + elRect.height / 2 - svgRect.top
      };
    }

    function drawLines() {
      const svg = document.getElementById('svgOverlay');
      svg.innerHTML = '';

      let connectedCount = 0;

      QUIZ_ITEMS.forEach(item => {
        const conn = connections[item.id];
        const itemColor = item.color;
        const caseDotId = \`case-dot-\${item.id}\`;
        const caseBadge = document.getElementById(\`case-badge-\${item.id}\`);

        let isFull = conn.actorNodeId && conn.roleNodeId;
        if (isFull) connectedCount++;

        if (conn.actorNodeId) {
          const actorLeftDotId = \`actor-dot-left-\${conn.actorNodeId}\`;
          const p1 = getPoint(caseDotId);
          const p2 = getPoint(actorLeftDotId);
          drawBezier(svg, p1, p2, itemColor, \`사례\${item.id} 주체 연결\`, () => {
            connections[item.id].actorNodeId = null;
            connections[item.id].roleNodeId = null;
            drawLines();
            updateProgress();
          });
          highlightDot(caseDotId, itemColor);
          highlightDot(actorLeftDotId, itemColor);
        } else {
          resetDot(caseDotId);
        }

        if (conn.actorNodeId && conn.roleNodeId) {
          const actorRightDotId = \`actor-dot-right-\${conn.actorNodeId}\`;
          const roleDotId = \`role-dot-\${conn.roleNodeId}\`;
          const p1 = getPoint(actorRightDotId);
          const p2 = getPoint(roleDotId);
          drawBezier(svg, p1, p2, itemColor, \`사례\${item.id} 역할 연결\`, () => {
            connections[item.id].roleNodeId = null;
            drawLines();
            updateProgress();
          });
          highlightDot(actorRightDotId, itemColor);
          highlightDot(roleDotId, itemColor);
        }

        if (caseBadge) {
          if (isFull) {
            caseBadge.innerHTML = \`<span class="text-emerald-600 font-bold">✓ 연결 완료</span>\`;
          } else if (conn.actorNodeId) {
            caseBadge.innerHTML = \`<span class="text-blue-600 font-medium">주체 연결됨</span>\`;
          } else {
            caseBadge.innerHTML = \`<span class="text-slate-400">미연결</span>\`;
          }
        }
      });
    }

    function highlightDot(dotId, color) {
      const dot = document.getElementById(dotId);
      if (dot) {
        dot.style.backgroundColor = color;
        dot.style.transform = 'scale(1.2)';
      }
    }

    function resetDot(dotId) {
      const dot = document.getElementById(dotId);
      if (dot) {
        dot.style.backgroundColor = '#cbd5e1';
        dot.style.transform = 'none';
      }
    }

    function drawBezier(svg, p1, p2, color, title, onRemove) {
      const dx = Math.abs(p2.x - p1.x) * 0.5;
      const d = \`M \${p1.x} \${p1.y} C \${p1.x + dx} \${p1.y}, \${p2.x - dx} \${p2.y}, \${p2.x} \${p2.y}\`;

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hitPath.setAttribute('d', d);
      hitPath.setAttribute('fill', 'none');
      hitPath.setAttribute('stroke', 'transparent');
      hitPath.setAttribute('stroke-width', '18');
      hitPath.setAttribute('class', 'line-clickable');
      hitPath.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(\`선택한 연결선(\${title})을 삭제할까요?\`)) {
          onRemove();
        }
      });

      const visiblePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      visiblePath.setAttribute('d', d);
      visiblePath.setAttribute('fill', 'none');
      visiblePath.setAttribute('stroke', color);
      visiblePath.setAttribute('stroke-width', '3.5');
      visiblePath.setAttribute('stroke-linecap', 'round');
      visiblePath.style.filter = \`drop-shadow(0 2px 4px \${color}40)\`;

      group.appendChild(hitPath);
      group.appendChild(visiblePath);
      svg.appendChild(group);
    }

    function updateProgress() {
      let completeCount = 0;
      QUIZ_ITEMS.forEach(item => {
        if (connections[item.id].actorNodeId && connections[item.id].roleNodeId) {
          completeCount++;
        }
      });
      document.getElementById('connectionProgress').innerText = \`연결 완료: \${completeCount} / 6개 사례\`;
    }

    document.getElementById('clearLinesBtn').addEventListener('click', () => {
      if (confirm('모든 연결선을 지우고 다시 시작할까요?')) {
        QUIZ_ITEMS.forEach(item => {
          connections[item.id] = { actorNodeId: null, roleNodeId: null };
        });
        clearActive();
        drawLines();
        updateProgress();
      }
    });

    window.addEventListener('resize', () => {
      drawLines();
    });

    document.getElementById('submitBtn').addEventListener('click', () => {
      const studentId = document.getElementById('studentId').value.trim();
      const studentName = document.getElementById('studentName').value.trim();

      if (!studentId || !studentName) {
        alert('학번과 이름을 모두 입력해 주세요!');
        document.getElementById('studentId').focus();
        return;
      }

      let unanswered = [];
      QUIZ_ITEMS.forEach(item => {
        const conn = connections[item.id];
        if (!conn.actorNodeId || !conn.roleNodeId) {
          unanswered.push(item.id);
        }
      });

      if (unanswered.length > 0) {
        if (!confirm(\`아직 \${unanswered.join(', ')}번 사례가 완전히 연결되지 않았습니다. 그래도 제출하시겠습니까?\`)) {
          return;
        }
      }

      gradeAndSubmit(studentId, studentName);
    });

    function gradeAndSubmit(studentId, studentName) {
      let totalQuestions = QUIZ_ITEMS.length;
      let correctCount = 0;
      let scorePerItem = Math.round(100 / totalQuestions);
      let calculatedScore = 0;

      const results = QUIZ_ITEMS.map(item => {
        const conn = connections[item.id];
        const selectedActorNode = ACTOR_NODES.find(n => n.id === conn.actorNodeId);
        const selectedRoleNode = ROLE_NODES.find(n => n.id === conn.roleNodeId);

        const selectedActorText = selectedActorNode ? selectedActorNode.text : '(선택 안 함)';
        const selectedRoleText = selectedRoleNode ? selectedRoleNode.text : '(선택 안 함)';

        const isActorCorrect = selectedActorText === item.actor;
        const isRoleCorrect = selectedRoleNode && (
          selectedRoleNode.targetCaseId === item.id ||
          ((item.id === 3 || item.id === 5) && (selectedRoleNode.targetCaseId === 3 || selectedRoleNode.targetCaseId === 5))
        );

        const isFullyCorrect = isActorCorrect && isRoleCorrect;
        if (isFullyCorrect) {
          correctCount++;
          calculatedScore += scorePerItem;
        }

        return {
          item,
          isActorCorrect,
          isRoleCorrect,
          isFullyCorrect,
          selectedActorText,
          selectedRoleText
        };
      });

      if (correctCount === totalQuestions) calculatedScore = 100;

      const modal = document.getElementById('resultModal');
      const scoreTitle = document.getElementById('modalScoreTitle');
      const finalScoreEl = document.getElementById('modalFinalScore');
      const fractionEl = document.getElementById('modalScoreFraction');
      const explanationList = document.getElementById('explanationList');

      scoreTitle.innerText = \`\${studentName}(\${studentId}) 학생의 채점 결과\`;
      finalScoreEl.innerText = \`\${calculatedScore}점\`;
      fractionEl.innerText = \`\${correctCount} / \${totalQuestions} 정답\`;

      explanationList.innerHTML = '';
      results.forEach(res => {
        const item = res.item;
        const box = document.createElement('div');
        box.className = \`p-5 rounded-2xl border \${res.isFullyCorrect ? 'bg-emerald-50/70 border-emerald-200' : 'bg-red-50/70 border-red-200'}\`;
        
        box.innerHTML = \`
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-lg text-xs font-bold text-white" style="background-color: \${item.color}">사례 \${item.id}</span>
              <h4 class="font-bold text-slate-900 text-sm md:text-base">\${res.isFullyCorrect ? '🟢 완벽 정답 (+17점)' : '🔴 부분 오답 / 불일치'}</h4>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full \${res.isFullyCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
              \${res.isFullyCorrect ? '모두 맞힘' : '오답 복습'}
            </span>
          </div>

          <div class="text-xs text-slate-700 bg-white/80 p-3 rounded-xl border border-slate-200 mb-3">
            <strong>상황:</strong> \${item.caseText}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
            <div class="p-2.5 rounded-xl bg-white border \${res.isActorCorrect ? 'border-emerald-300' : 'border-red-300'}">
              <div class="font-semibold text-slate-600 mb-1 flex items-center justify-between">
                <span>1. 정치 주체</span>
                <span>\${res.isActorCorrect ? '⭕ 일치' : '❌ 오답'}</span>
              </div>
              <p>내가 고른 답: <span class="font-bold \${res.isActorCorrect ? 'text-emerald-700' : 'text-red-700'}">\${res.selectedActorText}</span></p>
              \${!res.isActorCorrect ? \`<p class="text-slate-500 mt-0.5">정답: <span class="font-bold text-blue-700">\${item.actor}</span></p>\` : ''}
            </div>

            <div class="p-2.5 rounded-xl bg-white border \${res.isRoleCorrect ? 'border-emerald-300' : 'border-red-300'}">
              <div class="font-semibold text-slate-600 mb-1 flex items-center justify-between">
                <span>2. 정치 주체의 역할</span>
                <span>\${res.isRoleCorrect ? '⭕ 일치' : '❌ 오답'}</span>
              </div>
              <p class="truncate" title="\${res.selectedRoleText}">내가 고른 답: <span class="font-bold \${res.isRoleCorrect ? 'text-emerald-700' : 'text-red-700'}">\${res.selectedRoleText}</span></p>
              \${!res.isRoleCorrect ? \`<p class="text-slate-500 mt-0.5">정답: <span class="font-bold text-blue-700">\${item.role}</span></p>\` : ''}
            </div>
          </div>

          <div class="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
            <div class="flex items-start gap-1.5 text-slate-800">
              <span class="font-bold text-blue-600 whitespace-nowrap">💡 주체 해설:</span>
              <span>\${item.actorExpl}</span>
            </div>
            <div class="flex items-start gap-1.5 text-slate-800">
              <span class="font-bold text-indigo-600 whitespace-nowrap">🎯 역할 해설:</span>
              <span>\${item.roleExpl}</span>
            </div>
          </div>
        \`;
        explanationList.appendChild(box);
      });

      modal.classList.remove('hidden');

      if (calculatedScore >= 80) {
        playSfx('success');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      submitToGoogleSheet({
        studentId,
        studentName,
        score: calculatedScore,
        correctCount,
        totalQuestions,
        details: results.map(r => \`사례\${r.item.id}: 주체(\${r.selectedActorText}/\${r.isActorCorrect?'O':'X'}) 역할(\${r.selectedRoleText}/\${r.isRoleCorrect?'O':'X'})\`).join(' | ')
      });
    }

    function submitToGoogleSheet(payload) {
      const bannerText = document.getElementById('submitStatusText');
      const bannerTime = document.getElementById('submitTimestamp');
      bannerText.innerText = '구글 스프레드시트에 저장 중...';

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler((response) => {
            bannerText.innerText = '✅ 구글 스프레드시트에 점수가 성공적으로 기록되었습니다!';
            bannerTime.innerText = new Date().toLocaleTimeString('ko-KR');
          })
          .withFailureHandler((err) => {
            bannerText.innerText = '⚠️ 시트 저장 실패: ' + err;
          })
          .submitQuiz(payload);
      } else {
        setTimeout(() => {
          bannerText.innerText = '✅ (로컬/테스트 모드) 채점 완료 및 제출 시뮬레이션 성공';
          bannerTime.innerText = new Date().toLocaleTimeString('ko-KR');
        }, 600);
      }
    }

    document.getElementById('viewLinesAgainBtn').addEventListener('click', () => {
      document.getElementById('resultModal').classList.add('hidden');
    });

    document.getElementById('retryBtn').addEventListener('click', () => {
      document.getElementById('resultModal').classList.add('hidden');
      QUIZ_ITEMS.forEach(item => {
        connections[item.id] = { actorNodeId: null, roleNodeId: null };
      });
      clearActive();
      drawLines();
      updateProgress();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    renderCards();
    setTimeout(() => {
      drawLines();
    }, 100);
  <\/script>
</body>
</html>
`;
