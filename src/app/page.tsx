import Link from "next/link";

export default function Home() {

  return (
    <div className="space-y-6">
      {/* STO-PF 부동산 투자 플랫폼 소개 */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg p-6 mb-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">🏢 STO-PF 부동산 투자 플랫폼</h2>
          <p className="text-white mb-4">
            부동산 개발 프로젝트를 토큰화하여 PF 구조로 투자하는 혁신적인 플랫폼
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-3xl mb-2">🏗️</div>
              <div className="font-semibold text-gray-900">부동산 PF 토큰화</div>
              <div className="text-gray-800 text-sm">대규모 개발사업을 소액 투자로</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-3xl mb-2">📈</div>
              <div className="font-semibold text-gray-900">5배 레버리지</div>
              <div className="text-gray-800 text-sm">자기자본 20% + PF대출 80%</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-3xl mb-2">💎</div>
              <div className="font-semibold text-gray-900">투명한 수익분배</div>
              <div className="text-gray-800 text-sm">임대·매각수익 블록체인 분배</div>
            </div>
          </div>

          <Link 
            href="/investments" 
            className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors inline-block font-semibold"
          >
            부동산 PF 프로젝트 투자하기 →
          </Link>
        </div>
      </div>


      {/* AI 강화 기능 소개 섹션 */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">🤖 AI 강화 부동산 토큰 플랫폼</h2>
          <p className="text-white mb-4">
            체인링크 오라클 + 커스텀 데이터 + AI 분석을 결합한 혁신적인 투자 플랫폼
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-3xl mb-2">📊</div>
              <div className="font-semibold text-gray-900">실시간 데이터</div>
              <div className="text-gray-800 text-sm">체인링크 오라클을 통한 실시간 시장 데이터</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-3xl mb-2">🏗️</div>
              <div className="font-semibold text-gray-900">커스텀 메트릭</div>
              <div className="text-gray-800 text-sm">지역 수요, 개발 진행률, 인프라 점수</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-3xl mb-2">🤖</div>
              <div className="font-semibold text-gray-900">AI 예측</div>
              <div className="text-gray-800 text-sm">GPT 기반 투자 분석 및 리스크 평가</div>
            </div>
          </div>

          <Link 
            href="/ai-search" 
            className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors inline-block font-semibold"
          >
            AI 기반 프로젝트 검색하기 →
          </Link>
        </div>
      </div>

      {/* 실시간 계산 모드 장점 섹션 */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">🧮 지능형 실시간 계산 시스템</h2>
          <p className="text-white mb-4">
            블록체인 없이도 실제 시장 데이터를 기반으로 정확한 투자 분석을 제공합니다
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-3xl mb-2">⚡</div>
              <div className="font-semibold text-gray-900">빠른 응답</div>
              <div className="text-gray-800 text-sm">블록체인 대기 시간 없이 즉시 계산</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-3xl mb-2">🎯</div>
              <div className="font-semibold text-gray-900">정확한 분석</div>
              <div className="text-gray-800 text-sm">실제 경제 지표 기반 동적 계산</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-3xl mb-2">🔄</div>
              <div className="font-semibold text-gray-900">실시간 업데이트</div>
              <div className="text-gray-800 text-sm">시장 변화에 따른 자동 재계산</div>
            </div>
          </div>

          <div className="text-sm text-blue-100">
            💡 현재 실시간 계산 모드로 동작 중 - 모든 기능이 정상적으로 작동합니다
          </div>
        </div>
      </div>

    </div>
  );
}
