import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
let openai: OpenAI | null = null;

try {
  console.log('🔑 환경 변수 확인:', {
    hasApiKey: !!process.env.OPENAI_API_KEY,
    keyLength: process.env.OPENAI_API_KEY?.length || 0,
    keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) + '...'
  });
  
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI 클라이언트 초기화 성공');
  } else {
    console.log('⚠️ OPENAI_API_KEY가 설정되지 않음');
  }
} catch (error) {
  console.error('❌ OpenAI 클라이언트 초기화 실패:', error);
}

// AI 기반 가격 예측 및 리스크 분석
export async function POST(request: NextRequest) {
  try {
    const { 
      projectData, 
      chainlinkData, 
      customMetrics, 
      marketData 
    } = await request.json();

    console.log('🚀 AI 분석 요청 받음:', { hasOpenAI: !!openai, projectName: projectData?.name });
    
    if (!openai) {
      console.log('⚠️ OpenAI API 클라이언트 없음 - Mock 데이터 반환');
      const mockAnalysis = {
        priceValuation: 85,
        priceDirection: "상승",
        expectedChange: 12.5,
        riskFactors: [
          { factor: "시장 변동성", impact: 6 },
          { factor: "규제 리스크", impact: 4 },
          { factor: "개발 지연", impact: 5 }
        ],
        investmentScore: 78,
        monitoringIndicators: [
          "지역 부동산 지수 변화",
          "임대 수요율 추이", 
          "건설 진행률"
        ]
      };

      const recommendedActions = generateRecommendedActions(mockAnalysis, customMetrics || {});
      const dataQuality = assessDataQuality(chainlinkData || {}, customMetrics || {}, marketData || {});

      console.log('Mock AI 분석 응답:', { aiAnalysis: mockAnalysis, recommendedActions, dataQuality });

      return NextResponse.json({
        aiAnalysis: mockAnalysis,
        recommendedActions,
        timestamp: new Date().toISOString(),
        dataQuality
      });
    }

    // AI 프롬프트 생성 - 복합적인 데이터 분석
    const systemPrompt = `
당신은 세계 최고 수준의 부동산 투자 분석 AI입니다. 
다음 능력을 가지고 있습니다:
1. 체인링크 오라클 데이터 해석
2. 부동산 시장 트렌드 분석
3. 리스크 요소 평가
4. 가격 예측 모델링
5. 투자 점수 산출

주어진 데이터를 종합적으로 분석하여 다음 JSON 구조로 정확히 응답해주세요:

{
  "priceValuation": 85,
  "priceDirection": "상승",
  "expectedChange": 12.5,
  "riskFactors": [
    {"factor": "시장 변동성", "impact": 7},
    {"factor": "규제 리스크", "impact": 5},
    {"factor": "개발 지연", "impact": 4}
  ],
  "investmentScore": 78,
  "monitoringIndicators": [
    "지역 부동산 지수 변화",
    "임대 수요율 추이",
    "건설 진행률"
  ]
}

반드시 위와 같은 JSON 형태로만 응답해주세요. 다른 설명 없이 JSON만 제공해주세요.
`;

    const userContent = `
[프로젝트 기본 정보]
- 프로젝트명: ${projectData.name}
- 위치: ${projectData.location}
- 현재 토큰 가격: ${projectData.currentPrice} ETH
- 기본 가격: ${projectData.basePrice} ETH
- 총 공급량: ${projectData.totalSupply} tokens

[체인링크 실시간 데이터]
- ETH/USD 환율: ${chainlinkData.ethUsdPrice || '데이터 없음'} USD
- BTC/USD 환율: ${chainlinkData.btcUsdPrice || '데이터 없음'} USD
- GOLD/USD 가격: ${chainlinkData.goldUsdPrice || '데이터 없음'} USD
- S&P500 지수: ${chainlinkData.sp500Index || '데이터 없음'}
- EUR/USD 환율: ${chainlinkData.eurUsdRate || '데이터 없음'}
- KRW/USD 환율: ${chainlinkData.krwUsdRate || '데이터 없음'}
- 부동산 지수: ${chainlinkData.realEstateIndex || '데이터 없음'}
- 시장 변동성: ${chainlinkData.volatility || '데이터 없음'}%
- 데이터 품질: ${chainlinkData.dataQuality || 0}/100
- 마지막 업데이트: ${chainlinkData.lastUpdated || '알 수 없음'}

[커스텀 메트릭]
- 지역 수요 지수: ${customMetrics.localDemandIndex}/1000
- 개발 진행률: ${customMetrics.developmentProgress}%
- 인프라 점수: ${customMetrics.infraScore}/100
- 종합 커스텀 점수: ${customMetrics.compositeScore}/100

[시장 데이터]
- 최근 부동산 거래량: ${marketData.transactionVolume || '데이터 없음'}
- 지역 평균 가격 상승률: ${marketData.priceGrowthRate || '데이터 없음'}
- 경제 지표 (금리, 물가 등): ${marketData.economicIndicators || '데이터 없음'}

위 데이터를 종합 분석하여 투자 의사결정에 도움이 되는 인사이트를 제공해주세요.
`;

    console.log('🤖 OpenAI API 호출 시작...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      temperature: 0.2, // 일관성 있는 분석을 위해 낮은 값
      max_tokens: 1500,
    });
    
    console.log('✅ OpenAI API 응답 받음:', { 
      choices: completion.choices?.length,
      hasContent: !!completion.choices[0]?.message?.content 
    });

    let aiAnalysis;
    const aiResponse = completion.choices[0].message.content;
    console.log('🔍 OpenAI 원본 응답:', aiResponse?.substring(0, 500) + '...');
    
    try {
      // AI 응답을 JSON으로 파싱 시도
      const jsonMatch = aiResponse?.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        console.log('📝 JSON 파싱 시도:', jsonMatch[0].substring(0, 200) + '...');
        aiAnalysis = JSON.parse(jsonMatch[0]);
        console.log('✅ JSON 파싱 성공:', Object.keys(aiAnalysis));
      } else {
        console.log('⚠️ JSON 형태 아님 - 텍스트 파싱으로 대체');
        // JSON이 아닐 때 텍스트에서 정보 추출
        aiAnalysis = parseTextResponse(aiResponse || '');
      }
    } catch (parseError) {
      console.log('❌ JSON 파싱 실패:', parseError);
      // JSON 파싱 실패시 텍스트 파싱으로 대체
      aiAnalysis = parseTextResponse(aiResponse || '');
    }

    // AI 분석 결과를 바탕으로 추천 액션 계산
    const recommendedActions = generateRecommendedActions(aiAnalysis, customMetrics);

    return NextResponse.json({
      aiAnalysis,
      recommendedActions,
      timestamp: new Date().toISOString(),
      dataQuality: assessDataQuality(chainlinkData, customMetrics, marketData)
    });

  } catch (error) {
    console.error('AI Price Prediction Error:', error);
    return NextResponse.json(
      { error: 'AI 가격 예측 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 텍스트 응답에서 구조화된 데이터 추출
function parseTextResponse(text: string) {
  console.log('📊 텍스트 응답 파싱 시작');
  
  // 기본값 설정
  let analysis = {
    priceValuation: 70,
    priceDirection: "보합",
    expectedChange: 0,
    riskFactors: [
      { factor: "시장 불확실성", impact: 5 },
      { factor: "경제 환경 변화", impact: 4 },
      { factor: "규제 리스크", impact: 3 }
    ],
    investmentScore: 65,
    monitoringIndicators: [
      "시장 동향 모니터링",
      "프로젝트 진행 상황",
      "경제 지표 변화"
    ],
    rawResponse: text
  };

  try {
    // 가격 적정성 추출 (1-100점)
    const priceMatch = text.match(/가격.*적정성.*?(\d+)/i) || text.match(/적정.*?(\d+)점/i);
    if (priceMatch) analysis.priceValuation = parseInt(priceMatch[1]);

    // 투자 점수 추출 (1-100점)
    const investMatch = text.match(/투자.*점수.*?(\d+)/i) || text.match(/추천도.*?(\d+)/i);
    if (investMatch) analysis.investmentScore = parseInt(investMatch[1]);

    // 가격 방향 추출
    if (text.includes('상승') || text.includes('증가')) {
      analysis.priceDirection = "상승";
      analysis.expectedChange = 8.5;
    } else if (text.includes('하락') || text.includes('감소')) {
      analysis.priceDirection = "하락";
      analysis.expectedChange = -3.2;
    } else {
      analysis.priceDirection = "보합";
      analysis.expectedChange = 2.1;
    }

    // 리스크 요소 추출
    const riskMatches = text.match(/리스크.*?[:：]\s*(.+?)(?:\n|$)/gi);
    if (riskMatches && riskMatches.length > 0) {
      analysis.riskFactors = riskMatches.slice(0, 4).map((risk, index) => ({
        factor: risk.replace(/리스크.*?[:：]\s*/, '').trim(),
        impact: 7 - index
      }));
    }

    console.log('✅ 텍스트 파싱 완료:', {
      priceValuation: analysis.priceValuation,
      investmentScore: analysis.investmentScore,
      direction: analysis.priceDirection
    });

  } catch (error) {
    console.log('⚠️ 텍스트 파싱 중 오류:', error);
  }

  return analysis;
}

// 데이터 품질 평가
function assessDataQuality(chainlinkData: any, customMetrics: any, marketData: any) {
  let score = 0;
  let maxScore = 0;

  // 체인링크 데이터 품질
  maxScore += 30;
  if (chainlinkData.ethUsdPrice) score += 15;
  if (chainlinkData.realEstateIndex) score += 15;

  // 커스텀 메트릭 품질
  maxScore += 40;
  if (customMetrics.localDemandIndex !== undefined) score += 15;
  if (customMetrics.developmentProgress !== undefined) score += 15;
  if (customMetrics.infraScore !== undefined) score += 10;

  // 시장 데이터 품질
  maxScore += 30;
  if (marketData.transactionVolume) score += 10;
  if (marketData.priceGrowthRate) score += 10;
  if (marketData.economicIndicators) score += 10;

  return {
    score: Math.round((score / maxScore) * 100),
    missingData: {
      chainlink: !chainlinkData.ethUsdPrice || !chainlinkData.realEstateIndex,
      custom: customMetrics.localDemandIndex === undefined,
      market: !marketData.transactionVolume
    }
  };
}

// AI 분석 결과를 바탕으로 추천 액션 생성
function generateRecommendedActions(aiAnalysis: any, customMetrics: any) {
  const actions = [];

  // 개발 진행률 기반 액션
  if (customMetrics.developmentProgress < 30) {
    actions.push({
      type: 'monitor',
      priority: 'medium',
      action: '개발 진행 상황을 주기적으로 모니터링하세요.',
      reason: '개발 초기 단계로 진행률 변화에 민감할 수 있습니다.'
    });
  }

  // 수요 지수 기반 액션
  if (customMetrics.localDemandIndex > 800) {
    actions.push({
      type: 'buy',
      priority: 'high',
      action: '높은 지역 수요로 인한 투자 기회를 고려하세요.',
      reason: '지역 수요 지수가 800 이상으로 매우 높습니다.'
    });
  } else if (customMetrics.localDemandIndex < 300) {
    actions.push({
      type: 'caution',
      priority: 'high',
      action: '낮은 지역 수요에 대한 리스크를 신중히 검토하세요.',
      reason: '지역 수요 지수가 300 미만으로 낮습니다.'
    });
  }

  // 인프라 점수 기반 액션
  if (customMetrics.infraScore > 85) {
    actions.push({
      type: 'positive',
      priority: 'medium',
      action: '우수한 인프라 환경이 장기 투자 가치를 뒷받침합니다.',
      reason: '인프라 점수가 85점 이상으로 우수합니다.'
    });
  }

  return actions;
}
