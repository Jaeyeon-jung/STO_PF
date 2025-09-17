import { NextResponse } from "next/server";
import { ethers } from "ethers";
import MarketDataService from "../../../../lib/marketDataService";
import NewsEventService from "../../../../lib/newsEventService";
import { BlockchainConnectionManager } from "../../../../lib/blockchainUtils";
import BLOCKCHAIN_CONFIG from "../../../../config/blockchain";

// 투자 등급 계산 함수 (더 현실적인 분포)
function calculateInvestmentGrade(score: number): string {
  // 점수를 0-100 범위로 정규화
  const normalizedScore = Math.max(0, Math.min(100, score));
  
  if (normalizedScore >= 95) return 'AAA';
  if (normalizedScore >= 90) return 'AA+';
  if (normalizedScore >= 85) return 'AA';
  if (normalizedScore >= 82) return 'AA-';
  if (normalizedScore >= 78) return 'A+';
  if (normalizedScore >= 75) return 'A';
  if (normalizedScore >= 70) return 'A-';
  if (normalizedScore >= 65) return 'BBB+';
  if (normalizedScore >= 60) return 'BBB';
  if (normalizedScore >= 55) return 'BBB-';
  if (normalizedScore >= 50) return 'BB+';
  if (normalizedScore >= 45) return 'BB';
  if (normalizedScore >= 40) return 'BB-';
  if (normalizedScore >= 35) return 'B+';
  if (normalizedScore >= 30) return 'B';
  return 'B-';
}

// 동적 프로젝트 데이터 생성
async function generateDynamicProjectData(staticProject: any, projectId: string) {
  const marketData = await MarketDataService.getAllMarketData();
  const currentTime = Date.now();
  
  // 프로젝트별 특성 계산
  const locationMultiplier = staticProject.location.includes('서울') ? 1.2 : 
                           staticProject.location.includes('부산') ? 1.0 : 0.9;
  
  const estimatedValueMultiplier = staticProject.estimatedValue > 10000 ? 1.1 : 
                                 staticProject.estimatedValue > 5000 ? 1.0 : 0.95;
  
  // 동적 점수 계산
  const marketScore = Math.min(100, marketData.seoulRealEstateIndex * locationMultiplier);
  const financialScore = Math.max(0, 100 - (marketData.interestRate - 3) * 10);
  const constructionScore = Math.max(0, 100 - (marketData.constructionCostIndex - 110) * 2);
  const economicScore = (marketData.gdpGrowthRate * 15) + ((3 - marketData.inflationRate) * 10);
  
  const customScore = Math.round(
    (marketScore * 0.3 + financialScore * 0.25 + constructionScore * 0.25 + economicScore * 0.2) * 
    estimatedValueMultiplier
  );
  
  const investmentGrade = calculateInvestmentGrade(customScore);
  
  // 동적 가격 계산 (더 다양한 변동)
  const basePrice = 0.1;
  
  // 시장 조정 (부동산 지수 기반)
  const marketAdjustment = (marketData.seoulRealEstateIndex - 100) / 100 * 0.15;
  
  // 리스크 조정 (커스텀 점수 기반)
  const riskAdjustment = (customScore - 70) / 100 * 0.08;
  
  // 금리 영향 (금리가 높을수록 가격 하락)
  const interestRateImpact = -(marketData.interestRate - 3.5) / 100 * 0.05;
  
  // 시간 기반 변동 (매일 다른 값)
  const timeVariation = Math.sin(Date.now() / (1000 * 60 * 60 * 24)) * 0.02;
  
  // 프로젝트별 특성 반영
  const projectMultiplier = staticProject.estimatedValue > 10000 ? 1.05 : 
                           staticProject.estimatedValue > 5000 ? 1.0 : 0.98;
  
  const currentPrice = basePrice * projectMultiplier * (1 + marketAdjustment + riskAdjustment + interestRateImpact + timeVariation);
  const aiEnhancedPrice = currentPrice * (1 + (customScore - 50) / 800); // AI 강화 가격
  
  // 동적 배당 데이터 생성 (실제 계산 기반)
  const dividendData = generateDynamicDividendData(staticProject, marketData, customScore);
  
  return {
    ...staticProject,
    basePrice: basePrice.toFixed(6),
    currentPrice: currentPrice.toFixed(6),
    aiEnhancedPrice: aiEnhancedPrice.toFixed(6),
    totalSupply: 1000,
    customScore,
    investmentGrade,
    isActive: true,
    useHybridIndex: true,
    customMetrics: {
      localDemandIndex: Math.round(marketScore),
      developmentProgress: Math.round(60 + (customScore - 50) * 0.4),
      infraScore: Math.round(75 + (locationMultiplier - 1) * 50),
      lastUpdated: new Date()
    },
    lastUpdated: new Date(),
    contractAddress: BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS,
    isSimulated: false, // 실제 계산 데이터
    marketData, // 디버깅용
    dividendData
  };
}

