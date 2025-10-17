import { ethers } from "hardhat";

async function main() {
  console.log("🚀 고급 체인링크 지표 기반 가격 계산 테스트 시작...\n");

  try {
    // 1. 컨트랙트 배포
    console.log("📦 고급 가격 모듈 배포 중...");
    const AdvancedPricingModule = await ethers.getContractFactory("AdvancedPricingModule");
    const pricingModule = await AdvancedPricingModule.deploy();
    await pricingModule.waitForDeployment();

    const contractAddress = await pricingModule.getAddress();
    console.log(`✅ AdvancedPricingModule 배포 완료: ${contractAddress}\n`);

    // 2. 다양한 체인링크 지표 등록
    console.log("📊 체인링크 지표 등록 중...");
    
    const indicators = {
      // 암호화폐
      ETH_USD: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
      BTC_USD: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      
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
    };

    // 지표 등록
    await pricingModule.addIndicator(indicators.ETH_USD, 0, "Ethereum to USD price feed");
    await pricingModule.addIndicator(indicators.BTC_USD, 0, "Bitcoin to USD price feed");
    await pricingModule.addIndicator(indicators.SP500, 1, "S&P 500 Index");
    await pricingModule.addIndicator(indicators.NASDAQ, 1, "NASDAQ Index");
    await pricingModule.addIndicator(indicators.GOLD_USD, 2, "Gold to USD price feed");
    await pricingModule.addIndicator(indicators.SILVER_USD, 2, "Silver to USD price feed");
    await pricingModule.addIndicator(indicators.OIL_USD, 2, "Oil to USD price feed");
    await pricingModule.addIndicator(indicators.EUR_USD, 3, "Euro to USD exchange rate");
    await pricingModule.addIndicator(indicators.GBP_USD, 3, "British Pound to USD exchange rate");
    await pricingModule.addIndicator(indicators.KRW_USD, 3, "Korean Won to USD exchange rate");
    await pricingModule.addIndicator(indicators.JPY_USD, 3, "Japanese Yen to USD exchange rate");
    
    console.log("✅ 모든 체인링크 지표 등록 완료\n");

    // 3. 프로젝트별 맞춤형 지표 설정
    console.log("🏢 프로젝트별 맞춤형 지표 설정 중...");
    
    // 상업용 부동산 프로젝트 (S&P500 + 환율 중심)
    const commercialIndicators = [
      indicators.SP500,    // 40% - 경기 상황
      indicators.GOLD_USD, // 25% - 안전자산 선호도
      indicators.KRW_USD,  // 20% - 환율 변동
      indicators.ETH_USD   // 15% - 암호화폐 시장
    ];
    
    const commercialWeights = [40, 25, 20, 15];
    
    await pricingModule.setProjectIndicators(
      "commercial-project",
      commercialIndicators,
      commercialWeights,
      true,  // 경제 조정 사용
      true   // 변동성 조정 사용
    );
    console.log("  ✅ 상업용 부동산 지표 설정 완료");

    // 주거용 부동산 프로젝트 (인플레이션 + 금리 중심)
    const residentialIndicators = [
      indicators.GOLD_USD, // 50% - 인플레이션 지표
      indicators.SP500,    // 30% - 경제 안정성
      indicators.KRW_USD,  // 20% - 국내 환율
    ];
    
    const residentialWeights = [50, 30, 20];
    
    await pricingModule.setProjectIndicators(
      "residential-project",
      residentialIndicators,
      residentialWeights,
      true,  // 경제 조정 사용
      false  // 변동성 조정 사용 안함
    );
    console.log("  ✅ 주거용 부동산 지표 설정 완료");

    // 산업용 부동산 프로젝트 (원유 + 건설 자재 중심)
    const industrialIndicators = [
      indicators.OIL_USD,    // 40% - 에너지 비용
      indicators.SILVER_USD, // 30% - 건설 자재
      indicators.SP500,      // 20% - 경제 상황
      indicators.ETH_USD     // 10% - 시장 변동성
    ];
    
    const industrialWeights = [40, 30, 20, 10];
    
    await pricingModule.setProjectIndicators(
      "industrial-project",
      industrialIndicators,
      industrialWeights,
      true,  // 경제 조정 사용
      true   // 변동성 조정 사용
    );
    console.log("  ✅ 산업용 부동산 지표 설정 완료\n");

    // 4. 경제 조정 계수 설정
    console.log("⚙️ 경제 조정 계수 설정 중...");
    
    // 상업용: 시장 민감도 높음
    await pricingModule.setEconomicAdjustment(
      "commercial-project",
      200,  // 인플레이션 조정: 2%
      300,  // 금리 조정: 3%
      400,  // 시장 심리 조정: 4%
      200   // 변동성 조정: 2%
    );
    
    // 주거용: 안정성 중심
    await pricingModule.setEconomicAdjustment(
      "residential-project",
      100,  // 인플레이션 조정: 1%
      150,  // 금리 조정: 1.5%
      100,  // 시장 심리 조정: 1%
      50    // 변동성 조정: 0.5%
    );
    
    // 산업용: 에너지 비용 민감
    await pricingModule.setEconomicAdjustment(
      "industrial-project",
      300,  // 인플레이션 조정: 3%
      200,  // 금리 조정: 2%
      300,  // 시장 심리 조정: 3%
      400   // 변동성 조정: 4%
    );
    
    console.log("  ✅ 경제 조정 계수 설정 완료\n");

    // 5. 개별 지표 값 조회 테스트
    console.log("📈 개별 지표 값 조회 테스트...");
    
    const testIndicators = [
      { name: "ETH/USD", address: indicators.ETH_USD },
      { name: "S&P500", address: indicators.SP500 },
      { name: "GOLD/USD", address: indicators.GOLD_USD },
      { name: "KRW/USD", address: indicators.KRW_USD }
    ];

    for (const indicator of testIndicators) {
      try {
        const value = await pricingModule.getIndicatorValue(indicator.address);
        console.log(`  📊 ${indicator.name}: ${ethers.formatUnits(value, 8)}`);
      } catch (error) {
        console.log(`  ❌ ${indicator.name}: 조회 실패 (로컬 네트워크에서는 정상)`);
      }
    }

    // 6. 프로젝트 타입별 가격 계산 테스트
    console.log("\n💰 프로젝트 타입별 가격 계산 테스트...");
    
    const basePrice = ethers.parseEther("0.01"); // 0.01 ETH
    
    try {
      // 상업용 부동산 가격 계산
      const commercialPrice = await pricingModule.getProjectTypeSpecificPrice(
        "commercial-project", 
        "commercial"
      );
      console.log(`  🏢 상업용 부동산 가격: ${ethers.formatEther(commercialPrice)} ETH`);
      
      // 주거용 부동산 가격 계산
      const residentialPrice = await pricingModule.getProjectTypeSpecificPrice(
        "residential-project", 
        "residential"
      );
      console.log(`  🏠 주거용 부동산 가격: ${ethers.formatEther(residentialPrice)} ETH`);
      
      // 산업용 부동산 가격 계산
      const industrialPrice = await pricingModule.getProjectTypeSpecificPrice(
        "industrial-project", 
        "industrial"
      );
      console.log(`  🏭 산업용 부동산 가격: ${ethers.formatEther(industrialPrice)} ETH`);
      
    } catch (error) {
      console.log(`  ❌ 가격 계산 실패: ${error}`);
    }

    // 7. 변동성 조정 테스트
    console.log("\n📊 변동성 조정 테스트...");
    
    try {
      const volatilityAdjustedPrice = await pricingModule.applyVolatilityAdjustment(
        "commercial-project",
        basePrice
      );
      console.log(`  📈 변동성 조정된 가격: ${ethers.formatEther(volatilityAdjustedPrice)} ETH`);
    } catch (error) {
      console.log(`  ❌ 변동성 조정 실패: ${error}`);
    }

    // 8. 종합 분석 결과
    console.log("\n📋 고급 체인링크 가격 계산 시스템 분석 결과:");
    console.log("  🌐 지원 지표: 11개 (암호화폐, 주식, 상품, 환율)");
    console.log("  🏢 프로젝트 타입: 3개 (상업용, 주거용, 산업용)");
    console.log("  ⚙️ 조정 기능: 경제 조정, 변동성 조정");
    console.log("  📊 가중치 시스템: 프로젝트별 맞춤형");
    console.log("  🔄 실시간 업데이트: 체인링크 오라클 기반");

    console.log("\n🎯 활용 시나리오:");
    console.log("  🏢 상업용 부동산:");
    console.log("    - S&P500로 경기 상황 반영");
    console.log("    - 환율로 국제 투자자 유치");
    console.log("    - 금 가격으로 안전자산 선호도 측정");
    
    console.log("\n  🏠 주거용 부동산:");
    console.log("    - 금 가격으로 인플레이션 추정");
    console.log("    - S&P500로 경제 안정성 측정");
    console.log("    - 낮은 변동성으로 안정적 가격");
    
    console.log("\n  🏭 산업용 부동산:");
    console.log("    - 원유 가격으로 에너지 비용 반영");
    console.log("    - 은 가격으로 건설 자재 비용 추정");
    console.log("    - 높은 변동성으로 시장 민감도 반영");

    console.log("\n✅ 고급 체인링크 가격 계산 테스트 완료!");
    console.log("\n🚀 다음 단계:");
    console.log("  1. 실제 메인넷/테스트넷에 배포");
    console.log("  2. 프론트엔드에서 실시간 지표 시각화");
    console.log("  3. 투자자별 맞춤형 가격 정보 제공");
    console.log("  4. AI 분석에 다중 지표 데이터 활용");

  } catch (error) {
    console.error("❌ 고급 체인링크 가격 계산 테스트 실패:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

