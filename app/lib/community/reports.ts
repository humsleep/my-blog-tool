export type ReportTarget = 'swap_post' | 'tips_post' | 'tips_comment' | 'companion_post';

export type ReportReasonCode = 'spam' | 'abuse' | 'adult' | 'privacy' | 'illegal' | 'etc';

export const REPORT_REASONS: { code: ReportReasonCode; label: string; help?: string }[] = [
  { code: 'spam',    label: '도배·광고',   help: '같은 내용 반복, 외부 광고/유료 서비스 홍보' },
  { code: 'abuse',   label: '욕설·비방',   help: '욕설, 인신공격, 차별·혐오 표현' },
  { code: 'adult',   label: '음란·선정성',  help: '성인 콘텐츠, 노출, 음란물' },
  { code: 'privacy', label: '개인정보 노출', help: '전화번호, 주민번호, 주소, 사진 등' },
  { code: 'illegal', label: '불법 정보',    help: '도박, 마약, 사기, 저작권 침해' },
  { code: 'etc',     label: '기타',        help: '위에 해당하지 않는 문제' },
];
