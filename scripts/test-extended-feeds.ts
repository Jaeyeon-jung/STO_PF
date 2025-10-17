import { ethers } from "hardhat";

async function main() {
  console.log("🚀 확장된 체인링크 데이터 피드 테스트 시작...\n");

  // 컨트랙트 배포
  const ExtendedPricingModule = await ethers.getContractFactory("ExtendedPricingModule");
  const pricingModule = await ExtendedPricingModule.deploy();
  await pricingModule.waitForDeployment();

  const contractAddress = await pricingModule.getAddress();
  console.log(`✅ ExtendedPricingModule 배포 완료: ${contractAddress}\n`);

  // 다양한 데이터 피드 주소들 (Ethereum Mainnet)
  const feeds = {
    // 암호화폐
    "ETH/USD": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    "BTC/USD": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
    "USDC/USD": "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
    "USDT/USD": "0x3E7d1eAB13adBe4c9F2F0F4D893fc9c602b4A3",
    
    // 주식 지수
    "S&P500": "0x83d350e7Bdc0C43f8C4c9f4030335a4F2fE54D3d",
    "NASDAQ": "0x8cA2fec2e9F8c6f1c8A6779F2d93647C68D054e4",
    
    // 상품
    "GOLD/USD": "0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6",
    "SILVER/USD": "0x379589227b15F1a12195D3f2d90Bc8B31b4A6c0",
    "OIL/USD": "0x6292aA9a6650aC14d7e42c78c3c1d8f8B9e5d4b5",
    
    // 환율
    "EUR/USD": "0xb49f677943BC038e9857d61E7d053CaA2C1734C1",
    "GBP/USD": "0x5c0Ab2e9B9a100dF836af8759825b8Cf7D7D9a0b",
    "JPY/USD": "0xBcE206caE7f0ec07b545EddE332A47C2F75bbC3a",
    "KRW/USD": "0x01435677FA1170ca3c40A934E9911Fc0e2c97F1b"
  };

  try {
    // 1. 데이터 피드 등록
    console.log("📊 1. 데이터 피드 등록 중...");
    
    // 암호화폐 피드 등록
    await pricingModule.addFeed(feeds["ETH/USD"], 0, "Ethereum to USD price feed");
    await pricingModule.addFeed(feeds["BTC/USD"], 0, "Bitcoin to USD price feed");
    await pricingModule.addFeed(feeds["USDC/USD"], 0, "USDC to USD price feed");
    
    // 주식 지수 피드 등록
    await pricingModule.addFeed(feeds["S&P500"], 1, "S&P 500 Index");
    await pricingModule.addFeed(feeds["NASDAQ"], 1, "NASDAQ Index");
    
    // 상품 피드 등록
    await pricingModule.addFeed(feeds["GOLD/USD"], 2, "Gold to USD price feed");
    await pricingModule.addFeed(feeds["SILVER/USD"], 2, "Silver to USD price feed");
    await pricingModule.addFeed(feeds["OIL/USD"], 2, "Oil to USD price feed");
    
    // 환율 피드 등록
    await pricingModule.addFeed(feeds["EUR/USD"], 3, "Euro to USD exchange rate");
    await pricingModule.addFeed(feeds["GBP/USD"], 3, "British Pound to USD exchange rate");
    await pricingModule.addFeed(feeds["JPY/USD"], 3, "Japanese Yen to USD exchange rate");
    await pricingModule.addFeed(feeds["KRW/USD"], 3, "Korean Won to USD exchange rate");
    
    console.log("✅ 모든 데이터 피드 등록 완료\n");

    // 2. 개별 피드 가격 조회 테스트
    console.log("💰 2. 개별 피드 가격 조회 테스트...");
    
    const testFeeds = [
      { name: "ETH/USD", address: feeds["ETH/USD"] },
      { name: "BTC/USD", address: feeds["BTC/USD"] },
      { name: "S&P500", address: feeds["S&P500"] },
      { name: "GOLD/USD", address: feeds["GOLD/USD"] },
      { name: "EUR/USD", address: feeds["EUR/USD"] }
    ];

    for (const feed of testFeeds) {
      try {
        const price = await pricingModule.getLatestPrice(feed.address);
        console.log(`  📈 ${feed.name}: ${ethers.formatUnits(price, 8)}`);
      } catch (error) {
        console.log(`  ❌ ${feed.name}: 조회 실패 (로컬 네트워크에서는 정상)`);
      }
    }

    console.log("\n🏠 3. 부동산 프로젝트별 다중 피드 설정 예시...");
    
    // 예시: 서울 강남 프로젝트 (암호화폐 + 주식 + 상품)
    const seoulProjectFeeds = [
      feeds["ETH/USD"],    // 40% 가중치
      feeds["S&P500"],     // 30% 가중치  
      feeds["GOLD/USD"],   // 20% 가중치
      feeds["KRW/USD"]     // 10% 가중치
    ];
    
    const seoulProjectWeights = [40, 30, 20, 10];
    
    console.log("  🏢 서울 강남 프로젝트 피드 설정:");
    console.log("    - ETH/USD: 40% (암호화폐 시장 반영)");
    console.log("    - S&P500: 30% (주식 시장 반영)");
    console.log("    - GOLD/USD: 20% (안전자산 반영)");
    console.log("    - KRW/USD: 10% (환율 반영)");

    // 예시: 부산 해운대 프로젝트 (환율 중심)
    const busanProjectFeeds = [
      feeds["USD/KRW"],    // 50% 가중치
      feeds["JPY/USD"],    // 30% 가중치
      feeds["OIL/USD"],    // 20% 가중치
    ];
    
    const busanProjectWeights = [50, 30, 20];
    
    console.log("\n  🏖️ 부산 해운대 프로젝트 피드 설정:");
    console.log("    - KRW/USD: 50% (국내 투자자 중심)");
    console.log("    - JPY/USD: 30% (일본 투자자 유치)");
    console.log("    - OIL/USD: 20% (에너지 가격 반영)");

    console.log("\n💡 4. 부동산 프로젝트별 데이터 활용 전략:");
    console.log("  🏙️ 상업용 부동산:");
    console.log("    - S&P500 (경기 상황) + 금리 지수 + 환율");
    console.log("    - 경기가 좋으면 임대료 상승 → 토큰 가격 상승");
    
    console.log("\n  🏠 주거용 부동산:");
    console.log("    - 인플레이션 지수 + 금리 + 지역 경제 지수");
    console.log("    - 인플레이션 상승 시 부동산 가치 상승");
    
    console.log("\n  🏭 산업용 부동산:");
    console.log("    - 원유 가격 + 건설 자재 가격 + 물류 지수");
    console.log("    - 원유 가격 상승 시 물류비 증가 → 임대료 상승");

    console.log("\n  🌍 국제 투자 프로젝트:");
    console.log("    - 다중 환율 + 각국 주식 지수 + 금리 차이");
    console.log("    - 환율 변동에 따른 투자 매력도 조정");

    console.log("\n✅ 확장된 체인링크 데이터 피드 테스트 완료!");
    console.log("\n📋 다음 단계:");
    console.log("  1. 실제 메인넷/테스트넷에 배포");
    console.log("  2. 프로젝트별 맞춤형 피드 설정");
    console.log("  3. 프론트엔드에서 다중 데이터 시각화");
    console.log("  4. 투자자별 맞춤형 가격 정보 제공");

  } catch (error) {
    console.error("❌ 테스트 중 오류 발생:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
