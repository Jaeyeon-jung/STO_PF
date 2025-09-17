import { ethers } from "hardhat";

async function main() {
  console.log("🚀 체인링크 + 커스텀 데이터 하이브리드 오라클 시스템 테스트\n");

  // 컨트랙트 배포
  const RealEstateToken = await ethers.getContractFactory("RealEstateToken");
  const token = await RealEstateToken.deploy();
  await token.waitForDeployment();

  const contractAddress = await token.getAddress();
  console.log(`✅ RealEstateToken 컨트랙트 배포 완료: ${contractAddress}\n`);

  // 테스트용 가격 피드 주소
  const ETH_USD_PRICE_FEED = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";

  try {
    // 1. 기본 프로젝트 등록
    console.log("📝 1. 기본 프로젝트 등록...");
    await token.registerProject(
      "basic-project",
      "기본 프로젝트",
      "서울시 강남구",
      ethers.parseEther("0.1"),
      1000
    );
    console.log("✅ 기본 프로젝트 등록 완료\n");

    // 2. 하이브리드 프로젝트 등록
    console.log("🔧 2. 하이브리드 프로젝트 등록...");
    console.log("   가중치: 체인링크 40%, 커스텀 40%, 기본 20%");
    await token.registerHybridProject(
      "hybrid-project",
      "하이브리드 부동산 프로젝트",
      "서울시 서초구",
      ethers.parseEther("0.08"), // 0.08 ETH 기본 가격
      1000,
      ETH_USD_PRICE_FEED,
      40, // 체인링크 가중치 40%
      40, // 커스텀 가중치 40%  
      20  // 기본 가격 가중치 20%
    );
    console.log("✅ 하이브리드 프로젝트 등록 완료\n");

    // 3. 커스텀 메트릭 업데이트
    console.log("📊 3. 커스텀 메트릭 업데이트...");
    await token.updateCustomMetrics(
      "hybrid-project",
      750,  // 지역 수요 지수: 750/1000 (높은 수요)
      65,   // 개발 진행률: 65%
      85    // 인프라 점수: 85/100 (우수한 인프라)
    );
    console.log("   지역 수요 지수: 750/1000");
    console.log("   개발 진행률: 65%");
    console.log("   인프라 점수: 85/100");
    console.log("✅ 커스텀 메트릭 업데이트 완료\n");

    // 4. 가격 비교 분석
    console.log("💰 4. 가격 비교 분석...");
    
    const basicPrice = await token.getCurrentTokenPrice("basic-project");
    console.log(`   기본 프로젝트 가격: ${ethers.formatEther(basicPrice)} ETH`);
    
    const hybridPrice = await token.getCurrentTokenPrice("hybrid-project");
    console.log(`   하이브리드 프로젝트 가격: ${ethers.formatEther(hybridPrice)} ETH`);
    
    // 커스텀 점수 확인
    const customScore = await token.calculateCustomScore("hybrid-project");
    console.log(`   커스텀 점수: ${customScore}/100`);
    
    console.log("\n📈 가격 구성 요소 분석:");
    console.log(`   기본 가격: ${ethers.formatEther(ethers.parseEther("0.08"))} ETH`);
    console.log(`   커스텀 승수: ${(50 + Number(customScore)) / 100}배`);
    console.log(`   최종 하이브리드 가격: ${ethers.formatEther(hybridPrice)} ETH\n`);

    // 5. 메트릭 변경 시나리오 테스트
    console.log("🔄 5. 메트릭 변경 시나리오 테스트...");
    
    // 시나리오 1: 개발 완료, 높은 수요
    console.log("   시나리오 1: 개발 완료 + 높은 수요");
    await token.updateCustomMetrics("hybrid-project", 900, 100, 95);
    const scenario1Price = await token.getCurrentTokenPrice("hybrid-project");
    console.log(`   → 가격: ${ethers.formatEther(scenario1Price)} ETH`);
    
    // 시나리오 2: 낮은 수요, 개발 초기
    console.log("   시나리오 2: 낮은 수요 + 개발 초기");
    await token.updateCustomMetrics("hybrid-project", 200, 10, 30);
    const scenario2Price = await token.getCurrentTokenPrice("hybrid-project");
    console.log(`   → 가격: ${ethers.formatEther(scenario2Price)} ETH`);
    
    // 원래 상태로 복구
    await token.updateCustomMetrics("hybrid-project", 750, 65, 85);
    console.log("   원래 상태로 복구 완료\n");

    // 6. 가중치 변경 테스트
    console.log("⚖️  6. 가중치 변경 테스트...");
    console.log("   새 가중치: 체인링크 20%, 커스텀 70%, 기본 10%");
    await token.updateWeights("hybrid-project", 20, 70, 10);
    
    const newWeightPrice = await token.getCurrentTokenPrice("hybrid-project");
    console.log(`   → 새 가격: ${ethers.formatEther(newWeightPrice)} ETH`);
    console.log("   (커스텀 데이터의 영향력이 크게 증가)\n");

    // 7. 프로젝트 정보 조회
    console.log("📋 7. 프로젝트 정보 조회...");
    const hybridProject = await token.getProject("hybrid-project");
    const customMetrics = await token.projectCustomMetrics("hybrid-project");
    const weights = await token.projectWeights("hybrid-project");
    
    console.log("   프로젝트 정보:");
    console.log(`     이름: ${hybridProject.name}`);
    console.log(`     위치: ${hybridProject.location}`);
    console.log(`     기본 가격: ${ethers.formatEther(hybridProject.basePrice)} ETH`);
    console.log(`     하이브리드 지표 사용: ${hybridProject.useHybridIndex}`);
    
    console.log("   커스텀 메트릭:");
    console.log(`     지역 수요 지수: ${customMetrics.localDemandIndex}/1000`);
    console.log(`     개발 진행률: ${customMetrics.developmentProgress}%`);
    console.log(`     인프라 점수: ${customMetrics.infraScore}/100`);
    
    console.log("   가중치:");
    console.log(`     체인링크: ${weights.chainlinkWeight}%`);
    console.log(`     커스텀: ${weights.customWeight}%`);
    console.log(`     기본: ${weights.baseWeight}%`);

    console.log("\n🎉 하이브리드 오라클 시스템 테스트 완료!");
    console.log("\n💡 핵심 기능:");
    console.log("   ✓ 체인링크 실시간 데이터 연동");
    console.log("   ✓ 커스텀 메트릭 (수요, 진행률, 인프라) 반영");
    console.log("   ✓ 가중치 기반 복합 지표 계산");
    console.log("   ✓ 동적 가격 조정 시스템");

  } catch (error) {
    console.error("❌ 테스트 중 오류 발생:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

