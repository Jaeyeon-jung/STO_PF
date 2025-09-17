import { ethers } from "hardhat";

async function main() {
  console.log("체인링크 연동 테스트를 시작합니다...");

  // 컨트랙트 배포
  const RealEstateToken = await ethers.getContractFactory("RealEstateToken");
  const token = await RealEstateToken.deploy();
  await token.waitForDeployment();

  const contractAddress = await token.getAddress();
  console.log(`RealEstateToken 컨트랙트가 ${contractAddress}에 배포되었습니다.`);

  // 테스트용 가격 피드 주소 (Ethereum Mainnet ETH/USD)
  // 실제 테스트넷에서는 해당 네트워크의 가격 피드 주소를 사용해야 합니다
  const ETH_USD_PRICE_FEED = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";

  try {
    // 1. 기본 프로젝트 등록 (동적 가격 사용 안함)
    console.log("\n1. 기본 프로젝트 등록 테스트...");
    await token.registerProject(
      "seoul-basic-001",
      "서울 기본 프로젝트",
      "서울시 강남구",
      ethers.parseEther("0.1"), // 0.1 ETH per token
      1000
    );
    console.log("✅ 기본 프로젝트 등록 완료");

    // 2. 체인링크 가격 피드를 사용하는 프로젝트 등록
    console.log("\n2. 체인링크 가격 피드 프로젝트 등록 테스트...");
    await token.registerProjectWithPriceFeed(
      "seoul-dynamic-001",
      "서울 동적 가격 프로젝트",
      "서울시 서초구",
      ethers.parseEther("0.05"), // 0.05 ETH base price
      1000,
      ETH_USD_PRICE_FEED
    );
    console.log("✅ 동적 가격 프로젝트 등록 완료");

    // 3. 프로젝트 정보 조회
    console.log("\n3. 프로젝트 정보 조회 테스트...");
    const basicProject = await token.getProject("seoul-basic-001");
    console.log("기본 프로젝트 정보:", {
      id: basicProject.id,
      name: basicProject.name,
      basePrice: ethers.formatEther(basicProject.basePrice),
      useDynamicPricing: basicProject.useDynamicPricing
    });

    const dynamicProject = await token.getProject("seoul-dynamic-001");
    console.log("동적 가격 프로젝트 정보:", {
      id: dynamicProject.id,
      name: dynamicProject.name,
      basePrice: ethers.formatEther(dynamicProject.basePrice),
      useDynamicPricing: dynamicProject.useDynamicPricing,
      priceFeed: dynamicProject.priceFeed
    });

    // 4. 현재 토큰 가격 조회
    console.log("\n4. 현재 토큰 가격 조회 테스트...");
    const basicPrice = await token.getCurrentTokenPrice("seoul-basic-001");
    console.log(`기본 프로젝트 토큰 가격: ${ethers.formatEther(basicPrice)} ETH`);

    try {
      // 주의: 실제 메인넷 가격 피드를 사용하므로 테스트넷에서는 실패할 수 있습니다
      const dynamicPrice = await token.getCurrentTokenPrice("seoul-dynamic-001");
      console.log(`동적 가격 프로젝트 토큰 가격: ${ethers.formatEther(dynamicPrice)} ETH`);
    } catch (error) {
      console.log("⚠️  동적 가격 조회 실패 (테스트넷에서는 정상적인 현상):", error);
    }

    // 5. 가격 피드 업데이트 테스트
    console.log("\n5. 가격 피드 업데이트 테스트...");
    await token.updatePriceFeed("seoul-basic-001", ETH_USD_PRICE_FEED, true);
    const updatedProject = await token.getProject("seoul-basic-001");
    console.log("업데이트된 프로젝트 정보:", {
      useDynamicPricing: updatedProject.useDynamicPricing,
      priceFeed: updatedProject.priceFeed
    });

    console.log("\n✅ 모든 테스트가 완료되었습니다!");

  } catch (error) {
    console.error("❌ 테스트 중 오류 발생:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

