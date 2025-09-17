// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface IRealEstateCore {
    function projectToTokenId(string memory projectId) external view returns (uint256);
}

contract DividendModule is Initializable, OwnableUpgradeable {
    
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

    // 상태 변수들
    address public coreContract;
    
    // 프로젝트별 배당 기록 저장
    mapping(string => DividendRecord[]) public projectDividendHistory;
    
    // 프로젝트별 현재 기본 배당률 (basis points)
    mapping(string => uint256) public projectBaseDividendRate;

    // 이벤트
    event DividendEventTriggered(
        string indexed projectId,
        DividendEventType eventType,
        string description,
        uint256 adjustment,
        uint256 newYield
    );

    event MonthlyDividendRecorded(
        string indexed projectId,
        uint256 month,
        uint256 year,
        uint256 yield,
        uint256 cumulativeYield
    );

    event BaseDividendRateUpdated(string indexed projectId, uint256 newRate);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _coreContract) public initializer {
        __Ownable_init(msg.sender);
        coreContract = _coreContract;
    }

    // 기본 배당률 설정
    function setBaseDividendRate(string memory projectId, uint256 rateInBasisPoints) external onlyOwner {
        require(IRealEstateCore(coreContract).projectToTokenId(projectId) != 0, "Project does not exist");
        require(rateInBasisPoints <= 2000, "Rate cannot exceed 20%"); // 최대 20%
        
        projectBaseDividendRate[projectId] = rateInBasisPoints;
        emit BaseDividendRateUpdated(projectId, rateInBasisPoints);
    }

    // 배당 이벤트 트리거
    function triggerDividendEvent(
        string memory projectId,
        DividendEventType eventType,
        string memory description,
        int256 adjustmentInBasisPoints // 음수 가능 (악재의 경우)
    ) external onlyOwner {
        require(IRealEstateCore(coreContract).projectToTokenId(projectId) != 0, "Project does not exist");
        require(adjustmentInBasisPoints >= -1000 && adjustmentInBasisPoints <= 1000, "Adjustment too large");

        uint256 baseRate = projectBaseDividendRate[projectId];
        if (baseRate == 0) {
            baseRate = 50; // 기본값 0.5%
        }

        // 조정값 적용 (음수 처리 포함)
        uint256 finalRate = _calculateFinalRate(baseRate, adjustmentInBasisPoints);

        // 현재 월/년 계산
        (uint256 month, uint256 year) = _getCurrentMonthYear();

        // 배당 기록 저장
        _recordDividend(projectId, month, year, baseRate, adjustmentInBasisPoints, finalRate, eventType, description);

        emit DividendEventTriggered(projectId, eventType, description, uint256(adjustmentInBasisPoints), finalRate);
    }

    // 특정 월에 배당 이벤트 트리거 (시뮬레이션용)
    function triggerDividendEventWithTime(
        string memory projectId,
        DividendEventType eventType,
        string memory description,
        int256 adjustmentInBasisPoints,
        uint256 targetMonth
    ) external onlyOwner {
        require(IRealEstateCore(coreContract).projectToTokenId(projectId) != 0, "Project does not exist");
        require(adjustmentInBasisPoints >= -1000 && adjustmentInBasisPoints <= 1000, "Adjustment too large");
        require(targetMonth >= 1 && targetMonth <= 12, "Invalid month");

        uint256 baseRate = projectBaseDividendRate[projectId];
        if (baseRate == 0) {
            baseRate = 50; // 기본값 0.5%
        }

        uint256 finalRate = _calculateFinalRate(baseRate, adjustmentInBasisPoints);

        // 배당 기록 저장 (지정된 월 사용)
        _recordDividend(projectId, targetMonth, 2025, baseRate, adjustmentInBasisPoints, finalRate, eventType, description);

        emit DividendEventTriggered(projectId, eventType, description, uint256(adjustmentInBasisPoints), finalRate);
    }

    // 자동 시장 이벤트 시뮬레이션
    function simulateMarketEvents(string memory projectId) external onlyOwner {
        // 호재 이벤트들
        string[7] memory positiveEvents = [
            "New shopping mall opening boosts rental demand",
            "Subway extension confirmed improving accessibility", 
            "Government announces real estate deregulation",
            "Surrounding area redevelopment project approved",
            "Major corporation headquarters relocation increases foot traffic",
            "Tourism zone designation enhances commercial value",
            "Successful 10% rental rate increase above market"
        ];

        // 악재 이벤트들
        string[5] memory negativeEvents = [
            "COVID-19 resurgence reduces commercial facility usage",
            "Interest rate hikes shrink real estate market",
            "Building aging requires major renovation work",
            "Economic recession increases rental delinquency",
            "New environmental regulations raise operating costs"
        ];

        // 12개월 다양한 이벤트 생성
        for (uint i = 0; i < 12; i++) {
            bool isPositive = (block.timestamp + i * 1000) % 3 != 0; // 2/3 확률로 호재
            
            if (isPositive) {
                uint256 eventIndex = (block.timestamp + i * 1000) % 7;
                int256 adjustment = int256(15 + ((block.timestamp + i * 1000) % 35)); // +15~50 basis points
                
                this.triggerDividendEventWithTime(
                    projectId,
                    DividendEventType.POSITIVE_NEWS,
                    positiveEvents[eventIndex],
                    adjustment,
                    i + 1 // 월 (1-12)
                );
            } else {
                uint256 eventIndex = (block.timestamp + i * 1000) % 5;
                int256 adjustment = -int256(5 + ((block.timestamp + i * 1000) % 25)); // -5~30 basis points
                
                this.triggerDividendEventWithTime(
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
    function getDividendHistory(string memory projectId) external view returns (DividendRecord[] memory) {
        return projectDividendHistory[projectId];
    }

    // 최근 12개월 배당 요약 조회
    function getRecentDividendSummary(string memory projectId) external view returns (
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

    // 기본 배당률 조회
    function getProjectBaseDividendRate(string memory projectId) external view returns (uint256) {
        return projectBaseDividendRate[projectId];
    }

    // 특정 월의 배당 기록 조회
    function getDividendRecordByMonth(string memory projectId, uint256 month, uint256 year) external view returns (DividendRecord memory) {
        DividendRecord[] memory history = projectDividendHistory[projectId];
        
        for (uint256 i = 0; i < history.length; i++) {
            if (history[i].month == month && history[i].year == year) {
                return history[i];
            }
        }
        
        // 해당 월의 기록이 없으면 빈 구조체 반환
        return DividendRecord({
            month: 0,
            year: 0,
            baseYield: 0,
            eventAdjustment: 0,
            finalYield: 0,
            eventType: DividendEventType.POSITIVE_NEWS,
            eventDescription: "",
            timestamp: 0
        });
    }

    // 연간 배당 총계 계산
    function getYearlyDividendTotal(string memory projectId, uint256 year) external view returns (uint256) {
        DividendRecord[] memory history = projectDividendHistory[projectId];
        uint256 total = 0;
        
        for (uint256 i = 0; i < history.length; i++) {
            if (history[i].year == year) {
                total += history[i].finalYield;
            }
        }
        
        return total;
    }

    // 내부 함수들
    function _calculateFinalRate(uint256 baseRate, int256 adjustment) internal pure returns (uint256) {
        if (adjustment < 0) {
            uint256 reduction = uint256(-adjustment);
            return baseRate > reduction ? baseRate - reduction : 0;
        } else {
            return baseRate + uint256(adjustment);
        }
    }

    function _getCurrentMonthYear() internal view returns (uint256 month, uint256 year) {
        uint256 currentTime = block.timestamp;
        // 2025년 1월 1일 기준 타임스탬프: 1735689600
        uint256 year2025Start = 1735689600;
        
        year = 2025;
        
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
    }

    function _recordDividend(
        string memory projectId,
        uint256 month,
        uint256 year,
        uint256 baseRate,
        int256 adjustment,
        uint256 finalRate,
        DividendEventType eventType,
        string memory description
    ) internal {
        DividendRecord memory newRecord = DividendRecord({
            month: month,
            year: year,
            baseYield: baseRate,
            eventAdjustment: adjustment >= 0 ? uint256(adjustment) : uint256(-adjustment),
            finalYield: finalRate,
            eventType: eventType,
            eventDescription: description,
            timestamp: block.timestamp
        });

        projectDividendHistory[projectId].push(newRecord);
        
        emit MonthlyDividendRecorded(projectId, month, year, finalRate, finalRate);
    }
}
