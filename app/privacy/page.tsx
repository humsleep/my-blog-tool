import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침 - Boheme PostLab',
  description: 'Boheme PostLab의 개인정보처리방침입니다.',
};

export default function PrivacyPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>
          
          <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
            <p className="text-sm text-gray-500 mb-6">
              <strong>최종 수정일:</strong> 2026년 1월 27일
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. 개인정보 수집 및 처리 원칙</h2>
              <p className="mb-4">
                Boheme PostLab(이하 "본 사이트")는 <strong>회원가입 기능이 없는 서비스</strong>로, 
                사용자로부터 자발적으로 제공받는 개인정보를 수집하지 않습니다. 
                본 사이트는 서비스 이용을 위해 회원가입이나 로그인이 필요하지 않으며, 
                별도의 개인정보 입력 없이 모든 서비스를 이용하실 수 있습니다.
              </p>
              <p className="mb-4">
                다만, 다음의 경우에 한하여 최소한의 정보를 처리할 수 있습니다:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><strong>문의사항 접수 시:</strong> 이메일 주소 (선택사항, 문의사항 응대를 위한 목적)</li>
                <li><strong>서비스 제공을 위한 기술적 정보:</strong> IP 주소, 쿠키 등 (자동 수집, 서비스 운영 및 보안을 위한 목적)</li>
                <li><strong>광고 서비스 제공:</strong> Google AdSense를 통한 쿠키 및 기기 식별자 (광고 게재를 위한 목적)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. 개인정보의 처리 및 보유기간</h2>
              <p>
                본 사이트는 회원가입 기능이 없으므로, 사용자로부터 직접 수집하는 개인정보가 없습니다. 
                다만, 다음의 경우에 한하여 정보를 처리하며, 목적 달성 후 즉시 파기합니다:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><strong>이메일 주소:</strong> 문의사항 접수 시에만 수집되며, 문의사항 처리 완료 후 즉시 파기합니다. (단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관)</li>
                <li><strong>기술적 정보 (IP 주소, 쿠키 등):</strong> 서비스 제공 및 보안을 위해 자동으로 수집되며, 서비스 제공 기간 동안 보관 후 파기합니다.</li>
                <li><strong>Google AdSense 쿠키:</strong> Google의 개인정보 처리방침에 따라 관리되며, 사용자가 브라우저 설정에서 쿠키를 삭제하거나 차단할 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. 처리하는 정보의 항목</h2>
              <p className="mb-4">
                본 사이트는 <strong>회원가입 기능이 없으므로</strong> 사용자로부터 직접 수집하는 개인정보가 없습니다. 
                서비스 이용을 위해 이름, 전화번호, 주소 등의 개인정보를 요구하지 않습니다.
              </p>
              <p className="mb-4">다만, 서비스 제공 및 운영을 위해 다음의 정보가 자동으로 수집될 수 있습니다:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><strong>자발적 제공 정보:</strong> 없음 (회원가입 없음)</li>
                <li><strong>선택적 제공 정보:</strong> 이메일 주소 (문의사항 접수 시에만, 선택사항)</li>
                <li><strong>자동 수집 정보:</strong> 
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>IP 주소 (서비스 제공 및 보안을 위한 목적)</li>
                    <li>쿠키 (서비스 이용 통계 및 사용자 환경 설정 저장)</li>
                    <li>서비스 이용 기록 및 방문 기록 (서비스 개선을 위한 통계 목적)</li>
                    <li>Google AdSense 쿠키 및 기기 식별자 (광고 게재를 위한 목적)</li>
                  </ul>
                </li>
              </ul>
              <p className="mt-4 text-sm text-gray-600">
                ※ 위 자동 수집 정보는 개인을 식별할 수 없는 기술적 정보이며, 서비스 제공 및 보안을 위한 최소한의 정보입니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. 개인정보의 제3자 제공</h2>
              <p>
                본 사이트는 원칙적으로 정보주체의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>정보주체가 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. 개인정보처리의 위탁</h2>
              <p>
                본 사이트는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><strong>호스팅 서비스:</strong> Vercel Inc. (서버 운영 및 관리)</li>
                <li><strong>분석 서비스:</strong> Google Analytics (서비스 이용 통계 분석)</li>
                <li><strong>광고 서비스:</strong> Google AdSense (광고 게재 및 분석)</li>
              </ul>
              <p className="mt-4">
                위탁업체의 개인정보 처리 관련 지시엄수, 비밀유지, 제3자 제공 금지 등에 관한 사항을 계약서 등 문서에 명시하고, 수시로 감독하고 있습니다.
              </p>
              <p className="mt-4">
                Google AdSense의 경우, 광고 게재를 위해 쿠키 및 기기 식별자를 사용할 수 있으며, 
                이를 통해 사용자의 광고 선호도 및 관심사에 맞는 광고를 제공합니다. 
                Google의 개인정보 처리방침은 <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://policies.google.com/privacy</a>에서 확인하실 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. 정보주체의 권리·의무 및 행사방법</h2>
              <p>
                정보주체는 다음과 같은 권리를 행사할 수 있습니다:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>개인정보 열람 요구</li>
                <li>개인정보 정정·삭제 요구</li>
                <li>개인정보 처리정지 요구</li>
              </ul>
              <p className="mt-4">
                위 권리 행사는 본 사이트에 대해 서면, 전자우편 등을 통하여 하실 수 있으며, 본 사이트는 이에 대해 지체 없이 조치하겠습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. 개인정보의 파기</h2>
              <p>
                본 사이트는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
              </p>
              <p className="mt-4">
                파기의 절차 및 방법은 다음과 같습니다:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><strong>파기절차:</strong> 불필요한 개인정보 및 개인정보파일은 내부 방침 및 기타 관련 법령에 따라 파기</li>
                <li><strong>파기방법:</strong> 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. 쿠키의 운영 및 거부</h2>
              <p>
                본 사이트는 서비스 제공 및 개선을 위해 쿠키를 사용할 수 있습니다. 쿠키는 웹사이트를 방문할 때 사용자의 컴퓨터에 저장되는 작은 텍스트 파일입니다.
              </p>
              <p className="mt-4">
                쿠키 사용 목적:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>서비스 이용 통계 분석 (Vercel Analytics)</li>
                <li>사용자 환경 설정 저장</li>
                <li>서비스 품질 개선</li>
                <li>광고 게재 및 분석 (Google AdSense)</li>
              </ul>
              <p className="mt-4">
                사용자는 쿠키 설치에 대한 선택권을 가지고 있으며, 웹브라우저 설정을 통해 쿠키 허용, 쿠키 차단 등의 설정을 할 수 있습니다. 
                다만, 쿠키 설치를 거부할 경우 일부 서비스 이용에 어려움이 있을 수 있습니다.
              </p>
              <p className="mt-4 text-sm text-gray-600">
                ※ Google AdSense 쿠키에 대한 자세한 내용은 <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google 개인정보 처리방침</a>을 참고하시기 바랍니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. 개인정보 보호책임자</h2>
              <p>
                본 사이트는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p><strong>개인정보 보호책임자</strong></p>
                <p>이메일: boheme88@naver.com</p>
              </div>
              <p className="mt-4">
                정보주체께서는 본 사이트의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. 개인정보 처리방침 변경</h2>
              <p>
                이 개인정보처리방침은 법령·정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는 변경사항의 시행 7일 전부터 본 사이트의 공지사항을 통하여 고지할 것입니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. 개인정보의 안전성 확보조치</h2>
              <p>
                본 사이트는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
                <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

