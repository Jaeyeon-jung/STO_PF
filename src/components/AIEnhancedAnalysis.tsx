'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { ChainlinkDataProvider, CHAINLINK_FEEDS } from '@/lib/chainlinkIntegration';
import { useWeb3 } from '@/lib/web3Setup';

type Project = {
  id: string;
  name: string;
  location: string;
  currentPrice: string;
  basePrice: string;
  totalSupply: number;
};

type AIAnalysisResult = {
  aiAnalysis: {
    priceValuation?: number;
    priceDirection?: string;
    expectedChange?: number;
    riskFactors?: Array<{factor: string; impact: number}>;
    investmentScore?: number;
    monitoringIndicators?: string[];
    rawResponse?: string;
  };
  recommendedActions: Array<{
    type: string;
    priority: string;
    action: string;
    reason: string;
  }>;
  dataQuality: {
    score: number;
    missingData: {
      chainlink: boolean;
      custom: boolean;
      market: boolean;
    };
  };
};

// 체인링크 데이터 조회 함수 (Web3 훅 사용)
async function fetchChainlinkData(getChainlinkData: () => Promise<any>) {
  try {
    // 실제 체인링크 데이터 조회
    const realData = await getChainlinkData();
    
    console.log('🔗 실제 체인링크 데이터 조회:', realData);
    return {
      ethUsdPrice: realData.crypto.ethUsd,
      btcUsdPrice: realData.crypto.btcUsd,
      goldUsdPrice: realData.commodities.goldUsd,
      sp500Index: realData.stocks.sp500,
      eurUsdRate: realData.forex.eurUsd,
      krwUsdRate: realData.forex.krwUsd,
      realEstateIndex: 105.2, // 부동산 지수는 별도 피드 필요
      volatility: 12.5, // 변동성 계산 필요
      dataQuality: realData.metadata.dataQuality,
      lastUpdated: new Date(realData.metadata.timestamp).toISOString()
    };
  } catch (error) {
    console.error('❌ 체인링크 데이터 조회 실패:', error);
    
    // 실패 시 모의 데이터 반환
    console.log('⚠️ 체인링크 조회 실패 - 모의 데이터 사용');
    const mockChainlinkData = {
      ethUsdPrice: 2500 + (Math.random() - 0.5) * 100,
      btcUsdPrice: 45000 + (Math.random() - 0.5) * 2000,
      goldUsdPrice: 2000 + (Math.random() - 0.5) * 50,
      sp500Index: 4500 + (Math.random() - 0.5) * 100,
      eurUsdRate: 1.08 + (Math.random() - 0.5) * 0.02,
      krwUsdRate: 1300 + (Math.random() - 0.5) * 20,
      realEstateIndex: 105.2 + (Math.random() - 0.5) * 5,
      volatility: 12.5 + (Math.random() - 0.5) * 3,
      dataQuality: 50, // 실패 시 낮은 품질 점수
      lastUpdated: new Date().toISOString()
    };
    
    console.log('🔗 체인링크 데이터 조회 (모의):', mockChainlinkData);
    return mockChainlinkData;
  }
}

