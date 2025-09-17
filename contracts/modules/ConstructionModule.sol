// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface IRealEstateCore {
    function projectToTokenId(string memory projectId) external view returns (uint256);
}

contract ConstructionModule is Initializable, OwnableUpgradeable {
    
    // 건설 프로젝트 타입
    enum ProjectType {
        RESIDENTIAL,        // 주거용 건물
        COMMERCIAL,         // 상업용 건물
        INFRASTRUCTURE,     // 인프라 (도로, 교량 등)
        ENERGY,            // 에너지 시설
        INDUSTRIAL,        // 산업 시설
        SMART_CITY,        // 스마트시티
        TRANSPORTATION     // 교통 시설
    }

    // 건설 단계
    enum ConstructionPhase {
        PLANNING,          // 기획/설계
        APPROVAL,          // 인허가
        GROUNDBREAKING,    // 착공
        FOUNDATION,        // 기초공사
        STRUCTURE,         // 골조공사
        INTERIOR,          // 내부공사
        FINISHING,         // 마감공사
        TESTING,           // 시험/검수
        COMPLETED          // 완공
    }

    // 건설 프로젝트 상세 정보
    struct ConstructionDetails {
        ProjectType projectType;
        string location;
        string contractor;              // 시공사
        string architect;               // 설계사
        uint256 totalBudget;           // 총 예산 (wei)
        uint256 currentSpent;          // 현재 지출 (wei)
        uint256 estimatedDuration;     // 예상 공기 (일)
        uint256 startDate;             // 시작일
        uint256 expectedCompletion;    // 예상 완공일
        ConstructionPhase currentPhase;
        uint256 progressPercentage;    // 진행률 (0-100)
        bool isOnSchedule;             // 일정 준수 여부
        bool isOnBudget;               // 예산 준수 여부
    }

    // 리스크 요소
    struct RiskAssessment {
        uint256 weatherRisk;           // 기상 리스크 (0-100)
        uint256 regulatoryRisk;        // 규제 리스크 (0-100)
        uint256 technicalRisk;         // 기술적 리스크 (0-100)
        uint256 financialRisk;         // 재정 리스크 (0-100)
        uint256 environmentalRisk;     // 환경 리스크 (0-100)
        uint256 overallRiskScore;      // 종합 리스크 점수 (0-100)
        string[] riskMitigations;      // 리스크 완화 방안
        uint256 lastUpdated;
    }

    // 지속가능성 지표
    struct SustainabilityMetrics {
        uint256 carbonFootprint;       // 탄소 발자국 (톤 CO2)
        uint256 energyEfficiencyScore; // 에너지 효율성 점수 (0-100)
        uint256 recycledMaterialsPercent; // 재활용 자재 비율 (%)
        uint256 wasteReductionPercent; // 폐기물 감소율 (%)
        bool greenBuildingCertified;   // 친환경 건축물 인증 여부
        string[] sustainabilityFeatures; // 지속가능성 특징들
        uint256 lastUpdated;
    }

    // 상태 변수들
    address public coreContract;
    
    mapping(string => ConstructionDetails) public projectDetails;
    mapping(string => RiskAssessment) public projectRisks;
    mapping(string => SustainabilityMetrics) public projectSustainability;
    
    // 프로젝트 타입별 통계
    mapping(ProjectType => uint256) public projectCountByType;
    mapping(ProjectType => uint256) public totalInvestmentByType;

    // 이벤트
    event ConstructionProjectRegistered(
        string indexed projectId, 
        ProjectType projectType, 
        string location,
        uint256 totalBudget
    );
    
    event PhaseUpdated(
        string indexed projectId, 
        ConstructionPhase oldPhase, 
        ConstructionPhase newPhase,
        uint256 progressPercentage
    );
    
    event BudgetUpdated(
        string indexed projectId, 
        uint256 newSpent, 
        uint256 totalBudget,
        bool isOnBudget
    );
    
    event RiskAssessmentUpdated(
        string indexed projectId, 
        uint256 overallRiskScore
    );
    
    event SustainabilityUpdated(
        string indexed projectId, 
        uint256 carbonFootprint,
        uint256 energyEfficiencyScore
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _coreContract) public initializer {
        __Ownable_init(msg.sender);
        coreContract = _coreContract;
    }

    // 건설 프로젝트 등록
    function registerConstructionProject(
        string memory projectId,
        ProjectType projectType,
        string memory location,
        string memory contractor,
        string memory architect,
        uint256 totalBudget,
        uint256 estimatedDuration
    ) external onlyOwner {
        require(IRealEstateCore(coreContract).projectToTokenId(projectId) != 0, "Project must exist in core contract");
        
        projectDetails[projectId] = ConstructionDetails({
            projectType: projectType,
            location: location,
            contractor: contractor,
            architect: architect,
            totalBudget: totalBudget,
            currentSpent: 0,
            estimatedDuration: estimatedDuration,
            startDate: block.timestamp,
            expectedCompletion: block.timestamp + (estimatedDuration * 1 days),
            currentPhase: ConstructionPhase.PLANNING,
            progressPercentage: 0,
            isOnSchedule: true,
            isOnBudget: true
        });

        // 통계 업데이트
        projectCountByType[projectType]++;
        totalInvestmentByType[projectType] += totalBudget;

        emit ConstructionProjectRegistered(projectId, projectType, location, totalBudget);
    }

    // 건설 단계 업데이트
    function updateConstructionPhase(
        string memory projectId,
        ConstructionPhase newPhase,
        uint256 newProgressPercentage
    ) external onlyOwner {
        require(projectDetails[projectId].totalBudget > 0, "Project not registered");
        require(newProgressPercentage <= 100, "Progress cannot exceed 100%");
        
        ConstructionDetails storage details = projectDetails[projectId];
        ConstructionPhase oldPhase = details.currentPhase;
        
        details.currentPhase = newPhase;
        details.progressPercentage = newProgressPercentage;
        
        // 일정 준수 여부 확인
        uint256 expectedProgress = _calculateExpectedProgress(projectId);
        details.isOnSchedule = newProgressPercentage >= expectedProgress;
        
        emit PhaseUpdated(projectId, oldPhase, newPhase, newProgressPercentage);
    }

    // 예산 지출 업데이트
    function updateBudgetSpent(
        string memory projectId,
        uint256 newSpent
    ) external onlyOwner {
        require(projectDetails[projectId].totalBudget > 0, "Project not registered");
        
        ConstructionDetails storage details = projectDetails[projectId];
        details.currentSpent = newSpent;
        details.isOnBudget = newSpent <= details.totalBudget;
        
        emit BudgetUpdated(projectId, newSpent, details.totalBudget, details.isOnBudget);
    }

    // 리스크 평가 업데이트
    function updateRiskAssessment(
        string memory projectId,
        uint256 weatherRisk,
        uint256 regulatoryRisk,
        uint256 technicalRisk,
        uint256 financialRisk,
        uint256 environmentalRisk,
        string[] memory riskMitigations
    ) external onlyOwner {
        require(projectDetails[projectId].totalBudget > 0, "Project not registered");
        
        // 종합 리스크 점수 계산 (가중 평균)
        uint256 overallRisk = (
            weatherRisk * 15 +
            regulatoryRisk * 25 +
            technicalRisk * 20 +
            financialRisk * 25 +
            environmentalRisk * 15
        ) / 100;
        
        projectRisks[projectId] = RiskAssessment({
            weatherRisk: weatherRisk,
            regulatoryRisk: regulatoryRisk,
            technicalRisk: technicalRisk,
            financialRisk: financialRisk,
            environmentalRisk: environmentalRisk,
            overallRiskScore: overallRisk,
            riskMitigations: riskMitigations,
            lastUpdated: block.timestamp
        });
        
        emit RiskAssessmentUpdated(projectId, overallRisk);
    }

    // 지속가능성 지표 업데이트
    function updateSustainabilityMetrics(
        string memory projectId,
        uint256 carbonFootprint,
        uint256 energyEfficiencyScore,
        uint256 recycledMaterialsPercent,
        uint256 wasteReductionPercent,
        bool greenBuildingCertified,
        string[] memory sustainabilityFeatures
    ) external onlyOwner {
        require(projectDetails[projectId].totalBudget > 0, "Project not registered");
        
        projectSustainability[projectId] = SustainabilityMetrics({
            carbonFootprint: carbonFootprint,
            energyEfficiencyScore: energyEfficiencyScore,
            recycledMaterialsPercent: recycledMaterialsPercent,
            wasteReductionPercent: wasteReductionPercent,
            greenBuildingCertified: greenBuildingCertified,
            sustainabilityFeatures: sustainabilityFeatures,
            lastUpdated: block.timestamp
        });
        
        emit SustainabilityUpdated(projectId, carbonFootprint, energyEfficiencyScore);
    }

    // 예상 진행률 계산 (내부 함수)
    function _calculateExpectedProgress(string memory projectId) internal view returns (uint256) {
        ConstructionDetails memory details = projectDetails[projectId];
        uint256 elapsed = block.timestamp - details.startDate;
        uint256 expectedProgress = (elapsed * 100) / (details.estimatedDuration * 1 days);
        return expectedProgress > 100 ? 100 : expectedProgress;
    }

    // 프로젝트 종합 정보 조회
    function getProjectComprehensiveInfo(string memory projectId) external view returns (
        ConstructionDetails memory details,
        RiskAssessment memory risks,
        SustainabilityMetrics memory sustainability,
        uint256 expectedProgress,
        string memory projectStatus
    ) {
        details = projectDetails[projectId];
        risks = projectRisks[projectId];
        sustainability = projectSustainability[projectId];
        expectedProgress = _calculateExpectedProgress(projectId);
        projectStatus = _getProjectStatus(projectId);
    }

    // 프로젝트 상태 문자열 반환
    function _getProjectStatus(string memory projectId) internal view returns (string memory) {
        ConstructionDetails memory details = projectDetails[projectId];
        
        if (details.currentPhase == ConstructionPhase.COMPLETED) {
            return "Completed";
        } else if (!details.isOnSchedule && !details.isOnBudget) {
            return "Critical - Behind Schedule & Over Budget";
        } else if (!details.isOnSchedule) {
            return "Warning - Behind Schedule";
        } else if (!details.isOnBudget) {
            return "Warning - Over Budget";
        } else {
            return "On Track";
        }
    }

    // 프로젝트 타입별 통계 조회
    function getProjectTypeStats(ProjectType projectType) external view returns (
        uint256 count,
        uint256 totalInvestment,
        uint256 averageInvestment
    ) {
        count = projectCountByType[projectType];
        totalInvestment = totalInvestmentByType[projectType];
        averageInvestment = count > 0 ? totalInvestment / count : 0;
    }

    // 전체 포트폴리오 통계
    function getPortfolioStats() external view returns (
        uint256 totalProjects,
        uint256 totalInvestment,
        uint256 completedProjects,
        uint256 onTrackProjects
    ) {
        // 이 함수는 실제로는 모든 프로젝트를 순회해야 하므로 
        // 가스 효율성을 위해 오프체인에서 계산하고 결과만 저장하는 방식을 권장
        totalProjects = projectCountByType[ProjectType.RESIDENTIAL] + 
                       projectCountByType[ProjectType.COMMERCIAL] + 
                       projectCountByType[ProjectType.INFRASTRUCTURE] +
                       projectCountByType[ProjectType.ENERGY] +
                       projectCountByType[ProjectType.INDUSTRIAL] +
                       projectCountByType[ProjectType.SMART_CITY] +
                       projectCountByType[ProjectType.TRANSPORTATION];
        
        totalInvestment = totalInvestmentByType[ProjectType.RESIDENTIAL] +
                         totalInvestmentByType[ProjectType.COMMERCIAL] +
                         totalInvestmentByType[ProjectType.INFRASTRUCTURE] +
                         totalInvestmentByType[ProjectType.ENERGY] +
                         totalInvestmentByType[ProjectType.INDUSTRIAL] +
                         totalInvestmentByType[ProjectType.SMART_CITY] +
                         totalInvestmentByType[ProjectType.TRANSPORTATION];
    }

    // 리스크 레벨 반환
    function getRiskLevel(string memory projectId) external view returns (string memory) {
        uint256 riskScore = projectRisks[projectId].overallRiskScore;
        
        if (riskScore >= 80) return "Very High";
        if (riskScore >= 60) return "High";
        if (riskScore >= 40) return "Medium";
        if (riskScore >= 20) return "Low";
        return "Very Low";
    }

    // 지속가능성 등급 반환
    function getSustainabilityGrade(string memory projectId) external view returns (string memory) {
        SustainabilityMetrics memory metrics = projectSustainability[projectId];
        
        uint256 score = (
            metrics.energyEfficiencyScore * 30 +
            (100 - metrics.carbonFootprint / 100) * 25 +  // 탄소 발자국 역산
            metrics.recycledMaterialsPercent * 25 +
            metrics.wasteReductionPercent * 20
        ) / 100;
        
        if (metrics.greenBuildingCertified) score += 10;
        if (score > 100) score = 100;
        
        if (score >= 90) return "A+";
        if (score >= 80) return "A";
        if (score >= 70) return "B+";
        if (score >= 60) return "B";
        if (score >= 50) return "C+";
        return "C";
    }
}



