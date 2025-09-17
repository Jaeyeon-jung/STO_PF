// 실제 시장 데이터 서비스
export interface MarketData {
  seoulRealEstateIndex: number;
  interestRate: number;
  constructionCostIndex: number;
  gdpGrowthRate: number;
  inflationRate: number;
  timestamp: number;
}

// 실제 외부 API에서 데이터를 가져오는 함수들
class MarketDataService {
  private static cache: { [key: string]: { data: any; timestamp: number } } = {};
  private static CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시

  // 캐시된 데이터 확인
  private static getCachedData(key: string) {
    const cached = this.cache[key];
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  // 캐시 저장
  private static setCachedData(key: string, data: any) {
    this.cache[key] = { data, timestamp: Date.now() };
  }

  // 한국은행 API에서 금리 정보 가져오기 (실제 구현 시)
  static async getInterestRate(): Promise<number> {
    const cached = this.getCachedData('interestRate');
    if (cached) return cached;

    try {
      // 실제로는 한국은행 ECOS API 사용
      // const response = await fetch('https://ecos.bok.or.kr/api/StatisticSearch/...');
      
      // 현재는 시뮬레이션 데이터 (실제 트렌드 반영)
      const baseRate = 3.5;
      const timeVariation = Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 30)) * 0.5; // 월별 변동
      const randomVariation = (Math.random() - 0.5) * 0.2;
      const rate = baseRate + timeVariation + randomVariation;
      
      this.setCachedData('interestRate', rate);
      return rate;
    } catch (error) {
      console.error('금리 데이터 조회 실패:', error);
      return 3.5; // 기본값
    }
  }

  // 부동산 가격지수 (KB부동산 리브온 API 또는 국토교통부 실거래가 API)
  static async getRealEstateIndex(): Promise<number> {
    const cached = this.getCachedData('realEstateIndex');
    if (cached) return cached;

    try {
      // 실제로는 부동산 가격지수 API 사용
      // const response = await fetch('http://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/...');
      
      // 시뮬레이션: 계절성과 장기 트렌드 반영
      const currentDate = new Date();
      const dayOfYear = Math.floor((currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      const hourOfDay = currentDate.getHours();
      
      const baseIndex = 100;
      const longTermTrend = (currentDate.getFullYear() - 2023) * 2.5; // 연간 2.5% 상승
      const seasonalEffect = Math.sin((dayOfYear / 365) * 2 * Math.PI) * 8; // 계절성 ±8%
      const dailyVariation = Math.sin((dayOfYear / 7) * 2 * Math.PI) * 2; // 주간 변동
      const hourlyVariation = Math.sin((hourOfDay / 24) * 2 * Math.PI) * 1; // 시간별 변동
      const randomEffect = (Math.random() - 0.5) * 4; // 랜덤 ±2%
      
      const index = Math.max(85, baseIndex + longTermTrend + seasonalEffect + dailyVariation + hourlyVariation + randomEffect);
      
      this.setCachedData('realEstateIndex', index);
      return index;
    } catch (error) {
      console.error('부동산 지수 조회 실패:', error);
      return 100;
    }
  }

  // 건설비 지수 (한국건설기술연구원 API)
  static async getConstructionCostIndex(): Promise<number> {
    const cached = this.getCachedData('constructionCostIndex');
    if (cached) return cached;

    try {
      // 실제로는 건설비 지수 API 사용
      // const response = await fetch('https://www.kict.re.kr/api/construction-cost/...');
      
      // 시뮬레이션: 인플레이션과 원자재 가격 반영
      const currentDate = new Date();
      const monthsSince2023 = (currentDate.getFullYear() - 2023) * 12 + currentDate.getMonth();
      
      const baseIndex = 110;
      const inflationEffect = monthsSince2023 * 0.3; // 월 0.3% 상승
      const volatility = Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 7)) * 2; // 주간 변동
      const randomEffect = (Math.random() - 0.5) * 2;
      
      const index = baseIndex + inflationEffect + volatility + randomEffect;
      
      this.setCachedData('constructionCostIndex', index);
      return index;
    } catch (error) {
      console.error('건설비 지수 조회 실패:', error);
      return 110;
    }
  }

  // GDP 성장률 (한국은행 ECOS API)
  static async getGDPGrowthRate(): Promise<number> {
    const cached = this.getCachedData('gdpGrowthRate');
    if (cached) return cached;

    try {
      // 실제로는 한국은행 ECOS API 사용
      // const response = await fetch('https://ecos.bok.or.kr/api/StatisticSearch/GDP/...');
      
      // 시뮬레이션: 경제 사이클 반영
      const baseGrowth = 2.8;
      const cyclicalEffect = Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 365)) * 0.5; // 연간 사이클
      const randomEffect = (Math.random() - 0.5) * 0.4;
      
      const growthRate = baseGrowth + cyclicalEffect + randomEffect;
      
      this.setCachedData('gdpGrowthRate', growthRate);
      return growthRate;
    } catch (error) {
      console.error('GDP 성장률 조회 실패:', error);
      return 2.8;
    }
  }

  // 인플레이션율 (통계청 소비자물가지수)
  static async getInflationRate(): Promise<number> {
    const cached = this.getCachedData('inflationRate');
    if (cached) return cached;

    try {
      // 실제로는 통계청 KOSIS API 사용
      // const response = await fetch('https://kosis.kr/openapi/statisticsData/...');
      
      // 시뮬레이션: 글로벌 인플레이션 트렌드 반영
      const baseInflation = 2.1;
      const trendEffect = Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 180)) * 0.3; // 반년 사이클
      const randomEffect = (Math.random() - 0.5) * 0.3;
      
      const inflationRate = baseInflation + trendEffect + randomEffect;
      
      this.setCachedData('inflationRate', inflationRate);
      return inflationRate;
    } catch (error) {
      console.error('인플레이션율 조회 실패:', error);
      return 2.1;
    }
  }

  // 모든 시장 데이터를 한 번에 가져오기
  static async getAllMarketData(): Promise<MarketData> {
    const [
      seoulRealEstateIndex,
      interestRate,
      constructionCostIndex,
      gdpGrowthRate,
      inflationRate
    ] = await Promise.all([
      this.getRealEstateIndex(),
      this.getInterestRate(),
      this.getConstructionCostIndex(),
      this.getGDPGrowthRate(),
      this.getInflationRate()
    ]);

    return {
      seoulRealEstateIndex,
      interestRate,
      constructionCostIndex,
      gdpGrowthRate,
      inflationRate,
      timestamp: Date.now()
    };
  }

  // 캐시 클리어 (필요시)
  static clearCache() {
    this.cache = {};
  }
}

export default MarketDataService;

