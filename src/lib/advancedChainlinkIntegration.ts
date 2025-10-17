// 고급 체인링크 지표 통합 시스템
import { ethers } from 'ethers';

// 체인링크 지표 타입
export enum IndicatorType {
  CRYPTO = 0,      // 암호화폐
  STOCK = 1,       // 주식 지수
  COMMODITY = 2,   // 상품
  FOREX = 3,       // 환율
  ECONOMIC = 4,    // 경제 지표
  REAL_ESTATE = 5  // 부동산 지수
}

// 프로젝트 타입
export enum ProjectType {
  COMMERCIAL = 'commercial',
  RESIDENTIAL = 'residential',
  INDUSTRIAL = 'industrial'
}

// 체인링크 지표 정보
export interface ChainlinkIndicator {
  address: string;
  type: IndicatorType;
  name: string;
  description: string;
  weight: number;
  isActive: boolean;
  lastUpdated: number;
}

// 지표 값
export interface IndicatorValue {
  value: number;
  decimals: number;
  timestamp: number;
  roundId: number;
}

// 프로젝트별 지표 설정
export interface ProjectIndicatorConfig {
  projectId: string;
  projectType: ProjectType;
  indicators: ChainlinkIndicator[];
  weights: number[];
  useEconomicAdjustment: boolean;
  useVolatilityAdjustment: boolean;
}

// 경제 조정 계수
export interface EconomicAdjustment {
  inflationMultiplier: number;      // 인플레이션 조정 (basis points)
  interestRateMultiplier: number;   // 금리 조정 (basis points)
  marketSentimentMultiplier: number; // 시장 심리 조정 (basis points)
  volatilityMultiplier: number;     // 변동성 조정 (basis points)
}

// 고급 체인링크 데이터 제공자
export class AdvancedChainlinkProvider {
  private provider: ethers.Provider;
  private network: 'ethereum' | 'sepolia';
  private indicators: Map<string, ChainlinkIndicator> = new Map();

  // 체인링크 지표 주소들
  private static readonly INDICATOR_ADDRESSES = {
    ethereum: {
      // 암호화폐
      ETH_USD: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
      BTC_USD: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      USDC_USD: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
      
      // 주식 지수
      SP500: "0x83d350e7Bdc0C43f8C4c9f4030335a4F2fE54D3d",
      NASDAQ: "0x8cA2fec2e9F8c6f1c8A6779F2d93647C68D054e4",
      
      // 상품
      GOLD_USD: "0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6",
      SILVER_USD: "0x379589227b15F1a12195D3f2d90Bc8B31b4A6c0",
      OIL_USD: "0x6292aA9a6650aC14d7e42c78c3c1d8f8B9e5d4b5",
      
      // 환율
      EUR_USD: "0xb49f677943BC038e9857d61E7d053CaA2C1734C1",
      GBP_USD: "0x5c0Ab2e9B9a100dF836af8759825b8Cf7D7D9a0b",
      KRW_USD: "0x01435677FA1170ca3c40A934E9911Fc0e2c97F1b",
      JPY_USD: "0xBcE206caE7f0ec07b545EddE332A47C2F75bbC3a"
    },
    sepolia: {
      ETH_USD: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
      BTC_USD: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
      LINK_USD: "0xc59E3633BAAC79493d908e63626716e204A45EdF"
    }
  };

  constructor(provider: ethers.Provider, network: 'ethereum' | 'sepolia' = 'ethereum') {
    this.provider = provider;
    this.network = network;
    this.initializeIndicators();
  }

