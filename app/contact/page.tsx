import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '문의하기 - Boheme PostLab',
  description: 'Boheme PostLab에 문의하거나 제안사항을 보내주세요.',
};

export default function ContactPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">문의하기</h1>
          
          <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">연락처 정보</h2>
              <p className="mb-4">
                Boheme PostLab에 대한 문의사항, 제안사항, 버그 리포트 등이 있으시면 언제든지 연락주세요.
                빠른 시일 내에 답변드리겠습니다.
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">이메일</h3>
                  <a 
                    href="mailto:boheme88@naver.com?subject=Boheme PostLab 문의"
                    className="text-blue-600 hover:text-blue-700 text-lg font-medium"
                  >
                    boheme88@naver.com
                  </a>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">응답 시간</h3>
                  <p className="text-gray-700">
                    평일 기준 1-2일 이내에 답변드립니다. 주말 및 공휴일에는 답변이 지연될 수 있습니다.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">문의 유형</h2>
              <p className="mb-4">다음과 같은 문의사항을 받고 있습니다:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>서비스 개선 제안:</strong> 새로운 기능이나 개선사항에 대한 제안</li>
                <li><strong>버그 리포트:</strong> 서비스 사용 중 발견한 오류나 문제점</li>
                <li><strong>기능 문의:</strong> 서비스 사용 방법이나 기능에 대한 질문</li>
                <li><strong>제휴 및 협업:</strong> 비즈니스 제안이나 협업 문의</li>
                <li><strong>기타 문의:</strong> 기타 궁금하신 사항</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">이메일 작성 팁</h2>
              <p className="mb-4">더 빠르고 정확한 답변을 위해 다음 정보를 포함해주시면 도움이 됩니다:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>문의 유형 (서비스 개선 제안, 버그 리포트 등)</li>
                <li>문제가 발생한 페이지나 기능</li>
                <li>사용 중인 브라우저 및 운영체제 정보</li>
                <li>스크린샷이나 오류 메시지 (해당되는 경우)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">자주 묻는 질문 (FAQ)</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">서비스는 무료인가요?</h3>
                  <p className="text-gray-700">
                    네, Boheme PostLab의 모든 기능은 무료로 제공됩니다. 회원가입도 필요하지 않습니다.
                  </p>
                </div>
                
                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">개인정보는 어떻게 보호되나요?</h3>
                  <p className="text-gray-700">
                    본 사이트는 회원가입 기능이 없어 사용자의 개인정보를 수집하지 않습니다. 
                    자세한 내용은 <a href="/privacy" className="text-blue-600 hover:text-blue-700">개인정보처리방침</a>을 참고해주세요.
                  </p>
                </div>
                
                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">서비스 이용 중 문제가 발생했어요</h3>
                  <p className="text-gray-700">
                    문제가 발생한 페이지, 브라우저 정보, 오류 메시지 등을 포함하여 이메일로 문의해주시면 
                    빠르게 해결해드리겠습니다.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">관련 페이지</h2>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="/about" 
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  서비스 소개 →
                </a>
                <a 
                  href="/terms" 
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  이용약관 →
                </a>
                <a 
                  href="/privacy" 
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  개인정보처리방침 →
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

