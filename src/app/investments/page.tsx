"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  DollarSign,
  TrendingUp,
  PieChart,
  Banknote,
  Users,
  Shield,
  Target,
  MapPin,
  Calendar,
  Percent
} from 'lucide-react';

// 샘플 부동산 PF 프로젝트 데이터
const sampleRealEstateProjects = [
  {
    id: 'gangnam-office-pf',
    name: '강남 프리미엄 오피스 PF',
    location: '서울 강남구 역삼동',
    type: '오피스',
    totalProjectCost: 1000, // 억원
    stoRatio: 20, // %
    pfLoanRatio: 80, // %
    expectedReturn: 12.5, // %
    constructionPeriod: '24개월',
    operationStart: '2026년 3월',
    currentPhase: 'construction',
    progress: 35,
    tokenPrice: 0.1, // ETH
    totalTokens: 20000,
    soldTokens: 7000,
    minInvestment: 1, // ETH
    dscr: 1.45,
    features: ['프리미엄 입지', '대기업 선임대', 'LEED 골드 인증'],
    risks: ['건설비 상승', '임대료 하락', '금리 상승'],
    image: '/api/placeholder/400/300'
  },
  {
    id: 'busan-residential-pf',
    name: '부산 해운대 주거복합 PF',
    location: '부산 해운대구 우동',
    type: '주거복합',
    totalProjectCost: 800,
    stoRatio: 20,
    pfLoanRatio: 80,
    expectedReturn: 15.2,
    constructionPeriod: '30개월',
    operationStart: '2026년 9월',
    currentPhase: 'pre_construction',
    progress: 5,
    tokenPrice: 0.08,
    totalTokens: 20000,
    soldTokens: 3200,
    minInvestment: 1,
    dscr: 1.38,
    features: ['바다 전망', '복합쇼핑몰', '지하철 연결'],
    risks: ['분양률 리스크', '지역경기 둔화'],
    image: '/api/placeholder/400/300'
  },
  {
    id: 'incheon-logistics-pf',
    name: '인천 스마트 물류센터 PF',
    location: '인천 서구 경서동',
    type: '물류센터',
    totalProjectCost: 600,
    stoRatio: 20,
    pfLoanRatio: 80,
    expectedReturn: 10.8,
    constructionPeriod: '18개월',
    operationStart: '2025년 12월',
    currentPhase: 'operation',
    progress: 100,
    tokenPrice: 0.06,
    totalTokens: 20000,
    soldTokens: 18500,
    minInvestment: 1,
    dscr: 1.62,
    features: ['자동화 시설', '냉동창고', '인천공항 근접'],
    risks: ['물류업계 변화', '운영비 증가'],
    image: '/api/placeholder/400/300'
  }
];

const phaseLabels = {
  pre_construction: '착공 준비',
  construction: '건설 중',
  operation: '운영 중'
};

const phaseColors = {
  pre_construction: 'bg-yellow-100 text-yellow-800',
  construction: 'bg-blue-100 text-blue-800',
  operation: 'bg-green-100 text-green-800'
};

