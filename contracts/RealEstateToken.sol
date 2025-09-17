// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract RealEstateToken is ERC1155, Ownable, ERC1155Supply {
    // 커스텀 데이터 구조체
    struct CustomMetrics {
        uint256 localDemandIndex;    // 지역 수요 지수 (0-1000)
        uint256 developmentProgress; // 개발 진행률 (0-100)
        uint256 infraScore;         // 인프라 점수 (0-100)
        uint256 lastUpdated;        // 마지막 업데이트 시간
    }

    // 복합 지표 가중치 구조체
    struct IndexWeights {
        uint256 chainlinkWeight;    // 체인링크 데이터 가중치 (%)
        uint256 customWeight;       // 커스텀 데이터 가중치 (%)
        uint256 baseWeight;         // 기본 가격 가중치 (%)
    }

    // 프로젝트 정보 구조체
    struct Project {
        string id;          // 프로젝트 ID (예: "seoul-mixed-101")
        string name;        // 프로젝트 이름
        string location;    // 위치
        uint256 basePrice; // 기본 토큰 가격 (wei)
        uint256 totalSupply; // 총 발행량
        bool isActive;     // 활성화 상태
        address priceFeed; // 체인링크 가격 피드 주소 (선택사항)
        bool useDynamicPricing; // 동적 가격 책정 사용 여부
        bool useHybridIndex;    // 하이브리드 지표 사용 여부
    }

    // 프로젝트 ID를 토큰 ID에 매핑
    mapping(string => uint256) public projectToTokenId;
    // 토큰 ID를 프로젝트 정보에 매핑
    mapping(uint256 => Project) public tokenIdToProject;
    // 프로젝트별 커스텀 메트릭 저장
    mapping(string => CustomMetrics) public projectCustomMetrics;
    // 프로젝트별 지표 가중치 저장
    mapping(string => IndexWeights) public projectWeights;
    // 다음 토큰 ID를 추적
    uint256 private _nextTokenId;

    // AI 예측 결과 구조체
    struct AIPrediction {
        uint256 predictedPrice;      // AI 예측 가격 (wei)
        uint256 confidenceScore;     // 신뢰도 점수 (0-100)
        uint256 riskScore;          // 리스크 점수 (0-100)
        uint256 investmentScore;    // 투자 점수 (0-100)
        uint256 timestamp;          // 예측 시간
        bool isActive;              // 예측 활성화 여부
    }

    // 프로젝트별 AI 예측 저장
    mapping(string => AIPrediction) public projectAIPredictions;

    // 이벤트 정의
    event CustomMetricsUpdated(string indexed projectId, uint256 localDemandIndex, uint256 developmentProgress, uint256 infraScore);
    event WeightsUpdated(string indexed projectId, uint256 chainlinkWeight, uint256 customWeight, uint256 baseWeight);
    event HybridPriceCalculated(string indexed projectId, uint256 finalPrice, uint256 chainlinkComponent, uint256 customComponent);
    event AIPredictionUpdated(string indexed projectId, uint256 predictedPrice, uint256 confidenceScore, uint256 riskScore);

    constructor() ERC1155("https://api.realestate.example/token/{id}.json") Ownable(msg.sender) {
        _nextTokenId = 1;
    }

    // 새 프로젝트 등록 (기본 가격 사용)
    function registerProject(
        string memory projectId,
        string memory name,
        string memory location,
        uint256 basePrice,
        uint256 totalSupply
    ) public onlyOwner {
        _registerProject(projectId, name, location, basePrice, totalSupply, address(0), false, false);
    }

    // 새 프로젝트 등록 (체인링크 가격 피드 사용)
    function registerProjectWithPriceFeed(
        string memory projectId,
        string memory name,
        string memory location,
        uint256 basePrice,
        uint256 totalSupply,
        address priceFeedAddress
    ) public onlyOwner {
        _registerProject(projectId, name, location, basePrice, totalSupply, priceFeedAddress, true, false);
    }

    // 새 프로젝트 등록 (하이브리드 지표 사용)
    function registerHybridProject(
        string memory projectId,
        string memory name,
        string memory location,
        uint256 basePrice,
        uint256 totalSupply,
        address priceFeedAddress,
        uint256 chainlinkWeight,
        uint256 customWeight,
        uint256 baseWeight
    ) public onlyOwner {
        require(chainlinkWeight + customWeight + baseWeight == 100, "Weights must sum to 100");
        
        _registerProject(projectId, name, location, basePrice, totalSupply, priceFeedAddress, true, true);
        
        // 가중치 설정
        projectWeights[projectId] = IndexWeights({
            chainlinkWeight: chainlinkWeight,
            customWeight: customWeight,
            baseWeight: baseWeight
        });

        emit WeightsUpdated(projectId, chainlinkWeight, customWeight, baseWeight);
    }

    // 내부 프로젝트 등록 함수
    function _registerProject(
        string memory projectId,
        string memory name,
        string memory location,
        uint256 basePrice,
        uint256 totalSupply,
        address priceFeedAddress,
        bool useDynamicPricing,
        bool useHybridIndex
    ) internal {
        require(projectToTokenId[projectId] == 0, "Project already exists");
        
        uint256 tokenId = _nextTokenId++;
        projectToTokenId[projectId] = tokenId;
        
        Project memory newProject = Project({
            id: projectId,
            name: name,
            location: location,
            basePrice: basePrice,
            totalSupply: totalSupply,
            isActive: true,
            priceFeed: priceFeedAddress,
            useDynamicPricing: useDynamicPricing,
            useHybridIndex: useHybridIndex
        });
        
        tokenIdToProject[tokenId] = newProject;
        
        // 하이브리드 프로젝트인 경우 기본 커스텀 메트릭 초기화
        if (useHybridIndex) {
            projectCustomMetrics[projectId] = CustomMetrics({
                localDemandIndex: 500,    // 기본값: 중간 수준
                developmentProgress: 0,   // 기본값: 시작 단계
                infraScore: 50,          // 기본값: 중간 수준
                lastUpdated: block.timestamp
            });
        }
        
        _mint(msg.sender, tokenId, totalSupply, "");  // 컨트랙트 대신 소유자에게 직접 발행
    }

    // 커스텀 메트릭 업데이트 (소유자만 가능)
    function updateCustomMetrics(
        string memory projectId,
        uint256 localDemandIndex,
        uint256 developmentProgress,
        uint256 infraScore
    ) public onlyOwner {
        require(projectToTokenId[projectId] != 0, "Project does not exist");
        require(localDemandIndex <= 1000, "Local demand index must be <= 1000");
        require(developmentProgress <= 100, "Development progress must be <= 100");
        require(infraScore <= 100, "Infrastructure score must be <= 100");
        
        projectCustomMetrics[projectId] = CustomMetrics({
            localDemandIndex: localDemandIndex,
            developmentProgress: developmentProgress,
            infraScore: infraScore,
            lastUpdated: block.timestamp
        });

        emit CustomMetricsUpdated(projectId, localDemandIndex, developmentProgress, infraScore);
    }

    // 가중치 업데이트 (소유자만 가능)
    function updateWeights(
        string memory projectId,
        uint256 chainlinkWeight,
        uint256 customWeight,
        uint256 baseWeight
    ) public onlyOwner {
        require(projectToTokenId[projectId] != 0, "Project does not exist");
        require(chainlinkWeight + customWeight + baseWeight == 100, "Weights must sum to 100");
        
        projectWeights[projectId] = IndexWeights({
            chainlinkWeight: chainlinkWeight,
            customWeight: customWeight,
            baseWeight: baseWeight
        });

        emit WeightsUpdated(projectId, chainlinkWeight, customWeight, baseWeight);
    }

    // AI 예측 결과 업데이트 (소유자만 가능)
    function updateAIPrediction(
        string memory projectId,
        uint256 predictedPrice,
        uint256 confidenceScore,
        uint256 riskScore,
        uint256 investmentScore
    ) public onlyOwner {
        require(projectToTokenId[projectId] != 0, "Project does not exist");
        require(confidenceScore <= 100, "Confidence score must be <= 100");
        require(riskScore <= 100, "Risk score must be <= 100");
        require(investmentScore <= 100, "Investment score must be <= 100");
        
        projectAIPredictions[projectId] = AIPrediction({
            predictedPrice: predictedPrice,
            confidenceScore: confidenceScore,
            riskScore: riskScore,
            investmentScore: investmentScore,
            timestamp: block.timestamp,
            isActive: true
        });

        emit AIPredictionUpdated(projectId, predictedPrice, confidenceScore, riskScore);
    }

    // AI 예측 활성화/비활성화
    function toggleAIPrediction(string memory projectId, bool isActive) public onlyOwner {
        require(projectToTokenId[projectId] != 0, "Project does not exist");
        projectAIPredictions[projectId].isActive = isActive;
    }

    // 체인링크 가격 피드에서 최신 가격 가져오기
    function getLatestPrice(address priceFeed) public view returns (int256) {
        require(priceFeed != address(0), "Price feed address not set");
        
        AggregatorV3Interface priceFeedContract = AggregatorV3Interface(priceFeed);
        (, int256 price, , , ) = priceFeedContract.latestRoundData();
        
        return price;
    }

    // 커스텀 메트릭 기반 점수 계산
    function calculateCustomScore(string memory projectId) public view returns (uint256) {
        CustomMetrics memory metrics = projectCustomMetrics[projectId];
        
        // 각 메트릭을 0-100 범위로 정규화하고 가중 평균 계산
        uint256 demandScore = (metrics.localDemandIndex * 100) / 1000;  // 0-1000을 0-100으로
        uint256 progressScore = metrics.developmentProgress;             // 이미 0-100
        uint256 infraScore = metrics.infraScore;                       // 이미 0-100
        
        // 가중 평균 (수요 40%, 진행률 30%, 인프라 30%)
        uint256 customScore = (demandScore * 40 + progressScore * 30 + infraScore * 30) / 100;
        
        return customScore; // 0-100 범위의 점수
    }

    // 프로젝트의 현재 토큰 가격 계산 (하이브리드 지표 포함)
    function getCurrentTokenPrice(string memory projectId) public view returns (uint256) {
        uint256 tokenId = projectToTokenId[projectId];
        require(tokenId != 0, "Project does not exist");
        
        Project memory project = tokenIdToProject[tokenId];
        
        // 기본 가격만 사용하는 경우
        if (!project.useDynamicPricing) {
            return project.basePrice;
        }

        // 하이브리드 지표를 사용하는 경우
        if (project.useHybridIndex) {
            return calculateHybridPrice(projectId);
        }

        // 단순 체인링크 피드만 사용하는 경우 (기존 로직)
        if (project.priceFeed != address(0)) {
            int256 latestPrice = getLatestPrice(project.priceFeed);
            require(latestPrice > 0, "Invalid price from feed");
            return (project.basePrice * uint256(latestPrice)) / 1e8;
        }
        
        return project.basePrice;
    }

    // 하이브리드 가격 계산 (체인링크 + 커스텀 데이터)
    function calculateHybridPrice(string memory projectId) public view returns (uint256) {
        Project memory project = tokenIdToProject[projectToTokenId[projectId]];
        IndexWeights memory weights = projectWeights[projectId];
        
        uint256 baseComponent = project.basePrice;
        uint256 chainlinkComponent = baseComponent;
        uint256 customComponent = baseComponent;
        
        // 1. 체인링크 데이터 컴포넌트 계산
        if (project.priceFeed != address(0) && weights.chainlinkWeight > 0) {
            int256 latestPrice = getLatestPrice(project.priceFeed);
            if (latestPrice > 0) {
                chainlinkComponent = (baseComponent * uint256(latestPrice)) / 1e8;
            }
        }
        
        // 2. 커스텀 데이터 컴포넌트 계산
        if (weights.customWeight > 0) {
            uint256 customScore = calculateCustomScore(projectId);
            // 커스텀 점수를 가격 승수로 변환 (50점 = 1.0배, 100점 = 1.5배, 0점 = 0.5배)
            uint256 multiplier = 50 + customScore; // 50-150 범위
            customComponent = (baseComponent * multiplier) / 100;
        }
        
        // 3. 가중 평균으로 최종 가격 계산
        uint256 finalPrice = (
            (baseComponent * weights.baseWeight) +
            (chainlinkComponent * weights.chainlinkWeight) +
            (customComponent * weights.customWeight)
        ) / 100;
        
        // 이벤트 발생 (view 함수에서는 불가능하므로 별도 함수에서 처리)        
        return finalPrice;
    }

    // AI 강화 가격 계산 (체인링크 + 커스텀 + AI 예측)
    function getAIEnhancedPrice(string memory projectId) public view returns (uint256) {
        uint256 tokenId = projectToTokenId[projectId];
        require(tokenId != 0, "Project does not exist");
        
        Project memory project = tokenIdToProject[tokenId];
        AIPrediction memory aiPrediction = projectAIPredictions[projectId];
        
        // AI 예측이 비활성화되어 있거나 너무 오래된 경우 기본 하이브리드 가격 사용
        if (!aiPrediction.isActive || 
            (block.timestamp - aiPrediction.timestamp) > 24 hours ||
            aiPrediction.confidenceScore < 60) {
            return getCurrentTokenPrice(projectId);
        }
        
        // 기본 하이브리드 가격 계산
        uint256 hybridPrice = project.useHybridIndex ? 
            calculateHybridPrice(projectId) : 
            getCurrentTokenPrice(projectId);
        
        // AI 예측 가격과 하이브리드 가격을 신뢰도에 따라 가중 평균
        uint256 aiWeight = aiPrediction.confidenceScore; // 0-100
        uint256 hybridWeight = 100 - aiWeight;
        
        uint256 finalPrice = (
            (hybridPrice * hybridWeight) + 
            (aiPrediction.predictedPrice * aiWeight)
        ) / 100;
        
        // 리스크 점수에 따른 조정 (높은 리스크 = 가격 하향 조정)
        if (aiPrediction.riskScore > 70) {
            finalPrice = (finalPrice * 95) / 100; // 5% 할인
        } else if (aiPrediction.riskScore > 50) {
            finalPrice = (finalPrice * 98) / 100; // 2% 할인
        }
        
        return finalPrice;
    }

    // 투자 점수 기반 추천 등급 반환
    function getInvestmentGrade(string memory projectId) public view returns (string memory) {
        AIPrediction memory aiPrediction = projectAIPredictions[projectId];
        
        if (!aiPrediction.isActive) {
            return "No AI Analysis";
        }
        
        if (aiPrediction.investmentScore >= 90) return "A+";
        if (aiPrediction.investmentScore >= 80) return "A";
        if (aiPrediction.investmentScore >= 70) return "B+";
        if (aiPrediction.investmentScore >= 60) return "B";
        if (aiPrediction.investmentScore >= 50) return "C+";
        if (aiPrediction.investmentScore >= 40) return "C";
        return "D";
    }

    // 종합 프로젝트 정보 조회 (AI 정보 포함)
    function getProjectWithAI(string memory projectId) public view returns (
        Project memory project,
        CustomMetrics memory metrics,
        AIPrediction memory aiPrediction,
        uint256 currentPrice,
        uint256 aiEnhancedPrice,
        string memory investmentGrade
    ) {
        uint256 tokenId = projectToTokenId[projectId];
        require(tokenId != 0, "Project does not exist");
        
        project = tokenIdToProject[tokenId];
        metrics = projectCustomMetrics[projectId];
        aiPrediction = projectAIPredictions[projectId];
        currentPrice = getCurrentTokenPrice(projectId);
        aiEnhancedPrice = getAIEnhancedPrice(projectId);
        investmentGrade = getInvestmentGrade(projectId);
    }

    // 하이브리드 가격 계산 및 이벤트 발생 (non-view 함수)
    function calculateAndEmitHybridPrice(string memory projectId) public returns (uint256) {
        uint256 finalPrice = calculateHybridPrice(projectId);
        
        Project memory project = tokenIdToProject[projectToTokenId[projectId]];
        IndexWeights memory weights = projectWeights[projectId];
        
        uint256 chainlinkComponent = project.basePrice;
        if (project.priceFeed != address(0)) {
            int256 latestPrice = getLatestPrice(project.priceFeed);
            if (latestPrice > 0) {
                chainlinkComponent = (project.basePrice * uint256(latestPrice)) / 1e8;
            }
        }
        
        uint256 customScore = calculateCustomScore(projectId);
        uint256 customComponent = (project.basePrice * (50 + customScore)) / 100;
        
        emit HybridPriceCalculated(projectId, finalPrice, chainlinkComponent, customComponent);
        
        return finalPrice;
    }

    // 토큰 구매
    function invest(string memory projectId, uint256 amount) public payable {
        uint256 tokenId = projectToTokenId[projectId];
        require(tokenId != 0, "Project does not exist");
        require(tokenIdToProject[tokenId].isActive, "Project is not active");
        
        // 현재 토큰 가격 계산 (동적 가격 포함)
        uint256 currentPrice = getCurrentTokenPrice(projectId);
        uint256 totalPrice = currentPrice * amount;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // 소유자로부터 구매자에게 토큰 전송
        safeTransferFrom(owner(), msg.sender, tokenId, amount, "");
        
        // 초과 지불된 금액 반환
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        // 판매 대금을 컨트랙트 소유자에게 전송
        payable(owner()).transfer(totalPrice);
    }

    // 프로젝트 상태 토글
    function toggleProjectStatus(string memory projectId) public onlyOwner {
        uint256 tokenId = projectToTokenId[projectId];
        require(tokenId != 0, "Project does not exist");
        tokenIdToProject[tokenId].isActive = !tokenIdToProject[tokenId].isActive;
    }

    // 프로젝트의 가격 피드 설정 업데이트
    function updatePriceFeed(
        string memory projectId,
        address newPriceFeed,
        bool useDynamicPricing
    ) public onlyOwner {
        uint256 tokenId = projectToTokenId[projectId];
        require(tokenId != 0, "Project does not exist");
        
        tokenIdToProject[tokenId].priceFeed = newPriceFeed;
        tokenIdToProject[tokenId].useDynamicPricing = useDynamicPricing;
    }

    // 프로젝트의 기본 가격 업데이트
    function updateBasePrice(string memory projectId, uint256 newBasePrice) public onlyOwner {
        uint256 tokenId = projectToTokenId[projectId];
        require(tokenId != 0, "Project does not exist");
        
        tokenIdToProject[tokenId].basePrice = newBasePrice;
    }

    // 프로젝트 정보 조회
    function getProject(string memory projectId) public view returns (Project memory) {
        uint256 tokenId = projectToTokenId[projectId];
        require(tokenId != 0, "Project does not exist");
        return tokenIdToProject[tokenId];
    }

    // 토큰 보유량 조회
    function getBalance(string memory projectId, address account) public view returns (uint256) {
        uint256 tokenId = projectToTokenId[projectId];
        require(tokenId != 0, "Project does not exist");
        return balanceOf(account, tokenId);
    }

    // Override required functions
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }

    // ========== 배당 시스템 ==========
    
    // 배당 이벤트 타입
    enum DividendEventType {
        POSITIVE_NEWS,      // 호재 (임대율 상승, 개발 진행 등)
        NEGATIVE_NEWS,      // 악재 (경기 침체, 규제 등)
        MARKET_VOLATILITY,  // 시장 변동성
        SEASONAL_BONUS,     // 계절적 보너스
        MAINTENANCE_COST,   // 유지보수 비용
        RENTAL_INCREASE,    // 임대료 인상
        ECONOMIC_DOWNTURN   // 경기 하강
    }

    // 배당 기록 구조체
    struct DividendRecord {
        uint256 month;              // 월 (1-12)
        uint256 year;               // 연도
        uint256 baseYield;          // 기본 수익률 (basis points, 100 = 1%)
        uint256 eventAdjustment;    // 이벤트 조정값 (basis points)
        uint256 finalYield;         // 최종 수익률 (basis points)
        DividendEventType eventType; // 이벤트 타입
        string eventDescription;    // 이벤트 설명
        uint256 timestamp;          // 기록 시간
    }

    // 프로젝트별 배당 기록 저장
    mapping(string => DividendRecord[]) public projectDividendHistory;
    
    // 프로젝트별 현재 기본 배당률 (basis points)
    mapping(string => uint256) public projectBaseDividendRate;

    // 배당 이벤트 발생 시 알림
    event DividendEventTriggered(
        string indexed projectId,
        DividendEventType eventType,
        string description,
        uint256 adjustment,
        uint256 newYield
    );

    // 월별 배당 기록 이벤트
    event MonthlyDividendRecorded(
        string indexed projectId,
        uint256 month,
        uint256 year,
        uint256 yield,
        uint256 cumulativeYield
    );

    // 기본 배당률 설정 (소유자만 가능)
    function setBaseDividendRate(string memory projectId, uint256 rateInBasisPoints) public onlyOwner {
        require(projectToTokenId[projectId] != 0, "Project does not exist");
        require(rateInBasisPoints <= 2000, "Rate cannot exceed 20%"); // 최대 20%
        
        projectBaseDividendRate[projectId] = rateInBasisPoints;
    }

    // 배당 이벤트 트리거 (소유자만 가능)
    function triggerDividendEvent(
        string memory projectId,
        DividendEventType eventType,
        string memory description,
        int256 adjustmentInBasisPoints // 음수 가능 (악재의 경우)
    ) public onlyOwner {
        require(projectToTokenId[projectId] != 0, "Project does not exist");
        require(adjustmentInBasisPoints >= -1000 && adjustmentInBasisPoints <= 1000, "Adjustment too large");

        uint256 baseRate = projectBaseDividendRate[projectId];
        if (baseRate == 0) {
            baseRate = 50; // 기본값 0.5%
        }

        // 조정값 적용 (음수 처리 포함)
        uint256 finalRate;
        if (adjustmentInBasisPoints < 0) {
            uint256 reduction = uint256(-adjustmentInBasisPoints);
            finalRate = baseRate > reduction ? baseRate - reduction : 0;
        } else {
            finalRate = baseRate + uint256(adjustmentInBasisPoints);
        }

        // 현재 월/년 계산 (2025년 기준으로 수정)
        uint256 currentTime = block.timestamp;
        // 2025년 1월 1일 기준 타임스탬프: 1735689600
        uint256 year2025Start = 1735689600;
        
        uint256 year = 2025;
        uint256 month;
        
        if (currentTime >= year2025Start) {
            // 2025년 이후의 월 계산
            uint256 daysSince2025 = (currentTime - year2025Start) / 86400;
            month = (daysSince2025 / 30) % 12 + 1; // 30일 기준 월 계산
            year = 2025 + (daysSince2025 / 365);
        } else {
            // 2025년 이전의 경우 (테스트용)
            month = ((currentTime / 86400 / 30) % 12) + 1;
            year = 2024;
        }

        // 배당 기록 저장
        DividendRecord memory newRecord = DividendRecord({
            month: month,
            year: year,
            baseYield: baseRate,
            eventAdjustment: adjustmentInBasisPoints >= 0 ? uint256(adjustmentInBasisPoints) : uint256(-adjustmentInBasisPoints),
            finalYield: finalRate,
            eventType: eventType,
            eventDescription: description,
            timestamp: currentTime
        });

        projectDividendHistory[projectId].push(newRecord);

        emit DividendEventTriggered(projectId, eventType, description, uint256(adjustmentInBasisPoints), finalRate);
    }

    // 특정 월에 배당 이벤트 트리거 (내부 함수)
    function triggerDividendEventWithTime(
        string memory projectId,
        DividendEventType eventType,
        string memory description,
        int256 adjustmentInBasisPoints,
        uint256 targetMonth
    ) internal {
        require(projectToTokenId[projectId] != 0, "Project does not exist");
        require(adjustmentInBasisPoints >= -1000 && adjustmentInBasisPoints <= 1000, "Adjustment too large");
        require(targetMonth >= 1 && targetMonth <= 12, "Invalid month");

        uint256 baseRate = projectBaseDividendRate[projectId];
        if (baseRate == 0) {
            baseRate = 50; // 기본값 0.5%
        }

        // 조정값 적용 (음수 처리 포함)
        uint256 finalRate;
        if (adjustmentInBasisPoints < 0) {
            uint256 reduction = uint256(-adjustmentInBasisPoints);
            finalRate = baseRate > reduction ? baseRate - reduction : 0;
        } else {
            finalRate = baseRate + uint256(adjustmentInBasisPoints);
        }

        // 배당 기록 저장 (지정된 월 사용)
        DividendRecord memory newRecord = DividendRecord({
            month: targetMonth,
            year: 2025,
            baseYield: baseRate,
            eventAdjustment: adjustmentInBasisPoints >= 0 ? uint256(adjustmentInBasisPoints) : uint256(-adjustmentInBasisPoints),
            finalYield: finalRate,
            eventType: eventType,
            eventDescription: description,
            timestamp: block.timestamp
        });

        projectDividendHistory[projectId].push(newRecord);

        emit DividendEventTriggered(projectId, eventType, description, uint256(adjustmentInBasisPoints), finalRate);
    }

    // 자동 시장 이벤트 시뮬레이션 (테스트용)
    function simulateMarketEvents(string memory projectId) public onlyOwner {
        // 랜덤한 시장 이벤트들을 시뮬레이션
        string[7] memory positiveEvents = [
            "New shopping mall opening boosts rental demand",
            "Subway extension confirmed improving accessibility", 
            "Government announces real estate deregulation",
            "Surrounding area redevelopment project approved",
            "Major corporation headquarters relocation increases foot traffic",
            "Tourism zone designation enhances commercial value",
            "Successful 10% rental rate increase above market"
        ];

        string[5] memory negativeEvents = [
            "COVID-19 resurgence reduces commercial facility usage",
            "Interest rate hikes shrink real estate market",
            "Building aging requires major renovation work",
            "Economic recession increases rental delinquency",
            "New environmental regulations raise operating costs"
        ];

        // 12개월 다양한 이벤트 생성 (최근 1년간)
        for (uint i = 0; i < 12; i++) {
            bool isPositive = (block.timestamp + i * 1000) % 3 != 0; // 2/3 확률로 호재
            
            if (isPositive) {
                uint256 eventIndex = (block.timestamp + i * 1000) % 7;
                int256 adjustment = int256(15 + ((block.timestamp + i * 1000) % 35)); // +15~50 basis points
                
                // 시간을 과거로 조정하여 다른 월에 기록되도록 함
                uint256 originalTimestamp = block.timestamp;
                // 각 이벤트를 다른 월에 배치 (i * 30일 전)
                
                triggerDividendEventWithTime(
                    projectId,
                    DividendEventType.POSITIVE_NEWS,
                    positiveEvents[eventIndex],
                    adjustment,
                    i + 1 // 월 (1-12)
                );
            } else {
                uint256 eventIndex = (block.timestamp + i * 1000) % 5;
                int256 adjustment = -int256(5 + ((block.timestamp + i * 1000) % 25)); // -5~30 basis points
                
                triggerDividendEventWithTime(
                    projectId,
                    DividendEventType.NEGATIVE_NEWS,
                    negativeEvents[eventIndex],
                    adjustment,
                    i + 1 // 월 (1-12)
                );
            }
        }
    }

    // 프로젝트 배당 히스토리 조회
    function getDividendHistory(string memory projectId) public view returns (DividendRecord[] memory) {
        return projectDividendHistory[projectId];
    }

    // 최근 12개월 배당 요약 조회
    function getRecentDividendSummary(string memory projectId) public view returns (
        uint256[] memory months,
        uint256[] memory yields,
        uint256[] memory cumulativeYields,
        string[] memory eventDescriptions
    ) {
        DividendRecord[] memory history = projectDividendHistory[projectId];
        uint256 length = history.length > 12 ? 12 : history.length;
        
        months = new uint256[](length);
        yields = new uint256[](length);
        cumulativeYields = new uint256[](length);
        eventDescriptions = new string[](length);
        
        uint256 cumulative = 0;
        uint256 startIndex = history.length > 12 ? history.length - 12 : 0;
        
        for (uint256 i = 0; i < length; i++) {
            uint256 historyIndex = startIndex + i;
            months[i] = history[historyIndex].month;
            yields[i] = history[historyIndex].finalYield;
            cumulative += history[historyIndex].finalYield;
            cumulativeYields[i] = cumulative;
            eventDescriptions[i] = history[historyIndex].eventDescription;
        }
    }
}