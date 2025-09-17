// 커스텀 API 연동 예시
// 실제 부동산 데이터 API나 외부 서비스와 연동하여 메트릭을 자동 업데이트하는 예시

const { ethers } = require("hardhat");
const axios = require("axios");

class RealEstateDataOracle {
  constructor(contractAddress, signer) {
    this.contract = new ethers.Contract(
      contractAddress,
      [
        "function updateCustomMetrics(string memory projectId, uint256 localDemandIndex, uint256 developmentProgress, uint256 infraScore) external",
        "function projectCustomMetrics(string) external view returns (tuple(uint256,uint256,uint256,uint256))",
        "function getCurrentTokenPrice(string memory projectId) external view returns (uint256)"
      ],
      signer
    );
  }

  // 가상의 부동산 데이터 API에서 데이터 가져오기
  async fetchRealEstateData(projectId, location) {
    try {
      // 실제로는 다음과 같은 API를 호출할 수 있습니다:
      // - 한국부동산원 공시가격 API
      // - 서울시 부동산 정보 API  
      // - 네이버/다음 부동산 API
      // - 직방, 다방 등의 부동산 플랫폼 API
      
      console.log(`📡 ${location}의 부동산 데이터를 가져오는 중...`);
      
      // 시뮬레이션된 API 응답
      const mockApiResponse = {
        localDemand: this.generateRealisticDemand(location),
        developmentProgress: this.getDevelopmentProgress(projectId),
        infrastructureScore: this.getInfrastructureScore(location)
      };
      
      return mockApiResponse;
    } catch (error) {
      console.error("API 호출 실패:", error);
      return null;
    }
  }

  // 지역별 수요 지수 계산 (실제로는 외부 API에서 가져옴)
  generateRealisticDemand(location) {
    const locationFactors = {
      "서울시 강남구": 850,
      "서울시 서초구": 820,
      "서울시 송파구": 780,
      "서울시 마포구": 720,
      "부산시 해운대구": 650,
      "대구시 수성구": 580,
    };
    
    const baseDemand = locationFactors[location] || 500;
    // 시간에 따른 변동성 추가 (±10%)
    const variation = (Math.random() - 0.5) * 0.2;
    return Math.max(100, Math.min(1000, Math.floor(baseDemand * (1 + variation))));
  }

  // 개발 진행률 (실제로는 건설사 API나 허가 정보에서 가져옴)
  getDevelopmentProgress(projectId) {
    // 시뮬레이션: 시간이 지남에 따라 진행률 증가
    const startTime = Date.now() - (Math.random() * 365 * 24 * 60 * 60 * 1000); // 1년 내 랜덤 시작
    const elapsed = Date.now() - startTime;
    const totalDuration = 3 * 365 * 24 * 60 * 60 * 1000; // 3년 프로젝트
    
    return Math.min(100, Math.floor((elapsed / totalDuration) * 100));
  }

  // 인프라 점수 (교통, 교육, 상업시설 등을 종합한 점수)
  getInfrastructureScore(location) {
    const infraScores = {
      "서울시 강남구": 95,
      "서울시 서초구": 92,
      "서울시 송파구": 88,
      "서울시 마포구": 85,
      "부산시 해운대구": 78,
      "대구시 수성구": 72,
    };
    
    return infraScores[location] || 60;
  }

  // 블록체인에 메트릭 업데이트
  async updateMetrics(projectId, location) {
    try {
      const data = await this.fetchRealEstateData(projectId, location);
      if (!data) return false;

      console.log(`📊 ${projectId} 메트릭 업데이트:`);
      console.log(`   지역 수요: ${data.localDemand}/1000`);
      console.log(`   개발 진행률: ${data.developmentProgress}%`);
      console.log(`   인프라 점수: ${data.infrastructureScore}/100`);

      const tx = await this.contract.updateCustomMetrics(
        projectId,
        data.localDemand,
        data.developmentProgress,
        data.infrastructureScore
      );
      
      await tx.wait();
      console.log(`✅ 블록체인 업데이트 완료 (TX: ${tx.hash})`);
      
      return true;
    } catch (error) {
      console.error("메트릭 업데이트 실패:", error);
      return false;
    }
  }

