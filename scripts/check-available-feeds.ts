import { ethers } from "hardhat";

async function main() {
  console.log("🔍 체인링크에서 이용 가능한 주요 데이터 피드들\n");

  // 주요 네트워크별 체인링크 가격 피드 주소들 (실제 운영 중)
  const priceFeeds = {
    "Ethereum Mainnet": {
      "ETH/USD": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
      "BTC/USD": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "USDC/USD": "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
      "LINK/USD": "0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c",
      "MATIC/USD": "0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676"
    },
    "Polygon Mainnet": {
      "ETH/USD": "0xF9680D99D6C9589e2a93a78A04A279e509205945",
      "BTC/USD": "0xc907E116054Ad103354f2D350FD2514433D57F6f",
      "MATIC/USD": "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0"
    },
    "Sepolia Testnet": {
      "ETH/USD": "0x694AA1769357215DE4FAC081bf1f309aDC325306",
      "BTC/USD": "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
      "LINK/USD": "0xc59E3633BAAC79493d908e63626716e204A45EdF"
    }
  };

  console.log("📊 **현재 운영 중인 체인링크 데이터 피드들:**\n");
  
  for (const [network, feeds] of Object.entries(priceFeeds)) {
    console.log(`🌐 **${network}**`);
    for (const [pair, address] of Object.entries(feeds)) {
      console.log(`   ${pair}: ${address}`);
    }
    console.log();
  }

  console.log("💡 **이 데이터들은 체인링크가 이미 수집하고 있는 실제 시장 데이터입니다:**");
  console.log("   - 암호화폐 거래소들의 실시간 가격");
  console.log("   - 전통 금융 시장의 주식/환율 데이터");
  console.log("   - 상품 시장의 가격 정보");
  console.log("   - 부동산 지수 및 REIT 가격 등\n");

  console.log("🏠 **부동산 프로젝트 적용 예시:**");
  console.log("   1. ETH/USD 피드 → 토큰 가격을 달러 기준으로 안정화");
  console.log("   2. 부동산 지수 피드 → 지역 부동산 시장 변동 반영");
  console.log("   3. 건설 자재 가격 피드 → 건설 비용 변동 반영");
  console.log("   4. 환율 피드 → 국제 투자자를 위한 환율 변동 반영\n");

  // 실제 가격 피드 테스트 (로컬 네트워크에서는 실패하지만 설명용)
  console.log("⚠️  주의: 로컬 Hardhat 네트워크에서는 실제 피드에 접근할 수 없습니다.");
  console.log("   실제 테스트넷이나 메인넷에 배포해야 체인링크 데이터를 사용할 수 있습니다.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