  // 지표 초기화
  private initializeIndicators() {
    const addresses = AdvancedChainlinkProvider.INDICATOR_ADDRESSES[this.network];
    
    // 암호화폐 지표
    if (addresses.ETH_USD) {
      this.indicators.set(addresses.ETH_USD, {
        address: addresses.ETH_USD,
        type: IndicatorType.CRYPTO,
        name: 'ETH/USD',
        description: 'Ethereum to USD price feed',
        weight: 0,
        isActive: true,
        lastUpdated: 0
      });
    }
    
    if (addresses.BTC_USD) {
      this.indicators.set(addresses.BTC_USD, {
        address: addresses.BTC_USD,
        type: IndicatorType.CRYPTO,
        name: 'BTC/USD',
        description: 'Bitcoin to USD price feed',
        weight: 0,
        isActive: true,
        lastUpdated: 0
      });
    }
    
    // 주식 지수
    if (addresses.SP500) {
      this.indicators.set(addresses.SP500, {
        address: addresses.SP500,
        type: IndicatorType.STOCK,
        name: 'S&P500',
        description: 'S&P 500 Index',
        weight: 0,
        isActive: true,
        lastUpdated: 0
      });
    }
    
    // 상품
    if (addresses.GOLD_USD) {
      this.indicators.set(addresses.GOLD_USD, {
        address: addresses.GOLD_USD,
        type: IndicatorType.COMMODITY,
        name: 'GOLD/USD',
        description: 'Gold to USD price feed',
        weight: 0,
        isActive: true,
        lastUpdated: 0
      });
    }
    
    // 환율
    if (addresses.KRW_USD) {
      this.indicators.set(addresses.KRW_USD, {
        address: addresses.KRW_USD,
        type: IndicatorType.FOREX,
        name: 'KRW/USD',
        description: 'Korean Won to USD exchange rate',
        weight: 0,
        isActive: true,
        lastUpdated: 0
      });
    }
  }

