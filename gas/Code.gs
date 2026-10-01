/**
 * ====================================================================
 * 정치 과정과 정치 주체 통합 퀴즈 웹앱 - Google Apps Script (Code.gs)
 * ====================================================================
 * 
 * [시트 연동 규격]
 * - [시트1]: 1. 정치 주체 역할 3단 선긋기 퀴즈
 *   A열: 학번 | B열: 이름 | C열: 점수 | D열: 제출일시 | E열: 정답수 | F열: 세부 채점 내역
 * 
 * - [시트2]: 2. 시민단체 vs 이익 집단 스피드 퀴즈
 *   A열: 학번 | B열: 이름 | C열: 점수 | D열: 도전회차 | E열: 맞힌 개수 | F열: 소요 시간(초) | G열: 제출일시 | H열: 세부 내역
 * 
 * [★필독 - 왜 시트 1에만 다 들어갔을까요?]
 * 구글 앱스 스크립트는 코드를 수정하고 저장(Ctrl+S)만 누르면 배포된 웹 앱이 갱신되지 않습니다!
 * 반드시 상단 우측 [배포] > [배포 관리] > [연필(수정) 아이콘] > [버전: 새 버전]을 선택하고 [배포]를 눌러야
 * 지금 이 새로운 코드가 동작하여 시트 1과 시트 2에 완벽하게 분리 저장됩니다!
 */

