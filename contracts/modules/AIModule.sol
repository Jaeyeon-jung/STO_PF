// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface IRealEstateCore {
    function projectToTokenId(string memory projectId) external view returns (uint256);
}

contract AIModule is Initializable, OwnableUpgradeable {
    
    // AI 예측 결과 구조체
    struct AIPrediction {
        uint256 predictedPrice;      // AI 예측 가격 (wei)
        uint256 confidenceScore;     // 신뢰도 점수 (0-100)
        uint256 riskScore;          // 리스크 점수 (0-100)
        uint256 investmentScore;    // 투자 점수 (0-100)
        uint256 timestamp;          // 예측 시간
        bool isActive;              // 예측 활성화 여부
    }

    // 시장 분석 데이터 구조체
    struct MarketAnalysis {
        uint256 marketTrend;        // 시장 트렌드 (0-100, 50이 중립)
        uint256 volatilityIndex;    // 변동성 지수 (0-100)
        uint256 liquidityScore;     // 유동성 점수 (0-100)
        uint256 competitionLevel;   // 경쟁 수준 (0-100)
        string analysisDescription; // 분석 설명
        uint256 lastUpdated;        // 마지막 업데이트
    }

    // 상태 변수들
    address public coreContract;
    
    // 프로젝트별 AI 예측 저장
    mapping(string => AIPrediction) public projectAIPredictions;
    
    // 프로젝트별 시장 분석 저장
    mapping(string => MarketAnalysis) public projectMarketAnalysis;

    // 이벤트
    event AIPredictionUpdated(
        string indexed projectId, 
        uint256 predictedPrice, 
        uint256 confidenceScore, 
        uint256 riskScore,
        uint256 investmentScore
    );
    
    event MarketAnalysisUpdated(
        string indexed projectId,
        uint256 marketTrend,
        uint256 volatilityIndex,
        uint256 liquidityScore,
        uint256 competitionLevel
    );

    event PredictionStatusChanged(string indexed projectId, bool isActive);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _coreContract) public initializer {
        __Ownable_init(msg.sender);
        coreContract = _coreContract;
    }

    // AI 예측 결과 업데이트
    function updateAIPrediction(
        string memory projectId,
        uint256 predictedPrice,
        uint256 confidenceScore,
        uint256 riskScore,
        uint256 investmentScore
    ) external onlyOwner {
        require(IRealEstateCore(coreContract).projectToTokenId(projectId) != 0, "Project does not exist");
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

        emit AIPredictionUpdated(projectId, predictedPrice, confidenceScore, riskScore, investmentScore);
    }

    // 시장 분석 데이터 업데이트
    function updateMarketAnalysis(
        string memory projectId,
        uint256 marketTrend,
        uint256 volatilityIndex,
        uint256 liquidityScore,
        uint256 competitionLevel,
        string memory analysisDescription
    ) external onlyOwner {
        require(IRealEstateCore(coreContract).projectToTokenId(projectId) != 0, "Project does not exist");
        require(marketTrend <= 100, "Market trend must be <= 100");
        require(volatilityIndex <= 100, "Volatility index must be <= 100");
        require(liquidityScore <= 100, "Liquidity score must be <= 100");
        require(competitionLevel <= 100, "Competition level must be <= 100");
        
        projectMarketAnalysis[projectId] = MarketAnalysis({
            marketTrend: marketTrend,
            volatilityIndex: volatilityIndex,
            liquidityScore: liquidityScore,
            competitionLevel: competitionLevel,
            analysisDescription: analysisDescription,
            lastUpdated: block.timestamp
        });

        emit MarketAnalysisUpdated(projectId, marketTrend, volatilityIndex, liquidityScore, competitionLevel);
    }

    // AI 예측 활성화/비활성화
    function toggleAIPrediction(string memory projectId, bool isActive) external onlyOwner {
        require(IRealEstateCore(coreContract).projectToTokenId(projectId) != 0, "Project does not exist");
        projectAIPredictions[projectId].isActive = isActive;
        
        emit PredictionStatusChanged(projectId, isActive);
    }

    // 투자 점수 기반 추천 등급 반환
    function getInvestmentGrade(string memory projectId) external view returns (string memory) {
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

    // 리스크 레벨 반환
    function getRiskLevel(string memory projectId) external view returns (string memory) {
        AIPrediction memory aiPrediction = projectAIPredictions[projectId];
        
        if (!aiPrediction.isActive) {
            return "Unknown";
        }
        
        if (aiPrediction.riskScore >= 80) return "Very High";
        if (aiPrediction.riskScore >= 60) return "High";
        if (aiPrediction.riskScore >= 40) return "Medium";
        if (aiPrediction.riskScore >= 20) return "Low";
        return "Very Low";
    }

    // 시장 트렌드 상태 반환
    function getMarketTrendStatus(string memory projectId) external view returns (string memory) {
        MarketAnalysis memory analysis = projectMarketAnalysis[projectId];
        
        if (analysis.lastUpdated == 0) {
            return "No Analysis";
        }
        
        if (analysis.marketTrend >= 70) return "Bullish";
        if (analysis.marketTrend >= 55) return "Slightly Bullish";
        if (analysis.marketTrend >= 45) return "Neutral";
        if (analysis.marketTrend >= 30) return "Slightly Bearish";
        return "Bearish";
    }

    // 종합 AI 분석 결과 반환
    function getComprehensiveAnalysis(string memory projectId) external view returns (
        AIPrediction memory prediction,
        MarketAnalysis memory analysis,
        string memory investmentGrade,
        string memory riskLevel,
        string memory marketTrend,
        bool isRecommended
    ) {
        prediction = projectAIPredictions[projectId];
        analysis = projectMarketAnalysis[projectId];
        investmentGrade = this.getInvestmentGrade(projectId);
        riskLevel = this.getRiskLevel(projectId);
        marketTrend = this.getMarketTrendStatus(projectId);
        
        // 투자 추천 여부 결정
        isRecommended = prediction.isActive && 
                       prediction.investmentScore >= 60 && 
                       prediction.riskScore <= 60 &&
                       prediction.confidenceScore >= 70;
    }

    // AI 예측이 유효한지 확인
    function isPredictionValid(string memory projectId) external view returns (bool) {
        AIPrediction memory prediction = projectAIPredictions[projectId];
        
        return prediction.isActive && 
               (block.timestamp - prediction.timestamp) <= 24 hours &&
               prediction.confidenceScore >= 60;
    }

    // 예측 정확도 기반 신뢰도 조정 (실제 가격과 비교)
    function adjustConfidenceScore(
        string memory projectId, 
        uint256 actualPrice,
        uint256 timeElapsed
    ) external onlyOwner {
        AIPrediction storage prediction = projectAIPredictions[projectId];
        require(prediction.isActive, "Prediction not active");
        
        // 예측 정확도 계산 (오차율 기반)
        uint256 predictedPrice = prediction.predictedPrice;
        uint256 errorRate;
        
        if (actualPrice > predictedPrice) {
            errorRate = ((actualPrice - predictedPrice) * 100) / actualPrice;
        } else {
            errorRate = ((predictedPrice - actualPrice) * 100) / predictedPrice;
        }
        
        // 신뢰도 조정 (오차가 적을수록 신뢰도 증가)
        if (errorRate <= 5) {
            // 5% 이하 오차: 신뢰도 증가
            prediction.confidenceScore = prediction.confidenceScore < 95 ? 
                prediction.confidenceScore + 5 : 100;
        } else if (errorRate <= 10) {
            // 10% 이하 오차: 신뢰도 유지
            // 변경 없음
        } else if (errorRate <= 20) {
            // 20% 이하 오차: 신뢰도 감소
            prediction.confidenceScore = prediction.confidenceScore > 10 ? 
                prediction.confidenceScore - 10 : 0;
        } else {
            // 20% 초과 오차: 신뢰도 대폭 감소
            prediction.confidenceScore = prediction.confidenceScore > 20 ? 
                prediction.confidenceScore - 20 : 0;
        }
    }

    // 자동 시장 분석 시뮬레이션 (테스트용)
    function simulateMarketAnalysis(string memory projectId) external onlyOwner {
        require(IRealEstateCore(coreContract).projectToTokenId(projectId) != 0, "Project does not exist");
        
        // 의사 랜덤 값 생성
        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, projectId)));
        
        uint256 marketTrend = 30 + (seed % 40); // 30-70 범위
        uint256 volatilityIndex = 20 + ((seed >> 8) % 60); // 20-80 범위
        uint256 liquidityScore = 40 + ((seed >> 16) % 40); // 40-80 범위
        uint256 competitionLevel = 30 + ((seed >> 24) % 50); // 30-80 범위
        
        string memory description = "Automated market analysis based on current trends and historical data";
        
        this.updateMarketAnalysis(
            projectId,
            marketTrend,
            volatilityIndex,
            liquidityScore,
            competitionLevel,
            description
        );
        
        // AI 예측도 함께 생성
        uint256 basePrice = 1000000000000000000; // 1 ETH 기본값
        uint256 predictedPrice = basePrice + ((seed % 500000000000000000)); // ±0.5 ETH 변동
        uint256 confidenceScore = 60 + ((seed >> 32) % 35); // 60-95 범위
        uint256 riskScore = 20 + ((seed >> 40) % 60); // 20-80 범위
        uint256 investmentScore = 40 + ((seed >> 48) % 50); // 40-90 범위
        
        this.updateAIPrediction(
            projectId,
            predictedPrice,
            confidenceScore,
            riskScore,
            investmentScore
        );
    }

    // 단순 조회 함수들
    function getAIPrediction(string memory projectId) external view returns (AIPrediction memory) {
        return projectAIPredictions[projectId];
    }

    function getMarketAnalysis(string memory projectId) external view returns (MarketAnalysis memory) {
        return projectMarketAnalysis[projectId];
    }
}
