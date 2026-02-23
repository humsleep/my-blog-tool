export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Boheme BlogLab</h3>
            <p className="text-sm text-gray-600">
              전문적인 블로그 제작을 위한 도구 모음입니다.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">서비스</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="/keyword-analysis" className="hover:text-blue-600">
                  키워드 분석
                </a>
              </li>
              <li>
                <a href="/prompt-generator" className="hover:text-blue-600">
                  프롬프트 생성
                </a>
              </li>
              <li>
                <a href="/editor" className="hover:text-blue-600">
                  금칙어 검사기
                </a>
              </li>
              <li>
                <a href="/image-tools" className="hover:text-blue-600">
                  이미지 편집
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">문의</h3>
            <a
              href="mailto:boheme88@naver.com?subject=사이트 개선 제안"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium block mb-2"
            >
              boheme88@naver.com
            </a>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p>&copy; 2026 Boheme BlogLab. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="/about" className="hover:text-blue-600 hover:underline">
                서비스 소개
              </a>
              <a href="/terms" className="hover:text-blue-600 hover:underline">
                이용약관
              </a>
              <a href="/privacy" className="hover:text-blue-600 hover:underline">
                개인정보처리방침
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

