/**
 * ====================================================================
 * 정치 주체와 역할 3단 선긋기 퀴즈 - Google Apps Script 백엔드 (Code.gs)
 * ====================================================================
 * 
 * [배포 안내]
 * 1. 스프레드시트 만들기: 구글 드라이브에서 새 'Google 스프레드시트'를 생성합니다.
 * 2. 확장 프로그램 > Apps Script 클릭
 * 3. 기존 코드(Code.gs)를 모두 지우고 이 파일의 내용을 붙여넣기합니다.
 * 4. 파일 추가(+) 버튼 > HTML 선택 > 파일명을 'Index'로 입력하고 Index.html 파일 내용을 붙여넣기합니다.
 * 5. 우측 상단 [배포] > [새 배포] 클릭
 *    - 유형 선택(톱니바퀴): '웹 앱'
 *    - 설명: '정치 퀴즈 웹앱'
 *    - 다음 사용자 권한으로 실행: '나(내 계정)'
 *    - 액세스 권한이 있는 사용자: '모든 사용자(Anyone)' 선택 (★중요: 로그인 없이 학생 제출 가능)
 * 6. [배포] 클릭 후 승인 절차를 진행하고 발급된 '웹 앱 URL'을 학생들에게 공유합니다.
 */

// 웹 앱 접속 시 HTML 페이지 렌더링
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('정치 주체와 역할 3단 선긋기 퀴즈')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 학생 제출 데이터 스프레드시트에 기록 (google.script.run 방식)
function submitQuiz(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // 시트가 비어있으면 헤더 행 생성
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
    
    // 날짜 포맷 (한국 표준시)
    var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    
    var studentId = data.studentId || '-';
    var studentName = data.studentName || '-';
    var score = Number(data.score) || 0;
    var correctCount = Number(data.correctCount) || 0;
    var totalQuestions = Number(data.totalQuestions) || 6;
    var details = data.details || '';
    
    // 행 추가
    sheet.appendRow([
      timestamp,
      studentId,
      studentName,
      score,
      correctCount,
      totalQuestions,
      details
    ]);
    
    // 열 너비 자동 맞춤
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

// 외부 웹에서 fetch(POST)로 전송할 경우 지원 (CORS 대응)
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
