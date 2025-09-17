// 실제 뉴스 이벤트 생성 서비스
export interface NewsEvent {
  month: number;
  event: string;
  impact: 'positive' | 'negative' | 'neutral';
  severity: number; // 0-1
}

class NewsEventService {
  // 실제 부동산 관련 이벤트 템플릿
  private static eventTemplates = {
    positive: [
      { text: "대규모 인프라 투자 계획 발표", impact: 0.8 },
      { text: "지역 개발 프로젝트 승인", impact: 0.7 },
      { text: "교통 인프라 개선 확정", impact: 0.6 },
      { text: "대기업 본사 이전 결정", impact: 0.9 },
      { text: "신도시 개발 계획 발표", impact: 0.8 },
      { text: "지하철 노선 연장 확정", impact: 0.7 },
      { text: "대형 쇼핑몰 입점 확정", impact: 0.6 },
      { text: "친환경 인증 획득", impact: 0.5 },
      { text: "사전 분양 성공", impact: 0.7 },
      { text: "건설사 수주 확정", impact: 0.6 }
    ],
    negative: [
      { text: "공사비 상승 압박", impact: -0.6 },
      { text: "인허가 지연", impact: -0.7 },
      { text: "환경 규제 강화", impact: -0.5 },
      { text: "금리 인상 우려", impact: -0.8 },
      { text: "분양가 상한제 강화", impact: -0.7 },
      { text: "건설 인력 부족", impact: -0.6 },
      { text: "원자재 가격 급등", impact: -0.8 },
      { text: "부동산 규제 강화", impact: -0.9 },
      { text: "경기 둔화 우려", impact: -0.7 },
      { text: "공급 과잉 우려", impact: -0.6 }
    ],
    neutral: [
      { text: "정기 안전 점검 실시", impact: 0.1 },
      { text: "공사 진척률 발표", impact: 0.0 },
      { text: "투자자 설명회 개최", impact: 0.1 },
      { text: "분기 실적 발표", impact: 0.0 },
      { text: "운영 현황 보고", impact: 0.1 },
      { text: "시장 동향 분석", impact: 0.0 },
      { text: "품질 관리 점검", impact: 0.1 },
      { text: "파트너십 체결", impact: 0.2 },
      { text: "기술 도입 검토", impact: 0.1 },
      { text: "지속가능성 보고서 발행", impact: 0.2 }
    ]
  };

  // 월별 이벤트 확률 (계절성 반영)
  private static monthlyEventProbability = {
    1: { positive: 0.4, negative: 0.3, neutral: 0.3 }, // 신년 계획
    2: { positive: 0.3, negative: 0.4, neutral: 0.3 }, // 공사 재개 어려움
    3: { positive: 0.6, negative: 0.2, neutral: 0.2 }, // 봄철 활성화
    4: { positive: 0.7, negative: 0.2, neutral: 0.1 }, // 분양 시즌
    5: { positive: 0.6, negative: 0.2, neutral: 0.2 }, // 성수기
    6: { positive: 0.4, negative: 0.3, neutral: 0.3 }, // 중간 점검
    7: { positive: 0.3, negative: 0.4, neutral: 0.3 }, // 여름철 공사 어려움
    8: { positive: 0.3, negative: 0.4, neutral: 0.3 }, // 휴가철
    9: { positive: 0.6, negative: 0.2, neutral: 0.2 }, // 가을 활성화
    10: { positive: 0.7, negative: 0.2, neutral: 0.1 }, // 분양 성수기
    11: { positive: 0.5, negative: 0.3, neutral: 0.2 }, // 연말 준비
    12: { positive: 0.4, negative: 0.3, neutral: 0.3 }  // 연말 정리
  };

  // 프로젝트별 특성에 따른 이벤트 생성
  static generateMonthlyEvents(project: any, marketData: any, customScore: number): NewsEvent[] {
    const events: NewsEvent[] = [];
    
    for (let month = 1; month <= 12; month++) {
      const event = this.generateSingleEvent(month, project, marketData, customScore);
      events.push(event);
    }
    
    return events;
  }

  private static generateSingleEvent(
    month: number, 
    project: any, 
    marketData: any, 
    customScore: number
  ): NewsEvent {
    const monthProb = this.monthlyEventProbability[month as keyof typeof this.monthlyEventProbability];
    
    // 시장 상황과 프로젝트 점수에 따라 확률 조정
    const marketMultiplier = marketData.seoulRealEstateIndex > 105 ? 1.2 : 0.8;
    const scoreMultiplier = customScore > 70 ? 1.1 : 0.9;
    
    const adjustedProb = {
      positive: monthProb.positive * marketMultiplier * scoreMultiplier,
      negative: monthProb.negative * (2 - marketMultiplier) * (2 - scoreMultiplier),
      neutral: monthProb.neutral
    };
    
    // 정규화
    const total = adjustedProb.positive + adjustedProb.negative + adjustedProb.neutral;
    const normalizedProb = {
      positive: adjustedProb.positive / total,
      negative: adjustedProb.negative / total,
      neutral: adjustedProb.neutral / total
    };
    
    // 이벤트 타입 결정
    const random = Math.random();
    let eventType: 'positive' | 'negative' | 'neutral';
    
    if (random < normalizedProb.positive) {
      eventType = 'positive';
    } else if (random < normalizedProb.positive + normalizedProb.negative) {
      eventType = 'negative';
    } else {
      eventType = 'neutral';
    }
    
    // 이벤트 선택
    const templates = this.eventTemplates[eventType];
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    // 프로젝트별 커스터마이징
    let eventText = selectedTemplate.text;
    if (project.location.includes('서울')) {
      eventText = eventText.replace('지역', '서울시');
    } else if (project.location.includes('부산')) {
      eventText = eventText.replace('지역', '부산시');
    }
    
    // 프로젝트 이름 반영
    if (project.name.includes('복합')) {
      eventText = eventText.replace('프로젝트', '복합개발사업');
    } else if (project.name.includes('주거')) {
      eventText = eventText.replace('프로젝트', '주거단지');
    }
    
    return {
      month,
      event: `${month}월: ${eventText}`,
      impact: eventType,
      severity: Math.abs(selectedTemplate.impact)
    };
  }

  // 실제 뉴스 API에서 관련 뉴스 가져오기 (미래 구현)
  static async fetchRealNews(projectLocation: string, keywords: string[]): Promise<string[]> {
    try {
      // 실제로는 뉴스 API 사용 (예: 네이버 뉴스 API, 구글 뉴스 API)
      // const response = await fetch(`https://openapi.naver.com/v1/search/news.json?query=${keywords.join('+')}`);
      
      // 현재는 시뮬레이션
      return [
        "부동산 시장 안정화 정책 발표",
        "건설업계 디지털 전환 가속화",
        "친환경 건축 기준 강화",
        "스마트시티 프로젝트 확산"
      ];
    } catch (error) {
      console.error('뉴스 데이터 조회 실패:', error);
      return [];
    }
  }
}

export default NewsEventService;



