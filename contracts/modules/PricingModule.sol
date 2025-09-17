// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

interface IRealEstateCore {
    struct Project {
        string id;
        string name;
        string location;
        uint256 basePrice;
        uint256 totalSupply;
        bool isActive;
        address priceFeed;
        bool useDynamicPricing;
        bool useHybridIndex;
    }
    
    function getProject(string memory projectId) external view returns (Project memory);
    function projectToTokenId(string memory projectId) external view returns (uint256);
}

interface IAIModule {
    struct AIPrediction {
        uint256 predictedPrice;
        uint256 confidenceScore;
        uint256 riskScore;
        uint256 investmentScore;
        uint256 timestamp;
        bool isActive;
    }
    
    function getAIPrediction(string memory projectId) external view returns (AIPrediction memory);
}

contract PricingModule is Initializable, OwnableUpgradeable {
    
    // 커스텀 메트릭 구조체
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

    // 상태 변수들
    address public coreContract;
    address public aiModule;
    
    mapping(string => CustomMetrics) public projectCustomMetrics;
    mapping(string => IndexWeights) public projectWeights;
    
    // 이벤트
    event CustomMetricsUpdated(string indexed projectId, uint256 localDemandIndex, uint256 developmentProgress, uint256 infraScore);
    event WeightsUpdated(string indexed projectId, uint256 chainlinkWeight, uint256 customWeight, uint256 baseWeight);
    event HybridPriceCalculated(string indexed projectId, uint256 finalPrice, uint256 chainlinkComponent, uint256 customComponent);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _coreContract) public initializer {
        __Ownable_init(msg.sender);
        coreContract = _coreContract;
    }

    // AI 모듈 설정
    function setAIModule(address _aiModule) external onlyOwner {
        aiModule = _aiModule;
    }

    // 커스텀 메트릭 업데이트
    function updateCustomMetrics(
        string memory projectId,
        uint256 localDemandIndex,
        uint256 developmentProgress,
        uint256 infraScore
    ) external onlyOwner {
        require(IRealEstateCore(coreContract).projectToTokenId(projectId) != 0, "Project does not exist");
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

    // 가중치 업데이트
    function updateWeights(
        string memory projectId,
        uint256 chainlinkWeight,
        uint256 customWeight,
        uint256 baseWeight
    ) external onlyOwner {
        require(IRealEstateCore(coreContract).projectToTokenId(projectId) != 0, "Project does not exist");
        require(chainlinkWeight + customWeight + baseWeight == 100, "Weights must sum to 100");
        
        projectWeights[projectId] = IndexWeights({
            chainlinkWeight: chainlinkWeight,
            customWeight: customWeight,
            baseWeight: baseWeight
        });

        emit WeightsUpdated(projectId, chainlinkWeight, customWeight, baseWeight);
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

    // 현재 토큰 가격 계산 (메인 함수)
    function getCurrentTokenPrice(string memory projectId) external view returns (uint256) {
        IRealEstateCore.Project memory project = IRealEstateCore(coreContract).getProject(projectId);
        
        // 기본 가격만 사용하는 경우
        if (!project.useDynamicPricing) {
            return project.basePrice;
        }

        // 하이브리드 지표를 사용하는 경우
        if (project.useHybridIndex) {
            return calculateHybridPrice(projectId);
        }

        // 단순 체인링크 피드만 사용하는 경우
        if (project.priceFeed != address(0)) {
            int256 latestPrice = getLatestPrice(project.priceFeed);
            require(latestPrice > 0, "Invalid price from feed");
            return (project.basePrice * uint256(latestPrice)) / 1e8;
        }
        
        return project.basePrice;
    }

    // 하이브리드 가격 계산
    function calculateHybridPrice(string memory projectId) public view returns (uint256) {
        IRealEstateCore.Project memory project = IRealEstateCore(coreContract).getProject(projectId);
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
        
        return finalPrice;
    }

    // AI 강화 가격 계산
    function getAIEnhancedPrice(string memory projectId) external view returns (uint256) {
        IRealEstateCore.Project memory project = IRealEstateCore(coreContract).getProject(projectId);
        
        // AI 모듈이 설정되지 않은 경우 기본 가격 반환
        if (aiModule == address(0)) {
            return this.getCurrentTokenPrice(projectId);
        }
        
        IAIModule.AIPrediction memory aiPrediction = IAIModule(aiModule).getAIPrediction(projectId);
        
        // AI 예측이 비활성화되어 있거나 너무 오래된 경우 기본 하이브리드 가격 사용
        if (!aiPrediction.isActive || 
            (block.timestamp - aiPrediction.timestamp) > 24 hours ||
            aiPrediction.confidenceScore < 60) {
            return this.getCurrentTokenPrice(projectId);
        }
        
        // 기본 하이브리드 가격 계산
        uint256 hybridPrice = project.useHybridIndex ? 
            calculateHybridPrice(projectId) : 
            this.getCurrentTokenPrice(projectId);
        
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

    // 하이브리드 가격 계산 및 이벤트 발생 (non-view 함수)
    function calculateAndEmitHybridPrice(string memory projectId) external returns (uint256) {
        uint256 finalPrice = calculateHybridPrice(projectId);
        
        IRealEstateCore.Project memory project = IRealEstateCore(coreContract).getProject(projectId);
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

    // 커스텀 메트릭 조회
    function getCustomMetrics(string memory projectId) external view returns (CustomMetrics memory) {
        return projectCustomMetrics[projectId];
    }

    // 가중치 조회
    function getWeights(string memory projectId) external view returns (IndexWeights memory) {
        return projectWeights[projectId];
    }
}
