import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '서비스 이용약관 - Boheme BlogLab',
  description: 'Boheme BlogLab 서비스 이용에 관한 약관입니다. 서비스 내용, 이용자 의무, AI 생성 콘텐츠 관련 고지 등을 안내합니다.',
};

export default function TermsPage() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">서비스 이용약관</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-10">
            <strong>최종 수정일:</strong> 2026년 4월 23일 &middot; <strong>시행일:</strong> 2026년 4월 23일
          </p>

          <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-300 space-y-10">

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">제1조 (목적)</h2>
              <p>
                본 약관은 Boheme BlogLab(이하 &ldquo;서비스&rdquo;)이 제공하는 모든 온라인 서비스의 이용과 관련하여
                서비스 제공자와 이용자의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">제2조 (정의)</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>&ldquo;서비스&rdquo;</strong>란 Boheme BlogLab 웹사이트에서 제공하는 키워드 분석, 상위노출 분석, 프롬프트 생성, AI 초안 생성, 포스팅 에디터, 이미지 검색 및 편집 등 일체의 온라인 서비스를 의미합니다.</li>
                <li><strong>&ldquo;이용자&rdquo;</strong>란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
                <li><strong>&ldquo;회원&rdquo;</strong>이란 Google 계정을 통한 소셜 로그인으로 서비스에 가입한 이용자를 말합니다.</li>
                <li><strong>&ldquo;비회원&rdquo;</strong>이란 로그인 없이 서비스를 이용하는 이용자를 말합니다.</li>
                <li><strong>&ldquo;AI 초안&rdquo;</strong>이란 이용자가 제공한 프롬프트를 바탕으로 제3자 인공지능 모델(Anthropic Claude 등)이 생성한 텍스트 콘텐츠를 의미합니다.</li>
                <li><strong>&ldquo;콘텐츠&rdquo;</strong>란 서비스 내에서 제공되거나 이용자가 생성/입력한 텍스트, 이미지, 데이터 등 일체의 정보를 말합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">제3조 (약관의 게시와 개정)</h2>
              <p className="mb-3">
                서비스는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 웹사이트 하단에 게시합니다.
                서비스는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며,
                약관이 개정되는 경우 개정 약관의 적용일자 및 개정사유를 명시하여 현행 약관과 함께
                적용일자 7일 이전부터 공지합니다.
              </p>
              <p>
                이용자는 개정된 약관에 동의하지 않을 권리가 있으며, 동의하지 않을 경우 회원 탈퇴를 요청할 수 있습니다.
                개정 약관 시행일 이후에도 서비스를 계속 이용하는 경우 개정된 약관에 동의한 것으로 간주됩니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">제4조 (서비스의 제공 및 변경)</h2>
              <p className="mb-3">서비스는 다음과 같은 서비스를 제공합니다.</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>인기 검색어 트렌드 조회</li>
                <li>네이버 검색광고 API 기반 키워드 검색량 및 경쟁률 분석</li>
                <li>상위 노출 블로그 포스트 분석</li>
                <li>블로그 포스팅용 AI 프롬프트 생성</li>
                <li>Claude API 기반 AI 초안 자동 생성 (회원 전용, 일일 무료 사용 한도 제공)</li>
                <li>실시간 금칙어 검사 및 맞춤법 교정 에디터</li>
                <li>저작권 프리 이미지 검색 및 간단 편집 도구</li>
              </ul>
              <p className="mt-3">
                서비스 내용 및 기능은 운영상, 기술상 필요에 따라 변경될 수 있으며, 변경 시 사전에 공지합니다.
                단, 경미한 변경은 사후 공지로 갈음할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">제5조 (서비스의 이용 및 제한)</h2>
              <p className="mb-3">
                서비스는 연중무휴 1일 24시간 제공됨을 원칙으로 하되, 다음의 경우에는 서비스 제공이 일시 중단될 수 있습니다.
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>시스템 점검, 보수, 교체 등 정기 점검</li>
                <li>천재지변, 정전, 통신 두절 등 불가항력적 사유</li>
                <li>서비스 호스팅 제공사(Vercel) 또는 외부 API(Naver, Google, Supabase, Anthropic 등)의 장애</li>
                <li>이용자의 과도한 요청으로 서비스 안정성이 저해되는 경우</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">제6조 (회원가입 및 계정 관리)</h2>
              <p className="mb-3">
                서비스는 Google 소셜 로그인만을 제공하며, 별도의 아이디/비밀번호는 수집하지 않습니다.
                회원가입은 Google 계정으로 최초 로그인 시 자동으로 완료되며, 이때 본 약관 및 개인정보처리방침에 동의한 것으로 간주됩니다.
              </p>
              <p>
                이용자는 자신의 Google 계정을 안전하게 관리할 책임이 있으며, 계정의 부정 사용으로 인한 책임은
                이용자 본인에게 있습니다. 회원 탈퇴는 이메일(
                <a href="mailto:boheme88@naver.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">boheme88@naver.com</a>
                )로 요청할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">제7조 (이용자의 의무)</h2>
              <p className="mb-3">이용자는 다음 행위를 해서는 안 됩니다.</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>타인의 계정을 도용하거나 허위 정보로 가입하는 행위</li>
                <li>서비스의 정상적인 운영을 방해하는 행위 (자동화 도구, 크롤러, 어뷰징 등)</li>
                <li>일일 무료 사용 한도를 우회하기 위해 다수의 계정을 생성하는 행위</li>
                <li>서비스를 이용하여 법령 또는 공공질서에 위반되는 콘텐츠를 생성하거나 유통하는 행위</li>
                <li>타인의 저작권, 초상권 등 지적재산권을 침해하는 행위</li>
                <li>서비스를 상업적 목적으로 무단 복제, 재판매, 재배포하는 행위</li>
                <li>서비스의 API나 내부 구조를 리버스 엔지니어링하는 행위</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">제8조 (AI 생성 콘텐츠에 관한 특별 고지)</h2>
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-5 mb-4">
                <p className="font-semibold text-amber-900 dark:text-amber-300 mb-2">
                  ⚠️ 중요: AI 초안의 한계와 이용자 책임
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  AI 초안 생성 기능은 Anthropic 사의 Claude 모델을 이용한 자동 생성 결과물이며, 서비스 제공자는 생성된 콘텐츠의
                  정확성, 신뢰성, 최신성, 저작권 비침해성 등을 보증하지 않습니다.
                </p>
              </div>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>AI가 생성한 콘텐츠에는 사실과 다른 정보(환각, hallucination)가 포함될 수 있으며, 이용자는 반드시 사실 확인 후 활용해야 합니다.</li>
                <li>AI 생성 콘텐츠의 저작권은 관련 법령 및 AI 제공사(Anthropic)의 정책에 따라 결정되며, 이용자가 최종적으로 편집&middot;가공한 결과물에 대한 책임은 이용자에게 있습니다.</li>
                <li>AI 생성 콘텐츠를 블로그, 뉴스, 출판 등에 이용할 때는 각 플랫폼의 AI 콘텐츠 정책을 준수해야 합니다.</li>
                <li>서비스는 AI 생성 콘텐츠의 이용으로 인해 발생한 표절, 저작권 분쟁, 명예훼손, 사실 오류 등에 대한 책임을 지지 않습니다.</li>
                <li>AI 글쓰기 기능은 비로그인 이용자 일일 <strong>1회</strong>, 로그인 이용자 일일 <strong>5회</strong>로 제한되며, 이 한도는 서비스 운영 상황에 따라 조정될 수 있습니다.</li>
                <li>공공질서, 미풍양속에 반하거나 타인의 권리를 침해하는 프롬프트 입력은 금지됩니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">제9조 (서비스 이용 요금)</h2>
              <p>
                현재 서비스는 모든 기능을 무료로 제공합니다. 단, AI 초안 생성 등 일부 기능은 일일 이용 한도가 있으며,
                향후 유료 멤버십 또는 요금제가 도입될 경우 별도 공지 후 적용합니다. 유료 전환 시에도 기존의 무료 제공
                기능은 일정 수준으로 계속 이용 가능하도록 유지합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">제10조 (지적재산권)</h2>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>서비스에 포함된 로고, 디자인, UI, 텍스트, 소스 코드 등은 서비스 제공자 또는 정당한 권리자의 저작물입니다.</li>
                <li>이용자는 서비스를 이용함으로써 얻은 정보 중 서비스 제공자에게 지적재산권이 귀속된 정보를 허락 없이 복제, 전송, 출판, 배포할 수 없습니다.</li>
                <li>이용자가 서비스에 입력한 프롬프트, 생성된 초안, 편집한 이미지 등에 대한 권리는 이용자에게 귀속됩니다.</li>
                <li>이미지 검색 기능을 통해 제공되는 Pexels/Unsplash 이미지는 각 플랫폼의 라이선스를 따르며, 이용자는 해당 라이선스 조건을 준수해야 합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">제11조 (이용 제한 및 계정 해지)</h2>
              <p className="mb-3">
                서비스는 이용자가 본 약관을 위반한 경우 사전 통지 없이 서비스 이용을 제한하거나 계정을 해지할 수 있습니다.
                특히 다음의 경우 즉시 조치할 수 있습니다.
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>일일 사용 한도 회피를 위한 다중 계정 생성이 확인된 경우</li>
                <li>서비스를 부정한 목적으로 이용한 경우</li>
                <li>타인의 권리 또는 명예를 침해한 경우</li>
                <li>자동화 도구로 서비스 안정성을 저해한 경우</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">제12조 (면책조항)</h2>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>서비스는 천재지변, 전쟁, 기간통신사업자의 서비스 중지, 외부 API 장애 등 불가항력적 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
                <li>서비스는 이용자의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.</li>
                <li>서비스에서 제공되는 키워드 분석 결과, 상위노출 분석 데이터, AI 초안 등은 참고 자료로 제공되며, 서비스 제공자는 해당 정보의 정확성 및 활용 결과를 보증하지 않습니다.</li>
                <li>이용자가 서비스에서 얻은 자료를 이용하여 발생한 손해(블로그 저품질, 저작권 분쟁, 사실 오류 등)에 대해 서비스 제공자는 책임지지 않습니다.</li>
                <li>이용자 간, 또는 이용자와 제3자 간에 서비스를 매개로 발생한 분쟁에 대해 서비스 제공자는 개입할 의무가 없으며, 이로 인한 손해를 배상할 책임이 없습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">제13조 (준거법 및 관할)</h2>
              <p>
                본 약관은 대한민국 법령에 따라 규율되고 해석됩니다.
                서비스 이용과 관련하여 서비스 제공자와 이용자 사이에 분쟁이 발생한 경우, 원만한 해결을 위해 필요한 모든 노력을 다하되,
                협의가 이루어지지 않아 소송이 제기되는 경우 &ldquo;민사소송법&rdquo;상의 관할 법원에 소를 제기합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">제14조 (문의 및 연락처)</h2>
              <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 rounded-lg p-5 space-y-1.5">
                <p><strong>서비스명:</strong> Boheme BlogLab</p>
                <p><strong>운영 이메일:</strong> <a href="mailto:boheme88@naver.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">boheme88@naver.com</a></p>
                <p className="text-sm text-slate-500 dark:text-slate-400 pt-2">
                  약관 또는 서비스 이용 관련 문의는 위 이메일로 연락 주시기 바랍니다.
                </p>
              </div>
            </section>

            <section className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">부칙</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                본 약관은 2026년 4월 23일부터 시행합니다.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
