import { NextResponse } from "next/server";

const projects = [
  {
    id: "seoul-mixed-101",
    name: "서울역 복합 개발",
    location: "서울 중구",
    estimatedValue: 8200,
    riskSummary: "공사비 상승, 분양가 규제, 교통 혼잡 리스크",
  },
  {
    id: "busan-logi-11",
    name: "부산 물류센터 확장",
    location: "부산 강서구",
    estimatedValue: 3200,
    riskSummary: "물류 수요 변동, 금리 상승",
  },
  {
    id: "incheon-office-9",
    name: "인천 에코 오피스",
    location: "인천 연수구",
    estimatedValue: 4500,
    riskSummary: "ESG 인증 지연, 임대 수요 불확실",
  },
];

export async function GET(
  _req: Request,
  context: { params: { id: string } }
) {
  const id = context.params.id;
  const project = projects.find((p) => p.id === id) || null;
  return NextResponse.json({ project });
}


