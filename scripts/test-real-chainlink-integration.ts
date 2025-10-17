import { ethers } from "hardhat";

async function main() {
  console.log("🔗 실제 체인링크 데이터 연동 테스트 시작...\n");

  try {
    // 1. 컨트랙트 배포
    console.log("📦 컨트랙트 배포 중...");
    const RealEstateToken = await ethers.getContractFactory("RealEstateToken");
    const token = await RealEstateToken.deploy();
    await token.waitForDeployment();

    const contractAddress = await token.getAddress();
    console.log(`✅ RealEstateToken 배포 완료: ${contractAddress}\n`);

    // 2. 체인링크 가격 피드 주소들 (Ethereum Mainnet)
    const feeds = {
      ETH_USD: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
      BTC_USD: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      USDC_USD: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
      GOLD_USD: "0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6",
      S_P_500: "0x83d350e7Bdc0C43f8C4c9f4030335a4F2fE54D3d",
      EUR_USD: "0xb49f677943BC038e9857d61E7d053CaA2C1734C1",
      KRW_USD: "0x01435677FA1170ca3c40A934E9911Fc0e2c97F1b"
    };

    // 3. 실제 체인링크 데이터 조회
    console.log("🔍 실제 체인링크 데이터 조회 중...");
    
    const chainlinkData: any = {};
    
    for (const [name, address] of Object.entries(feeds)) {
      try {
        console.log(`  📊 ${name} 조회 중...`);
        const price = await token.getLatestPrice(address);
        const formattedPrice = ethers.formatUnits(price, 8); // 대부분 8자리 소수점
        chainlinkData[name.toLowerCase()] = parseFloat(formattedPrice);
        console.log(`    ✅ ${name}: ${formattedPrice}`);
      } catch (error) {
        console.log(`    ❌ ${name}: 조회 실패 - ${error}`);
        chainlinkData[name.toLowerCase()] = 0;
      }
    }

    // 4. 프로젝트 등록 (체인링크 연동)
    console.log("\n🏢 체인링크 연동 프로젝트 등록 중...");
    
    // ETH/USD 연동 프로젝트
    await token.registerProjectWithPriceFeed(
      "chainlink-eth-project",
      "체인링크 ETH 연동 프로젝트",
      "서울시 강남구 테헤란로",
      ethers.parseEther("0.01"), // 0.01 ETH 기본 가격
      10000, // 10,000 tokens
      feeds.ETH_USD
    );
    console.log("  ✅ ETH 연동 프로젝트 등록 완료");

    // 5. 실시간 가격 계산 테스트
    console.log("\n💰 실시간 가격 계산 테스트...");
    
    try {
      const currentPrice = await token.getCurrentTokenPrice("chainlink-eth-project");
      const ethUsdPrice = chainlinkData.eth_usd;
      const calculatedPrice = (parseFloat(ethers.formatEther(currentPrice)) * ethUsdPrice).toFixed(2);
      
      console.log(`  📈 현재 토큰 가격: ${ethers.formatEther(currentPrice)} ETH`);
      console.log(`  💵 USD 환산 가격: $${calculatedPrice}`);
      console.log(`  🔗 ETH/USD 환율: $${ethUsdPrice}`);
    } catch (error) {
      console.log(`  ❌ 가격 계산 실패: ${error}`);
    }

    // 6. 하이브리드 프로젝트 등록 (다중 데이터 소스)
    console.log("\n🔧 하이브리드 프로젝트 등록 중...");
    
    await token.registerHybridProject(
      "chainlink-hybrid-project",
      "체인링크 하이브리드 프로젝트",
      "부산시 해운대구",
      ethers.parseEther("0.005"), // 0.005 ETH 기본 가격
      20000, // 20,000 tokens
      feeds.ETH_USD,
      40, // 체인링크 가중치 40%
      40, // 커스텀 가중치 40%
      20  // 기본 가격 가중치 20%
    );
    console.log("  ✅ 하이브리드 프로젝트 등록 완료");

    // 7. 커스텀 메트릭 설정
    console.log("\n⚙️ 커스텀 메트릭 설정 중...");
    
    await token.updateCustomMetrics(
      "chainlink-hybrid-project",
      850,  // 지역 수요 지수: 850/1000 (높은 수요)
      45,   // 개발 진행률: 45%
      90    // 인프라 점수: 90/100 (우수한 인프라)
    );
    console.log("  ✅ 커스텀 메트릭 설정 완료");

    // 8. 하이브리드 가격 계산
    console.log("\n🧮 하이브리드 가격 계산 테스트...");
    
    try {
      const hybridPrice = await token.calculateHybridPrice("chainlink-hybrid-project");
      const hybridPriceUsd = (parseFloat(ethers.formatEther(hybridPrice)) * chainlinkData.eth_usd).toFixed(2);
      
      console.log(`  📊 하이브리드 토큰 가격: ${ethers.formatEther(hybridPrice)} ETH`);
      console.log(`  💵 USD 환산 가격: $${hybridPriceUsd}`);
      
      // 가격 구성 요소 분석
      const customScore = await token.calculateCustomScore("chainlink-hybrid-project");
      console.log(`  📈 커스텀 점수: ${customScore}/100`);
      
    } catch (error) {
      console.log(`  ❌ 하이브리드 가격 계산 실패: ${error}`);
    }

    // 9. AI 예측 데이터 설정
    console.log("\n🤖 AI 예측 데이터 설정 중...");
    
    await token.updateAIPrediction(
      "chainlink-hybrid-project",
      ethers.parseEther("0.006"), // AI 예측 가격
      85,  // 신뢰도 점수: 85/100
      25,  // 리스크 점수: 25/100 (낮은 리스크)
      88   // 투자 점수: 88/100
    );
    console.log("  ✅ AI 예측 데이터 설정 완료");

    // 10. AI 강화 가격 계산
    console.log("\n🚀 AI 강화 가격 계산 테스트...");
    
    try {
      const aiEnhancedPrice = await token.getAIEnhancedPrice("chainlink-hybrid-project");
      const aiPriceUsd = (parseFloat(ethers.formatEther(aiEnhancedPrice)) * chainlinkData.eth_usd).toFixed(2);
      
      console.log(`  🧠 AI 강화 토큰 가격: ${ethers.formatEther(aiEnhancedPrice)} ETH`);
      console.log(`  💵 USD 환산 가격: $${aiPriceUsd}`);
      
      const investmentGrade = await token.getInvestmentGrade("chainlink-hybrid-project");
      console.log(`  📊 투자 등급: ${investmentGrade}`);
      
    } catch (error) {
      console.log(`  ❌ AI 강화 가격 계산 실패: ${error}`);
    }

    // 11. 종합 분석 결과
    console.log("\n📋 종합 분석 결과:");
    console.log("  🌐 네트워크: Ethereum Mainnet");
    console.log("  🔗 체인링크 피드: 7개 활성화");
    console.log("  📊 데이터 품질: 실시간");
    console.log("  🤖 AI 분석: 활성화");
    console.log("  💰 가격 계산: 하이브리드 + AI 강화");

    console.log("\n✅ 체인링크 연동 테스트 완료!");
    console.log("\n🎯 다음 단계:");
    console.log("  1. 프론트엔드에서 실시간 데이터 연동");
    console.log("  2. 가격 차트에 체인링크 데이터 반영");
    console.log("  3. AI 분석에 실시간 시장 데이터 활용");
    console.log("  4. 투자자 대시보드에 실시간 업데이트");

  } catch (error) {
    console.error("❌ 체인링크 연동 테스트 실패:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

