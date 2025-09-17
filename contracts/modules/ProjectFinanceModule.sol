// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

interface IRealEstateCore {
    function projectToTokenId(string memory projectId) external view returns (uint256);
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function totalSupply(uint256 id) external view returns (uint256);
}

contract ProjectFinanceModule is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    
    // PF 단계
    enum PFPhase {
        PLANNING,           // 기획 단계
        FINANCIAL_CLOSE,    // 금융조달 완료
        CONSTRUCTION,       // 건설 단계  
        OPERATION,          // 운영 단계
        REFINANCING,        // 리파이낸싱
        EXIT                // 출구 (상환/매각)
    }

    // 자본 구조
    struct CapitalStructure {
        uint256 totalProjectCost;      // 총 사업비 (wei)
        uint256 equityAmount;          // 자기자본 (wei) - 보통 20%
        uint256 debtAmount;            // 타인자본 (wei) - 보통 80%
        uint256 stoTokenSupply;        // STO 토큰 발행량
        uint256 stoTokenPrice;         // STO 토큰 가격 (wei)
        uint256 sponsorEquity;         // 시행사 지분 (wei)
        uint256 equityRatio;           // 자기자본 비율 (basis points)
        uint256 debtRatio;             // 타인자본 비율 (basis points)
    }

    // 금융 조달 정보
    struct FinancingDetails {
        address[] lenders;             // 대출 기관들
        uint256[] loanAmounts;         // 대출 금액들
        uint256[] interestRates;       // 대출 이자율들 (basis points)
        uint256[] maturityDates;       // 만기일들
        uint256 totalDebtService;      // 총 원리금상환액
        bool isFinancialClosed;        // 금융조달 완료 여부
        uint256 financialCloseDate;    // 금융조달 완료일
    }

    // 현금흐름 정보
    struct CashFlowData {
        uint256 totalRevenue;          // 총 수익 (누적)
        uint256 operatingExpenses;     // 운영비 (누적)
        uint256 debtService;           // 원리금상환 (누적)
        uint256 netCashFlow;           // 순현금흐름 (누적)
        uint256 equityDistribution;    // 자기자본 배당 (누적)
        uint256 dscr;                  // 원리금상환비율 (DSCR) - basis points
        uint256 lastUpdated;           // 마지막 업데이트
    }

    // STO 투자자 정보
    struct STOInvestor {
        uint256 tokenAmount;           // 보유 토큰 수
        uint256 investmentAmount;      // 투자 금액 (wei)
        uint256 totalDividends;        // 총 배당 수령액 (wei)
        uint256 lastDividendClaim;     // 마지막 배당 청구일
        bool isAccredited;             // 전문투자자 여부
    }

    // 리파이낸싱 정보
    struct RefinancingData {
        uint256 newLoanAmount;         // 신규 대출 금액
        uint256 newInterestRate;       // 신규 이자율
        uint256 cashOutAmount;         // 현금 인출 금액
        uint256 refinancingDate;       // 리파이낸싱 실행일
        bool isCompleted;              // 완료 여부
    }

    // 상태 변수들
    address public coreContract;
    
    // 프로젝트별 PF 정보
    mapping(string => CapitalStructure) public projectCapitalStructure;
    mapping(string => FinancingDetails) public projectFinancing;
    mapping(string => CashFlowData) public projectCashFlow;
    mapping(string => RefinancingData) public projectRefinancing;
    mapping(string => PFPhase) public projectPhase;
    
    // STO 투자자 정보
    mapping(string => mapping(address => STOInvestor)) public stoInvestors;
    mapping(string => address[]) public projectInvestors;
    
    // 배당 풀
    mapping(string => uint256) public dividendPool;
    mapping(string => uint256) public totalDividendsPaid;

    // 이벤트들
    event PFProjectRegistered(
        string indexed projectId,
        uint256 totalProjectCost,
        uint256 equityAmount,
        uint256 debtAmount
    );
    
    event FinancialClose(
        string indexed projectId,
        uint256 totalDebtAmount,
        uint256 closeDate
    );
    
    event STOInvestment(
        string indexed projectId,
        address indexed investor,
        uint256 tokenAmount,
        uint256 investmentAmount
    );
    
    event CashFlowUpdate(
        string indexed projectId,
        uint256 revenue,
        uint256 expenses,
        uint256 netCashFlow,
        uint256 dscr
    );
    
    event DividendDistribution(
        string indexed projectId,
        uint256 totalAmount,
        uint256 perToken
    );
    
    event RefinancingExecuted(
        string indexed projectId,
        uint256 newLoanAmount,
        uint256 cashOutAmount
    );
    
    event PhaseTransition(
        string indexed projectId,
        PFPhase oldPhase,
        PFPhase newPhase
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _coreContract) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        coreContract = _coreContract;
    }

    // PF 프로젝트 등록
    function registerPFProject(
        string memory projectId,
        uint256 totalProjectCost,
        uint256 equityRatio,  // basis points (2000 = 20%)
        uint256 stoTokenSupply,
        uint256 stoTokenPrice
    ) external onlyOwner {
        require(IRealEstateCore(coreContract).projectToTokenId(projectId) != 0, "Project must exist in core contract");
        require(equityRatio <= 5000, "Equity ratio cannot exceed 50%"); // 최대 50%
        require(equityRatio >= 1000, "Equity ratio must be at least 10%"); // 최소 10%
        
        uint256 equityAmount = (totalProjectCost * equityRatio) / 10000;
        uint256 debtAmount = totalProjectCost - equityAmount;
        uint256 sponsorEquity = equityAmount / 4; // 자기자본의 25%는 시행사가 보유
        
        projectCapitalStructure[projectId] = CapitalStructure({
            totalProjectCost: totalProjectCost,
            equityAmount: equityAmount,
            debtAmount: debtAmount,
            stoTokenSupply: stoTokenSupply,
            stoTokenPrice: stoTokenPrice,
            sponsorEquity: sponsorEquity,
            equityRatio: equityRatio,
            debtRatio: 10000 - equityRatio
        });
        
        projectPhase[projectId] = PFPhase.PLANNING;
        
        emit PFProjectRegistered(projectId, totalProjectCost, equityAmount, debtAmount);
    }

    // STO 투자 (토큰 구매)
    function investSTO(string memory projectId) external payable nonReentrant {
        CapitalStructure memory structure = projectCapitalStructure[projectId];
        require(structure.totalProjectCost > 0, "Project not registered");
        require(projectPhase[projectId] == PFPhase.PLANNING, "Investment period ended");
        require(msg.value >= structure.stoTokenPrice, "Insufficient payment");
        
        uint256 tokensToBuy = msg.value / structure.stoTokenPrice;
        uint256 currentSupply = getTotalSTOInvestment(projectId) / structure.stoTokenPrice;
        require(currentSupply + tokensToBuy <= structure.stoTokenSupply, "Exceeds available tokens");
        
        // STO 투자자 정보 업데이트
        STOInvestor storage investor = stoInvestors[projectId][msg.sender];
        if (investor.tokenAmount == 0) {
            projectInvestors[projectId].push(msg.sender);
        }
        
        investor.tokenAmount += tokensToBuy;
        investor.investmentAmount += msg.value;
        
        // 초과 지불 반환
        uint256 actualCost = tokensToBuy * structure.stoTokenPrice;
        if (msg.value > actualCost) {
            payable(msg.sender).transfer(msg.value - actualCost);
        }
        
        emit STOInvestment(projectId, msg.sender, tokensToBuy, actualCost);
    }

    // 금융 조달 완료 (Financial Close)
    function executeFinancialClose(
        string memory projectId,
        address[] memory lenders,
        uint256[] memory loanAmounts,
        uint256[] memory interestRates,
        uint256[] memory maturityDates
    ) external onlyOwner {
        require(projectPhase[projectId] == PFPhase.PLANNING, "Invalid phase");
        require(lenders.length == loanAmounts.length, "Array length mismatch");
        require(lenders.length == interestRates.length, "Array length mismatch");
        require(lenders.length == maturityDates.length, "Array length mismatch");
        
        uint256 totalLoanAmount = 0;
        for (uint i = 0; i < loanAmounts.length; i++) {
            totalLoanAmount += loanAmounts[i];
        }
        
        CapitalStructure memory structure = projectCapitalStructure[projectId];
        require(totalLoanAmount >= structure.debtAmount * 95 / 100, "Insufficient debt financing"); // 95% 이상
        
        projectFinancing[projectId] = FinancingDetails({
            lenders: lenders,
            loanAmounts: loanAmounts,
            interestRates: interestRates,
            maturityDates: maturityDates,
            totalDebtService: totalLoanAmount, // 단순화, 실제로는 이자 포함 계산
            isFinancialClosed: true,
            financialCloseDate: block.timestamp
        });
        
        projectPhase[projectId] = PFPhase.FINANCIAL_CLOSE;
        
        emit FinancialClose(projectId, totalLoanAmount, block.timestamp);
    }

    // 건설 단계 전환
    function startConstruction(string memory projectId) external onlyOwner {
        require(projectPhase[projectId] == PFPhase.FINANCIAL_CLOSE, "Financial close required");
        
        PFPhase oldPhase = projectPhase[projectId];
        projectPhase[projectId] = PFPhase.CONSTRUCTION;
        
        emit PhaseTransition(projectId, oldPhase, PFPhase.CONSTRUCTION);
    }

    // 운영 단계 전환
    function startOperation(string memory projectId) external onlyOwner {
        require(projectPhase[projectId] == PFPhase.CONSTRUCTION, "Construction must be completed");
        
        PFPhase oldPhase = projectPhase[projectId];
        projectPhase[projectId] = PFPhase.OPERATION;
        
        emit PhaseTransition(projectId, oldPhase, PFPhase.OPERATION);
    }

    // 현금흐름 업데이트
    function updateCashFlow(
        string memory projectId,
        uint256 revenue,
        uint256 operatingExpenses,
        uint256 debtService
    ) external onlyOwner {
        require(projectPhase[projectId] == PFPhase.OPERATION, "Project must be in operation");
        
        CashFlowData storage cashFlow = projectCashFlow[projectId];
        cashFlow.totalRevenue += revenue;
        cashFlow.operatingExpenses += operatingExpenses;
        cashFlow.debtService += debtService;
        
        uint256 netCashFlow = revenue - operatingExpenses - debtService;
        cashFlow.netCashFlow += netCashFlow;
        
        // DSCR 계산 (원리금상환비율)
        if (debtService > 0) {
            uint256 ebitda = revenue - operatingExpenses;
            cashFlow.dscr = (ebitda * 10000) / debtService; // basis points
        }
        
        cashFlow.lastUpdated = block.timestamp;
        
        // 자기자본 배당 풀에 추가 (순현금흐름의 일정 비율)
        if (netCashFlow > 0) {
            uint256 dividendAmount = netCashFlow * 80 / 100; // 순현금흐름의 80%
            dividendPool[projectId] += dividendAmount;
        }
        
        emit CashFlowUpdate(projectId, revenue, operatingExpenses, netCashFlow, cashFlow.dscr);
    }

    // 배당 분배
    function distributeDividends(string memory projectId) external onlyOwner nonReentrant {
        require(dividendPool[projectId] > 0, "No dividends available");
        require(projectPhase[projectId] == PFPhase.OPERATION, "Project must be in operation");
        
        uint256 totalDividends = dividendPool[projectId];
        CapitalStructure memory structure = projectCapitalStructure[projectId];
        uint256 dividendPerToken = totalDividends / structure.stoTokenSupply;
        
        address[] memory investors = projectInvestors[projectId];
        
        for (uint i = 0; i < investors.length; i++) {
            address investor = investors[i];
            STOInvestor storage investorData = stoInvestors[projectId][investor];
            
            if (investorData.tokenAmount > 0) {
                uint256 dividendAmount = investorData.tokenAmount * dividendPerToken;
                investorData.totalDividends += dividendAmount;
                investorData.lastDividendClaim = block.timestamp;
                
                // 배당 지급
                payable(investor).transfer(dividendAmount);
            }
        }
        
        totalDividendsPaid[projectId] += totalDividends;
        dividendPool[projectId] = 0;
        
        emit DividendDistribution(projectId, totalDividends, dividendPerToken);
    }

    // 리파이낸싱 실행
    function executeRefinancing(
        string memory projectId,
        uint256 newLoanAmount,
        uint256 newInterestRate,
        uint256 cashOutAmount
    ) external onlyOwner {
        require(projectPhase[projectId] == PFPhase.OPERATION, "Project must be in operation");
        require(projectCashFlow[projectId].dscr >= 12000, "DSCR too low for refinancing"); // 1.2x 이상
        
        projectRefinancing[projectId] = RefinancingData({
            newLoanAmount: newLoanAmount,
            newInterestRate: newInterestRate,
            cashOutAmount: cashOutAmount,
            refinancingDate: block.timestamp,
            isCompleted: true
        });
        
        PFPhase oldPhase = projectPhase[projectId];
        projectPhase[projectId] = PFPhase.REFINANCING;
        
        // 현금 인출액을 배당 풀에 추가
        if (cashOutAmount > 0) {
            dividendPool[projectId] += cashOutAmount;
        }
        
        emit RefinancingExecuted(projectId, newLoanAmount, cashOutAmount);
        emit PhaseTransition(projectId, oldPhase, PFPhase.REFINANCING);
    }

    // 조회 함수들
    function getTotalSTOInvestment(string memory projectId) public view returns (uint256) {
        address[] memory investors = projectInvestors[projectId];
        uint256 total = 0;
        
        for (uint i = 0; i < investors.length; i++) {
            total += stoInvestors[projectId][investors[i]].investmentAmount;
        }
        
        return total;
    }

    function getProjectMetrics(string memory projectId) external view returns (
        uint256 totalInvestment,
        uint256 equityRaised,
        uint256 debtRaised,
        uint256 currentDSCR,
        uint256 totalDividendsPaidOut,
        PFPhase currentPhase
    ) {
        CapitalStructure memory structure = projectCapitalStructure[projectId];
        CashFlowData memory cashFlow = projectCashFlow[projectId];
        
        totalInvestment = structure.totalProjectCost;
        equityRaised = getTotalSTOInvestment(projectId);
        debtRaised = structure.debtAmount;
        currentDSCR = cashFlow.dscr;
        totalDividendsPaidOut = totalDividendsPaid[projectId];
        currentPhase = projectPhase[projectId];
    }

    function getInvestorInfo(string memory projectId, address investor) external view returns (
        uint256 tokenAmount,
        uint256 investmentAmount,
        uint256 totalDividends,
        uint256 pendingDividends
    ) {
        STOInvestor memory investorData = stoInvestors[projectId][investor];
        CapitalStructure memory structure = projectCapitalStructure[projectId];
        
        tokenAmount = investorData.tokenAmount;
        investmentAmount = investorData.investmentAmount;
        totalDividends = investorData.totalDividends;
        
        // 대기 중인 배당 계산
        if (structure.stoTokenSupply > 0) {
            pendingDividends = (dividendPool[projectId] * tokenAmount) / structure.stoTokenSupply;
        }
    }

    // 긴급 상황 대응
    function emergencyWithdraw(string memory projectId) external onlyOwner {
        require(projectPhase[projectId] == PFPhase.PLANNING, "Only available in planning phase");
        
        // 투자자들에게 투자금 반환
        address[] memory investors = projectInvestors[projectId];
        
        for (uint i = 0; i < investors.length; i++) {
            address investor = investors[i];
            STOInvestor memory investorData = stoInvestors[projectId][investor];
            
            if (investorData.investmentAmount > 0) {
                payable(investor).transfer(investorData.investmentAmount);
                delete stoInvestors[projectId][investor];
            }
        }
        
        delete projectInvestors[projectId];
    }
}



