// 체인링크 데이터 연동 유틸리티
import { ethers } from 'ethers';

// 체인링크 가격 피드 주소들
export const CHAINLINK_FEEDS = {
  // Ethereum Mainnet
  ETHEREUM: {
    ETH_USD: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    BTC_USD: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
    USDC_USD: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
    GOLD_USD: "0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6",
    S_P_500: "0x83d350e7Bdc0C43f8C4c9f4030335a4F2fE54D3d",
    EUR_USD: "0xb49f677943BC038e9857d61E7d053CaA2C1734C1",
    KRW_USD: "0x01435677FA1170ca3c40A934E9911Fc0e2c97F1b"
  },
  // Sepolia Testnet
  SEPOLIA: {
    ETH_USD: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    BTC_USD: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
    LINK_USD: "0xc59E3633BAAC79493d908e63626716e204A45EdF"
  }
};

// 체인링크 AggregatorV3Interface ABI (최소한의 필요한 부분)
const AGGREGATOR_V3_ABI = [
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
];

// 체인링크 데이터 조회 클래스
export class ChainlinkDataProvider {
  private provider: ethers.Provider;
  private network: 'ethereum' | 'sepolia';

  constructor(provider: ethers.Provider, network: 'ethereum' | 'sepolia' = 'ethereum') {
    this.provider = provider;
    this.network = network;
  }

  // 단일 가격 피드에서 데이터 조회
  async getPrice(feedAddress: string): Promise<{
    price: number;
    decimals: number;
    timestamp: number;
    roundId: number;
  }> {
    try {
      const contract = new ethers.Contract(feedAddress, AGGREGATOR_V3_ABI, this.provider);
      
      const [roundId, answer, startedAt, updatedAt, answeredInRound] = await contract.latestRoundData();
      const decimals = await contract.decimals();
      
      return {
        price: Number(ethers.formatUnits(answer, decimals)),
        decimals: Number(decimals),
        timestamp: Number(updatedAt) * 1000, // JavaScript timestamp로 변환
        roundId: Number(roundId)
      };
    } catch (error) {
      console.error(`체인링크 데이터 조회 실패 (${feedAddress}):`, error);
      throw new Error(`가격 피드 조회 실패: ${error}`);
    }
  }

  // 다중 가격 피드에서 데이터 조회
  async getMultiplePrices(feedAddresses: string[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    const promises = feedAddresses.map(async (address) => {
      try {
        const data = await this.getPrice(address);
        return { address, data, success: true };
      } catch (error) {
        return { address, data: null, success: false, error };
      }
    });

    const responses = await Promise.all(promises);
    
    responses.forEach(({ address, data, success, error }) => {
      if (success) {
        results[address] = data;
      } else {
        console.warn(`가격 피드 ${address} 조회 실패:`, error);
        results[address] = { error: '조회 실패' };
      }
    });

    return results;
  }

  // 부동산 분석용 종합 데이터 조회
  async getRealEstateAnalysisData(): Promise<{
    crypto: {
      ethUsd: number;
      btcUsd: number;
      usdcUsd: number;
    };
    commodities: {
      goldUsd: number;
    };
    stocks: {
      sp500: number;
    };
    forex: {
      eurUsd: number;
      krwUsd: number;
    };
    metadata: {
      timestamp: number;
      network: string;
      dataQuality: number;
    };
  }> {
    const feeds = this.network === 'ethereum' ? CHAINLINK_FEEDS.ETHEREUM : CHAINLINK_FEEDS.SEPOLIA;
    
    const feedAddresses = [
      feeds.ETH_USD,
      feeds.BTC_USD,
      feeds.USDC_USD,
      feeds.GOLD_USD,
      feeds.S_P_500,
      feeds.EUR_USD,
      feeds.KRW_USD
    ];

    const priceData = await this.getMultiplePrices(feedAddresses);
    
    // 데이터 품질 평가
    const successfulFeeds = Object.values(priceData).filter(data => !data.error).length;
    const dataQuality = (successfulFeeds / feedAddresses.length) * 100;

    return {
      crypto: {
        ethUsd: priceData[feeds.ETH_USD]?.price || 0,
        btcUsd: priceData[feeds.BTC_USD]?.price || 0,
        usdcUsd: priceData[feeds.USDC_USD]?.price || 0,
      },
      commodities: {
        goldUsd: priceData[feeds.GOLD_USD]?.price || 0,
      },
      stocks: {
        sp500: priceData[feeds.S_P_500]?.price || 0,
      },
      forex: {
        eurUsd: priceData[feeds.EUR_USD]?.price || 0,
        krwUsd: priceData[feeds.KRW_USD]?.price || 0,
      },
      metadata: {
        timestamp: Date.now(),
        network: this.network,
        dataQuality: Math.round(dataQuality)
      }
    };
  }

  // 프로젝트별 맞춤형 데이터 조회
  async getProjectSpecificData(projectId: string, projectType: 'commercial' | 'residential' | 'industrial'): Promise<any> {
    const baseData = await this.getRealEstateAnalysisData();
    
    // 프로젝트 타입별 추가 분석
    let additionalAnalysis = {};
    
    switch (projectType) {
      case 'commercial':
        // 상업용 부동산: S&P500, 금리, 환율에 더 민감
        additionalAnalysis = {
          marketSentiment: baseData.stocks.sp500 > 4000 ? 'bullish' : 'bearish',
          currencyImpact: baseData.forex.krwUsd > 1300 ? 'favorable' : 'unfavorable',
          safeHavenDemand: baseData.commodities.goldUsd > 2000 ? 'high' : 'normal'
        };
        break;
        
      case 'residential':
        // 주거용 부동산: 인플레이션, 금리에 더 민감
        additionalAnalysis = {
          inflationPressure: baseData.commodities.goldUsd > 1800 ? 'high' : 'normal',
          economicStability: baseData.stocks.sp500 > 3500 ? 'stable' : 'volatile'
        };
        break;
        
      case 'industrial':
        // 산업용 부동산: 원유, 건설 자재 가격에 더 민감
        additionalAnalysis = {
          energyCosts: 'moderate', // 원유 피드가 있다면 실제 데이터 사용
          constructionCosts: 'stable'
        };
        break;
    }
    
    return {
      ...baseData,
      projectAnalysis: additionalAnalysis
    };
  }
}

// React Hook으로 사용할 수 있는 체인링크 데이터 훅
export function useChainlinkData(projectId?: string, projectType?: 'commercial' | 'residential' | 'industrial') {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 실제 환경에서는 Web3 provider를 사용
      // const provider = new ethers.BrowserProvider(window.ethereum);
      // const chainlinkProvider = new ChainlinkDataProvider(provider, 'ethereum');
      
      // 개발 환경에서는 모의 데이터 반환
      const mockData = {
        crypto: {
          ethUsd: 2500 + Math.random() * 100,
          btcUsd: 45000 + Math.random() * 2000,
          usdcUsd: 1.0
        },
        commodities: {
          goldUsd: 2000 + Math.random() * 100
        },
        stocks: {
          sp500: 4500 + Math.random() * 100
        },
        forex: {
          eurUsd: 1.08 + Math.random() * 0.02,
          krwUsd: 1300 + Math.random() * 20
        },
        metadata: {
          timestamp: Date.now(),
          network: 'ethereum',
          dataQuality: 95
        }
      };
      
      setData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId, projectType]);

  return { data, loading, error, refetch: fetchData };
}

