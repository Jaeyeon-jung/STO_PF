import { ethers } from "hardhat";
import * as fs from 'fs';

async function main() {
    console.log("🚀 Sepolia 테스트넷에 STO-PF 시스템 배포 시작...");
    
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    
    console.log("🌐 네트워크:", network.name, "Chain ID:", network.chainId.toString());
    console.log("👤 배포자 주소:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 배포자 잔액:", ethers.formatEther(balance), "ETH");
    
    if (balance < ethers.parseEther("0.1")) {
        throw new Error("❌ 잔액 부족! 최소 0.1 ETH가 필요합니다. Sepolia Faucet에서 테스트 ETH를 받으세요.");
    }

    try {
        // 1. 구현체 컨트랙트들 배포
        console.log("\n📦 구현체 컨트랙트들 배포 중...");
        
        // RealEstateCore 구현체 배포
        console.log("  🏗️ RealEstateCore 배포 중...");
        const RealEstateCore = await ethers.getContractFactory("RealEstateCore");
        const coreImplementation = await RealEstateCore.deploy();
        await coreImplementation.waitForDeployment();
        const coreImplAddress = await coreImplementation.getAddress();
        console.log("  ✅ RealEstateCore 구현체:", coreImplAddress);

        // PricingModule 구현체 배포
        console.log("  💰 PricingModule 배포 중...");
        const PricingModule = await ethers.getContractFactory("PricingModule");
        const pricingImplementation = await PricingModule.deploy();
        await pricingImplementation.waitForDeployment();
        const pricingImplAddress = await pricingImplementation.getAddress();
        console.log("  ✅ PricingModule 구현체:", pricingImplAddress);

        // DividendModule 구현체 배포
        console.log("  📊 DividendModule 배포 중...");
        const DividendModule = await ethers.getContractFactory("DividendModule");
        const dividendImplementation = await DividendModule.deploy();
        await dividendImplementation.waitForDeployment();
        const dividendImplAddress = await dividendImplementation.getAddress();
        console.log("  ✅ DividendModule 구현체:", dividendImplAddress);

        // AIModule 구현체 배포
        console.log("  🤖 AIModule 배포 중...");
        const AIModule = await ethers.getContractFactory("AIModule");
        const aiImplementation = await AIModule.deploy();
        await aiImplementation.waitForDeployment();
        const aiImplAddress = await aiImplementation.getAddress();
        console.log("  ✅ AIModule 구현체:", aiImplAddress);

        // 2. 프록시 매니저 배포
        console.log("\n🔧 프록시 매니저 배포 중...");
        const RealEstateProxyManager = await ethers.getContractFactory("RealEstateProxyManager");
        const proxyManager = await RealEstateProxyManager.deploy();
        await proxyManager.waitForDeployment();
        const proxyManagerAddress = await proxyManager.getAddress();
        console.log("✅ 프록시 매니저 배포:", proxyManagerAddress);

        // 3. 모든 프록시들 배포 및 초기화
        console.log("\n🌐 프록시들 배포 및 초기화 중...");
        const deployTx = await proxyManager.deployAllProxies(
            coreImplAddress,
            pricingImplAddress,
            dividendImplAddress,
            aiImplAddress
        );
        await deployTx.wait();
        console.log("✅ 모든 프록시 배포 및 연결 완료");

        // 4. 프록시 주소들 조회
        const [coreProxy, pricingProxy, dividendProxy, aiProxy] = await proxyManager.getAllProxies();
        console.log("\n📍 배포된 프록시 주소들:");
        console.log("  🏗️ Core 프록시:", coreProxy);
        console.log("  💰 Pricing 프록시:", pricingProxy);
        console.log("  📊 Dividend 프록시:", dividendProxy);
        console.log("  🤖 AI 프록시:", aiProxy);

        // 5. Chainlink 가격 피드 설정 (Sepolia 테스트넷용)
        console.log("\n🔗 Chainlink 가격 피드 설정 중...");
        const SEPOLIA_ETH_USD_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
        const SEPOLIA_BTC_USD_FEED = "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43";
        
        // 6. 테스트 프로젝트 등록 (Chainlink 피드 포함)
        console.log("\n🏢 테스트 프로젝트 등록 중...");
        const coreContract = await ethers.getContractAt("RealEstateCore", coreProxy);
        
        // 프로젝트 1: ETH/USD 피드 사용
        const registerTx1 = await coreContract.registerProjectWithPriceFeed(
            "sepolia-eth-project",
            "Sepolia ETH 연동 프로젝트",
            "서울시 강남구 테헤란로",
            ethers.parseEther("0.01"), // 0.01 ETH per token
            10000, // 10,000 tokens
            SEPOLIA_ETH_USD_FEED
        );
        await registerTx1.wait();
        console.log("  ✅ ETH/USD 연동 프로젝트 등록 완료");

        // 프로젝트 2: 기본 프로젝트
        const registerTx2 = await coreContract.registerProject(
            "sepolia-basic-project",
            "Sepolia 기본 프로젝트",
            "부산시 해운대구",
            ethers.parseEther("0.005"), // 0.005 ETH per token
            20000 // 20,000 tokens
        );
        await registerTx2.wait();
        console.log("  ✅ 기본 프로젝트 등록 완료");

        // 7. 프라이싱 모듈 설정
        console.log("\n⚙️ 프라이싱 모듈 설정 중...");
        const pricingContract = await ethers.getContractAt("PricingModule", pricingProxy);
        
        // ETH 연동 프로젝트 설정
        await pricingContract.updateCustomMetrics("sepolia-eth-project", 850, 45, 90);
        await pricingContract.updateWeights("sepolia-eth-project", 50, 30, 20); // Chainlink 50%
        
        // 기본 프로젝트 설정  
        await pricingContract.updateCustomMetrics("sepolia-basic-project", 650, 25, 75);
        await pricingContract.updateWeights("sepolia-basic-project", 0, 60, 40); // 커스텀 60%
        
        console.log("  ✅ 프라이싱 모듈 설정 완료");

        // 8. 실제 Chainlink 데이터 테스트
        console.log("\n🔍 실제 Chainlink 데이터 테스트...");
        try {
            const ethUsdPrice = await pricingContract.getLatestPrice(SEPOLIA_ETH_USD_FEED);
            console.log("  📊 현재 ETH/USD 가격:", ethers.formatUnits(ethUsdPrice, 8), "USD");
            
            const projectPrice = await pricingContract.getCurrentTokenPrice("sepolia-eth-project");
            console.log("  💰 ETH 연동 프로젝트 토큰 가격:", ethers.formatEther(projectPrice), "ETH");
            
            console.log("  ✅ Chainlink 데이터 연동 성공!");
        } catch (error) {
            console.log("  ⚠️ Chainlink 데이터 조회 실패:", error);
        }

        // 9. 배포 정보 저장
        const deploymentInfo = {
            network: "sepolia",
            chainId: network.chainId.toString(),
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            contracts: {
                proxyManager: proxyManagerAddress,
                proxies: {
                    core: coreProxy,
                    pricing: pricingProxy,
                    dividend: dividendProxy,
                    ai: aiProxy
                },
                implementations: {
                    core: coreImplAddress,
                    pricing: pricingImplAddress,
                    dividend: dividendImplAddress,
                    ai: aiImplAddress
                }
            },
            chainlinkFeeds: {
                ethUsd: SEPOLIA_ETH_USD_FEED,
                btcUsd: SEPOLIA_BTC_USD_FEED
            },
            testProjects: [
                "sepolia-eth-project",
                "sepolia-basic-project"
            ]
        };

        // 배포 정보를 파일로 저장
        const deploymentPath = `deployments/sepolia-${Date.now()}.json`;
        if (!fs.existsSync('deployments')) {
            fs.mkdirSync('deployments');
        }
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

        console.log("\n🎉 Sepolia 테스트넷 배포 완료!");
        console.log("\n📋 배포 요약:");
        console.log("  🌐 네트워크: Sepolia Testnet");
        console.log("  🔗 Chain ID:", network.chainId.toString());
        console.log("  📍 프록시 매니저:", proxyManagerAddress);
        console.log("  🏗️ Core 프록시:", coreProxy);
        console.log("  💰 Pricing 프록시:", pricingProxy);
        console.log("  📊 배포 정보 저장:", deploymentPath);
        
        console.log("\n🔗 Etherscan 링크:");
        console.log("  프록시 매니저:", `https://sepolia.etherscan.io/address/${proxyManagerAddress}`);
        console.log("  Core 프록시:", `https://sepolia.etherscan.io/address/${coreProxy}`);
        
        console.log("\n🚀 다음 단계:");
        console.log("  1. 프론트엔드에서 Sepolia 네트워크 설정");
        console.log("  2. 컨트랙트 주소 업데이트");
        console.log("  3. MetaMask에서 Sepolia 네트워크 추가");
        console.log("  4. 실제 투자 기능 테스트");

        return deploymentInfo;

    } catch (error) {
        console.error("❌ Sepolia 배포 중 오류 발생:", error);
        throw error;
    }
}

// 스크립트 실행
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export default main;


