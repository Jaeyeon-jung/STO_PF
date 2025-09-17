// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface IPricingModule {
    function getCurrentTokenPrice(string memory projectId) external view returns (uint256);
    function getAIEnhancedPrice(string memory projectId) external view returns (uint256);
}

interface IDividendModule {
    function getProjectBaseDividendRate(string memory projectId) external view returns (uint256);
}

interface IAIModule {
    function getInvestmentGrade(string memory projectId) external view returns (string memory);
    function getAIPrediction(string memory projectId) external view returns (uint256, uint256, uint256, uint256);
}

contract RealEstateCore is Initializable, ERC1155Upgradeable, OwnableUpgradeable {
    
    // 프로젝트 정보 구조체 (간소화)
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

    // 매핑들
    mapping(string => uint256) public projectToTokenId;
    mapping(uint256 => Project) public tokenIdToProject;
    uint256 private _nextTokenId;
    
    // 모듈 주소들
    address public pricingModule;
    address public dividendModule;
    address public aiModule;
    
    // 이벤트
    event ProjectRegistered(string indexed projectId, uint256 tokenId, string name);
    event Investment(address indexed investor, string indexed projectId, uint256 amount, uint256 price);
    event ModuleUpdated(string indexed moduleName, address newAddress);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __ERC1155_init("https://api.realestate.example/token/{id}.json");
        __Ownable_init(msg.sender);
        _nextTokenId = 1;
    }

    // 모듈 주소 설정
    function setPricingModule(address _pricingModule) external onlyOwner {
        pricingModule = _pricingModule;
        emit ModuleUpdated("pricing", _pricingModule);
    }

    function setDividendModule(address _dividendModule) external onlyOwner {
        dividendModule = _dividendModule;
        emit ModuleUpdated("dividend", _dividendModule);
    }

    function setAIModule(address _aiModule) external onlyOwner {
        aiModule = _aiModule;
        emit ModuleUpdated("ai", _aiModule);
    }

    // 프로젝트 등록 (간소화)
    function registerProject(
        string memory projectId,
        string memory name,
        string memory location,
        uint256 basePrice,
        uint256 totalSupply
    ) external onlyOwner {
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
            priceFeed: address(0),
            useDynamicPricing: false,
            useHybridIndex: false
        });
        
        tokenIdToProject[tokenId] = newProject;
        _mint(msg.sender, tokenId, totalSupply, "");
        
        emit ProjectRegistered(projectId, tokenId, name);
    }

    // 하이브리드 프로젝트 등록
    function registerHybridProject(
        string memory projectId,
        string memory name,
        string memory location,
        uint256 basePrice,
        uint256 totalSupply,
        address priceFeedAddress
    ) external onlyOwner {
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
            useDynamicPricing: true,
            useHybridIndex: true
        });
        
        tokenIdToProject[tokenId] = newProject;
        _mint(msg.sender, tokenId, totalSupply, "");
        
        emit ProjectRegistered(projectId, tokenId, name);
    }

    // 투자 함수 (핵심 기능)
    function invest(string memory projectId, uint256 amount) external payable {
        uint256 tokenId = projectToTokenId[projectId];
        require(tokenId != 0, "Project does not exist");
        require(tokenIdToProject[tokenId].isActive, "Project is not active");
        
        // 가격 계산은 PricingModule에 위임
        uint256 currentPrice = _getCurrentPrice(projectId);
        uint256 totalPrice = currentPrice * amount;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // 토큰 전송
        safeTransferFrom(owner(), msg.sender, tokenId, amount, "");
        
        // 초과 지불 반환
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        // 판매 대금 전송
        payable(owner()).transfer(totalPrice);
        
        emit Investment(msg.sender, projectId, amount, currentPrice);
    }

    // 내부 가격 계산 함수
    function _getCurrentPrice(string memory projectId) internal view returns (uint256) {
        if (pricingModule != address(0)) {
            return IPricingModule(pricingModule).getCurrentTokenPrice(projectId);
        }
        
        // fallback: 기본 가격 사용
        uint256 tokenId = projectToTokenId[projectId];
        return tokenIdToProject[tokenId].basePrice;
    }

    // 프로젝트 정보 조회
    function getProject(string memory projectId) external view returns (Project memory) {
        uint256 tokenId = projectToTokenId[projectId];
        require(tokenId != 0, "Project does not exist");
        return tokenIdToProject[tokenId];
    }

    // 토큰 잔액 조회
    function getBalance(string memory projectId, address account) external view returns (uint256) {
        uint256 tokenId = projectToTokenId[projectId];
        require(tokenId != 0, "Project does not exist");
        return balanceOf(account, tokenId);
    }

    // 종합 정보 조회 (모든 모듈 정보 통합)
    function getProjectWithAllInfo(string memory projectId) external view returns (
        Project memory project,
        uint256 currentPrice,
        uint256 aiEnhancedPrice,
        string memory investmentGrade,
        uint256 dividendRate
    ) {
        uint256 tokenId = projectToTokenId[projectId];
        require(tokenId != 0, "Project does not exist");
        
        project = tokenIdToProject[tokenId];
        
        // 각 모듈에서 정보 수집
        if (pricingModule != address(0)) {
            currentPrice = IPricingModule(pricingModule).getCurrentTokenPrice(projectId);
            aiEnhancedPrice = IPricingModule(pricingModule).getAIEnhancedPrice(projectId);
        } else {
            currentPrice = project.basePrice;
            aiEnhancedPrice = project.basePrice;
        }
        
        if (aiModule != address(0)) {
            investmentGrade = IAIModule(aiModule).getInvestmentGrade(projectId);
        } else {
            investmentGrade = "No AI Analysis";
        }
        
        if (dividendModule != address(0)) {
            dividendRate = IDividendModule(dividendModule).getProjectBaseDividendRate(projectId);
        }
    }

    // 프로젝트 상태 토글
    function toggleProjectStatus(string memory projectId) external onlyOwner {
        uint256 tokenId = projectToTokenId[projectId];
        require(tokenId != 0, "Project does not exist");
        tokenIdToProject[tokenId].isActive = !tokenIdToProject[tokenId].isActive;
    }

    // 기본 가격 업데이트
    function updateBasePrice(string memory projectId, uint256 newBasePrice) external onlyOwner {
        uint256 tokenId = projectToTokenId[projectId];
        require(tokenId != 0, "Project does not exist");
        tokenIdToProject[tokenId].basePrice = newBasePrice;
    }

    // No override needed for upgradeable contracts
}
