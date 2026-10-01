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
 */

// 웹 앱 접속 시 HTML 페이지 렌더링
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('정치 주체와 역할 탐구 퀴즈')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 1. [시트1] 정치 주체와 역할 3단 선긋기 퀴즈 결과 저장
function submitQuiz(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // '시트1' 명시적 검색 (없으면 첫 번째 시트 사용)
    var sheet1 = ss.getSheetByName('시트1') || ss.getSheetByName('시트 1') || ss.getSheetByName('Sheet1') || ss.getSheets()[0];
    
    // 헤더가 없으면 A열(학번), B열(이름), C열(점수) 규격으로 자동 생성
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

// 2. [시트2] 시민단체 vs 이익 집단 스피드 퀴즈 결과 저장
function submitSpeedQuiz(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // '시트2' 명시적 검색 (없으면 두 번째 시트 또는 신규 생성)
    var sheet2 = ss.getSheetByName('시트2') || ss.getSheetByName('시트 2') || ss.getSheetByName('Sheet2');
    if (!sheet2) {
      if (ss.getSheets().length > 1) {
        sheet2 = ss.getSheets()[1];
      } else {
        sheet2 = ss.insertSheet('시트2');
      }
    }
    
    // 헤더가 없으면 A열(학번), B열(이름), C열(점수) 규격으로 자동 생성
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
    var score = (data.score !== undefined && data.score !== null)
      ? Number(data.score)
      : Math.round((correctCount / totalQuestions) * 100);
      
    var attemptNumber = (data.attemptNumber || 1) + '차 도전';
    var timeSpent = Number(data.timeSpent) || 0;
    var details = data.details || '';
    
    // A열: 학번, B열: 이름, C열: 점수 순서로 정확히 기록
    sheet2.appendRow([
      studentId,                                   // A열: 학번
      studentName,                                 // B열: 이름
      score,                                       // C열: 점수
      attemptNumber,                               // D열: 도전회차
      correctCount + ' / ' + totalQuestions,       // E열: 맞힌 개수
      timeSpent + '초',                            // F열: 소요 시간(초)
      timestamp,                                   // G열: 제출일시
      details                                      // H열: 세부 채점 내역
    ]);
    
    sheet2.autoResizeColumns(1, 8);
    
    return {
      success: true,
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

// 3. 외부 웹(깃허브 페이지, 브라우저 등)에서 fetch POST 요청 처리 (CORS 대응)
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    
    var result;
    if (data.type === 'speed_quiz' || data.quizType === 'speed' || data.targetSheet === '시트2') {
      result = submitSpeedQuiz(data);
    } else {
      result = submitQuiz(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
