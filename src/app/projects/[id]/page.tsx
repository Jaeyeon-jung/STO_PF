"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  AreaChart, 
  Area 
} from "recharts";
import AIAnalysisButton from '../../../components/AIAnalysisButton';
import SimplePriceChart from '../../../components/SimplePriceChart';
import AIEnhancedAnalysis from '../../../components/AIEnhancedAnalysis';
import TradingWidgets from '../../../components/TradingWidgets';

// Web3InvestButton 컴포넌트를 페이지 내에 정의
function Web3InvestButton({ project }: { project: any }) {
  const [amount, setAmount] = useState('1');
  const [showModal, setShowModal] = useState(false);
  
  const handleInvest = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        // 계정 연결 및 잔량 확인
        const accounts = await (window as any).ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts.length > 0) {
          // 네트워크 확인
          const chainId = await (window as any).ethereum.request({
            method: 'eth_chainId'
          });
          
          // Hardhat 로컬 네트워크 체크 (1337 또는 31337 둘 다 허용)
          const chainIdDecimal = parseInt(chainId, 16);
          if (chainIdDecimal !== 1337 && chainIdDecimal !== 31337) {
            alert(`잘못된 네트워크입니다. Hardhat Local 네트워크로 변경해주세요.\n현재: ${chainIdDecimal}\n필요: 1337 또는 31337`);
            return;
          }
          
          // ETH 잔량 확인
          const balance = await (window as any).ethereum.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest']
          });
          
          const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
          console.log(`현재 ETH 잔량: ${balanceInEth} ETH`);
          
          if (balanceInEth < 0.1) {
            alert(`ETH 잔량이 부족합니다. 현재 잔량: ${balanceInEth.toFixed(4)} ETH\n\nHardhat 테스트 계정을 사용하세요:\n프라이빗 키: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`);
            return;
          }
          
          alert(`연결된 계정: ${accounts[0]}\nETH 잔량: ${balanceInEth.toFixed(4)} ETH\n네트워크: Hardhat Local (${parseInt(chainId, 16)})`);
          setShowModal(true);
        }
      } catch (error) {
        console.error('계정 연결 실패:', error);
        alert('MetaMask 연결에 실패했습니다.');
      }
    } else {
      alert('MetaMask가 설치되어 있지 않습니다.');
    }
  };

  const handleConfirmInvest = async () => {
    try {
      const accounts = await (window as any).ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        // 실제 트랜잭션 보내기
        const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
        const tokenAmount = parseInt(amount);
        const valueInWei = (0.1 * tokenAmount * Math.pow(10, 18)).toString(16); // 0.1 ETH per token을 Wei로 변환
        
        // 먼저 간단한 ETH 전송으로 테스트
        const transactionParameters = {
          to: contractAddress,
          from: accounts[0],
          value: '0x' + valueInWei,
          gas: '0x5208', // 21000 gas (기본 ETH 전송)
        };

        const txHash = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [transactionParameters],
        });

        alert(`트랜잭션이 전송되었습니다!\nTx Hash: ${txHash}\n컨트랙트: ${contractAddress}\n프로젝트: ${project.name}\n수량: ${amount}`);
        setShowModal(false);
      }
    } catch (error) {
      console.error('트랜잭션 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      alert('트랜잭션 전송에 실패했습니다: ' + errorMessage);
    }
  };

  // invest 함수 호출을 위한 데이터 인코딩
  const encodeInvestFunction = (projectId: string, amount: number) => {
    // invest(string,uint256) 함수 시그니처 계산
    const functionSignature = '0xa694fc3a'; // keccak256("invest(string,uint256)")의 첫 4바이트
    
    // ABI 인코딩
    const offsetToString = '0000000000000000000000000000000000000000000000000000000000000040'; // string 데이터 오프셋
    const amountHex = amount.toString(16).padStart(64, '0'); // uint256 amount
    
    // 문자열 길이와 데이터
    const stringLength = projectId.length.toString(16).padStart(64, '0');
    const stringData = stringToHex(projectId).padEnd(64, '0'); // 32바이트로 패딩
    
    return functionSignature + offsetToString + amountHex + stringLength + stringData;
  };

  const stringToHex = (str: string) => {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
      hex += str.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return hex;
  };

  return (
    <>
      <button
        onClick={handleInvest}
        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
      >
        Invest
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">{project.name} 투자</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                투자 수량
              </label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="mb-4 text-gray-600">
              <p className="text-sm">컨트랙트 주소: 0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf</p>
              <p>토큰 가격: 0.1 ETH per token</p>
              <p>총 비용: {(parseFloat(amount) * 0.1).toFixed(2)} ETH</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                취소
              </button>
              <button
                onClick={handleConfirmInvest}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


type Project = {
  id: string;
  name: string;
  location: string;
  estimatedValue: number;
  riskSummary: string;
  currentPrice?: string;
  basePrice?: string;
  totalSupply?: number;
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState({
    basePrice: 0.1,
    hybridPrice: 0.1,
    aiEnhancedPrice: 0.1,
    customScore: 70,
    investmentGrade: '로딩 중...',
    lastUpdated: new Date()
  });

  const [connectionStatus, setConnectionStatus] = useState<{
    status: 'connecting' | 'blockchain_online' | 'blockchain_offline';
    dataSource: string;
    notice?: string;
  }>({
    status: 'connecting',
    dataSource: 'loading'
  });

  const loadProjectData = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        cache: 'no-store' // 항상 최신 데이터
      });
      const data = await res.json();
      
      // 연결 상태 확인 및 설정
      if (data.notice || data.mode === 'calculation_mode' || data.mode === 'fallback_mode') {
        console.log('🧮 블록체인 연결 상태:', data.mode);
        if (data.error) {
          console.log('❌ 연결 오류:', data.error);
          console.log('💡 해결 방법:', data.troubleshooting);
        }
        setConnectionStatus({
          status: 'blockchain_offline',
          dataSource: 'dynamic_calculation',
          notice: data.notice || '블록체인 연결 실패'
        });
      } else {
        console.log('✅ 블록체인 연결 성공');
        setConnectionStatus({
          status: 'blockchain_online',
          dataSource: 'blockchain'
        });
      }
      
      if (data.project) {
        setProject(data.project);
        
        // 실시간 가격 데이터 업데이트
        const basePrice = parseFloat(data.project.basePrice || "0.1");
        const currentPrice = parseFloat(data.project.currentPrice || "0.1");
        const aiEnhancedPrice = parseFloat(data.project.aiEnhancedPrice || "0.1");
        const customScore = data.project.customScore || 70;
        const investmentGrade = data.project.investmentGrade;
        
        // 디버깅 로그
        console.log('🔍 받은 프로젝트 데이터:', {
          basePrice: data.project.basePrice,
          currentPrice: data.project.currentPrice,
          aiEnhancedPrice: data.project.aiEnhancedPrice,
          customScore: data.project.customScore,
          investmentGrade: data.project.investmentGrade,
          isSimulated: data.project.isSimulated,
          marketData: data.project.marketData
        });
        
        setPriceData({
          basePrice,
          hybridPrice: aiEnhancedPrice, // AI 강화 가격을 메인 가격으로 사용
          aiEnhancedPrice,
          customScore,
          investmentGrade,
          lastUpdated: new Date()
        });
        
        console.log('📊 실시간 프로젝트 데이터 로드:', {
          name: data.project.name,
          basePrice,
          currentPrice,
          aiEnhancedPrice,
          customScore,
          investmentGrade,
          rawInvestmentGrade: data.project.investmentGrade,
          isSimulated: data.project.isSimulated
        });
        
        console.log('🎯 투자등급 상세:', {
          받은값: data.project.investmentGrade,
          타입: typeof data.project.investmentGrade,
          최종값: investmentGrade,
          fallback적용: !data.project.investmentGrade
        });

        // 투자등급이 "No AI Analysis"인 경우에만 알림
        if (investmentGrade === 'No AI Analysis') {
          console.warn('⚠️ AI 분석이 비활성화되어 있습니다. AI 예측 데이터를 설정해주세요.');
        }

        // 배당 데이터 업데이트
        console.log('🔍 배당 데이터 확인:', {
          dividendDataExists: !!data.project.dividendData,
          dividendData: data.project.dividendData,
          monthsLength: data.project.dividendData?.months?.length || 0
        });
        
        if (data.project.dividendData && data.project.dividendData.months && data.project.dividendData.months.length > 0) {
          const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
          
          // 배당 데이터를 월별로 정리
          const dividendData = data.project.dividendData;
          const dynamicDividendSeries = dividendData.months.map((monthNum: number, index: number) => {
            const monthName = monthNames[monthNum - 1] || `${monthNum}월`;
            return {
              month: monthName,
              yield: dividendData.yields[index] || 0,
              cumulative: dividendData.cumulativeYields[index] || 0,
              event: dividendData.eventDescriptions[index] || ""
            };
          });
          
          setDividendSeries(dynamicDividendSeries);
          console.log('💰 배당 데이터 로드 완료:', dynamicDividendSeries);
        } else {
          console.log('⚠️ 배당 데이터가 없습니다. 기본 데이터를 생성합니다.');
          // 기본 배당 데이터 생성
          const defaultDividendSeries = [
            { month: "1월", yield: 0.8, cumulative: 0.8, event: "프로젝트 시작" },
            { month: "2월", yield: 1.2, cumulative: 2.0, event: "초기 수익 발생" },
            { month: "3월", yield: 0.9, cumulative: 2.9, event: "안정화 단계" },
            { month: "4월", yield: 1.5, cumulative: 4.4, event: "성장 단계 진입" },
            { month: "5월", yield: 1.1, cumulative: 5.5, event: "지속적 성장" },
            { month: "6월", yield: 0.7, cumulative: 6.2, event: "시장 조정" },
          ];
          setDividendSeries(defaultDividendSeries);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('프로젝트 데이터 로드 실패:', error);
      
      // 에러가 발생해도 기본 데이터로 폴백
      if (!project) {
        const fallbackProject = {
          id: params.id,
          name: "프로젝트 로딩 실패",
          location: "위치 정보 없음",
          estimatedValue: 0,
          riskSummary: "데이터를 불러올 수 없습니다"
        };
        setProject(fallbackProject);
      }
      
      // 에러 발생 시 빈 배당 데이터
      setDividendSeries([]);
      
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [params.id]);

  // 10초마다 실시간 데이터 업데이트
  useEffect(() => {
    const interval = setInterval(loadProjectData, 10000);
    return () => clearInterval(interval);
  }, [params.id]);

  const valueSeries = [
    { year: "Y0", value: 100 },
    { year: "Y1", value: 108 },
    { year: "Y2", value: 117 },
    { year: "Y3", value: 129 },
    { year: "Y4", value: 141 },
  ];

  const riskRadar = [
    { metric: "ESG/TNFD", score: 72 },
    { metric: "금융", score: 58 },
    { metric: "시장", score: 63 },
    { metric: "공사", score: 55 },
    { metric: "규제", score: 49 },
  ];

  // 동적 배당 데이터 (실시간 계산)
  const [dividendSeries, setDividendSeries] = useState<any[]>([]);

  if (loading) return <div>로딩 중...</div>;
  if (!project) return <div>프로젝트를 찾을 수 없습니다.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <div className="text-sm text-gray-600">{project.location}</div>
        </div>
        <Link className="text-blue-600 hover:underline text-sm" href="/">← 목록으로</Link>
      </div>

      {/* 연결 상태 알림 */}
      {connectionStatus.status === 'blockchain_offline' && connectionStatus.notice && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            </div>
            <div className="ml-3 flex-1">
              <div className="text-sm font-medium text-yellow-800">
                ⚠️ 블록체인 연결 실패
              </div>
              <div className="text-sm text-yellow-700 mt-1">
                {connectionStatus.notice}
              </div>
              <div className="text-xs text-yellow-600 mt-2 bg-yellow-100 p-2 rounded">
                💡 <strong>해결 방법:</strong><br/>
                1. 새 터미널에서 <code className="bg-yellow-200 px-1 rounded">npm run blockchain:node</code> 실행<br/>
                2. 컨트랙트 배포: <code className="bg-yellow-200 px-1 rounded">npm run blockchain:deploy</code><br/>
                3. 페이지 새로고침
              </div>
              <div className="text-xs text-yellow-600 mt-2">
                🔄 현재는 실시간 계산 모드로 동작 중입니다 (모든 기능 정상 작동)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 현재 토큰 가격 (통합) */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">현재 토큰 가격</div>
            <div className="text-3xl font-bold text-blue-600">
              {priceData.hybridPrice.toFixed(4)} ETH
            </div>
            <div className="text-sm text-gray-600 mt-1">
              투자 등급: <span className="font-semibold text-green-600">{priceData.investmentGrade}</span>
              <span className="mx-2">•</span>
              커스텀 점수: <span className="font-semibold">{priceData.customScore}/100</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">마지막 업데이트</div>
            <div className="text-sm font-medium text-gray-700">
              {priceData.lastUpdated.toLocaleTimeString('ko-KR')}
            </div>
            <div className="flex items-center justify-end mt-1">
              <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                connectionStatus.status === 'blockchain_online' ? 'bg-green-500 animate-pulse' :
                connectionStatus.status === 'blockchain_offline' ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
              }`}></span>
              <span className="text-xs text-gray-500">
                {connectionStatus.status === 'blockchain_online' ? '블록체인 연결' :
                 connectionStatus.status === 'blockchain_offline' ? '실시간 계산' : '연결 중...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 실시간 가격 차트 - 전체 폭으로 크게 */}
      <div className="rounded border bg-white p-8 mb-8 min-w-0">
        <div className="font-medium mb-4 flex items-center justify-between">
          <span className="text-2xl font-bold">실시간 토큰 가격</span>
          <span className="text-base text-green-600 bg-green-50 px-4 py-2 rounded-full font-semibold">LIVE</span>
        </div>
        <div className="h-[500px] w-full overflow-hidden">
          <SimplePriceChart 
            currentPrice={priceData.hybridPrice}
            lastUpdated={priceData.lastUpdated}
            isLive={true}
            onToggleLive={() => {}}
          />
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center bg-blue-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {priceData.hybridPrice.toFixed(4)} ETH
            </div>
            <div className="text-sm text-gray-600">현재 토큰 가격</div>
          </div>
          <div className="text-center bg-green-50 p-4 rounded-lg">
            <div className={`text-3xl font-bold mb-2 ${
              priceData.investmentGrade === 'No AI Analysis' ? 'text-orange-500' : 
              priceData.investmentGrade.startsWith('A') ? 'text-green-600' :
              priceData.investmentGrade.startsWith('B') ? 'text-blue-600' :
              priceData.investmentGrade.startsWith('C') ? 'text-yellow-600' : 'text-gray-600'
            }`}>
              {priceData.investmentGrade}
            </div>
            <div className="text-sm text-gray-600">투자 등급</div>
            {priceData.investmentGrade === 'No AI Analysis' && (
              <div className="text-xs text-orange-500 mt-1">AI 분석 필요</div>
            )}
            {priceData.investmentGrade !== 'No AI Analysis' && priceData.investmentGrade !== '로딩 중...' && (
              <div className="text-xs text-green-600 mt-1">AI 분석 완료</div>
            )}
          </div>
          <div className="text-center bg-purple-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {priceData.customScore}/100
            </div>
            <div className="text-sm text-gray-600">커스텀 점수</div>
          </div>
        </div>
      </div>

      {/* 상단 3개 차트 - 배당추이 포함 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 월별 배당 추이 - 상단으로 이동 */}
        <div className="rounded border bg-white p-6 min-w-0">
          <div className="font-medium mb-3 text-lg">월별 배당 추이</div>
          {dividendSeries.length > 0 ? (
            <>
              <div className="h-80 w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dividendSeries} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{fontSize: 11}} />
                    <YAxis tick={{fontSize: 11}} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        maxWidth: '300px'
                      }}
                      formatter={(value, name, props) => [
                        `${value}%`, 
                        name === 'yield' ? '월별 수익률' : '누적 수익률'
                      ]}
                      labelFormatter={(label) => {
                        const dataPoint = dividendSeries.find(item => item.month === label);
                        return (
                          <div>
                            <div className="font-semibold">{label}</div>
                            {dataPoint?.event && (
                              <div className="text-xs text-gray-600 mt-1 max-w-xs">
                                📰 {dataPoint.event}
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="yield" 
                      stackId="1" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.4}
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulative" 
                      stackId="2" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.4}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-center">
                <div className="text-lg font-bold text-green-600">
                  {dividendSeries[dividendSeries.length - 1]?.cumulative?.toFixed(2) || '0.00'}%
                </div>
                <div className="text-xs text-gray-600">누적 수익률</div>
              </div>
            </>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <div className="text-lg mb-2">배당 데이터 로딩 중...</div>
                <div className="text-sm">실시간 계산 중입니다</div>
              </div>
            </div>
          )}
        </div>

        {/* 자산 가치 평가 */}
        <div className="rounded border bg-white p-6 min-w-0">
          <div className="font-medium mb-3 text-lg">자산 가치 평가</div>
          <div className="h-80 w-full overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={valueSeries} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-center">
            <div className="text-lg font-bold text-blue-600">
              IRR 12.4%
            </div>
            <div className="text-xs text-gray-600">DCF {project.estimatedValue.toLocaleString()}억원</div>
          </div>
        </div>

        {/* 리스크 지표 */}
        <div className="rounded border bg-white p-6 min-w-0">
          <div className="font-medium mb-3 text-lg">리스크 분석</div>
          <div className="h-80 w-full overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={riskRadar} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{fontSize: 10}} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fontSize: 9}} />
                <Radar 
                  name="리스크" 
                  dataKey="score" 
                  stroke="#16a34a" 
                  fill="#16a34a" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-center">
            <div className="text-lg font-bold text-green-600">
              {Math.round(riskRadar.reduce((sum, item) => sum + item.score, 0) / riskRadar.length)}점
            </div>
            <div className="text-xs text-gray-600">평균 리스크</div>
          </div>
        </div>
      </div>

      {/* 호가창 - 독립적으로 */}
      <div className="rounded border bg-white p-6 mb-6 min-w-0">
        <div className="font-medium mb-4 text-xl">실시간 호가창</div>
        <div className="h-96 overflow-y-auto">
          <TradingWidgets />
        </div>
      </div>

      {/* 마켓 데이터 정보 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-700">시가총액</div>
          <div className="text-xl font-bold text-blue-900 mt-1">
            {(priceData.hybridPrice * 1000).toFixed(0)} ETH
          </div>
          <div className="text-xs text-blue-600 mt-1">총 {(1000).toLocaleString()}개 토큰</div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm font-medium text-green-700">24시간 거래량</div>
          <div className="text-xl font-bold text-green-900 mt-1">
            32.4 ETH
          </div>
          <div className="text-xs text-green-600 mt-1">+12.3% 증가</div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm font-medium text-purple-700">유통량</div>
          <div className="text-xl font-bold text-purple-900 mt-1">
            700
          </div>
          <div className="text-xs text-purple-600 mt-1">전체의 70% 유통중</div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-sm font-medium text-orange-700">최근 7일</div>
          <div className="text-xl font-bold text-orange-900 mt-1">
            +8.7%
          </div>
          <div className="text-xs text-orange-600 mt-1">상승 추세 지속</div>
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <div className="font-medium mb-3">액션</div>
        <div className="flex flex-wrap gap-3">
          <Web3InvestButton project={project} />
          <AIAnalysisButton project={project} />
          <AIEnhancedAnalysis project={{
            ...project,
            currentPrice: priceData.hybridPrice.toFixed(4),
            basePrice: priceData.basePrice.toFixed(4),
            totalSupply: 1000
          }} />
          <button className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Return Simulation</button>
          <button className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">ESG Impact</button>
        </div>
      </div>
    </div>
  );
}