// 1. 웹 앱 접속 및 GET 방식 데이터 수신 처리 (CORS 대응)
function doGet(e) {
  if (e && e.parameter && (e.parameter.studentId || e.parameter.studentName || e.parameter.type || e.parameter.sheet)) {
    var data = e.parameter;
    
    // 스피드 퀴즈 여부 판별 (10문항, attemptNumber, timeSpent, type 등)
    var isSpeed = (
      data.type === 'speed_quiz' ||
      data.quizType === 'speed' ||
      data.sheet === '시트2' ||
      data.targetSheet === '시트2' ||
      data.attemptNumber !== undefined ||
      data.timeSpent !== undefined ||
      Number(data.totalQuestions) === 10
    );
    
    var result = isSpeed ? submitSpeedQuiz(data) : submitQuiz(data);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('정치 주체와 역할 탐구 퀴즈')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 2. [시트1] 3단 선긋기 퀴즈 결과 저장
function submitQuiz(data) {
  try {
    // [자동 감지 분기] 만약 스피드 퀴즈 데이터가 이 함수로 들어왔다면 자동으로 시트2 저장 함수로 토스!
    if (data && (
      data.type === 'speed_quiz' ||
      data.quizType === 'speed' ||
      data.sheet === '시트2' ||
      data.targetSheet === '시트2' ||
      data.attemptNumber !== undefined ||
      data.timeSpent !== undefined ||
      Number(data.totalQuestions) === 10
    )) {
      return submitSpeedQuiz(data);
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    
    // 시트1 탐색 (이름 '시트1' 또는 첫 번째 시트 사용)
    var sheet1 = null;
    for (var i = 0; i < sheets.length; i++) {
      var name = sheets[i].getName().replace(/\s+/g, '').toLowerCase();
      if (name === '시트1' || name === 'sheet1') {
        sheet1 = sheets[i];
        break;
      }
    }
    if (!sheet1) {
      sheet1 = sheets[0];
    }
    
    // 헤더 행이 비어있으면 생성: [A: 학번, B: 이름, C: 점수, ...]
    if (sheet1.getLastRow() === 0) {
      var headers = ['학번', '이름', '점수', '제출일시', '정답수', '세부 채점 내역'];
      sheet1.appendRow(headers);
      var headerRange = sheet1.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#2563eb');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      sheet1.setFrozenRows(1);
    }
    
    var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var studentId = String(data.studentId || '').trim();
    var studentName = String(data.studentName || '').trim();
    var score = Number(data.score) || 0;
    var correctCount = Number(data.correctCount) || 0;
    var totalQuestions = Number(data.totalQuestions) || 6;
    var details = data.details || '';
    
    // A열: 학번, B열: 이름, C열: 점수 순서로 정확히 기록
    sheet1.appendRow([
      studentId,                                   // A열: 학번
      studentName,                                 // B열: 이름
      score,                                       // C열: 점수 (100점 만점)
      timestamp,                                   // D열: 제출일시
      correctCount + ' / ' + totalQuestions,       // E열: 정답수
      details                                      // F열: 세부 채점 내역
    ]);
    
    sheet1.autoResizeColumns(1, 6);
    
    return {
      success: true,
      target: '시트1',
      message: '시트1에 [학번, 이름, 점수]가 성공적으로 기록되었습니다.'
    };
  } catch (error) {
    Logger.log('Error in submitQuiz: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

// 3. [시트2] 시민단체 vs 이익 집단 스피드 퀴즈 결과 저장
function submitSpeedQuiz(data) {
  try {
    // [자동 감지 분기] 만약 선긋기 퀴즈 데이터가 이 함수로 들어왔다면 시트1 저장 함수로 토스!
    if (data && (
      data.type === 'line_quiz' ||
      data.sheet === '시트1' ||
      data.targetSheet === '시트1' ||
      (Number(data.totalQuestions) === 6 && data.attemptNumber === undefined)
    )) {
      return submitQuiz(data);
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    
    // 시트2 탐색 ('시트2' 이름 매칭)
    var sheet2 = null;
    for (var i = 0; i < sheets.length; i++) {
      var name = sheets[i].getName().replace(/\s+/g, '').toLowerCase();
      if (name === '시트2' || name === 'sheet2') {
        sheet2 = sheets[i];
        break;
      }
    }
    
    // 이름으로 못 찾았는데 시트가 2개 이상이면 무조건 2번째 시트 탭(index 1)을 시트2로 사용!
    if (!sheet2 && sheets.length >= 2) {
      sheet2 = sheets[1];
    }
    
    // 그래도 없으면 새 시트2 탭 생성
    if (!sheet2) {
      sheet2 = ss.insertSheet('시트2');
    }
    
    // 헤더 행이 비어있으면 생성: [A: 학번, B: 이름, C: 점수, ...]
    if (sheet2.getLastRow() === 0) {
      var headers = [
        '학번',
        '이름',
        '점수',
        '도전회차',
        '맞힌 개수',
        '소요 시간(초)',
        '제출일시',
        '세부 채점 내역'
      ];
      sheet2.appendRow(headers);
      var headerRange = sheet2.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#d97706');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      sheet2.setFrozenRows(1);
    }
    
    var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var studentId = String(data.studentId || '').trim();
    var studentName = String(data.studentName || '').trim();
    var correctCount = Number(data.correctCount) || 0;
    var totalQuestions = Number(data.totalQuestions) || 10;
    
    // 점수: 10개 문항이므로 문항당 10점 (예: 9개 정답 시 90점, 10개 정답 시 100점)
    var score = (data.score !== undefined && data.score !== null && data.score !== '')
      ? Number(data.score)
      : Math.round((correctCount / totalQuestions) * 100);
      
    var attemptNumber = String(data.attemptNumber || 1);
    if (!attemptNumber.includes('차')) {
      attemptNumber += '차 도전';
    }
    
    var timeSpent = String(data.timeSpent || 0);
    if (!timeSpent.includes('초')) {
      timeSpent += '초';
    }
    
    var details = data.details || '';
    
    // A열: 학번, B열: 이름, C열: 점수 순서로 정확히 기록
    sheet2.appendRow([
      studentId,                                   // A열: 학번
      studentName,                                 // B열: 이름
      score,                                       // C열: 점수
      attemptNumber,                               // D열: 도전회차
      correctCount + ' / ' + totalQuestions,       // E열: 맞힌 개수
      timeSpent,                                   // F열: 소요 시간(초)
      timestamp,                                   // G열: 제출일시
      details                                      // H열: 세부 채점 내역
    ]);
    
    sheet2.autoResizeColumns(1, 8);
    
    return {
      success: true,
      target: '시트2',
      message: '시트2에 [학번, 이름, 점수]가 성공적으로 기록되었습니다.'
    };
  } catch (error) {
    Logger.log('Error in submitSpeedQuiz: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

// 4. 외부 웹(브라우저 fetch POST) 요청 처리
function doPost(e) {
  try {
    var data = {};
    
    // 1) postData.contents 파싱
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err1) {
        try {
          data = JSON.parse(decodeURIComponent(e.postData.contents));
        } catch (err2) {
          data = e.parameter || {};
        }
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    
    // 2) URL 쿼리 파라미터가 있으면 데이터에 병합
    if (e && e.parameter) {
      for (var k in e.parameter) {
        data[k] = e.parameter[k];
      }
    }
    
    // 3) 스피드 퀴즈 감지 (다양한 플래그와 문항수 10으로 확실하게 판별)
    var isSpeed = (
      data.type === 'speed_quiz' ||
      data.quizType === 'speed' ||
      data.sheet === '시트2' ||
      data.targetSheet === '시트2' ||
      data.attemptNumber !== undefined ||
      data.timeSpent !== undefined ||
      Number(data.totalQuestions) === 10
    );
    
    var result = isSpeed ? submitSpeedQuiz(data) : submitQuiz(data);
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('doPost Error: ' + err.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
