import { ethers } from "hardhat";

async function main() {
    console.log("🏗️ 대규모 건설 프로젝트 예시 배포 및 등록...");
    
    const [deployer] = await ethers.getSigners();
    console.log("배포자 주소:", deployer.address);

    try {
        // 1. 기존 프록시 주소들 (실제 환경에서는 배포된 주소 사용)
        const CORE_PROXY = "0xa1F94caF02bE7939bD58144b4E156F2e719fC10d"; // 예시 주소
        const PRICING_PROXY = "0x19c2164F0B8a514c66DEEc8f1f8246F655f73B5d";
        const PROXY_MANAGER = "0x2B0d36FACD61B71CC05ab8F3D2355ec3631C0dd5";

        // 2. ConstructionModule 배포
        console.log("\n📦 ConstructionModule 배포 중...");
        const ConstructionModule = await ethers.getContractFactory("ConstructionModule");
        const constructionModule = await ConstructionModule.deploy();
        await constructionModule.waitForDeployment();
        console.log("✅ ConstructionModule 배포:", await constructionModule.getAddress());

        // 3. 초기화
        const initTx = await constructionModule.initialize(CORE_PROXY);
        await initTx.wait();
        console.log("✅ ConstructionModule 초기화 완료");

        // 4. Core 컨트랙트에 다양한 건설 프로젝트 등록
        const coreContract = await ethers.getContractAt("RealEstateCore", CORE_PROXY);
        
        console.log("\n🏢 건설 프로젝트들 등록 중...");

        // 건설 프로젝트 예시들
        const constructionProjects = [
            {
                id: "busan-bridge-2025",
                name: "부산 해상대교 건설",
                location: "부산광역시 해운대구",
                basePrice: ethers.parseEther("50"), // 50 ETH per token
                totalSupply: 2000,
                projectType: 2, // INFRASTRUCTURE
                contractor: "현대건설",
                architect: "삼성물산",
                totalBudget: ethers.parseEther("100000"), // 100,000 ETH
                estimatedDuration: 1825, // 5년
                description: "부산 해운대와 기장군을 연결하는 총 길이 7.2km의 해상대교 건설 프로젝트"
            },
            {
                id: "solar-plant-jeju",
                name: "제주 해상풍력 발전단지",
                location: "제주특별자치도 서귀포시",
                basePrice: ethers.parseEther("25"), // 25 ETH per token
                totalSupply: 4000,
                projectType: 3, // ENERGY
                contractor: "두산에너빌리티",
                architect: "한국전력공사",
                totalBudget: ethers.parseEther("80000"), // 80,000 ETH
                estimatedDuration: 1095, // 3년
                description: "100MW 규모의 해상풍력 발전단지 조성으로 친환경 에너지 공급"
            },
            {
                id: "smart-city-songdo",
                name: "송도 스마트시티 2단계",
                location: "인천광역시 연수구 송도동",
                basePrice: ethers.parseEther("30"), // 30 ETH per token
                totalSupply: 5000,
                projectType: 5, // SMART_CITY
                contractor: "포스코건설",
                architect: "KPF + 삼우설계",
                totalBudget: ethers.parseEther("150000"), // 150,000 ETH
                estimatedDuration: 2190, // 6년
                description: "IoT, AI 기반 스마트 인프라를 갖춘 미래형 도시 개발 2단계 사업"
            },
            {
                id: "gtx-extension",
                name: "GTX-D 노선 건설",
                location: "경기도 일산-서울-하남",
                basePrice: ethers.parseEther("40"), // 40 ETH per token
                totalSupply: 3000,
                projectType: 6, // TRANSPORTATION
                contractor: "대림산업",
                architect: "한국철도기술연구원",
                totalBudget: ethers.parseEther("120000"), // 120,000 ETH
                estimatedDuration: 2555, // 7년
                description: "수도권 광역급행철도 D노선 건설로 교통 접근성 대폭 개선"
            },
            {
                id: "semiconductor-complex",
                name: "K-반도체 벨트 조성",
                location: "경기도 용인시 처인구",
                basePrice: ethers.parseEther("60"), // 60 ETH per token
                totalSupply: 3500,
                projectType: 4, // INDUSTRIAL
                contractor: "삼성물산",
                architect: "삼성전자",
                totalBudget: ethers.parseEther("200000"), // 200,000 ETH
                estimatedDuration: 1460, // 4년
                description: "차세대 반도체 생산을 위한 첨단 산업단지 및 연구개발 시설 구축"
            }
        ];

        // 각 프로젝트를 Core 컨트랙트에 등록
        for (const project of constructionProjects) {
            try {
                console.log(`\n🏗️ ${project.name} 등록 중...`);
                
                // Core 컨트랙트에 기본 프로젝트 등록
                const registerTx = await coreContract.registerProject(
                    project.id,
                    project.name,
                    project.location,
                    project.basePrice,
                    project.totalSupply
                );
                await registerTx.wait();

                // ConstructionModule에 상세 정보 등록
                const constructionTx = await constructionModule.registerConstructionProject(
                    project.id,
                    project.projectType,
                    project.location,
                    project.contractor,
                    project.architect,
                    project.totalBudget,
                    project.estimatedDuration
                );
                await constructionTx.wait();

                console.log(`✅ ${project.name} 등록 완료`);
                
            } catch (error) {
                console.log(`⚠️ ${project.name} 등록 실패:`, error.message);
            }
        }

        // 5. 프로젝트별 리스크 평가 및 지속가능성 지표 설정
        console.log("\n📊 리스크 평가 및 지속가능성 지표 설정...");

        const riskData = [
            {
                projectId: "busan-bridge-2025",
                weatherRisk: 70, // 해상 공사로 기상 리스크 높음
                regulatoryRisk: 40,
                technicalRisk: 60,
                financialRisk: 30,
                environmentalRisk: 50,
                carbonFootprint: 15000,
                energyEfficiency: 75,
                recycledMaterials: 30,
                wasteReduction: 25,
                greenCertified: true
            },
            {
                projectId: "solar-plant-jeju",
                weatherRisk: 60,
                regulatoryRisk: 30,
                technicalRisk: 40,
                financialRisk: 25,
                environmentalRisk: 15, // 친환경 프로젝트
                carbonFootprint: 2000, // 매우 낮음
                energyEfficiency: 95,
                recycledMaterials: 60,
                wasteReduction: 70,
                greenCertified: true
            },
            {
                projectId: "smart-city-songdo",
                weatherRisk: 20,
                regulatoryRisk: 45,
                technicalRisk: 70, // 신기술 적용
                financialRisk: 40,
                environmentalRisk: 25,
                carbonFootprint: 8000,
                energyEfficiency: 90,
                recycledMaterials: 50,
                wasteReduction: 60,
                greenCertified: true
            }
        ];

        for (const risk of riskData) {
            try {
                // 리스크 평가 업데이트
                const riskTx = await constructionModule.updateRiskAssessment(
                    risk.projectId,
                    risk.weatherRisk,
                    risk.regulatoryRisk,
                    risk.technicalRisk,
                    risk.financialRisk,
                    risk.environmentalRisk,
                    ["정기 안전점검 강화", "보험 가입", "전문가 자문단 구성"]
                );
                await riskTx.wait();

                // 지속가능성 지표 업데이트
                const sustainabilityTx = await constructionModule.updateSustainabilityMetrics(
                    risk.projectId,
                    risk.carbonFootprint,
                    risk.energyEfficiency,
                    risk.recycledMaterials,
                    risk.wasteReduction,
                    risk.greenCertified,
                    ["태양광 패널 설치", "우수 재활용 시설", "친환경 자재 사용"]
                );
                await sustainabilityTx.wait();

                console.log(`✅ ${risk.projectId} 지표 설정 완료`);
            } catch (error) {
                console.log(`⚠️ ${risk.projectId} 지표 설정 실패:`, error.message);
            }
        }

        // 6. 프로젝트 정보 조회 테스트
        console.log("\n📋 등록된 프로젝트 정보 조회...");
        
        for (const project of constructionProjects.slice(0, 2)) { // 처음 2개만 테스트
            try {
                const info = await constructionModule.getProjectComprehensiveInfo(project.id);
                console.log(`\n🏗️ ${project.name}:`);
                console.log(`- 프로젝트 타입: ${info.details.projectType}`);
                console.log(`- 현재 단계: ${info.details.currentPhase}`);
                console.log(`- 진행률: ${info.details.progressPercentage}%`);
                console.log(`- 예산 준수: ${info.details.isOnBudget ? '✅' : '❌'}`);
                console.log(`- 일정 준수: ${info.details.isOnSchedule ? '✅' : '❌'}`);
                console.log(`- 종합 리스크: ${info.risks.overallRiskScore}/100`);
                console.log(`- 프로젝트 상태: ${info.projectStatus}`);
                
                const riskLevel = await constructionModule.getRiskLevel(project.id);
                const sustainabilityGrade = await constructionModule.getSustainabilityGrade(project.id);
                console.log(`- 리스크 레벨: ${riskLevel}`);
                console.log(`- 지속가능성 등급: ${sustainabilityGrade}`);
                
            } catch (error) {
                console.log(`⚠️ ${project.name} 정보 조회 실패:`, error.message);
            }
        }

        // 7. 포트폴리오 통계
        console.log("\n📈 포트폴리오 통계:");
        try {
            const stats = await constructionModule.getPortfolioStats();
            console.log(`- 총 프로젝트 수: ${stats.totalProjects}`);
            console.log(`- 총 투자 규모: ${ethers.formatEther(stats.totalInvestment)} ETH`);
            
            // 프로젝트 타입별 통계
            const projectTypes = [
                { name: "주거용", type: 0 },
                { name: "상업용", type: 1 },
                { name: "인프라", type: 2 },
                { name: "에너지", type: 3 },
                { name: "산업시설", type: 4 },
                { name: "스마트시티", type: 5 },
                { name: "교통시설", type: 6 }
            ];

            for (const pt of projectTypes) {
                const typeStats = await constructionModule.getProjectTypeStats(pt.type);
                if (typeStats.count > 0) {
                    console.log(`- ${pt.name}: ${typeStats.count}개 프로젝트, ${ethers.formatEther(typeStats.totalInvestment)} ETH`);
                }
            }
        } catch (error) {
            console.log("⚠️ 통계 조회 실패:", error.message);
        }

        console.log("\n🎉 대규모 건설 프로젝트 확장 완료!");
        console.log("\n✨ 새로운 기능들:");
        console.log("1. 7가지 건설 프로젝트 타입 지원");
        console.log("2. 9단계 건설 진행 상황 추적");
        console.log("3. 다차원 리스크 평가 시스템");
        console.log("4. ESG 기반 지속가능성 지표");
        console.log("5. 실시간 예산/일정 모니터링");
        console.log("6. 포트폴리오 통계 및 분석");

        return {
            constructionModule: await constructionModule.getAddress(),
            projectsRegistered: constructionProjects.length,
            totalInvestmentSize: constructionProjects.reduce((sum, p) => sum + Number(ethers.formatEther(p.totalBudget)), 0)
        };

    } catch (error) {
        console.error("❌ 배포 중 오류 발생:", error);
        throw error;
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export default main;



