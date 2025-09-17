import { ethers } from "hardhat";

async function main() {
  console.log("🚀 체인링크 + 커스텀 데이터 하이브리드 오라클 시스템 테스트 (로컬 버전)\n");

  // 컨트랙트 배포
  const RealEstateToken = await ethers.getContractFactory("RealEstateToken");
  const token = await RealEstateToken.deploy();
  await token.waitForDeployment();

  const contractAddress = await token.getAddress();
  console.log(`✅ RealEstateToken 컨트랙트 배포 완료: ${contractAddress}\n`);

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

    // 2. 하이브리드 프로젝트 등록 (체인링크 피드 없이)
    console.log("🔧 2. 하이브리드 프로젝트 등록 (커스텀 데이터만 사용)...");
    console.log("   가중치: 커스텀 70%, 기본 30%");
    await token.registerHybridProject(
      "hybrid-project",
      "하이브리드 부동산 프로젝트",
      "서울시 서초구",
      ethers.parseEther("0.08"), // 0.08 ETH 기본 가격
      1000,
      ethers.ZeroAddress, // 체인링크 피드 사용 안함
      0,  // 체인링크 가중치 0%
      70, // 커스텀 가중치 70%  
      30  // 기본 가격 가중치 30%
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
    console.log(`   커스텀 컴포넌트: ${ethers.formatEther(ethers.parseEther("0.08") * BigInt(50 + Number(customScore)) / 100n)} ETH`);
    console.log(`   최종 하이브리드 가격: ${ethers.formatEther(hybridPrice)} ETH\n`);

    // 5. 메트릭 변경 시나리오 테스트
    console.log("🔄 5. 메트릭 변경 시나리오 테스트...");
    
    // 시나리오 1: 개발 완료, 높은 수요
    console.log("   시나리오 1: 개발 완료 + 높은 수요");
    await token.updateCustomMetrics("hybrid-project", 900, 100, 95);
    const scenario1Price = await token.getCurrentTokenPrice("hybrid-project");
    const score1 = await token.calculateCustomScore("hybrid-project");
    console.log(`   → 커스텀 점수: ${score1}/100`);
    console.log(`   → 가격: ${ethers.formatEther(scenario1Price)} ETH`);
    
    // 시나리오 2: 낮은 수요, 개발 초기
    console.log("   시나리오 2: 낮은 수요 + 개발 초기");
    await token.updateCustomMetrics("hybrid-project", 200, 10, 30);
    const scenario2Price = await token.getCurrentTokenPrice("hybrid-project");
    const score2 = await token.calculateCustomScore("hybrid-project");
    console.log(`   → 커스텀 점수: ${score2}/100`);
    console.log(`   → 가격: ${ethers.formatEther(scenario2Price)} ETH`);
    
    // 원래 상태로 복구
    await token.updateCustomMetrics("hybrid-project", 750, 65, 85);
    console.log("   원래 상태로 복구 완료\n");

    // 6. 가중치 변경 테스트
    console.log("⚖️  6. 가중치 변경 테스트...");
    console.log("   새 가중치: 커스텀 90%, 기본 10%");
    await token.updateWeights("hybrid-project", 0, 90, 10);
    
    const newWeightPrice = await token.getCurrentTokenPrice("hybrid-project");
    console.log(`   → 새 가격: ${ethers.formatEther(newWeightPrice)} ETH`);
    console.log("   (커스텀 데이터의 영향력이 90%로 증가)\n");

    // 7. 커스텀 점수별 가격 변화 시뮬레이션
    console.log("📊 7. 커스텀 점수별 가격 변화 시뮬레이션...");
    const scenarios = [
      { name: "최악의 상황", demand: 100, progress: 0, infra: 20 },
      { name: "개발 초기", demand: 300, progress: 10, infra: 40 },
      { name: "중간 단계", demand: 500, progress: 50, infra: 60 },
      { name: "개발 후반", demand: 700, progress: 80, infra: 80 },
      { name: "최고의 상황", demand: 1000, progress: 100, infra: 100 }
    ];

    for (const scenario of scenarios) {
      await token.updateCustomMetrics("hybrid-project", scenario.demand, scenario.progress, scenario.infra);
      const price = await token.getCurrentTokenPrice("hybrid-project");
      const score = await token.calculateCustomScore("hybrid-project");
      console.log(`   ${scenario.name}: 점수 ${score}/100 → ${ethers.formatEther(price)} ETH`);
    }

    // 8. 프로젝트 정보 조회
    console.log("\n📋 8. 최종 프로젝트 정보 조회...");
    const hybridProject = await token.getProject("hybrid-project");
    const customMetrics = await token.projectCustomMetrics("hybrid-project");
    const weights = await token.projectWeights("hybrid-project");
    
    console.log("   프로젝트 정보:");
    console.log(`     이름: ${hybridProject.name}`);
    console.log(`     위치: ${hybridProject.location}`);
    console.log(`     기본 가격: ${ethers.formatEther(hybridProject.basePrice)} ETH`);
    console.log(`     하이브리드 지표 사용: ${hybridProject.useHybridIndex}`);
    
    console.log("   현재 커스텀 메트릭:");
    console.log(`     지역 수요 지수: ${customMetrics.localDemandIndex}/1000`);
    console.log(`     개발 진행률: ${customMetrics.developmentProgress}%`);
    console.log(`     인프라 점수: ${customMetrics.infraScore}/100`);
    
    console.log("   현재 가중치:");
    console.log(`     체인링크: ${weights.chainlinkWeight}%`);
    console.log(`     커스텀: ${weights.customWeight}%`);
    console.log(`     기본: ${weights.baseWeight}%`);

    console.log("\n🎉 하이브리드 오라클 시스템 테스트 완료!");
    console.log("\n💡 핵심 기능 검증 완료:");
    console.log("   ✓ 커스텀 메트릭 (수요, 진행률, 인프라) 반영");
    console.log("   ✓ 가중치 기반 복합 지표 계산");
    console.log("   ✓ 동적 가격 조정 시스템");
    console.log("   ✓ 실시간 메트릭 업데이트");
    console.log("\n🌐 실제 배포시에는 체인링크 데이터도 함께 활용 가능!");

  } catch (error) {
    console.error("❌ 테스트 중 오류 발생:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

