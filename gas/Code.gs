/**
 * ====================================================================
 * 정치 과정과 정치 주체 통합 퀴즈 웹앱 - Google Apps Script (Code.gs)
 * 5대 활동 통합 스프레드시트 기록 시스템 (시트1, 시트2, 시트3, 시트4, 시트5)
 * ====================================================================
 * 
 * [스프레드시트 시트별 기록 규격]
 * - [시트1]: 활동 1. 정치 주체 역할 3단 선긋기 퀴즈
 *   A열: 학번 | B열: 이름 | C열: 점수 | D열: 제출일시 | E열: 정답수 | F열: 세부 채점 내역
 * 
 * - [시트2]: 활동 2. 시민단체 vs 이익 집단 스피드 퀴즈 (3회 도전)
 *   A열: 학번 | B열: 이름 | C열: 점수 | D열: 도전회차 | E열: 맞힌 개수 | F열: 소요 시간(초) | G열: 제출일시 | H열: 세부 내역
 * 
 * - [시트3]: 활동 3. 정치주체의 역할과 정치과정 (객관식 20문항)
 *   A열: 학번 | B열: 이름 | C열: 점수 | D열: 제출일시 | E열: 맞힌 개수 (예: 18 / 20) | F열: 세부 채점 내역
 * 
 * - [시트4]: 활동 4. 정치과정 단계별 이해 평가 (객관식 10문항)
 *   A열: 학번 | B열: 이름 | C열: 점수 | D열: 제출일시 | E열: 맞힌 개수 (예: 9 / 10) | F열: 세부 채점 내역
 * 
 * - [시트5]: 활동 5. 정치 과정과 정치 주체 실전 평가 (실전 사례 10문항)
 *   A열: 학번 | B열: 이름 | C열: 점수 | D열: 제출일시 | E열: 맞힌 개수 (예: 10 / 10) | F열: 세부 채점 내역
 * 
 * [★배포 방법]
 * 이 코드를 스프레드시트의 Apps Script 편집기에 붙여넣고 저장(Ctrl+S)한 뒤,
 * 우측 상단 [배포] > [배포 관리] > [✏️ 수정] > [버전: 새 버전] > [배포]를 누르면 즉시 적용됩니다!
 */