  // 단일 지표 값 조회
  async getIndicatorValue(address: string): Promise<IndicatorValue> {
    const indicator = this.indicators.get(address);
    if (!indicator || !indicator.isActive) {
      throw new Error('Indicator not found or inactive');
    }

    try {
      const contract = new ethers.Contract(address, [
        {
          "inputs": [],
          "name": "latestRoundData",
          "outputs": [
            {"internalType": "uint80", "name": "roundId", "type": "uint80"},
            {"internalType": "int256", "name": "answer", "type": "int256"},
            {"internalType": "uint256", "name": "startedAt", "type": "uint256"},
            {"internalType": "uint256", "name": "updatedAt", "type": "uint256"},
            {"internalType": "uint80", "name": "answeredInRound", "type": "uint80"}
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "decimals",
          "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
          "stateMutability": "view",
          "type": "function"
        }
      ], this.provider);

      const [roundId, answer, startedAt, updatedAt, answeredInRound] = await contract.latestRoundData();
      const decimals = await contract.decimals();

      return {
        value: Number(ethers.formatUnits(answer, decimals)),
        decimals: Number(decimals),
        timestamp: Number(updatedAt) * 1000,
        roundId: Number(roundId)
      };
    } catch (error) {
      console.error(`Failed to get indicator value for ${address}:`, error);
      throw error;
    }
  }

  // 프로젝트 타입별 맞춤형 지표 조회
  async getProjectTypeIndicators(projectType: ProjectType): Promise<ChainlinkIndicator[]> {
    const indicators: ChainlinkIndicator[] = [];
    
    for (const [address, indicator] of this.indicators) {
      if (this.isIndicatorRelevantForProjectType(indicator, projectType)) {
        indicators.push(indicator);
      }
    }
    
    return indicators;
  }

  // 프로젝트 타입별 지표 관련성 확인
  private isIndicatorRelevantForProjectType(indicator: ChainlinkIndicator, projectType: ProjectType): boolean {
    switch (projectType) {
      case ProjectType.COMMERCIAL:
        // 상업용: 주식, 환율, 암호화폐에 민감
        return indicator.type === IndicatorType.STOCK || 
               indicator.type === IndicatorType.FOREX || 
               indicator.type === IndicatorType.CRYPTO;
               
      case ProjectType.RESIDENTIAL:
        // 주거용: 상품(인플레이션), 주식(경제 안정성)에 민감
        return indicator.type === IndicatorType.COMMODITY || 
               indicator.type === IndicatorType.STOCK;
               
      case ProjectType.INDUSTRIAL:
        // 산업용: 상품(에너지, 건설 자재), 암호화폐(변동성)에 민감
        return indicator.type === IndicatorType.COMMODITY || 
               indicator.type === IndicatorType.CRYPTO;
               
      default:
        return true;
    }
  }

  // 종합 시장 분석 데이터 조회
  async getComprehensiveMarketData(): Promise<{
    crypto: Record<string, IndicatorValue>;
    stocks: Record<string, IndicatorValue>;
    commodities: Record<string, IndicatorValue>;
    forex: Record<string, IndicatorValue>;
    metadata: {
      timestamp: number;
      network: string;
      dataQuality: number;
    };
  }> {
    const results: any = {
      crypto: {},
      stocks: {},
      commodities: {},
      forex: {},
      metadata: {
        timestamp: Date.now(),
        network: this.network,
        dataQuality: 0
      }
    };

    let successfulFeeds = 0;
    let totalFeeds = 0;

    for (const [address, indicator] of this.indicators) {
      if (!indicator.isActive) continue;
      
      totalFeeds++;
      
      try {
        const value = await this.getIndicatorValue(address);
        
        switch (indicator.type) {
          case IndicatorType.CRYPTO:
            results.crypto[indicator.name] = value;
            break;
          case IndicatorType.STOCK:
            results.stocks[indicator.name] = value;
            break;
          case IndicatorType.COMMODITY:
            results.commodities[indicator.name] = value;
            break;
          case IndicatorType.FOREX:
            results.forex[indicator.name] = value;
            break;
        }
        
        successfulFeeds++;
      } catch (error) {
        console.warn(`Failed to get value for ${indicator.name}:`, error);
      }
    }

    results.metadata.dataQuality = totalFeeds > 0 ? Math.round((successfulFeeds / totalFeeds) * 100) : 0;
    
    return results;
  }

  // 프로젝트별 맞춤형 가격 계산을 위한 데이터 조회
  async getProjectSpecificData(projectType: ProjectType): Promise<{
    indicators: Record<string, IndicatorValue>;
    marketAnalysis: {
      economicHealth: 'excellent' | 'good' | 'fair' | 'poor';
      volatilityLevel: 'low' | 'medium' | 'high';
      inflationPressure: 'low' | 'medium' | 'high';
      marketSentiment: 'bullish' | 'neutral' | 'bearish';
    };
    recommendations: string[];
  }> {
    const relevantIndicators = await this.getProjectTypeIndicators(projectType);
    const indicators: Record<string, IndicatorValue> = {};
    
    // 관련 지표 값들 조회
    for (const indicator of relevantIndicators) {
      try {
        const value = await this.getIndicatorValue(indicator.address);
        indicators[indicator.name] = value;
      } catch (error) {
        console.warn(`Failed to get value for ${indicator.name}:`, error);
      }
    }

    // 시장 분석
    const marketAnalysis = this.analyzeMarketConditions(indicators, projectType);
    
    // 추천사항 생성
    const recommendations = this.generateRecommendations(indicators, projectType, marketAnalysis);

    return {
      indicators,
      marketAnalysis,
      recommendations
    };
  }

  // 시장 상황 분석
  private analyzeMarketConditions(indicators: Record<string, IndicatorValue>, projectType: ProjectType) {
    let economicHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'fair';
    let volatilityLevel: 'low' | 'medium' | 'high' = 'medium';
    let inflationPressure: 'low' | 'medium' | 'high' = 'medium';
    let marketSentiment: 'bullish' | 'neutral' | 'bearish' = 'neutral';

    // S&P500 기반 경제 건강도 분석
    if (indicators['S&P500']) {
      const sp500 = indicators['S&P500'].value;
      if (sp500 > 4500) economicHealth = 'excellent';
      else if (sp500 > 4000) economicHealth = 'good';
      else if (sp500 > 3500) economicHealth = 'fair';
      else economicHealth = 'poor';
    }

    // 금 가격 기반 인플레이션 압력 분석
    if (indicators['GOLD/USD']) {
      const gold = indicators['GOLD/USD'].value;
      if (gold > 2000) inflationPressure = 'high';
      else if (gold > 1800) inflationPressure = 'medium';
      else inflationPressure = 'low';
    }

    // ETH 가격 기반 변동성 분석
    if (indicators['ETH/USD']) {
      const eth = indicators['ETH/USD'].value;
      // 간단한 변동성 계산 (실제로는 더 복잡한 계산 필요)
      if (eth > 3000 || eth < 2000) volatilityLevel = 'high';
      else if (eth > 2500 || eth < 2200) volatilityLevel = 'medium';
      else volatilityLevel = 'low';
    }

    // 종합 시장 심리 분석
    const bullishIndicators = Object.values(indicators).filter(v => v.value > 0).length;
    const totalIndicators = Object.keys(indicators).length;
    
    if (bullishIndicators / totalIndicators > 0.7) marketSentiment = 'bullish';
    else if (bullishIndicators / totalIndicators < 0.3) marketSentiment = 'bearish';
    else marketSentiment = 'neutral';

    return {
      economicHealth,
      volatilityLevel,
      inflationPressure,
      marketSentiment
    };
  }

  // 추천사항 생성
  private generateRecommendations(
    indicators: Record<string, IndicatorValue>, 
    projectType: ProjectType, 
    marketAnalysis: any
  ): string[] {
    const recommendations: string[] = [];

    // 프로젝트 타입별 추천
    switch (projectType) {
      case ProjectType.COMMERCIAL:
        if (marketAnalysis.economicHealth === 'excellent') {
          recommendations.push('경기가 좋아 상업용 부동산 투자 적기입니다.');
        }
        if (marketAnalysis.inflationPressure === 'high') {
          recommendations.push('인플레이션 상승으로 임대료 인상 가능성이 높습니다.');
        }
        break;
        
      case ProjectType.RESIDENTIAL:
        if (marketAnalysis.inflationPressure === 'high') {
          recommendations.push('인플레이션 상승으로 주거용 부동산 가치 상승 예상됩니다.');
        }
        if (marketAnalysis.volatilityLevel === 'low') {
          recommendations.push('시장 안정성으로 안전한 투자 환경입니다.');
        }
        break;
        
      case ProjectType.INDUSTRIAL:
        if (indicators['OIL/USD'] && indicators['OIL/USD'].value > 80) {
          recommendations.push('원유 가격 상승으로 에너지 비용 증가에 주의하세요.');
        }
        if (marketAnalysis.volatilityLevel === 'high') {
          recommendations.push('높은 변동성으로 신중한 투자 결정이 필요합니다.');
        }
        break;
    }

    // 일반적인 추천사항
    if (marketAnalysis.marketSentiment === 'bullish') {
      recommendations.push('전반적인 시장 심리가 긍정적입니다.');
    } else if (marketAnalysis.marketSentiment === 'bearish') {
      recommendations.push('시장 불안정성으로 신중한 접근이 필요합니다.');
    }

    return recommendations;
  }
}

// React Hook으로 사용할 수 있는 고급 체인링크 훅
export function useAdvancedChainlink(projectType?: ProjectType) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 실제 환경에서는 Web3 provider를 사용
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const chainlinkProvider = new AdvancedChainlinkProvider(provider, 'ethereum');
        
