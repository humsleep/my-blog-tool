export const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
  '온라인', '기타',
] as const;

export type Region = (typeof REGIONS)[number];

export const TIME_SLOTS = ['오전', '오후', '저녁', '협의'] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];

export const COMPANION_STATUS = ['모집중', '마감', '완료'] as const;
export type CompanionStatus = (typeof COMPANION_STATUS)[number];