// 1. 웹 접속 및 GET 방식 데이터 수신 처리 (CORS 대응)
function doGet(e) {
  if (e && e.parameter && (e.parameter.studentId || e.parameter.studentName || e.parameter.type || e.parameter.sheet)) {
    var data = e.parameter;
    var result;
    
    if (data.type === 'case_quiz_10' || data.quizType === 'quiz5' || data.sheet === '시트5' || data.targetSheet === '시트5') {
      result = submitQuiz5(data);
    } else if (data.type === 'process_quiz_10' || data.quizType === 'quiz4' || data.sheet === '시트4' || data.targetSheet === '시트4') {
      result = submitQuiz4(data);
    } else if (data.type === 'choice_quiz_20' || data.quizType === 'quiz3' || data.sheet === '시트3' || data.targetSheet === '시트3' || Number(data.totalQuestions) === 20) {
      result = submitQuiz3(data);
    } else if (data.type === 'speed_quiz' || data.quizType === 'speed' || data.sheet === '시트2' || data.targetSheet === '시트2' || data.attemptNumber !== undefined || data.timeSpent !== undefined) {
      result = submitSpeedQuiz(data);
    } else {
      result = submitQuiz(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('정치 주체와 정치과정 통합 퀴즈')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 2. [시트1] 활동 1: 3단 선긋기 퀴즈 결과 저장
function submitQuiz(data) {
  try {
    if (data && (data.type === 'case_quiz_10' || data.sheet === '시트5')) return submitQuiz5(data);
    if (data && (data.type === 'process_quiz_10' || data.sheet === '시트4')) return submitQuiz4(data);
    if (data && (data.type === 'choice_quiz_20' || data.sheet === '시트3' || Number(data.totalQuestions) === 20)) return submitQuiz3(data);
    if (data && (data.type === 'speed_quiz' || data.sheet === '시트2' || data.attemptNumber !== undefined)) return submitSpeedQuiz(data);
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    var sheet1 = ss.getSheetByName('시트1') || ss.getSheetByName('시트 1') || ss.getSheetByName('Sheet1') || sheets[0];
    
    if (sheet1.getLastRow() === 0) {
      var headers = ['학번', '이름', '점수', '제출일시', '정답수', '세부 채점 내역'];
      sheet1.appendRow(headers);
      var headerRange = sheet1.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#2563eb'); // Blue
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
    
    sheet1.appendRow([
      studentId,
      studentName,
      score,
      timestamp,
      correctCount + ' / ' + totalQuestions,
      details
    ]);
    sheet1.autoResizeColumns(1, 6);
    
    return { success: true, target: '시트1', message: '시트1 저장 성공' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// 3. [시트2] 활동 2: 스피드 퀴즈 결과 저장
function submitSpeedQuiz(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    
    var sheet2 = ss.getSheetByName('시트2') || ss.getSheetByName('시트 2') || ss.getSheetByName('Sheet2');
    if (!sheet2 && sheets.length >= 2) {
      sheet2 = sheets[1];
    }
    if (!sheet2) {
      sheet2 = ss.insertSheet('시트2');
    }
    
    if (sheet2.getLastRow() === 0) {
      var headers = ['학번', '이름', '점수', '도전회차', '맞힌 개수', '소요 시간(초)', '제출일시', '세부 채점 내역'];
      sheet2.appendRow(headers);
      var headerRange = sheet2.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#d97706'); // Amber
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
    
    var score = (data.score !== undefined && data.score !== null && data.score !== '')
      ? Number(data.score)
      : Math.round((correctCount / totalQuestions) * 100);
      
    var attemptNumber = String(data.attemptNumber || 1);
    if (!attemptNumber.includes('차')) attemptNumber += '차 도전';
    
    var timeSpent = String(data.timeSpent || 0);
    if (!timeSpent.includes('초')) timeSpent += '초';
    
    var details = data.details || '';
    
    sheet2.appendRow([
      studentId,
      studentName,
      score,
      attemptNumber,
      correctCount + ' / ' + totalQuestions,
      timeSpent,
      timestamp,
      details
    ]);
    sheet2.autoResizeColumns(1, 8);
    
    return { success: true, target: '시트2', message: '시트2 저장 성공' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// 4. [시트3] 활동 3: 정치주체의 역할과 정치과정 (객관식 20문항) 결과 저장
function submitQuiz3(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    
    var sheet3 = ss.getSheetByName('시트3') || ss.getSheetByName('시트 3') || ss.getSheetByName('Sheet3');
    if (!sheet3 && sheets.length >= 3) {
      sheet3 = sheets[2];
    }
    if (!sheet3) {
      sheet3 = ss.insertSheet('시트3');
    }
    
    if (sheet3.getLastRow() === 0) {
      var headers = ['학번', '이름', '점수', '제출일시', '맞힌 개수', '세부 채점 내역'];
      sheet3.appendRow(headers);
      var headerRange = sheet3.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#059669'); // Emerald
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      sheet3.setFrozenRows(1);
    }
    
    var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var studentId = String(data.studentId || '').trim();
    var studentName = String(data.studentName || '').trim();
    var correctCount = Number(data.correctCount) || 0;
    var totalQuestions = Number(data.totalQuestions) || 20;
    var score = (data.score !== undefined && data.score !== null && data.score !== '')
      ? Number(data.score)
      : Math.round((correctCount / totalQuestions) * 100);
    var details = data.details || '';
    
    sheet3.appendRow([
      studentId,                                   // A열: 학번
      studentName,                                 // B열: 이름
      score,                                       // C열: 점수 (100점 만점)
      timestamp,                                   // D열: 제출일시
      correctCount + ' / ' + totalQuestions,       // E열: 맞힌 개수
      details                                      // F열: 세부 채점 내역
    ]);
    sheet3.autoResizeColumns(1, 6);
    
    return { success: true, target: '시트3', message: '시트3 저장 성공' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// 5. [시트4] 활동 4: 정치과정의 단계별 이해 평가 (객관식 10문항) 결과 저장
function submitQuiz4(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    
    var sheet4 = ss.getSheetByName('시트4') || ss.getSheetByName('시트 4') || ss.getSheetByName('Sheet4');
    if (!sheet4 && sheets.length >= 4) {
      sheet4 = sheets[3];
    }
    if (!sheet4) {
      sheet4 = ss.insertSheet('시트4');
    }
    
    if (sheet4.getLastRow() === 0) {
      var headers = ['학번', '이름', '점수', '제출일시', '맞힌 개수', '세부 채점 내역'];
      sheet4.appendRow(headers);
      var headerRange = sheet4.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#7c3aed'); // Purple
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      sheet4.setFrozenRows(1);
    }
    
    var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var studentId = String(data.studentId || '').trim();
    var studentName = String(data.studentName || '').trim();
    var correctCount = Number(data.correctCount) || 0;
    var totalQuestions = Number(data.totalQuestions) || 10;
    var score = (data.score !== undefined && data.score !== null && data.score !== '')
      ? Number(data.score)
      : Math.round((correctCount / totalQuestions) * 100);
    var details = data.details || '';
    
    sheet4.appendRow([
      studentId,                                   // A열: 학번
      studentName,                                 // B열: 이름
      score,                                       // C열: 점수 (100점 만점)
      timestamp,                                   // D열: 제출일시
      correctCount + ' / ' + totalQuestions,       // E열: 맞힌 개수
      details                                      // F열: 세부 채점 내역
    ]);
    sheet4.autoResizeColumns(1, 6);
    
    return { success: true, target: '시트4', message: '시트4 저장 성공' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// 6. [시트5] 활동 5: 실전 사례 중심 평가 (객관식 10문항) 결과 저장
function submitQuiz5(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    
    var sheet5 = ss.getSheetByName('시트5') || ss.getSheetByName('시트 5') || ss.getSheetByName('Sheet5');
    if (!sheet5 && sheets.length >= 5) {
      sheet5 = sheets[4];
    }
    if (!sheet5) {
      sheet5 = ss.insertSheet('시트5');
    }
    
    if (sheet5.getLastRow() === 0) {
      var headers = ['학번', '이름', '점수', '제출일시', '맞힌 개수', '세부 채점 내역'];
      sheet5.appendRow(headers);
      var headerRange = sheet5.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#e11d48'); // Rose / Crimson
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      sheet5.setFrozenRows(1);
    }
    
    var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var studentId = String(data.studentId || '').trim();
    var studentName = String(data.studentName || '').trim();
    var correctCount = Number(data.correctCount) || 0;
    var totalQuestions = Number(data.totalQuestions) || 10;
    var score = (data.score !== undefined && data.score !== null && data.score !== '')
      ? Number(data.score)
      : Math.round((correctCount / totalQuestions) * 100);
    var details = data.details || '';
    
    sheet5.appendRow([
      studentId,                                   // A열: 학번
      studentName,                                 // B열: 이름
      score,                                       // C열: 점수 (100점 만점)
      timestamp,                                   // D열: 제출일시
      correctCount + ' / ' + totalQuestions,       // E열: 맞힌 개수
      details                                      // F열: 세부 채점 내역
    ]);
    sheet5.autoResizeColumns(1, 6);
    
    return { success: true, target: '시트5', message: '시트5 저장 성공' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// 7. 외부 웹 브라우저 fetch POST 요청 수신 및 분기
function doPost(e) {
  try {
    var data = {};
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
    
    if (e && e.parameter) {
      for (var k in e.parameter) {
        data[k] = e.parameter[k];
      }
    }
    
    var result;
    // 5. 시트5: 실전 사례 중심 10문항
    if (data.type === 'case_quiz_10' || data.quizType === 'quiz5' || data.sheet === '시트5' || data.targetSheet === '시트5') {
      result = submitQuiz5(data);
    }
    // 4. 시트4: 정치과정 단계별 이해 10문항
    else if (data.type === 'process_quiz_10' || data.quizType === 'quiz4' || data.sheet === '시트4' || data.targetSheet === '시트4') {
      result = submitQuiz4(data);
    }
    // 3. 시트3: 정치주체 20문항
    else if (data.type === 'choice_quiz_20' || data.quizType === 'quiz3' || data.sheet === '시트3' || data.targetSheet === '시트3' || Number(data.totalQuestions) === 20) {
      result = submitQuiz3(data);
    }
    // 2. 시트2: 스피드 퀴즈
    else if (data.type === 'speed_quiz' || data.quizType === 'speed' || data.sheet === '시트2' || data.targetSheet === '시트2' || data.attemptNumber !== undefined || data.timeSpent !== undefined) {
      result = submitSpeedQuiz(data);
    }
    // 1. 시트1: 3단 선긋기
    else {
      result = submitQuiz(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