        if (projectType) {
          const projectData = await chainlinkProvider.getProjectSpecificData(projectType);
          setData(projectData);
        } else {
          const marketData = await chainlinkProvider.getComprehensiveMarketData();
          setData(marketData);
        }
      } else {
        // Web3가 없는 경우 모의 데이터 반환
        const mockData = generateMockAdvancedData(projectType);
        setData(mockData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectType]);

  return { data, loading, error, refetch: fetchData };
}

// 모의 데이터 생성
function generateMockAdvancedData(projectType?: ProjectType) {
  const baseData = {
    indicators: {
      'ETH/USD': { value: 2500 + Math.random() * 100, decimals: 8, timestamp: Date.now(), roundId: 12345 },
      'BTC/USD': { value: 45000 + Math.random() * 2000, decimals: 8, timestamp: Date.now(), roundId: 12346 },
      'S&P500': { value: 4500 + Math.random() * 100, decimals: 8, timestamp: Date.now(), roundId: 12347 },
      'GOLD/USD': { value: 2000 + Math.random() * 50, decimals: 8, timestamp: Date.now(), roundId: 12348 },
      'KRW/USD': { value: 1300 + Math.random() * 20, decimals: 8, timestamp: Date.now(), roundId: 12349 }
    },
    marketAnalysis: {
      economicHealth: 'good' as const,
      volatilityLevel: 'medium' as const,
      inflationPressure: 'medium' as const,
      marketSentiment: 'neutral' as const
    },
    recommendations: [
      '시장 상황을 지속적으로 모니터링하세요.',
      '다양한 지표를 종합적으로 고려하여 투자 결정을 내리세요.'
    ]
  };

  if (projectType) {
    return {
      ...baseData,
      projectType,
      recommendations: [
        ...baseData.recommendations,
        `${projectType} 프로젝트에 특화된 분석을 제공합니다.`
      ]
    };
  }

  return baseData;
}

