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

contract ExtendedPricingModule is Initializable, OwnableUpgradeable {
    
    // 다양한 데이터 피드 타입
    enum FeedType {
        CRYPTO,      // 암호화폐
        STOCK,       // 주식
        COMMODITY,   // 상품
        FOREX,       // 환율
        REAL_ESTATE, // 부동산
        ECONOMIC     // 경제지표
    }
    
    // 데이터 피드 정보 구조체
    struct FeedInfo {
        address feedAddress;
        FeedType feedType;
        uint256 weight;        // 가중치 (0-100)
        bool isActive;
        string description;
    }
    
    // 프로젝트별 다중 피드 설정
    struct MultiFeedConfig {
        address[] feedAddresses;
        uint256[] feedWeights;
        uint256 totalWeight;
    }
    
    // 상태 변수들
    address public coreContract;
    mapping(string => MultiFeedConfig) public projectFeedConfigs;
    mapping(address => FeedInfo) public feedInfos;
    
    // 이벤트
    event FeedAdded(address indexed feedAddress, FeedType feedType, string description);
    event ProjectFeedUpdated(string indexed projectId, address[] feeds, uint256[] weights);
    event MultiFeedPriceCalculated(string indexed projectId, uint256 finalPrice, uint256[] feedPrices);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _coreContract) public initializer {
        __Ownable_init(msg.sender);
        coreContract = _coreContract;
    }

    // 데이터 피드 등록
    function addFeed(
        address feedAddress,
        FeedType feedType,
        string memory description
    ) external onlyOwner {
        feedInfos[feedAddress] = FeedInfo({
            feedAddress: feedAddress,
            feedType: feedType,
            weight: 0,
            isActive: true,
            description: description
        });
        
        emit FeedAdded(feedAddress, feedType, description);
    }

    // 프로젝트별 다중 피드 설정
    function setProjectFeeds(
        string memory projectId,
        address[] memory feedAddresses,
        uint256[] memory feedWeights
    ) external onlyOwner {
        require(IRealEstateCore(coreContract).projectToTokenId(projectId) != 0, "Project does not exist");
        require(feedAddresses.length == feedWeights.length, "Arrays length mismatch");
        
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < feedWeights.length; i++) {
            require(feedInfos[feedAddresses[i]].isActive, "Feed not active");
            totalWeight += feedWeights[i];
        }
        require(totalWeight == 100, "Total weight must be 100");
        
        projectFeedConfigs[projectId] = MultiFeedConfig({
            feedAddresses: feedAddresses,
            feedWeights: feedWeights,
            totalWeight: totalWeight
        });
        
        emit ProjectFeedUpdated(projectId, feedAddresses, feedWeights);
    }

    // 단일 피드에서 가격 조회
    function getLatestPrice(address priceFeed) public view returns (int256) {
        require(priceFeed != address(0), "Price feed address not set");
        require(feedInfos[priceFeed].isActive, "Feed not active");
        
        AggregatorV3Interface priceFeedContract = AggregatorV3Interface(priceFeed);
        (, int256 price, , , ) = priceFeedContract.latestRoundData();
        
        return price;
    }

    // 다중 피드를 사용한 가격 계산
    function getMultiFeedPrice(string memory projectId) external view returns (uint256) {
        IRealEstateCore.Project memory project = IRealEstateCore(coreContract).getProject(projectId);
        MultiFeedConfig memory config = projectFeedConfigs[projectId];
        
        if (config.feedAddresses.length == 0) {
            return project.basePrice;
        }
        
        uint256[] memory feedPrices = new uint256[](config.feedAddresses.length);
        uint256 totalWeightedPrice = 0;
        
        for (uint256 i = 0; i < config.feedAddresses.length; i++) {
            int256 latestPrice = getLatestPrice(config.feedAddresses[i]);
            require(latestPrice > 0, "Invalid price from feed");
            
            // 가격을 8자리 소수점으로 정규화
            uint256 normalizedPrice = uint256(latestPrice);
            feedPrices[i] = normalizedPrice;
            
            // 가중 평균 계산
            totalWeightedPrice += (normalizedPrice * config.feedWeights[i]) / 100;
        }
        
        // 기본 가격에 정규화된 가격을 적용
        uint256 finalPrice = (project.basePrice * totalWeightedPrice) / 1e8;
        
        return finalPrice;
    }

    // 특정 피드 타입별 가격 조회
    function getPriceByType(string memory projectId, FeedType feedType) external view returns (uint256) {
        MultiFeedConfig memory config = projectFeedConfigs[projectId];
        IRealEstateCore.Project memory project = IRealEstateCore(coreContract).getProject(projectId);
        
        uint256 totalWeight = 0;
        uint256 weightedPrice = 0;
        
        for (uint256 i = 0; i < config.feedAddresses.length; i++) {
            if (feedInfos[config.feedAddresses[i]].feedType == feedType) {
                int256 latestPrice = getLatestPrice(config.feedAddresses[i]);
                if (latestPrice > 0) {
                    uint256 normalizedPrice = uint256(latestPrice);
                    weightedPrice += (normalizedPrice * config.feedWeights[i]);
                    totalWeight += config.feedWeights[i];
                }
            }
        }
        
        if (totalWeight == 0) {
            return project.basePrice;
        }
        
        return (project.basePrice * weightedPrice) / (totalWeight * 1e8);
    }

    // 경제 지표 기반 가격 조정
    function getEconomicAdjustedPrice(string memory projectId) external view returns (uint256) {
        IRealEstateCore.Project memory project = IRealEstateCore(coreContract).getProject(projectId);
        
        // S&P500 지수 조회 (경기 상황 반영)
        address sp500Feed = 0x83d350e7Bdc0C43f8C4c9f4030335a4F2fE54D3d; // 예시 주소
        int256 sp500Price = getLatestPrice(sp500Feed);
        
        // 금 가격 조회 (안전자산 선호도)
        address goldFeed = 0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6; // 예시 주소
        int256 goldPrice = getLatestPrice(goldFeed);
        
        // 기본 가격
        uint256 basePrice = project.basePrice;
        
        // S&P500 기반 조정 (경기 호황 시 가격 상승)
        if (sp500Price > 0) {
            // S&P500가 4000 이상이면 5% 상승, 3000 이하면 5% 하락
            if (sp500Price >= 4000 * 1e8) {
                basePrice = (basePrice * 105) / 100;
            } else if (sp500Price <= 3000 * 1e8) {
                basePrice = (basePrice * 95) / 100;
            }
        }
        
        // 금 가격 기반 조정 (불안정성 반영)
        if (goldPrice > 0) {
            // 금 가격이 높으면 불안정성 증가로 가격 하락
            if (goldPrice >= 2000 * 1e8) {
                basePrice = (basePrice * 98) / 100;
            }
        }
        
        return basePrice;
    }

    // 환율 기반 국제 투자자 가격 조정
    function getForexAdjustedPrice(string memory projectId, address forexFeed) external view returns (uint256) {
        IRealEstateCore.Project memory project = IRealEstateCore(coreContract).getProject(projectId);
        
        int256 forexRate = getLatestPrice(forexFeed);
        require(forexRate > 0, "Invalid forex rate");
        
        // 환율이 강세면 (USD 대비) 투자 매력도 증가
        uint256 adjustedPrice = project.basePrice;
        
        // 예: USD/KRW 환율이 1300 이상이면 3% 할인 (한국 투자자 유치)
        if (forexRate >= 1300 * 1e8) {
            adjustedPrice = (adjustedPrice * 97) / 100;
        }
        
        return adjustedPrice;
    }

    // 프로젝트 피드 설정 조회
    function getProjectFeedConfig(string memory projectId) external view returns (
        address[] memory feedAddresses,
        uint256[] memory feedWeights,
        FeedType[] memory feedTypes,
        string[] memory descriptions
    ) {
        MultiFeedConfig memory config = projectFeedConfigs[projectId];
        
        feedAddresses = config.feedAddresses;
        feedWeights = config.feedWeights;
        feedTypes = new FeedType[](config.feedAddresses.length);
        descriptions = new string[](config.feedAddresses.length);
        
        for (uint256 i = 0; i < config.feedAddresses.length; i++) {
            FeedInfo memory info = feedInfos[config.feedAddresses[i]];
            feedTypes[i] = info.feedType;
            descriptions[i] = info.description;
        }
    }
}
