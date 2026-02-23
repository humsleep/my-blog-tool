import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관 - Boheme PostLab',
  description: 'Boheme PostLab의 이용약관입니다.',
};

export default function TermsPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">이용약관</h1>
          
          <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
            <p className="text-sm text-gray-500 mb-6">
              <strong>최종 수정일:</strong> 2026년 1월 27일
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제1조 (목적)</h2>
              <p>
                본 약관은 Boheme PostLab(이하 "본 사이트")이 제공하는 온라인 서비스의 이용과 관련하여 
                본 사이트와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제2조 (정의)</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>"본 사이트"</strong>란 Boheme PostLab이 운영하는 웹사이트를 의미합니다.</li>
                <li><strong>"서비스"</strong>란 본 사이트가 제공하는 모든 온라인 서비스를 의미합니다.</li>
                <li><strong>"이용자"</strong>란 본 사이트에 접속하여 본 약관에 따라 본 사이트가 제공하는 서비스를 받는 회원 및 비회원을 의미합니다.</li>
                <li><strong>"콘텐츠"</strong>란 본 사이트를 통해 제공되는 정보, 텍스트, 그래픽, 링크 등을 의미합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제3조 (약관의 게시와 개정)</h2>
              <p>
                본 사이트는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다. 
                본 사이트는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다. 
                약관이 개정되는 경우 개정 약관의 적용일자 및 개정사유를 명시하여 현행 약관과 함께 
                서비스 초기 화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제4조 (서비스의 제공 및 변경)</h2>
              <p>본 사이트는 다음과 같은 서비스를 제공합니다:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>키워드 분석 서비스</li>
                <li>프롬프트 생성 서비스</li>
                <li>금칙어 검사 서비스</li>
                <li>이미지 편집 서비스</li>
                <li>블로그 포스팅 관련 정보 제공</li>
                <li>기타 본 사이트가 추가 개발하거나 제휴계약 등을 통해 제공하는 일체의 서비스</li>
              </ul>
              <p className="mt-4">
                본 사이트는 서비스의 내용을 변경할 수 있으며, 변경 시에는 사전에 공지합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제5조 (서비스의 중단)</h2>
              <p>
                본 사이트는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 
                서비스의 제공을 일시적으로 중단할 수 있습니다. 본 사이트는 서비스의 제공이 중단됨으로 인하여 
                이용자 또는 제3자가 입은 손해에 대하여 배상합니다. 단, 본 사이트가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제6조 (이용자의 의무)</h2>
              <p>이용자는 다음 행위를 하여서는 안 됩니다:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>신청 또는 변경 시 허위 내용의 등록</li>
                <li>타인의 정보 도용</li>
                <li>본 사이트가 게시한 정보의 변경</li>
                <li>본 사이트가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                <li>본 사이트와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                <li>본 사이트 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 본 사이트에 공개 또는 게시하는 행위</li>
                <li>본 사이트의 동의 없이 영리를 목적으로 서비스를 사용하는 행위</li>
                <li>기타 불법적이거나 부당한 행위</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제7조 (저작권의 귀속 및 이용제한)</h2>
              <p>
                본 사이트가 작성한 저작물에 대한 저작권 기타 지적재산권은 본 사이트에 귀속합니다. 
                이용자는 본 사이트를 이용함으로써 얻은 정보 중 본 사이트에게 지적재산권이 귀속된 정보를 
                본 사이트의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 
                제3자에게 이용하게 하여서는 안 됩니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제8조 (면책조항)</h2>
              <p>
                본 사이트는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 
                서비스 제공에 관한 책임이 면제됩니다. 본 사이트는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 
                책임을 지지 않습니다. 본 사이트는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 
                그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제9조 (분쟁의 해결)</h2>
              <p>
                본 사이트와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 
                주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다. 다만, 제소 당시 이용자의 주소 또는 거소가 
                명확하지 아니한 경우의 관할법원은 민사소송법에 따라 정합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제10조 (광고 및 제휴)</h2>
              <p>
                본 사이트는 서비스의 제공과 관련하여 광고를 게재할 수 있으며, 본 사이트의 서비스를 이용하고자 하는 이용자는 
                광고가 게재된 서비스를 이용함으로써 발생하는 문제에 대해 본 사이트에 책임을 물을 수 없습니다. 
                본 사이트는 제3자와의 제휴를 통해 다양한 서비스를 제공할 수 있으며, 제휴 서비스의 경우 제휴사가 제공하는 
                서비스의 이용약관 및 개인정보처리방침이 적용됩니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제11조 (연락처)</h2>
              <p>
                본 약관에 명시되지 않은 사항은 관련 법령 및 상관례에 따릅니다. 
                본 약관에 대한 문의사항이 있으시면 아래 연락처로 문의해 주시기 바랍니다.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p><strong>이메일:</strong> boheme88@naver.com</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

