import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침 - Boheme BlogLab',
  description: 'Boheme BlogLab의 개인정보처리방침입니다. 수집하는 개인정보 항목, 처리 목적, 제3자 제공, 정보주체의 권리 등을 안내합니다.',
};

export default function PrivacyPage() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">개인정보처리방침</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-10">
            <strong>최종 수정일:</strong> 2026년 4월 23일 &middot; <strong>시행일:</strong> 2026년 4월 23일
          </p>

          <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-300 space-y-10">

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">1. 총칙</h2>
              <p className="leading-relaxed">
                Boheme BlogLab(이하 &ldquo;서비스&rdquo;)은 이용자의 개인정보를 매우 중요하게 생각하며, &ldquo;개인정보 보호법&rdquo; 등
                관련 법령을 준수하고 있습니다. 본 개인정보처리방침은 서비스가 수집하는 개인정보의 항목, 처리 목적, 보유 기간,
                제3자 제공 및 처리위탁, 이용자의 권리 등을 안내하기 위해 마련되었습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">2. 수집하는 개인정보 항목 및 수집 방법</h2>
              <p className="mb-3">서비스는 다음과 같은 개인정보를 수집합니다.</p>

              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mt-5 mb-2">가. 회원가입(Google 소셜 로그인) 시</h3>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>필수: 이메일 주소, 구글 계정 고유 식별자(sub), 이름</li>
                <li>선택: 프로필 이미지 URL</li>
                <li>수집 방법: Google OAuth 2.0 인증을 통한 제공</li>
              </ul>

              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mt-5 mb-2">나. AI 초안 생성 기능 이용 시</h3>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>이용자가 입력한 프롬프트 내용 및 키워드</li>
                <li>일일 사용 횟수 및 이용 날짜</li>
                <li>수집 방법: 서비스 내 &ldquo;AI 초안 생성&rdquo; 기능 이용 시 자동 기록</li>
              </ul>

              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mt-5 mb-2">다. 문의사항 접수 시</h3>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>이메일 주소, 문의 내용</li>
                <li>수집 방법: 이메일을 통한 자발적 제공</li>
              </ul>

              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mt-5 mb-2">라. 자동 수집 항목</h3>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>IP 주소, 쿠키, 접속 일시, 서비스 이용 기록, User-Agent 등 기기 정보</li>
                <li>수집 방법: 서비스 이용 과정에서 자동 생성&middot;수집</li>
              </ul>

              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mt-5 mb-2">마. 비로그인 이용자의 일일 한도 적용을 위한 IP 해시</h3>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>비로그인 상태에서 AI 글쓰기 기능을 이용하는 경우, 일일 무료 한도(1회) 적용을 위해 접속 IP를 SHA-256 알고리즘으로 단방향 해시한 값과 이용 일자를 저장합니다.</li>
                <li>원본 IP 주소는 별도로 저장되지 않으며, 해시 값으로부터 원본 IP를 복원할 수 없습니다.</li>
                <li>보유 기간: 30일 (이후 자동 삭제). 일일 한도 초기화는 매일 자정(KST) 기준으로 새 row가 생성되어 자연스럽게 이루어집니다.</li>
                <li>로그인 이용자에게는 적용되지 않으며, 회원 ID 기준으로 한도가 관리됩니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">3. 개인정보의 처리 목적</h2>
              <p className="mb-3">수집된 개인정보는 다음의 목적을 위해서만 처리되며, 이용 목적이 변경될 경우 사전 동의를 구합니다.</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li><strong>회원 식별 및 인증:</strong> Google 계정을 통한 로그인 처리 및 본인 확인</li>
                <li><strong>서비스 제공:</strong> AI 초안 생성 기능 제공, 일일 무료 사용 횟수 관리</li>
                <li><strong>부정 이용 방지:</strong> 사용량 한도 초과 및 비정상적 접근 차단</li>
                <li><strong>문의사항 응대:</strong> 이용자 문의에 대한 회신</li>
                <li><strong>서비스 개선:</strong> 접속 로그 및 이용 통계 분석</li>
                <li><strong>법령상 의무 이행:</strong> 관계 법령에 따른 보존 및 조사 협조</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">4. 개인정보의 보유 및 이용 기간</h2>
              <ul className="list-disc pl-6 space-y-1.5">
                <li><strong>회원 정보:</strong> 회원 탈퇴 시까지. 회원 탈퇴 요청을 받은 즉시 관련 데이터를 파기합니다.</li>
                <li><strong>AI 초안 생성 사용 기록(일일 카운트):</strong> 수집일로부터 90일간 보유 후 파기</li>
                <li><strong>이용자가 입력한 프롬프트 내용:</strong> 별도 저장하지 않으며, AI 초안 생성 응답 직후 폐기(처리위탁사 내부 로그 제외)</li>
                <li><strong>접속 로그, IP 주소 등:</strong> 통신비밀보호법에 따라 3개월간 보관 후 파기</li>
                <li><strong>문의 내역:</strong> 문의 응대 완료 후 1년간 보관 후 파기</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">5. 개인정보의 제3자 제공</h2>
              <p>
                서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 아래의 경우는 예외로 합니다.
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-1.5">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">6. 개인정보 처리 위탁</h2>
              <p className="mb-3">서비스는 원활한 운영을 위해 다음의 업체에 개인정보 처리를 위탁하고 있습니다.</p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-700/50">
                    <tr>
                      <th className="border border-slate-200 dark:border-slate-600 px-3 py-2 text-left font-semibold">수탁업체</th>
                      <th className="border border-slate-200 dark:border-slate-600 px-3 py-2 text-left font-semibold">위탁 업무 내용</th>
                      <th className="border border-slate-200 dark:border-slate-600 px-3 py-2 text-left font-semibold">보유&middot;이용 기간</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">Google LLC</td>
                      <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">OAuth 2.0 인증 처리</td>
                      <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">로그인 처리 완료 시까지</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">Supabase, Inc.</td>
                      <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">사용자 인증 세션 관리 및 데이터베이스 운영</td>
                      <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">위탁 계약 종료 시 또는 회원 탈퇴 시까지</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">Anthropic, PBC</td>
                      <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">AI 초안 생성 (Claude API 호출)</td>
                      <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">API 응답 완료 시까지 (Anthropic 자체 정책에 따라 일정 기간 로그 보관 가능)</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">Vercel, Inc.</td>
                      <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">웹사이트 호스팅 및 접속 로그 처리</td>
                      <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">위탁 계약 종료 시까지</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">네이버 주식회사</td>
                      <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">키워드&middot;블로그&middot;뉴스 검색 API 호출 (개인정보 미전송)</td>
                      <td className="border border-slate-200 dark:border-slate-600 px-3 py-2">API 응답 완료 시까지</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">7. 개인정보의 국외 이전</h2>
              <p className="mb-3">
                서비스 이용 과정에서 일부 개인정보가 국외에 위치한 서버로 이전될 수 있습니다.
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li><strong>Google LLC:</strong> 미국 (OAuth 인증 처리)</li>
                <li><strong>Supabase, Inc.:</strong> 미국 등 (서비스 선택 리전에 따라 보관 위치 결정)</li>
                <li><strong>Anthropic, PBC:</strong> 미국 (Claude API 처리)</li>
                <li><strong>Vercel, Inc.:</strong> 글로벌 (Edge Network)</li>
              </ul>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                이전 항목: 이메일, 이름, 프로필 이미지, 프롬프트 내용, IP 주소 등 &middot;
                이전 방법: HTTPS 암호화 통신 &middot;
                이전받는 자의 개인정보 보호책임자: 각 사 개인정보처리방침 참조
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">8. 이용자 및 법정대리인의 권리와 행사 방법</h2>
              <p className="mb-3">이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>개인정보 열람 요청</li>
                <li>개인정보 정정&middot;삭제 요청</li>
                <li>개인정보 처리 정지 요청</li>
                <li>회원 탈퇴 요청 (로그인 후 이메일로 요청)</li>
              </ul>
              <p className="mt-3">
                권리 행사는 이메일(
                <a href="mailto:boheme88@naver.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">boheme88@naver.com</a>
                )을 통해 요청할 수 있으며, 서비스는 지체 없이 조치합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">9. 개인정보의 파기</h2>
              <p>
                보유기간 만료, 처리 목적 달성, 이용자의 탈퇴 요청 등 개인정보가 불필요하게 되었을 때 지체 없이 파기합니다.
                전자적 파일 형태의 정보는 복구 및 재생할 수 없는 기술적 방법을 사용하여 삭제하며,
                종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">10. 쿠키(Cookie)의 사용</h2>
              <p className="mb-3">
                서비스는 이용자에게 최적화된 정보 제공 및 로그인 세션 유지를 위해 쿠키를 사용합니다.
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li><strong>필수 쿠키:</strong> Supabase 인증 세션 쿠키 (로그인 유지)</li>
                <li><strong>분석 쿠키:</strong> Vercel Analytics를 통한 익명 방문 통계</li>
              </ul>
              <p className="mt-3 text-sm">
                이용자는 브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 이 경우 로그인 기반 기능(AI 초안 생성 등)의 이용이 제한될 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">11. 개인정보의 안전성 확보 조치</h2>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>비밀번호는 수집하지 않으며, 인증은 Google OAuth에 위임됩니다.</li>
                <li>데이터베이스 접근은 RLS(Row Level Security)로 본인 데이터만 접근 가능하도록 제한됩니다.</li>
                <li>모든 통신은 HTTPS(TLS)로 암호화됩니다.</li>
                <li>API 키 등 민감 정보는 서버 환경 변수로만 관리되며, 클라이언트에 노출되지 않습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">12. 개인정보 보호책임자</h2>
              <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 rounded-lg p-5 space-y-1.5">
                <p><strong>개인정보 보호책임자:</strong> Boheme BlogLab 운영자</p>
                <p><strong>이메일:</strong> <a href="mailto:boheme88@naver.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">boheme88@naver.com</a></p>
                <p className="text-sm text-slate-500 dark:text-slate-400 pt-2">
                  이용자는 서비스를 이용하면서 발생한 개인정보 보호 관련 문의, 불만처리, 피해구제 등을 위 이메일로 요청할 수 있으며,
                  서비스는 이용자의 문의에 대해 지체 없이 답변 및 처리해드립니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">13. 권익침해 구제방법</h2>
              <p className="mb-3">개인정보 침해로 인한 신고 및 상담은 아래 기관에 문의하실 수 있습니다.</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>개인정보분쟁조정위원회: (국번없이) 1833-6972 &middot; <a href="https://www.kopico.go.kr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">kopico.go.kr</a></li>
                <li>개인정보침해신고센터: (국번없이) 118 &middot; <a href="https://privacy.kisa.or.kr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">privacy.kisa.or.kr</a></li>
                <li>대검찰청 사이버수사과: (국번없이) 1301 &middot; <a href="https://www.spo.go.kr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">spo.go.kr</a></li>
                <li>경찰청 사이버수사국: (국번없이) 182 &middot; <a href="https://ecrm.police.go.kr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">ecrm.police.go.kr</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">14. 개인정보처리방침의 변경</h2>
              <p>
                본 방침은 법령&middot;정책 또는 보안기술의 변경에 따라 내용의 추가&middot;삭제 및 수정이 있을 수 있으며,
                변경 시 홈페이지 공지사항을 통해 사전에 고지합니다. 중대한 변경이 있는 경우 최소 7일 전에 공지합니다.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
