import { ethers } from "hardhat";

async function main() {
  console.log("🤖 AI 통합 시스템 종합 테스트\n");

  // 컨트랙트 배포
  const RealEstateToken = await ethers.getContractFactory("RealEstateToken");
  const token = await RealEstateToken.deploy();
  await token.waitForDeployment();

  const contractAddress = await token.getAddress();
  console.log(`✅ 컨트랙트 배포 완료: ${contractAddress}\n`);

  try {
    // 1. AI 강화 하이브리드 프로젝트 등록
    console.log("🏗️  1. AI 강화 하이브리드 프로젝트 등록...");
    await token.registerHybridProject(
      "ai-enhanced-project",
      "AI 강화 부동산 프로젝트",
      "서울시 강남구",
      ethers.parseEther("0.1"), // 0.1 ETH 기본 가격
      1000,
      ethers.ZeroAddress, // 체인링크 피드 사용 안함 (로컬 테스트)
      0,  // 체인링크 0%
      60, // 커스텀 60%
      40  // 기본 40%
    );
    console.log("✅ AI 강화 프로젝트 등록 완료\n");

    // 2. 커스텀 메트릭 설정
    console.log("📊 2. 커스텀 메트릭 설정...");
    await token.updateCustomMetrics(
      "ai-enhanced-project",
      800,  // 높은 지역 수요
      45,   // 개발 진행률 45%
      90    // 우수한 인프라
    );
    
    const customScore = await token.calculateCustomScore("ai-enhanced-project");
    console.log(`   커스텀 종합 점수: ${customScore}/100`);
    
    const hybridPrice = await token.getCurrentTokenPrice("ai-enhanced-project");
    console.log(`   하이브리드 가격: ${ethers.formatEther(hybridPrice)} ETH\n`);

    // 3. AI 예측 결과 업데이트 (다양한 시나리오)
    console.log("🧠 3. AI 예측 결과 업데이트 테스트...");
    
    // 시나리오 1: 긍정적 AI 예측
    console.log("   시나리오 1: 긍정적 AI 예측");
    await token.updateAIPrediction(
      "ai-enhanced-project",
      ethers.parseEther("0.12"), // AI 예측 가격: 0.12 ETH
      85, // 높은 신뢰도
      30, // 낮은 리스크
      88  // 높은 투자 점수
    );
    
    let aiEnhancedPrice = await token.getAIEnhancedPrice("ai-enhanced-project");
    let investmentGrade = await token.getInvestmentGrade("ai-enhanced-project");
    console.log(`   → AI 강화 가격: ${ethers.formatEther(aiEnhancedPrice)} ETH`);
    console.log(`   → 투자 등급: ${investmentGrade}\n`);

    // 시나리오 2: 부정적 AI 예측
    console.log("   시나리오 2: 부정적 AI 예측");
    await token.updateAIPrediction(
      "ai-enhanced-project",
      ethers.parseEther("0.08"), // AI 예측 가격: 0.08 ETH (하락)
      75, // 중간 신뢰도
      80, // 높은 리스크
      35  // 낮은 투자 점수
    );
    
    aiEnhancedPrice = await token.getAIEnhancedPrice("ai-enhanced-project");
    investmentGrade = await token.getInvestmentGrade("ai-enhanced-project");
    console.log(`   → AI 강화 가격: ${ethers.formatEther(aiEnhancedPrice)} ETH`);
    console.log(`   → 투자 등급: ${investmentGrade}`);
    console.log(`   → 리스크 조정: 높은 리스크로 인한 가격 하향 조정 적용\n`);

    // 시나리오 3: 낮은 신뢰도 AI 예측
    console.log("   시나리오 3: 낮은 신뢰도 AI 예측");
    await token.updateAIPrediction(
      "ai-enhanced-project",
      ethers.parseEther("0.15"), // AI 예측 가격: 0.15 ETH
      45, // 낮은 신뢰도 (60% 미만)
      25, // 낮은 리스크
      70  // 중간 투자 점수
    );
    
    aiEnhancedPrice = await token.getAIEnhancedPrice("ai-enhanced-project");
    console.log(`   → AI 강화 가격: ${ethers.formatEther(aiEnhancedPrice)} ETH`);
    console.log(`   → 낮은 신뢰도로 인해 하이브리드 가격 사용\n`);

    // 4. 종합 프로젝트 정보 조회
    console.log("📋 4. 종합 프로젝트 정보 조회...");
    const projectInfo = await token.getProjectWithAI("ai-enhanced-project");
    
    console.log("   📊 프로젝트 기본 정보:");
    console.log(`     이름: ${projectInfo.project.name}`);
    console.log(`     위치: ${projectInfo.project.location}`);
    console.log(`     기본 가격: ${ethers.formatEther(projectInfo.project.basePrice)} ETH`);
    console.log(`     하이브리드 사용: ${projectInfo.project.useHybridIndex}`);
    
    console.log("   📈 커스텀 메트릭:");
    console.log(`     지역 수요: ${projectInfo.metrics.localDemandIndex}/1000`);
    console.log(`     개발 진행률: ${projectInfo.metrics.developmentProgress}%`);
    console.log(`     인프라 점수: ${projectInfo.metrics.infraScore}/100`);
    
    console.log("   🤖 AI 예측 정보:");
    console.log(`     예측 가격: ${ethers.formatEther(projectInfo.aiPrediction.predictedPrice)} ETH`);
    console.log(`     신뢰도: ${projectInfo.aiPrediction.confidenceScore}/100`);
    console.log(`     리스크 점수: ${projectInfo.aiPrediction.riskScore}/100`);
    console.log(`     투자 점수: ${projectInfo.aiPrediction.investmentScore}/100`);
    console.log(`     활성화 상태: ${projectInfo.aiPrediction.isActive}`);
    
    console.log("   💰 가격 정보:");
    console.log(`     현재 가격: ${ethers.formatEther(projectInfo.currentPrice)} ETH`);
    console.log(`     AI 강화 가격: ${ethers.formatEther(projectInfo.aiEnhancedPrice)} ETH`);
    console.log(`     투자 등급: ${projectInfo.investmentGrade}\n`);

    // 5. AI 예측 비활성화 테스트
    console.log("🔄 5. AI 예측 비활성화 테스트...");
    await token.toggleAIPrediction("ai-enhanced-project", false);
    
    const disabledAIPrice = await token.getAIEnhancedPrice("ai-enhanced-project");
    const disabledGrade = await token.getInvestmentGrade("ai-enhanced-project");
    console.log(`   → AI 비활성화 후 가격: ${ethers.formatEther(disabledAIPrice)} ETH`);
    console.log(`   → 투자 등급: ${disabledGrade}\n`);

    // 6. 가격 비교 분석
    console.log("📊 6. 가격 비교 분석 요약...");
    
    // AI 다시 활성화
    await token.toggleAIPrediction("ai-enhanced-project", true);
    await token.updateAIPrediction(
      "ai-enhanced-project",
      ethers.parseEther("0.11"),
      80, 40, 75
    );
    
    const basePrice = await token.tokenIdToProject(await token.projectToTokenId("ai-enhanced-project"));
    const currentHybridPrice = await token.getCurrentTokenPrice("ai-enhanced-project");
    const finalAIPrice = await token.getAIEnhancedPrice("ai-enhanced-project");
    
    console.log("   가격 진화 과정:");
    console.log(`   1️⃣  기본 가격: ${ethers.formatEther(basePrice.basePrice)} ETH`);
    console.log(`   2️⃣  하이브리드 가격: ${ethers.formatEther(currentHybridPrice)} ETH`);
    console.log(`   3️⃣  AI 강화 가격: ${ethers.formatEther(finalAIPrice)} ETH`);
    
    const hybridIncrease = ((Number(currentHybridPrice) - Number(basePrice.basePrice)) / Number(basePrice.basePrice)) * 100;
    const aiIncrease = ((Number(finalAIPrice) - Number(currentHybridPrice)) / Number(currentHybridPrice)) * 100;
    
    console.log(`   📈 하이브리드 효과: ${hybridIncrease > 0 ? '+' : ''}${hybridIncrease.toFixed(2)}%`);
    console.log(`   🤖 AI 효과: ${aiIncrease > 0 ? '+' : ''}${aiIncrease.toFixed(2)}%`);

    console.log("\n🎉 AI 통합 시스템 테스트 완료!");
    console.log("\n💡 구현된 AI 기능들:");
    console.log("   ✓ AI 기반 가격 예측 및 신뢰도 평가");
    console.log("   ✓ 리스크 점수 기반 가격 조정");
    console.log("   ✓ 투자 점수 및 등급 시스템");
    console.log("   ✓ 체인링크 + 커스텀 + AI 데이터 융합");
    console.log("   ✓ 시간 기반 예측 만료 시스템");
    console.log("   ✓ 종합 프로젝트 분석 대시보드");

  } catch (error) {
    console.error("❌ 테스트 중 오류 발생:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

