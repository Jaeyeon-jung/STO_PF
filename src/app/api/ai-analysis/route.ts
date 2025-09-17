import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI 클라이언트 초기화 (안전한 방식)
let openai: OpenAI | null = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.error('OpenAI 클라이언트 초기화 실패:', error);
}

// 프로젝트 데이터 (실제로는 데이터베이스에서 가져올 데이터)
const projectsData = [
  {
    id: "seoul-mixed-101",
    name: "서울역 복합 개발",
    location: "서울 중구",
    estimatedValue: 8200,
    riskSummary: "공사비 상승, 분양가 규제, 교통 혼잡 리스크",
    description: "서울역 인근의 대규모 복합 개발 프로젝트로, 상업시설과 주거시설이 결합된 형태입니다. 교통 접근성이 우수하고 향후 개발 잠재력이 높은 지역입니다.",
    projectedYield: "연 6.5% (임대수익 기반)",
    tokenPrice: "0.1 ETH per token"
  },
  {
    id: "busan-logi-11",
    name: "부산 물류센터 확장",
    location: "부산 강서구",
    estimatedValue: 3200,
    riskSummary: "물류 수요 변동, 금리 상승",
    description: "부산항 인근의 물류센터 확장 프로젝트로, 전자상거래 성장에 따른 물류 수요 증가를 겨냥한 투자입니다.",
    projectedYield: "연 7.2% (물류 임대수익)",
    tokenPrice: "0.05 ETH per token"
  },
  {
    id: "incheon-office-9",
    name: "인천 에코 오피스",
    location: "인천 연수구",
    estimatedValue: 4500,
    riskSummary: "ESG 인증 지연, 임대 수요 불확실",
    description: "친환경 인증을 받은 프리미엄 오피스 빌딩으로, ESG 투자 트렌드에 부합하는 지속가능한 부동산 개발 프로젝트입니다.",
    projectedYield: "연 5.8% (오피스 임대)",
    tokenPrice: "0.08 ETH per token"
  }
];

export async function POST(request: NextRequest) {
  try {
    // OpenAI API 키 확인
    if (!openai) {
      return NextResponse.json({ 
        error: 'OpenAI API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.' 
      }, { status: 500 });
    }

    const { query, projectId } = await request.json();

    if (!query) {
      return NextResponse.json({ error: '질문을 입력해주세요.' }, { status: 400 });
    }

    // 특정 프로젝트에 대한 질문인지 확인
    let projectData = null;
    if (projectId) {
      projectData = projectsData.find(p => p.id === projectId);
    } else {
      // 질문에서 프로젝트 이름을 찾아보기
      for (const project of projectsData) {
        if (query.includes(project.name)) {
          projectData = project;
          break;
        }
      }
    }

    if (!projectData) {
      return NextResponse.json({
        response: "죄송합니다. 문의하신 프로젝트를 찾을 수 없습니다. 현재 분석 가능한 프로젝트는 '서울역 복합 개발', '부산 물류센터 확장', '인천 에코 오피스'입니다."
      });
    }

    // AI 프롬프트 생성
    const systemPrompt = `
당신은 전문 STO(증권형 토큰) 부동산 투자 분석가입니다.
제공된 프로젝트 데이터를 기반으로 사용자의 질문에 대해 객관적이고 명확하게 분석하여 답변해주세요.
주어진 데이터에 없는 내용은 추측하지 말고, '제공된 정보 없음'이라고 명시해주세요.
답변은 한국어로, 친절하고 이해하기 쉬운 전문가 어조를 유지해주세요.
투자 결정은 개인의 책임임을 항상 언급해주세요.
`;

    const userContent = `
[분석 대상 프로젝트 데이터]
- 프로젝트명: ${projectData.name}
- 위치: ${projectData.location}
- 예상 가치: ${projectData.estimatedValue}억원
- 예상 수익률: ${projectData.projectedYield}
- 토큰 가격: ${projectData.tokenPrice}
- 주요 리스크: ${projectData.riskSummary}
- 프로젝트 설명: ${projectData.description}

[사용자 질문]
${query}

위 프로젝트 데이터에 근거하여 사용자 질문에 대해 분석하고 답변해주세요.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 비용 효율적인 모델 사용
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0].message.content;

    return NextResponse.json({
      response: aiResponse,
      project: projectData
    });

  } catch (error) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json(
      { error: 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}

