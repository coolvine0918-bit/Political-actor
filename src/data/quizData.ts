import { QuizItem, ActorNode, RoleNode } from '../types';

export const QUIZ_ITEMS: QuizItem[] = [
  {
    id: 1,
    color: '#2563eb', // Blue
    colorName: '파랑',
    caseText: '우리 동네 횡단보도에 신호등이 없어 학생들의 교통사고 위험이 크자, 학부모들이 시청 누리집에 민원을 제기하고 서명 운동을 벌였다.',
    actor: '개인',
    role: '선거 참여, 민원 제기 등을 통해 자신의 의견을 정당하게 표현하고 공공의 문제 해결에 직접 참여한다.',
    actorExpl: '학부모 개개인이 주체가 되어 민원 제기와 서명 운동이라는 참여 수단을 통해 동네 안전 문제(공공 문제)를 해결하고자 행동하였으므로 정치 주체는 \'개인\'입니다.',
    roleExpl: '시청 민원 제기 및 서명 운동을 통해 직접 공공 문제 해결에 참여하는 풀뿌리 민주 시민의 역할을 보여줍니다.',
    keyTakeaway: '개인은 청원, 민원, 서명 운동, 선거 투표 등을 통해 일상 속 공공 문제를 해결하는 가장 기본적이고 핵심적인 정치 주체입니다.'
  },
  {
    id: 2,
    color: '#059669', // Emerald
    colorName: '초록',
    caseText: '환경 보호를 위해 일회용 플라스틱 컵 사용을 전면 금지하자는 캠페인을 전국적으로 벌이며, 정부에 관련 법규 강화를 촉구하는 단체가 있다.',
    actor: '시민단체',
    role: '사회 전체의 공익 실현을 위해 활동하며, 정부 정책을 감시하고 비판하거나 대안을 제시한다.',
    actorExpl: '특정 집단의 사익이 아닌 환경 보호라는 사회 전체의 보편적 \'공익(Public Interest)\'을 목적으로 활동하므로 정치 주체는 \'시민단체\'입니다.',
    roleExpl: '전국적인 대중 캠페인을 조직하고 정부에 법령 강화를 촉구함으로써 정책 대안을 제시하고 공익을 수호하는 역할을 합니다.',
    keyTakeaway: '시민단체는 비영리·비정부 조직(NGO)으로서 사익이 아닌 사회 전체의 \'공익 실현\'을 최고 목표로 삼습니다.'
  },
  {
    id: 3,
    color: '#d97706', // Amber
    colorName: '주황',
    caseText: 'A아파트 주변에 쓰레기 소각장이 들어온다는 소식에 A아파트 입주민 단체에서 쓰레기 소각장 반대시위를 연일 하고 있다.',
    actor: '이익 집단',
    role: '특정 지역이나 집단의 이익을 대변하여 요구 사항을 전달하고 정책 반영을 유도한다.',
    actorExpl: '해당 아파트 입주민들만의 쾌적한 주거권과 환경 보호 등 \'특정 지역 및 집단의 사적 이익\'을 추구하는 모임이므로 \'이익 집단\'입니다.',
    roleExpl: '특정 지역 주민들의 이익을 대변하여 쓰레기 소각장 반대 요구 사항을 전달하고 지자체의 정책 반영을 유도하는 역할을 합니다.',
    keyTakeaway: '이익 집단은 특정 지역 주민, 직능 단체 등 구성원들의 공통된 특수 이익을 대변하여 정책 결정 과정에 영향력을 행사합니다.'
  },
  {
    id: 4,
    color: '#7c3aed', // Purple
    colorName: '보라',
    caseText: '한 방송사 심층 보도 프로그램에서 최근 늘어나는 \'청소년 SNS 범죄 노출\'의 심각성을 집중 취재하고, 해외의 규제 사례를 소개했다.',
    actor: '언론',
    role: '사회적 의제에 대한 정보를 제공하고 여론을 형성하며, 권력을 비판하고 감시한다.',
    actorExpl: '방송, 신문, 인터넷 뉴스 등 사실을 취재하고 심층 분석하여 대중에게 보도하는 미디어이므로 정치 주체는 \'언론\'입니다.',
    roleExpl: '사회의 심각한 문제를 대중의 공적 관심사로 끌어올리는 \'의제 설정(Agenda Setting)\'과 여론 형성 및 대안 제시의 역할을 수행합니다.',
    keyTakeaway: '언론은 대중에게 정확한 정보를 제공하고 여론을 형성하여 제4의 권부로서 사회적 감시자 역할을 합니다.'
  },
  {
    id: 5,
    color: '#db2777', // Pink
    colorName: '분홍',
    caseText: '의사협회와 간호사협회가 각 직역의 업무 범위와 처우 개선을 두고 서로 다른 법안 통과를 국회에 요구하며 팽팽하게 대립하고 있다.',
    actor: '이익 집단',
    role: '소속 집단의 특정한 사적 이익이나 요구를 실현하기 위해 정책 결정 과정에 영향력을 행사한다.',
    actorExpl: '의사협회와 간호사협회는 특정 직역 종사자들의 권익과 처우를 대변하는 대표적인 전문 직능별 \'이익 집단\'입니다.',
    roleExpl: '소속 집단의 특정한 사적 이익이나 요구(처우 개선 및 업무 범위)를 관철하기 위해 국회에 법안 통과를 요구하며 정책 결정 과정에 영향력을 행사합니다.',
    keyTakeaway: '전문 직능 단체(의사협회, 간호사협회 등)도 소속 구성원의 특수한 사적 이익을 법과 제도에 관철하려는 중요한 이익 집단입니다.'
  },
  {
    id: 6,
    color: '#0891b2', // Cyan
    colorName: '청록',
    caseText: 'A기업이 정부의 새로운 세금 부과 정책이 부당하다며 취소해 달라는 소송을 제기했고, 판사는 A기업의 손을 들어주었다.',
    actor: '법원',
    role: '법을 적용하여 분쟁을 해결하고 법질서를 유지하며, 행정부의 입법 및 집행 과정의 위법성을 심판한다.',
    actorExpl: '행정부 처분의 적법성을 재판을 통해 판단하고 최종 판결을 내리는 국가의 사법 기관이므로 정치 주체는 \'법원\'입니다.',
    roleExpl: '법률에 따라 구체적 분쟁을 판결하고, 행정부의 과세 처분이 위법한지 여부를 심판하여 국민의 권리를 구제하는 역할을 합니다.',
    keyTakeaway: '법원은 국가의 사법 기관(공식적 정치 주체)으로서 삼권 분립의 원리에 따라 행정부와 입법부를 견제하고 법치를 실현합니다.'
  }
];

// Column 2: Political Actors (shuffled for challenge)
export const ACTOR_NODES: ActorNode[] = [
  { id: 'actor-1', text: '개인' },
  { id: 'actor-2', text: '시민단체' },
  { id: 'actor-3', text: '이익 집단' },
  { id: 'actor-4', text: '언론' },
  { id: 'actor-5', text: '이익 집단' },
  { id: 'actor-6', text: '법원' }
];

// Column 3: Roles (shuffled order for challenge)
export const ROLE_NODES: RoleNode[] = [
  { id: 'role-1', targetCaseId: 1, text: QUIZ_ITEMS[0].role },
  { id: 'role-5', targetCaseId: 5, text: QUIZ_ITEMS[4].role },
  { id: 'role-6', targetCaseId: 6, text: QUIZ_ITEMS[5].role },
  { id: 'role-2', targetCaseId: 2, text: QUIZ_ITEMS[1].role },
  { id: 'role-3', targetCaseId: 3, text: QUIZ_ITEMS[2].role },
  { id: 'role-4', targetCaseId: 4, text: QUIZ_ITEMS[3].role }
];
