export interface SpeedQuizItem {
  id: number;
  name: string;
  purpose: string;
  answer: '시민단체' | '이익 집단';
  explanation: string;
}

export interface SpeedQuizAttemptResult {
  attemptNumber: number; // 1, 2, 3
  timeLimit: number; // 30, 45, 60
  timeSpent: number; // in seconds
  correctCount: number;
  totalQuestions: number;
  answers: {
    item: SpeedQuizItem;
    userAnswer: '시민단체' | '이익 집단' | '미응답';
    isCorrect: boolean;
  }[];
  timestamp: string;
}

export const SPEED_ATTEMPTS_CONFIG = [
  { attempt: 1, timeLimit: 30, label: '1차 도전 (제한시간 30초)' },
  { attempt: 2, timeLimit: 45, label: '2차 도전 (제한시간 45초)' },
  { attempt: 3, timeLimit: 60, label: '3차 도전 (제한시간 1분)' }
];

export const SPEED_QUIZ_ITEMS: SpeedQuizItem[] = [
  {
    id: 1,
    name: '멸종위기종 보호 연대',
    purpose: '멸종 위기에 처한 야생 동식물을 보호하고 서식지를 보존하기 위한 캠페인 진행',
    answer: '시민단체',
    explanation: '환경 보호라는 사회 전체의 공익을 추구합니다.'
  },
  {
    id: 2,
    name: '전국 택시 운송 사업조합',
    purpose: '택시 요금 인상 및 택시 운전사의 근로 조건 개선, 권익 보호를 위한 로비 활동',
    answer: '이익 집단',
    explanation: '택시 기사 및 사업자라는 특정 집단의 특수 이익을 추구합니다.'
  },
  {
    id: 3,
    name: '소비자 주권 행동',
    purpose: '기업의 허위 과장 광고를 감시하고, 불량 제품에 대한 소비자 불매 운동 주도',
    answer: '시민단체',
    explanation: '일반 소비자의 권리라는 공익을 대변합니다.'
  },
  {
    id: 4,
    name: '대한치과의사협회',
    purpose: '치과의사들의 의료 수가 인상 요구 및 치과 의료계의 법적 권리 확보',
    answer: '이익 집단',
    explanation: '치과의사라는 특정 직업군의 사익을 대변합니다.'
  },
  {
    id: 5,
    name: '부정부패 척결 연대',
    purpose: '고위 공직자의 비리 감시 및 투명하고 깨끗한 정치 문화 조성을 위한 활동',
    answer: '시민단체',
    explanation: '사회 전반의 정의와 정치 투명성이라는 공익을 추구합니다.'
  },
  {
    id: 6,
    name: '전국 철도 노동조합',
    purpose: '철도 노동자의 임금 인상, 정년 연장, 근무 환경 개선을 위한 파업 및 협상',
    answer: '이익 집단',
    explanation: '철도 노동자라는 조합원의 이익과 근로조건 향상을 목적으로 합니다.'
  },
  {
    id: 7,
    name: '아름다운 이웃 자원봉사단',
    purpose: '소외계층 무료 급식 지원 및 독거노인 주거 환경 개선 봉사 활동',
    answer: '시민단체',
    explanation: '소외계층 지원 등 사회적 약자를 돕는 공익적 활동을 합니다.'
  },
  {
    id: 8,
    name: '한국 반도체 산업 협회',
    purpose: '반도체 기업들에 대한 세금 감면 및 규제 완화를 정부에 요구',
    answer: '이익 집단',
    explanation: '반도체 관련 기업들의 경제적 이익 극대화를 추구합니다.'
  },
  {
    id: 9,
    name: '어린이 안전 통학로 만들기 시민 모임',
    purpose: '스쿨존 내 과속 단속 카메라 설치 의무화 및 안전한 통학 환경 조성 촉구',
    answer: '시민단체',
    explanation: '어린이 안전이라는 사회적 가치와 공익을 추구합니다.'
  },
  {
    id: 10,
    name: '전국 농업 경영인 연합회',
    purpose: '농산물 수입 개방 반대 및 농업 보조금 확대 등 농민들의 소득 보장 요구',
    answer: '이익 집단',
    explanation: '농민이라는 특정 계층의 경제적 이익을 대변합니다.'
  }
];