export default function InvestmentsPage() {
  const [selectedProject, setSelectedProject] = useState(sampleRealEstateProjects[0]);

  const handleInvest = (projectId: string) => {
    alert(`${projectId} 프로젝트 투자 기능은 개발 중입니다.`);
  };

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🏢 STO-PF 부동산 투자
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          부동산 개발 프로젝트를 토큰화하여 소액으로도 투자할 수 있습니다. 
          자기자본 20% + PF대출 80% 구조로 높은 레버리지 효과를 경험하세요.
        </p>
      </div>

      {/* 투자 개요 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-md border">
          <div className="flex items-center justify-between mb-4">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">3</span>
          </div>
          <div className="text-sm text-gray-600">활성 프로젝트</div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md border">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">2,400억</span>
          </div>
          <div className="text-sm text-gray-600">총 프로젝트 규모</div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md border">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">12.8%</span>
          </div>
          <div className="text-sm text-gray-600">평균 예상 수익률</div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md border">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">1,247</span>
          </div>
          <div className="text-sm text-gray-600">총 투자자 수</div>
        </div>
      </div>

      {/* 프로젝트 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {sampleRealEstateProjects.map((project) => (
          <div 
            key={project.id} 
            className="bg-white rounded-lg shadow-md border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedProject(project)}
          >
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              <Building2 className="h-16 w-16 text-gray-400" />
            </div>
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {project.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    {project.location}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${phaseColors[project.currentPhase]}`}>
                  {phaseLabels[project.currentPhase]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <div className="text-gray-600">총 사업비</div>
                  <div className="font-semibold">{project.totalProjectCost}억원</div>
                </div>
                <div>
                  <div className="text-gray-600">예상 수익률</div>
                  <div className="font-semibold text-green-600">{project.expectedReturn}%</div>
                </div>
                <div>
                  <div className="text-gray-600">토큰 가격</div>
                  <div className="font-semibold">{project.tokenPrice} ETH</div>
                </div>
                <div>
                  <div className="text-gray-600">DSCR</div>
                  <div className="font-semibold">{project.dscr}</div>
                </div>
              </div>

              {/* 진행률 바 */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">진행률</span>
                  <span className="font-semibold">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* 토큰 판매 현황 */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">토큰 판매</span>
                  <span className="font-semibold">{((project.soldTokens / project.totalTokens) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(project.soldTokens / project.totalTokens) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {project.soldTokens.toLocaleString()} / {project.totalTokens.toLocaleString()} 토큰
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleInvest(project.id);
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                {project.minInvestment} ETH부터 투자하기
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 선택된 프로젝트 상세 정보 */}
      {selectedProject && (
        <div className="bg-white rounded-lg shadow-md border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📊 {selectedProject.name} 상세 정보
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 프로젝트 개요 */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">프로젝트 개요</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">위치</span>
                    <span className="font-semibold">{selectedProject.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">유형</span>
                    <span className="font-semibold">{selectedProject.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">총 사업비</span>
                    <span className="font-semibold">{selectedProject.totalProjectCost}억원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">건설 기간</span>
                    <span className="font-semibold">{selectedProject.constructionPeriod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">운영 시작</span>
                    <span className="font-semibold">{selectedProject.operationStart}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">주요 특징</h3>
                <div className="space-y-2">
                  {selectedProject.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Shield className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">주요 리스크</h3>
                <div className="space-y-2">
                  {selectedProject.risks.map((risk, index) => (
                    <div key={index} className="flex items-center">
                      <Target className="h-4 w-4 text-red-600 mr-2" />
                      <span className="text-gray-700">{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PF 구조 및 투자 정보 */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">PF 자본 구조</h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-blue-900">자기자본 (STO)</span>
                      <span className="text-blue-900">{selectedProject.stoRatio}%</span>
                    </div>
                    <div className="text-sm text-blue-700">
                      {selectedProject.totalProjectCost * selectedProject.stoRatio / 100}억원 • 토큰으로 조달
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-green-900">타인자본 (PF대출)</span>
                      <span className="text-green-900">{selectedProject.pfLoanRatio}%</span>
                    </div>
                    <div className="text-sm text-green-700">
                      {selectedProject.totalProjectCost * selectedProject.pfLoanRatio / 100}억원 • 은행 대출
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">투자 정보</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">토큰 가격</span>
                    <span className="font-semibold">{selectedProject.tokenPrice} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">최소 투자금</span>
                    <span className="font-semibold">{selectedProject.minInvestment} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">예상 수익률</span>
                    <span className="font-semibold text-green-600">{selectedProject.expectedReturn}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">DSCR</span>
                    <span className="font-semibold">{selectedProject.dscr}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 rounded-lg">
                <h4 className="font-semibold mb-2">💡 STO-PF 투자의 장점</h4>
                <ul className="text-sm space-y-1">
                  <li>• 소액으로도 대규모 부동산 개발사업 참여</li>
                  <li>• PF 구조로 높은 레버리지 효과</li>
                  <li>• 블록체인 기반 투명한 수익 분배</li>
                  <li>• 토큰 거래를 통한 유동성 확보</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



