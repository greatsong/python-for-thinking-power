// AI 도움 레벨
export const AI_LEVELS = {
  DISABLED: 0,
  QUESTIONS_ONLY: 1,
  CONCEPTUAL_HINT: 2,
  PSEUDOCODE: 3,
  CODE_EXAMPLE: 4,
};

export const AI_LEVEL_LABELS = {
  0: 'AI 비활성화',
  1: '질문으로 유도',
  2: '개념 힌트',
  3: '수도코드 설명',
  4: '코드 예시',
};

// 문제 난이도
export const DIFFICULTY = {
  BEGINNER: 1,
  NOVICE: 2,
  CHALLENGER: 3,
  SOLVER: 4,
  MASTER: 5,
};

export const DIFFICULTY_LABELS = {
  1: '입문자',
  2: '초보자',
  3: '도전자',
  4: '문제해결자',
  5: '코딩대마왕',
};

export const DIFFICULTY_COLORS = {
  1: '#22c55e',
  2: '#3b82f6',
  3: '#eab308',
  4: '#f97316',
  5: '#ef4444',
};

// 문제 카테고리
export const CATEGORIES = {
  OUTPUT: 'output',
  LOGIC: 'logic',
  LOOP: 'loop',
  STRING: 'string',
  LIST: 'list',
  FUNCTION: 'function',
  ALGORITHM: 'algorithm',
};

export const CATEGORY_LABELS = {
  output: '출력',
  logic: '조건/논리',
  loop: '반복',
  string: '문자열',
  list: '리스트',
  function: '함수',
  algorithm: '알고리즘',
};

// 문제 상태
export const PROBLEM_STATUS = {
  DRAFT: 'draft',
  REVIEW: 'review',
  APPROVED: 'approved',
  REVISION: 'revision',
  REJECTED: 'rejected',
};

// 유저 역할
export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
};