// 동적 배당 데이터 생성
function generateDynamicDividendData(project: any, marketData: any, customScore: number) {
  const months = [];
  const yields = [];
  const cumulativeYields = [];
  const eventDescriptions = [];
  
  let cumulativeYield = 0;
  
  // 실제 뉴스 이벤트 생성
  const newsEvents = NewsEventService.generateMonthlyEvents(project, marketData, customScore);
  
  for (let month = 1; month <= 12; month++) {
    // 계절성 고려 (부동산은 보통 3-5월, 9-11월이 활발)
    const seasonalMultiplier = [0.8, 0.9, 1.2, 1.1, 1.3, 0.9, 0.8, 0.9, 1.2, 1.1, 1.2, 1.0][month - 1];
    
    // 시장 상황 반영
    const marketMultiplier = (marketData.seoulRealEstateIndex / 100) * (marketData.gdpGrowthRate / 3);
    
    // 프로젝트 등급 반영
    const gradeMultiplier = customScore / 70;
    
    // 뉴스 이벤트 영향 반영
    const newsEvent = newsEvents.find(event => event.month === month);
    const newsImpact = newsEvent ? 
      (newsEvent.impact === 'positive' ? 1 + newsEvent.severity * 0.3 :
       newsEvent.impact === 'negative' ? 1 - newsEvent.severity * 0.3 : 1) : 1;
    
    // 월별 수익률 계산 (연 8-15% 범위에서 월별 분산)
    const baseMonthlyYield = 0.8; // 기본 월 0.8%
    const monthlyYield = baseMonthlyYield * seasonalMultiplier * marketMultiplier * gradeMultiplier * newsImpact;
    
    cumulativeYield += monthlyYield;
    
    months.push(month);
    yields.push(Number(monthlyYield.toFixed(2)));
    cumulativeYields.push(Number(cumulativeYield.toFixed(2)));
    eventDescriptions.push(newsEvent?.event || `${month}월: 정상 운영`);
  }
  
  return {
    months,
    yields,
    cumulativeYields,
    eventDescriptions
  };
}


// 스마트 컨트랙트 설정
const CONTRACT_ADDRESS = "0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf";
const CONTRACT_ABI = [
  "function getProject(string memory projectId) public view returns (tuple(string id, string name, string location, uint256 basePrice, uint256 totalSupply, bool isActive, address priceFeed, bool useDynamicPricing, bool useHybridIndex))",
  "function getCurrentTokenPrice(string memory projectId) public view returns (uint256)",
  "function getAIEnhancedPrice(string memory projectId) public view returns (uint256)",
  "function calculateCustomScore(string memory projectId) public view returns (uint256)",
  "function getInvestmentGrade(string memory projectId) public view returns (string memory)",
  "function projectCustomMetrics(string memory projectId) public view returns (tuple(uint256 localDemandIndex, uint256 developmentProgress, uint256 infraScore, uint256 lastUpdated))",
  "function getRecentDividendSummary(string memory projectId) public view returns (uint256[] memory months, uint256[] memory yields, uint256[] memory cumulativeYields, string[] memory eventDescriptions)"
];

