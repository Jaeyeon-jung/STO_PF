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

contract AdvancedPricingModule is Initializable, OwnableUpgradeable {
    
    // 다양한 체인링크 지표 타입
    enum IndicatorType {
        CRYPTO,      // 암호화폐 (ETH, BTC)
        STOCK,       // 주식 지수 (S&P500, NASDAQ)
        COMMODITY,   // 상품 (금, 은, 원유)
        FOREX,       // 환율 (USD/KRW, EUR/USD)
        ECONOMIC,    // 경제 지표 (금리, 인플레이션)
        REAL_ESTATE  // 부동산 지수
    }
    
    // 체인링크 지표 정보
    struct ChainlinkIndicator {
        address feedAddress;
        IndicatorType indicatorType;
        uint256 weight;        // 가중치 (0-100)
        bool isActive;
        string description;
        uint256 lastUpdated;
    }
    
    // 프로젝트별 다중 지표 설정
    struct MultiIndicatorConfig {
        address[] indicatorAddresses;
        uint256[] indicatorWeights;
        uint256 totalWeight;
        bool useEconomicAdjustment;
        bool useVolatilityAdjustment;
    }
    
    // 경제 지표 기반 조정 계수
    struct EconomicAdjustment {
        uint256 inflationMultiplier;    // 인플레이션 조정 (basis points)
        uint256 interestRateMultiplier; // 금리 조정 (basis points)
        uint256 marketSentimentMultiplier; // 시장 심리 조정 (basis points)
        uint256 volatilityMultiplier;   // 변동성 조정 (basis points)
    }
    
    // 상태 변수들
    address public coreContract;
    mapping(string => MultiIndicatorConfig) public projectIndicatorConfigs;
    mapping(address => ChainlinkIndicator) public indicators;
    mapping(string => EconomicAdjustment) public projectEconomicAdjustments;
    
    // 이벤트
    event IndicatorAdded(address indexed feedAddress, IndicatorType indicatorType, string description);
    event ProjectIndicatorsUpdated(string indexed projectId, address[] indicators, uint256[] weights);
    event EconomicAdjustmentUpdated(string indexed projectId, EconomicAdjustment adjustment);
    event AdvancedPriceCalculated(string indexed projectId, uint256 finalPrice, uint256[] indicatorPrices, EconomicAdjustment adjustment);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _coreContract) public initializer {
        __Ownable_init(msg.sender);
        coreContract = _coreContract;
    }

    // 체인링크 지표 등록
    function addIndicator(
        address feedAddress,
        IndicatorType indicatorType,
        string memory description
    ) external onlyOwner {
        indicators[feedAddress] = ChainlinkIndicator({
            feedAddress: feedAddress,
            indicatorType: indicatorType,
            weight: 0,
            isActive: true,
            description: description,
            lastUpdated: block.timestamp
        });
        
        emit IndicatorAdded(feedAddress, indicatorType, description);
    }

    // 프로젝트별 다중 지표 설정
    function setProjectIndicators(
        string memory projectId,
        address[] memory indicatorAddresses,
        uint256[] memory indicatorWeights,
        bool useEconomicAdjustment,
        bool useVolatilityAdjustment
    ) external onlyOwner {
        require(IRealEstateCore(coreContract).projectToTokenId(projectId) != 0, "Project does not exist");
        require(indicatorAddresses.length == indicatorWeights.length, "Arrays length mismatch");
        
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < indicatorWeights.length; i++) {
            require(indicators[indicatorAddresses[i]].isActive, "Indicator not active");
            totalWeight += indicatorWeights[i];
        }
        require(totalWeight == 100, "Total weight must be 100");
        
        projectIndicatorConfigs[projectId] = MultiIndicatorConfig({
            indicatorAddresses: indicatorAddresses,
            indicatorWeights: indicatorWeights,
            totalWeight: totalWeight,
            useEconomicAdjustment: useEconomicAdjustment,
            useVolatilityAdjustment: useVolatilityAdjustment
        });
        
        emit ProjectIndicatorsUpdated(projectId, indicatorAddresses, indicatorWeights);
    }

    // 경제 조정 계수 설정
    function setEconomicAdjustment(
        string memory projectId,
        uint256 inflationMultiplier,
        uint256 interestRateMultiplier,
        uint256 marketSentimentMultiplier,
        uint256 volatilityMultiplier
    ) external onlyOwner {
        require(IRealEstateCore(coreContract).projectToTokenId(projectId) != 0, "Project does not exist");
        
        projectEconomicAdjustments[projectId] = EconomicAdjustment({
            inflationMultiplier: inflationMultiplier,
            interestRateMultiplier: interestRateMultiplier,
            marketSentimentMultiplier: marketSentimentMultiplier,
            volatilityMultiplier: volatilityMultiplier
        });
        
        emit EconomicAdjustmentUpdated(projectId, projectEconomicAdjustments[projectId]);
    }

    // 단일 지표에서 데이터 조회
    function getIndicatorValue(address feedAddress) public view returns (int256) {
        require(feedAddress != address(0), "Feed address not set");
        require(indicators[feedAddress].isActive, "Indicator not active");
        
        AggregatorV3Interface feedContract = AggregatorV3Interface(feedAddress);
        (, int256 value, , , ) = feedContract.latestRoundData();
        
        return value;
    }

    // 다중 지표 기반 가격 계산
    function getMultiIndicatorPrice(string memory projectId) external view returns (uint256) {
        IRealEstateCore.Project memory project = IRealEstateCore(coreContract).getProject(projectId);
        MultiIndicatorConfig memory config = projectIndicatorConfigs[projectId];
        
        if (config.indicatorAddresses.length == 0) {
            return project.basePrice;
        }
        
        uint256[] memory indicatorValues = new uint256[](config.indicatorAddresses.length);
        uint256 totalWeightedValue = 0;
        
        for (uint256 i = 0; i < config.indicatorAddresses.length; i++) {
            int256 latestValue = getIndicatorValue(config.indicatorAddresses[i]);
            require(latestValue > 0, "Invalid value from indicator");
            
            // 8자리 소수점으로 정규화
            uint256 normalizedValue = uint256(latestValue);
            indicatorValues[i] = normalizedValue;
            
            // 가중 평균 계산
            totalWeightedValue += (normalizedValue * config.indicatorWeights[i]) / 100;
        }
        
        // 기본 가격에 정규화된 지표값을 적용
        uint256 basePrice = project.basePrice;
        uint256 indicatorAdjustedPrice = (basePrice * totalWeightedValue) / 1e8;
        
        // 경제 조정 적용
        if (config.useEconomicAdjustment) {
            indicatorAdjustedPrice = applyEconomicAdjustment(projectId, indicatorAdjustedPrice);
        }
        
        return indicatorAdjustedPrice;
    }

    // 경제 조정 적용
    function applyEconomicAdjustment(string memory projectId, uint256 basePrice) internal view returns (uint256) {
        EconomicAdjustment memory adjustment = projectEconomicAdjustments[projectId];
        uint256 adjustedPrice = basePrice;
        
        // 인플레이션 조정 (금 가격 기반)
        if (adjustment.inflationMultiplier > 0) {
            // 금 가격이 높으면 인플레이션 상승으로 가격 상승
            // 실제로는 금 가격 피드를 사용해야 함
            adjustedPrice = (adjustedPrice * (10000 + adjustment.inflationMultiplier)) / 10000;
        }
        
        // 금리 조정 (S&P500 기반)
        if (adjustment.interestRateMultiplier > 0) {
            // S&P500가 낮으면 금리 상승으로 가격 하락
            // 실제로는 S&P500 피드를 사용해야 함
            adjustedPrice = (adjustedPrice * (10000 - adjustment.interestRateMultiplier)) / 10000;
        }
        
        // 시장 심리 조정 (변동성 기반)
        if (adjustment.marketSentimentMultiplier > 0) {
            // 변동성이 높으면 불안정성으로 가격 하락
            adjustedPrice = (adjustedPrice * (10000 - adjustment.marketSentimentMultiplier)) / 10000;
        }
        
        return adjustedPrice;
    }

    // 프로젝트 타입별 맞춤형 가격 계산
    function getProjectTypeSpecificPrice(
        string memory projectId, 
        string memory projectType
    ) external view returns (uint256) {
        IRealEstateCore.Project memory project = IRealEstateCore(coreContract).getProject(projectId);
        MultiIndicatorConfig memory config = projectIndicatorConfigs[projectId];
        
        uint256 basePrice = project.basePrice;
        
        // 프로젝트 타입별 다른 지표 조합 사용
        if (keccak256(abi.encodePacked(projectType)) == keccak256(abi.encodePacked("commercial"))) {
            // 상업용 부동산: S&P500, 금리, 환율에 민감
            return calculateCommercialPrice(projectId, basePrice, config);
        } else if (keccak256(abi.encodePacked(projectType)) == keccak256(abi.encodePacked("residential"))) {
            // 주거용 부동산: 인플레이션, 금리에 민감
            return calculateResidentialPrice(projectId, basePrice, config);
        } else if (keccak256(abi.encodePacked(projectType)) == keccak256(abi.encodePacked("industrial"))) {
            // 산업용 부동산: 원유, 건설 자재에 민감
            return calculateIndustrialPrice(projectId, basePrice, config);
        }
        
        return basePrice;
    }

    // 상업용 부동산 가격 계산
    function calculateCommercialPrice(
        string memory projectId, 
        uint256 basePrice, 
        MultiIndicatorConfig memory config
    ) internal view returns (uint256) {
        uint256 adjustedPrice = basePrice;
        
        // S&P500 지수 반영 (경기 상황)
        for (uint256 i = 0; i < config.indicatorAddresses.length; i++) {
            if (indicators[config.indicatorAddresses[i]].indicatorType == IndicatorType.STOCK) {
                int256 sp500Value = getIndicatorValue(config.indicatorAddresses[i]);
                if (sp500Value > 0) {
                    // S&P500가 4000 이상이면 5% 상승, 3000 이하면 5% 하락
                    if (sp500Value >= 4000 * 1e8) {
                        adjustedPrice = (adjustedPrice * 105) / 100;
                    } else if (sp500Value <= 3000 * 1e8) {
                        adjustedPrice = (adjustedPrice * 95) / 100;
                    }
                }
            }
        }
        
        // 환율 반영 (국제 투자자)
        for (uint256 i = 0; i < config.indicatorAddresses.length; i++) {
            if (indicators[config.indicatorAddresses[i]].indicatorType == IndicatorType.FOREX) {
                int256 forexValue = getIndicatorValue(config.indicatorAddresses[i]);
                if (forexValue > 0) {
                    // USD/KRW 환율이 1300 이상이면 3% 할인 (한국 투자자 유치)
                    if (forexValue >= 1300 * 1e8) {
                        adjustedPrice = (adjustedPrice * 97) / 100;
                    }
                }
            }
        }
        
        return adjustedPrice;
    }

    // 주거용 부동산 가격 계산
    function calculateResidentialPrice(
        string memory projectId, 
        uint256 basePrice, 
        MultiIndicatorConfig memory config
    ) internal view returns (uint256) {
        uint256 adjustedPrice = basePrice;
        
        // 금 가격 반영 (인플레이션)
        for (uint256 i = 0; i < config.indicatorAddresses.length; i++) {
            if (indicators[config.indicatorAddresses[i]].indicatorType == IndicatorType.COMMODITY) {
                int256 goldValue = getIndicatorValue(config.indicatorAddresses[i]);
                if (goldValue > 0) {
                    // 금 가격이 2000 이상이면 인플레이션 상승으로 가격 상승
                    if (goldValue >= 2000 * 1e8) {
                        adjustedPrice = (adjustedPrice * 103) / 100;
                    }
                }
            }
        }
        
        return adjustedPrice;
    }

    // 산업용 부동산 가격 계산
    function calculateIndustrialPrice(
        string memory projectId, 
        uint256 basePrice, 
        MultiIndicatorConfig memory config
    ) internal view returns (uint256) {
        uint256 adjustedPrice = basePrice;
        
        // 원유 가격 반영 (에너지 비용)
        for (uint256 i = 0; i < config.indicatorAddresses.length; i++) {
            if (indicators[config.indicatorAddresses[i]].indicatorType == IndicatorType.COMMODITY) {
                int256 oilValue = getIndicatorValue(config.indicatorAddresses[i]);
                if (oilValue > 0) {
                    // 원유 가격이 80 이상이면 에너지 비용 상승으로 가격 하락
                    if (oilValue >= 80 * 1e8) {
                        adjustedPrice = (adjustedPrice * 98) / 100;
                    }
                }
            }
        }
        
        return adjustedPrice;
    }

    // 변동성 기반 가격 조정
    function applyVolatilityAdjustment(
        string memory projectId, 
        uint256 basePrice
    ) external view returns (uint256) {
        MultiIndicatorConfig memory config = projectIndicatorConfigs[projectId];
        
        if (!config.useVolatilityAdjustment) {
            return basePrice;
        }
        
        uint256 totalVolatility = 0;
        uint256 activeIndicators = 0;
        
        // 모든 지표의 변동성 계산
        for (uint256 i = 0; i < config.indicatorAddresses.length; i++) {
            int256 currentValue = getIndicatorValue(config.indicatorAddresses[i]);
            if (currentValue > 0) {
                // 간단한 변동성 계산 (실제로는 더 복잡한 계산 필요)
                totalVolatility += uint256(currentValue) / 1e6; // 변동성 지수
                activeIndicators++;
            }
        }
        
        if (activeIndicators == 0) return basePrice;
        
        uint256 avgVolatility = totalVolatility / activeIndicators;
        
        // 변동성이 높으면 가격 하락
        if (avgVolatility > 50) {
            return (basePrice * 95) / 100; // 5% 할인
        } else if (avgVolatility > 30) {
            return (basePrice * 98) / 100; // 2% 할인
        }
        
        return basePrice;
    }

    // 프로젝트 지표 설정 조회
    function getProjectIndicatorConfig(string memory projectId) external view returns (
        address[] memory indicatorAddresses,
        uint256[] memory indicatorWeights,
        IndicatorType[] memory indicatorTypes,
        string[] memory descriptions
    ) {
        MultiIndicatorConfig memory config = projectIndicatorConfigs[projectId];
        
        indicatorAddresses = config.indicatorAddresses;
        indicatorWeights = config.indicatorWeights;
        indicatorTypes = new IndicatorType[](config.indicatorAddresses.length);
        descriptions = new string[](config.indicatorAddresses.length);
        
        for (uint256 i = 0; i < config.indicatorAddresses.length; i++) {
            ChainlinkIndicator memory indicator = indicators[config.indicatorAddresses[i]];
            indicatorTypes[i] = indicator.indicatorType;
            descriptions[i] = indicator.description;
        }
    }
}
