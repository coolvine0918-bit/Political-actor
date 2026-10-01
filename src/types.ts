export interface QuizItem {
  id: number;
  color: string;
  colorName: string;
  caseText: string;
  actor: string;
  role: string;
  actorExpl: string;
  roleExpl: string;
  keyTakeaway: string;
}

export interface ActorNode {
  id: string;
  text: string;
  categoryHint?: string;
}

export interface RoleNode {
  id: string;
  targetCaseId: number;
  text: string;
}

export interface CaseConnection {
  actorNodeId: string | null;
  roleNodeId: string | null;
}

export interface ConnectionMap {
  [caseId: number]: CaseConnection;
}

export interface GradeResult {
  item: QuizItem;
  selectedActorText: string;
  selectedRoleText: string;
  isActorCorrect: boolean;
  isRoleCorrect: boolean;
  isFullyCorrect: boolean;
}

export interface StudentSubmission {
  studentId: string;
  studentName: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timestamp: string;
  durationSeconds: number;
  results: GradeResult[];
}