// 정적 프로젝트 정보 (블록체인 데이터로 보완)
const staticProjects = [
  {
    id: "seoul-mixed-101",
    name: "서울역 복합 개발",
    location: "서울 중구",
    estimatedValue: 8200,
    riskSummary: "공사비 상승, 분양가 규제, 교통 혼잡 리스크",
  },
  {
    id: "ai-enhanced-project",
    name: "AI 강화 부동산 프로젝트",
    location: "서울시 강남구",
    estimatedValue: 12000,
    riskSummary: "AI 예측 기반 리스크 관리, 시장 변동성",
  },
  {
    id: "hybrid-project",
    name: "하이브리드 부동산 프로젝트",
    location: "서울시 서초구",
    estimatedValue: 9500,
    riskSummary: "하이브리드 오라클 기반 동적 가격, 개발 진행률 의존",
  },
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  const { id } = await params;
  const staticProject = staticProjects.find((p) => p.id === id);
  
  if (!staticProject) {
    return NextResponse.json({ project: null });
  }

  // 블록체인 연결 설정 확인
  if (!BLOCKCHAIN_CONFIG.ENABLED) {
    console.log(`🧮 블록체인 비활성화됨 - 동적 계산 모드로 실행`);
    const dynamicProject = await generateDynamicProjectData(staticProject, id);
    
    // 배당 데이터 확인 로그
    console.log(`💰 동적 배당 데이터 생성 결과:`, {
      dividendDataExists: !!dynamicProject.dividendData,
      dividendDataLength: dynamicProject.dividendData?.months?.length || 0,
      dividendData: dynamicProject.dividendData
    });
    
    // 사용자에게 알림용 메타데이터 추가
    dynamicProject.connectionStatus = 'calculation_mode';
    dynamicProject.dataSource = 'dynamic_calculation';
    dynamicProject.lastConnectionAttempt = new Date().toISOString();

    return NextResponse.json({ 
      project: dynamicProject,
      notice: '현재 실시간 계산 모드로 동작 중입니다. 모든 데이터는 실제 시장 지표를 기반으로 계산됩니다.',
      mode: 'calculation_mode'
    });
  }

  try {
    // 블록체인 연결 상태 확인 (BLOCKCHAIN_CONFIG.ENABLED가 true일 때만)
    const connectionManager = BlockchainConnectionManager.getInstance();
    const connectionInfo = await connectionManager.testConnection(BLOCKCHAIN_CONFIG.RPC_URL);
    
    if (!connectionInfo.isConnected) {
      throw new Error(`블록체인 연결 실패: ${connectionInfo.error}`);
    }
    
    if (BLOCKCHAIN_CONFIG.VERBOSE_LOGGING) {
      console.log(`✅ 블록체인 연결됨: ${connectionInfo.networkName} (블록: ${connectionInfo.blockNumber})`);
    }
    
    const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL, undefined, {
      staticNetwork: true,
      batchMaxCount: 1
    });
    
    const contract = new ethers.Contract(BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    // 블록체인에서 실시간 데이터 조회 (각각 타임아웃 설정)
    const [
      projectInfo,
      currentPrice,
      aiEnhancedPrice,
      customScore,
      investmentGrade,
      customMetrics,
      dividendSummary
    ] = await Promise.allSettled([
      Promise.race([
        contract.getProject(id),
        new Promise((_, reject) => setTimeout(() => reject(new Error('getProject 타임아웃')), 2000))
      ]),
      Promise.race([
        contract.getCurrentTokenPrice(id),
        new Promise((_, reject) => setTimeout(() => reject(new Error('getCurrentTokenPrice 타임아웃')), 2000))
      ]),
      Promise.race([
        contract.getAIEnhancedPrice(id),
        new Promise((_, reject) => setTimeout(() => reject(new Error('getAIEnhancedPrice 타임아웃')), 2000))
      ]),
      Promise.race([
        contract.calculateCustomScore(id),
        new Promise((_, reject) => setTimeout(() => reject(new Error('calculateCustomScore 타임아웃')), 2000))
      ]),
      Promise.race([
        contract.getInvestmentGrade(id),
        new Promise((_, reject) => setTimeout(() => reject(new Error('getInvestmentGrade 타임아웃')), 2000))
      ]),
      Promise.race([
        contract.projectCustomMetrics(id),
        new Promise((_, reject) => setTimeout(() => reject(new Error('projectCustomMetrics 타임아웃')), 2000))
      ]),
      Promise.race([
        contract.getRecentDividendSummary(id),
        new Promise((_, reject) => setTimeout(() => reject(new Error('getRecentDividendSummary 타임아웃')), 2000))
      ])
    ]);

    // 블록체인 데이터가 없을 경우 동적 계산으로 fallback
    const dynamicFallback = await generateDynamicProjectData(staticProject, id);
    
    // 결과 조합 (블록체인 데이터 우선, 없으면 동적 계산)
    const project = {
      ...staticProject,
      // 블록체인 데이터 또는 동적 계산 데이터 사용
      basePrice: projectInfo.status === 'fulfilled' ? ethers.formatEther(projectInfo.value.basePrice) : dynamicFallback.basePrice,
      currentPrice: currentPrice.status === 'fulfilled' ? ethers.formatEther(currentPrice.value) : dynamicFallback.currentPrice,
      aiEnhancedPrice: aiEnhancedPrice.status === 'fulfilled' ? ethers.formatEther(aiEnhancedPrice.value) : dynamicFallback.aiEnhancedPrice,
      totalSupply: projectInfo.status === 'fulfilled' ? Number(projectInfo.value.totalSupply) : dynamicFallback.totalSupply,
      customScore: customScore.status === 'fulfilled' ? Number(customScore.value) : dynamicFallback.customScore,
      investmentGrade: investmentGrade.status === 'fulfilled' ? investmentGrade.value : dynamicFallback.investmentGrade,
      isActive: projectInfo.status === 'fulfilled' ? projectInfo.value.isActive : dynamicFallback.isActive,
      useHybridIndex: projectInfo.status === 'fulfilled' ? projectInfo.value.useHybridIndex : dynamicFallback.useHybridIndex,
      // 커스텀 메트릭
      customMetrics: customMetrics.status === 'fulfilled' ? {
        localDemandIndex: Number(customMetrics.value.localDemandIndex),
        developmentProgress: Number(customMetrics.value.developmentProgress),
        infraScore: Number(customMetrics.value.infraScore),
        lastUpdated: new Date(Number(customMetrics.value.lastUpdated) * 1000)
      } : dynamicFallback.customMetrics,
      // 메타데이터
      lastUpdated: new Date(),
      contractAddress: BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS,
      // 배당 데이터 추가
      dividendData: dividendSummary.status === 'fulfilled' ? {
        months: dividendSummary.value[0].map(Number),
        yields: dividendSummary.value[1].map((n: any) => Number(n) / 100), // basis points를 퍼센트로 변환
        cumulativeYields: dividendSummary.value[2].map((n: any) => Number(n) / 100),
        eventDescriptions: dividendSummary.value[3]
      } : dynamicFallback.dividendData
    };

    console.log(`📊 프로젝트 ${id} 실시간 데이터 조회 완료:`, {
      currentPrice: project.currentPrice,
      aiEnhancedPrice: project.aiEnhancedPrice,
      customScore: project.customScore,
      investmentGrade: project.investmentGrade,
      dividendDataExists: !!project.dividendData,
      dividendDataLength: project.dividendData?.months?.length || 0,
      dividendData: project.dividendData
    });

    return NextResponse.json({ project });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.log(`📡 블록체인 연결 실패 - ${errorMessage}`);
    console.log('🔄 동적 계산 모드로 전환합니다...');
    
    // 연결 실패 원인 분석
    let troubleshootingTip = '';
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('연결 타임아웃')) {
      troubleshootingTip = 'Hardhat 노드가 실행되지 않았습니다. "npm run blockchain:node" 명령어로 시작해주세요.';
    } else if (errorMessage.includes('network')) {
      troubleshootingTip = '네트워크 설정을 확인해주세요. Chain ID는 31337이어야 합니다.';
    } else {
      troubleshootingTip = '블록체인 연결에 문제가 있습니다. Hardhat 노드를 재시작해보세요.';
    }
    
    // 블록체인 연결 실패시 동적 계산 기반 데이터 생성
    const dynamicProject = await generateDynamicProjectData(staticProject, id);
    
    // 사용자에게 알림용 메타데이터 추가
    dynamicProject.connectionStatus = 'blockchain_offline';
    dynamicProject.dataSource = 'dynamic_calculation';
    dynamicProject.lastConnectionAttempt = new Date().toISOString();
    dynamicProject.troubleshootingTip = troubleshootingTip;

    return NextResponse.json({ 
      project: dynamicProject,
      notice: '블록체인 연결에 실패했습니다. 실시간 계산 모드로 동작합니다.',
      mode: 'fallback_mode',
      error: errorMessage,
      troubleshooting: troubleshootingTip
    });
  }
}