  // 가격 변화 모니터링
  async monitorPriceChanges(projectId, location) {
    console.log(`🔍 ${projectId}의 가격 변화 모니터링 시작...\n`);
    
    const initialPrice = await this.contract.getCurrentTokenPrice(projectId);
    console.log(`초기 가격: ${ethers.formatEther(initialPrice)} ETH`);

    // 5초마다 데이터 업데이트 및 가격 확인
    setInterval(async () => {
      await this.updateMetrics(projectId, location);
      
      const currentPrice = await this.contract.getCurrentTokenPrice(projectId);
      const priceChange = ((Number(currentPrice) - Number(initialPrice)) / Number(initialPrice)) * 100;
      
      console.log(`현재 가격: ${ethers.formatEther(currentPrice)} ETH (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%)\n`);
    }, 5000);
  }
}

// 사용 예시
async function demonstrateCustomAPIIntegration() {
  console.log("🌐 커스텀 API 연동 시스템 데모\n");
  
  const [signer] = await ethers.getSigners();
  
  // 컨트랙트 배포 (실제로는 이미 배포된 주소 사용)
  const RealEstateToken = await ethers.getContractFactory("RealEstateToken");
  const token = await RealEstateToken.deploy();
  await token.waitForDeployment();
  
  const contractAddress = await token.getAddress();
  console.log(`컨트랙트 주소: ${contractAddress}`);
  
  // 하이브리드 프로젝트 등록
  await token.registerHybridProject(
    "seoul-gangnam-tower",
    "서울 강남 타워 프로젝트",
    "서울시 강남구",
    ethers.parseEther("0.1"),
    1000,
    ethers.ZeroAddress,
    0,   // 체인링크 0%
    80,  // 커스텀 80%
    20   // 기본 20%
  );
  
  // 오라클 인스턴스 생성
  const oracle = new RealEstateDataOracle(contractAddress, signer);
  
  // 실시간 데이터 업데이트 및 모니터링 시작
  await oracle.monitorPriceChanges("seoul-gangnam-tower", "서울시 강남구");
}

// 실제 API 연동 예시들
const realWorldAPIExamples = {
  // 1. 한국부동산원 API 연동 예시
  koreaRealEstateAPI: async (location) => {
    // 실제 API 호출 코드
    /*
    const response = await axios.get('https://openapi.reb.or.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTrade', {
      params: {
        serviceKey: 'YOUR_API_KEY',
        LAWD_CD: getLocationCode(location),
        DEAL_YMD: getCurrentMonth()
      }
    });
    return processRealEstateData(response.data);
    */
  },

  // 2. 서울시 부동산 정보 API
  seoulRealEstateAPI: async (district) => {
    /*
    const response = await axios.get('http://openapi.seoul.go.kr:8088/YOUR_API_KEY/json/RealEstateTradeDevelopmtInfo/1/1000/', {
      params: {
        CNSTRCT_DE: getCurrentDate(),
        SGG_NM: district
      }
    });
    return response.data;
    */
  },

  // 3. 기상청 API (날씨가 부동산 수요에 미치는 영향)
  weatherAPI: async (location) => {
    /*
    const response = await axios.get('http://apis.data.go.kr/1360000/VilageFcstInfoService/getVilageFcst', {
      params: {
        serviceKey: 'YOUR_API_KEY',
        nx: getCoordinates(location).x,
        ny: getCoordinates(location).y,
        base_date: getCurrentDate(),
        base_time: getCurrentTime()
      }
    });
    return response.data;
    */
  }
};

console.log("💡 커스텀 API 연동 가능한 데이터 소스들:");
console.log("   📊 부동산 거래 데이터: 한국부동산원, 서울시 공공데이터");
console.log("   🚇 교통 데이터: 지하철 이용량, 버스 노선 정보");
console.log("   🏫 교육 데이터: 학군 정보, 교육시설 평가");
console.log("   🛒 상권 데이터: 상업시설 밀도, 유동인구");
console.log("   🌤️  기상 데이터: 날씨, 자연재해 위험도");
console.log("   📈 경제 지표: 금리, 물가지수, 고용률");

module.exports = { RealEstateDataOracle, demonstrateCustomAPIIntegration };

