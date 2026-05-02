export const CATEGORIES = [
  '일상',
  '맛집',
  '육아/결혼',
  '스포츠',
  'IT/기술',
  '요리/음식',
  '여행',
  '뷰티/패션',
  '건강/운동',
  '교육/학습',
  '경제/투자',
  '인테리어',
  '반려동물',
  '자동차',
  '게임',
  '부동산',
  '영화/드라마',
  '기타',
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}
