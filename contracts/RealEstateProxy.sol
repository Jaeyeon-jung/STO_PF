// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RealEstateProxy
 * @dev 업그레이드 가능한 투명 프록시를 사용한 부동산 토큰 시스템
 * 
 * 이 컨트랙트는 다음과 같은 업그레이드 가능한 아키텍처를 제공합니다:
 * 1. RealEstateCore - 핵심 ERC1155 및 투자 기능
 * 2. PricingModule - 가격 계산 로직
 * 3. DividendModule - 배당 시스템
 * 4. AIModule - AI 예측 기능
 */
contract RealEstateProxyManager is Ownable {
    
    // 프록시 및 관리자 컨트랙트들
    ProxyAdmin public proxyAdmin;
    TransparentUpgradeableProxy public coreProxy;
    TransparentUpgradeableProxy public pricingProxy;
    TransparentUpgradeableProxy public dividendProxy;
    TransparentUpgradeableProxy public aiProxy;
    
    // 현재 구현체 주소들
    address public currentCoreImplementation;
    address public currentPricingImplementation;
    address public currentDividendImplementation;
    address public currentAIImplementation;
    
    // 이벤트
    event ProxyDeployed(string indexed moduleName, address proxyAddress, address implementation);
    event ImplementationUpgraded(string indexed moduleName, address oldImplementation, address newImplementation);
    event ModulesConnected();

    constructor() Ownable(msg.sender) {
        // ProxyAdmin 배포
        proxyAdmin = new ProxyAdmin(msg.sender);
    }

    /**
     * @dev 모든 모듈의 프록시를 배포하고 초기화
     */
    function deployAllProxies(
        address coreImplementation,
        address pricingImplementation,
        address dividendImplementation,
        address aiImplementation
    ) external onlyOwner {
        require(address(coreProxy) == address(0), "Proxies already deployed");
        
        // Core 프록시 배포
        bytes memory coreInitData = abi.encodeWithSignature("initialize()");
        coreProxy = new TransparentUpgradeableProxy(
            coreImplementation,
            address(proxyAdmin),
            coreInitData
        );
        currentCoreImplementation = coreImplementation;
        emit ProxyDeployed("Core", address(coreProxy), coreImplementation);
        
        // Pricing 프록시 배포
        bytes memory pricingInitData = abi.encodeWithSignature("initialize(address)", address(coreProxy));
        pricingProxy = new TransparentUpgradeableProxy(
            pricingImplementation,
            address(proxyAdmin),
            pricingInitData
        );
        currentPricingImplementation = pricingImplementation;
        emit ProxyDeployed("Pricing", address(pricingProxy), pricingImplementation);
        
        // Dividend 프록시 배포
        bytes memory dividendInitData = abi.encodeWithSignature("initialize(address)", address(coreProxy));
        dividendProxy = new TransparentUpgradeableProxy(
            dividendImplementation,
            address(proxyAdmin),
            dividendInitData
        );
        currentDividendImplementation = dividendImplementation;
        emit ProxyDeployed("Dividend", address(dividendProxy), dividendImplementation);
        
        // AI 프록시 배포
        bytes memory aiInitData = abi.encodeWithSignature("initialize(address)", address(coreProxy));
        aiProxy = new TransparentUpgradeableProxy(
            aiImplementation,
            address(proxyAdmin),
            aiInitData
        );
        currentAIImplementation = aiImplementation;
        emit ProxyDeployed("AI", address(aiProxy), aiImplementation);
        
        // 모듈 간 연결 설정
        _connectModules();
        
        emit ModulesConnected();
    }

    /**
     * @dev Core 모듈 업그레이드
     */
    function upgradeCoreModule(address newImplementation) external onlyOwner {
        require(address(coreProxy) != address(0), "Core proxy not deployed");
        require(newImplementation != address(0), "Invalid implementation address");
        
        address oldImplementation = currentCoreImplementation;
        proxyAdmin.upgradeAndCall(
            ITransparentUpgradeableProxy(address(coreProxy)),
            newImplementation,
            ""
        );
        
        currentCoreImplementation = newImplementation;
        emit ImplementationUpgraded("Core", oldImplementation, newImplementation);
    }

    /**
     * @dev Pricing 모듈 업그레이드
     */
    function upgradePricingModule(address newImplementation) external onlyOwner {
        require(address(pricingProxy) != address(0), "Pricing proxy not deployed");
        require(newImplementation != address(0), "Invalid implementation address");
        
        address oldImplementation = currentPricingImplementation;
        proxyAdmin.upgradeAndCall(
            ITransparentUpgradeableProxy(address(pricingProxy)),
            newImplementation,
            ""
        );
        
        currentPricingImplementation = newImplementation;
        emit ImplementationUpgraded("Pricing", oldImplementation, newImplementation);
    }

    /**
     * @dev Dividend 모듈 업그레이드
     */
    function upgradeDividendModule(address newImplementation) external onlyOwner {
        require(address(dividendProxy) != address(0), "Dividend proxy not deployed");
        require(newImplementation != address(0), "Invalid implementation address");
        
        address oldImplementation = currentDividendImplementation;
        proxyAdmin.upgradeAndCall(
            ITransparentUpgradeableProxy(address(dividendProxy)),
            newImplementation,
            ""
        );
        
        currentDividendImplementation = newImplementation;
        emit ImplementationUpgraded("Dividend", oldImplementation, newImplementation);
    }

    /**
     * @dev AI 모듈 업그레이드
     */
    function upgradeAIModule(address newImplementation) external onlyOwner {
        require(address(aiProxy) != address(0), "AI proxy not deployed");
        require(newImplementation != address(0), "Invalid implementation address");
        
        address oldImplementation = currentAIImplementation;
        proxyAdmin.upgradeAndCall(
            ITransparentUpgradeableProxy(address(aiProxy)),
            newImplementation,
            ""
        );
        
        currentAIImplementation = newImplementation;
        emit ImplementationUpgraded("AI", oldImplementation, newImplementation);
    }

    /**
     * @dev 모든 모듈을 한 번에 업그레이드
     */
    function upgradeAllModules(
        address newCoreImplementation,
        address newPricingImplementation,
        address newDividendImplementation,
        address newAIImplementation
    ) external onlyOwner {
        if (newCoreImplementation != address(0)) {
            this.upgradeCoreModule(newCoreImplementation);
        }
        if (newPricingImplementation != address(0)) {
            this.upgradePricingModule(newPricingImplementation);
        }
        if (newDividendImplementation != address(0)) {
            this.upgradeDividendModule(newDividendImplementation);
        }
        if (newAIImplementation != address(0)) {
            this.upgradeAIModule(newAIImplementation);
        }
        
        // 업그레이드 후 모듈 재연결
        _connectModules();
    }

    /**
     * @dev 모듈 간 연결 설정
     */
    function _connectModules() internal {
        // Core에 다른 모듈들 연결
        (bool success1,) = address(coreProxy).call(
            abi.encodeWithSignature("setPricingModule(address)", address(pricingProxy))
        );
        (bool success2,) = address(coreProxy).call(
            abi.encodeWithSignature("setDividendModule(address)", address(dividendProxy))
        );
        (bool success3,) = address(coreProxy).call(
            abi.encodeWithSignature("setAIModule(address)", address(aiProxy))
        );
        
        // Pricing에 AI 모듈 연결
        (bool success4,) = address(pricingProxy).call(
            abi.encodeWithSignature("setAIModule(address)", address(aiProxy))
        );
        
        require(success1 && success2 && success3 && success4, "Failed to connect modules");
    }

    /**
     * @dev 수동으로 모듈 연결 재설정
     */
    function reconnectModules() external onlyOwner {
        _connectModules();
        emit ModulesConnected();
    }

    /**
     * @dev 프록시 관리자 권한 이전
     */
    function transferProxyAdminOwnership(address newOwner) external onlyOwner {
        proxyAdmin.transferOwnership(newOwner);
    }

    /**
     * @dev 현재 구현체 주소들 조회
     */
    function getAllImplementations() external view returns (
        address core,
        address pricing,
        address dividend,
        address ai
    ) {
        return (
            currentCoreImplementation,
            currentPricingImplementation,
            currentDividendImplementation,
            currentAIImplementation
        );
    }

    /**
     * @dev 모든 프록시 주소들 조회
     */
    function getAllProxies() external view returns (
        address core,
        address pricing,
        address dividend,
        address ai
    ) {
        return (
            address(coreProxy),
            address(pricingProxy),
            address(dividendProxy),
            address(aiProxy)
        );
    }

    /**
     * @dev 시스템 상태 확인
     */
    function getSystemStatus() external view returns (
        bool isDeployed,
        bool isConnected,
        uint256 totalModules
    ) {
        isDeployed = address(coreProxy) != address(0) && 
                    address(pricingProxy) != address(0) && 
                    address(dividendProxy) != address(0) && 
                    address(aiProxy) != address(0);
        
        // 연결 상태는 간단한 호출로 확인 (실제로는 더 정교한 검증 필요)
        isConnected = isDeployed; // 단순화
        
        totalModules = 4; // Core, Pricing, Dividend, AI
    }

    /**
     * @dev 긴급 상황시 모든 모듈 일시 정지 (각 모듈에 pause 기능이 있다면)
     */
    function emergencyPause() external onlyOwner {
        // 각 모듈이 Pausable을 구현한 경우 호출
        (bool success1,) = address(coreProxy).call(abi.encodeWithSignature("pause()"));
        (bool success2,) = address(pricingProxy).call(abi.encodeWithSignature("pause()"));
        (bool success3,) = address(dividendProxy).call(abi.encodeWithSignature("pause()"));
        (bool success4,) = address(aiProxy).call(abi.encodeWithSignature("pause()"));
        
        // 실패해도 계속 진행 (일부 모듈은 pause 기능이 없을 수 있음)
    }

    /**
     * @dev 모든 모듈 재개
     */
    function emergencyUnpause() external onlyOwner {
        (bool success1,) = address(coreProxy).call(abi.encodeWithSignature("unpause()"));
        (bool success2,) = address(pricingProxy).call(abi.encodeWithSignature("unpause()"));
        (bool success3,) = address(dividendProxy).call(abi.encodeWithSignature("unpause()"));
        (bool success4,) = address(aiProxy).call(abi.encodeWithSignature("unpause()"));
    }
}