export default function AIEnhancedAnalysis({ project }: { project: Project }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const { isConnected, isLoading: web3Loading, error: web3Error, connect, getChainlinkData } = useWeb3();

  const handleAIAnalysis = async () => {
    setLoading(true);
    try {
      // 실제 프로젝트 데이터 수집 (체인링크 + 커스텀 메트릭)
      const projectData = {
        name: project.name,
        location: project.location,
        currentPrice: project.currentPrice,
        basePrice: project.basePrice,
        totalSupply: project.totalSupply
      };

      // 실제 체인링크 데이터 조회
      const chainlinkData = await fetchChainlinkData(getChainlinkData);

      // 모의 커스텀 메트릭
      const customMetrics = {
        localDemandIndex: 750,
        developmentProgress: 65,
        infraScore: 85,
        compositeScore: 75
      };

      // 모의 시장 데이터
      const marketData = {
        transactionVolume: "높음",
        priceGrowthRate: "5.2%",
        economicIndicators: "금리 3.5%, 물가상승률 2.1%"
      };

      console.log('🚀 AI 분석 요청 시작:', projectData);
      
      const response = await fetch('/api/ai-price-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectData,
          chainlinkData,
          customMetrics,
          marketData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ AI 분석 응답 성공:', data);
      
      // 응답 데이터 검증 및 구조 확인
      if (!data.aiAnalysis) {
        throw new Error('AI 분석 결과가 없습니다.');
      }
      
      console.log('🔍 AI 분석 데이터 구조 확인:', {
        hasRawResponse: !!data.aiAnalysis.rawResponse,
        hasPriceValuation: !!data.aiAnalysis.priceValuation,
        hasInvestmentScore: !!data.aiAnalysis.investmentScore,
        hasRiskFactors: !!data.aiAnalysis.riskFactors,
        keys: Object.keys(data.aiAnalysis)
      });
      
      setAnalysisResult(data);

    } catch (error) {
      console.error('❌ AI 분석 오류:', error);
      
      // 더 자세한 에러 메시지 제공
      let errorMessage = 'AI 분석 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        if (error.message.includes('HTTP error')) {
          errorMessage = '서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('분석 결과가 없습니다')) {
          errorMessage = 'AI 분석 결과를 받을 수 없습니다. 데이터를 확인해주세요.';
        } else {
          errorMessage = `분석 오류: ${error.message}`;
        }
      }
      
      setAnalysisResult({
        aiAnalysis: { 
          rawResponse: `🚨 ${errorMessage}\n\n브라우저 개발자 도구(F12)의 콘솔을 확인하여 자세한 오류 정보를 확인할 수 있습니다.` 
        },
        recommendedActions: [{
          type: 'caution',
          priority: 'high',
          action: '문제 해결을 위한 조치가 필요합니다',
          reason: '분석 시스템에 일시적인 문제가 발생했습니다'
        }],
        dataQuality: { score: 0, missingData: { chainlink: true, custom: true, market: true } }
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (impact: number) => {
    if (impact >= 8) return 'text-red-600';
    if (impact >= 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'buy': return '📈';
      case 'sell': return '📉';
      case 'monitor': return '👁️';
      case 'caution': return '⚠️';
      case 'positive': return '✅';
      default: return '💡';
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2"
      >
        🤖 AI 고급 분석
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  🤖 AI 강화 투자 분석
                  <span className="text-sm font-normal text-gray-600">
                    {project.name}
                  </span>
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {!analysisResult && (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <div className="text-6xl mb-4">🤖</div>
                    <h3 className="text-xl font-semibold mb-2">AI 고급 분석</h3>
                    <p className="text-gray-600 mb-6">
                      체인링크 데이터, 커스텀 메트릭, 시장 데이터를 종합하여 
                      AI가 투자 의사결정을 도와드립니다.
                    </p>
                  </div>
                  
                  {!isConnected ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🔗</div>
                        <h3 className="text-lg font-semibold mb-2">Web3 연결 필요</h3>
                        <p className="text-gray-600 mb-4">
                          실제 체인링크 데이터를 사용하려면 MetaMask를 연결해주세요.
                        </p>
                      </div>
                      <button
                        onClick={connect}
                        disabled={web3Loading}
                        className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {web3Loading ? '🔄 연결 중...' : '🔗 MetaMask 연결'}
                      </button>
                      <button
                        onClick={handleAIAnalysis}
                        disabled={loading}
                        className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-3 rounded-lg hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {loading ? '🔄 AI 분석 중...' : '📊 모의 데이터로 분석'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleAIAnalysis}
                      disabled={loading}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {loading ? '🔄 AI 분석 중...' : '🚀 실제 데이터로 AI 분석'}
                    </button>
                  )}
                </div>
              )}

              {analysisResult && (
                <div className="space-y-6">
                  {/* 디버깅 정보 (개발 환경에서만 표시) */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm">
                      <div className="font-semibold text-yellow-800 mb-2">🔧 개발자 정보</div>
                      <div className="text-yellow-700 space-y-1">
                        <div>분석 소스: {(analysisResult as any).source || 'AI API'}</div>
                        <div>타임스탬프: {(analysisResult as any).timestamp || '없음'}</div>
                        <div>데이터 품질: {analysisResult.dataQuality?.score || 0}/100</div>
                      </div>
                    </div>
                  )}
                  
                  {/* 데이터 품질 표시 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      📊 데이터 품질 점수
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            analysisResult.dataQuality.score >= 80 ? 'bg-green-500' :
                            analysisResult.dataQuality.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${analysisResult.dataQuality.score}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold">{analysisResult.dataQuality.score}/100</span>
                    </div>
                  </div>

                  {/* AI 분석 결과 */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      🧠 AI 분석 결과
                    </h3>
                    
                    {/* 구조화된 데이터가 있으면 우선 표시, 없으면 rawResponse 표시 */}
                    {analysisResult.aiAnalysis.priceValuation !== undefined || 
                     analysisResult.aiAnalysis.investmentScore !== undefined ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 가격 평가 */}
                        <div className="bg-white p-3 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-1">가격 적정성</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {analysisResult.aiAnalysis.priceValuation || 0}/100
                          </div>
                          <div className="text-xs text-gray-500">현재 토큰 가격 평가</div>
                        </div>

                        {/* 투자 점수 */}
                        <div className="bg-white p-3 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-1">투자 추천도</div>
                          <div className="text-2xl font-bold text-green-600">
                            {analysisResult.aiAnalysis.investmentScore || 0}/100
                          </div>
                          <div className="text-xs text-gray-500">종합 투자 점수</div>
                        </div>

                        {/* 가격 예측 */}
                        <div className="bg-white p-3 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-1">6개월 예측</div>
                          <div className="text-lg font-bold">
                            <span className={`${
                              analysisResult.aiAnalysis.priceDirection === '상승' ? 'text-green-600' :
                              analysisResult.aiAnalysis.priceDirection === '하락' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {analysisResult.aiAnalysis.priceDirection || '보합'}
                            </span>
                            <span className="text-sm ml-2">
                              {analysisResult.aiAnalysis.expectedChange ? 
                                `${analysisResult.aiAnalysis.expectedChange > 0 ? '+' : ''}${analysisResult.aiAnalysis.expectedChange}%` 
                                : '0%'
                              }
                            </span>
                          </div>
                        </div>

                        {/* 리스크 요소 */}
                        <div className="bg-white p-3 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-2">주요 리스크</div>
                          {analysisResult.aiAnalysis.riskFactors?.map((risk, index) => (
                            <div key={index} className="flex justify-between items-center text-xs mb-1">
                              <span>{risk.factor}</span>
                              <span className={`px-2 py-1 rounded ${
                                risk.impact >= 7 ? 'bg-red-100 text-red-800' :
                                risk.impact >= 4 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {risk.impact}/10
                              </span>
                            </div>
                          )) || <div className="text-xs text-gray-500">리스크 분석 중...</div>}
                        </div>
                      </div>
                    ) : analysisResult.aiAnalysis.rawResponse ? (
                      <div className="prose prose-sm max-w-none">
                        <div className="bg-yellow-50 p-3 rounded-lg mb-4 text-sm text-yellow-800">
                          ⚠️ AI 응답을 구조화된 형태로 파싱하지 못했습니다. 원본 응답을 표시합니다.
                        </div>
                        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-lg">
                          {analysisResult.aiAnalysis.rawResponse}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        분석 결과를 불러오는 중입니다...
                      </div>
                    )}

                    {/* 모니터링 지표 */}
                    {analysisResult.aiAnalysis.monitoringIndicators && (
                      <div className="mt-4 bg-white p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">핵심 모니터링 지표</div>
                        <ul className="text-xs space-y-1">
                          {analysisResult.aiAnalysis.monitoringIndicators.map((indicator, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              {indicator}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* 추천 액션 */}
                  {analysisResult.recommendedActions.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        💡 추천 액션
                      </h3>
                      <div className="space-y-3">
                        {analysisResult.recommendedActions.map((action, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                            <span className="text-2xl">{getActionIcon(action.type)}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{action.action}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(action.priority)}`}>
                                  {action.priority.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{action.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleAIAnalysis}
                      disabled={loading}
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? '🔄 재분석 중...' : '🔄 재분석'}
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
