"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Filters = {
  projectName: string;
  region: string;
  size: string;
  devType: string;
  assetClass: string;
  esg: string;
  risk: string;
};

const regions = ["전체", "서울", "부산", "인천", "경기", "세종"];
const sizes = ["전체", "소형", "중형", "대형"];
const devTypes = ["전체", "주거", "상업", "복합", "물류"];
const assetClasses = ["전체", "토지", "오피스", "리테일", "주거"];
const esgOptions = ["무관", "ESG 고", "ESG 중", "ESG 저"];
const riskLevels = ["전체", "낮음", "중간", "높음"];

export default function AISearchPage() {
  const [filters, setFilters] = useState<Filters>({
    projectName: "",
    region: regions[0],
    size: sizes[0],
    devType: devTypes[0],
    assetClass: assetClasses[0],
    esg: esgOptions[0],
    risk: riskLevels[0],
  });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const prompt = useMemo(() => {
    const parts = [
      `프로젝트명: ${filters.projectName || "(미입력)"}`,
      `지역: ${filters.region}`,
      `규모: ${filters.size}`,
      `개발유형: ${filters.devType}`,
      `자산군: ${filters.assetClass}`,
      `ESG: ${filters.esg}`,
      `리스크: ${filters.risk}`,
    ];
    return `부동산 개발 프로젝트 검색 및 분석 요약을 반환하세요. ${parts.join(", ")}`;
  }, [filters]);

  async function onSearch() {
    setLoading(true);
    try {
      const res = await fetch(`/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters, prompt }),
      });
      const data = await res.json();
      setResults(data.items || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🤖 AI 기반 프로젝트 검색
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          체인링크 오라클 + 커스텀 데이터 + AI 분석을 활용하여 
          최적의 부동산 투자 프로젝트를 찾아보세요
        </p>
      </div>

      {/* AI 기능 소개 */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6 mb-6">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">🧠 AI 강화 검색 기능</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold text-gray-800">실시간 데이터</div>
              <div className="text-gray-700 text-sm">체인링크 오라클 시장 데이터</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-semibold text-gray-800">스마트 필터링</div>
              <div className="text-gray-700 text-sm">AI 기반 맞춤형 추천</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-2xl mb-2">📈</div>
              <div className="font-semibold text-gray-800">리스크 분석</div>
              <div className="text-gray-700 text-sm">GPT 기반 위험도 평가</div>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 필터 */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-2xl font-semibold">🔍 프로젝트 검색</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            className="border rounded px-3 py-2"
            placeholder="프로젝트명 입력"
            value={filters.projectName}
            onChange={(e) => setFilters({ ...filters, projectName: e.target.value })}
          />
          <select className="border rounded px-3 py-2" value={filters.region} onChange={(e) => setFilters({ ...filters, region: e.target.value })}>
            {regions.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select className="border rounded px-3 py-2" value={filters.size} onChange={(e) => setFilters({ ...filters, size: e.target.value })}>
            {sizes.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select className="border rounded px-3 py-2" value={filters.devType} onChange={(e) => setFilters({ ...filters, devType: e.target.value })}>
            {devTypes.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select className="border rounded px-3 py-2" value={filters.assetClass} onChange={(e) => setFilters({ ...filters, assetClass: e.target.value })}>
            {assetClasses.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select className="border rounded px-3 py-2" value={filters.esg} onChange={(e) => setFilters({ ...filters, esg: e.target.value })}>
            {esgOptions.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select className="border rounded px-3 py-2" value={filters.risk} onChange={(e) => setFilters({ ...filters, risk: e.target.value })}>
            {riskLevels.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="text-xs text-gray-600 flex-1 bg-gray-50 border rounded p-3">
            <div className="font-medium text-gray-800 mb-1">🤖 AI 자동 생성 프롬프트</div>
            <div className="whitespace-pre-wrap break-words">{prompt}</div>
          </div>
          <button
            onClick={onSearch}
            className="shrink-0 inline-flex items-center justify-center rounded bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 font-semibold"
            disabled={loading}
          >
            {loading ? "🔍 AI 분석 중..." : "🚀 AI 검색 시작"}
          </button>
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold flex items-center">
          📋 AI 분석 결과
          {results.length > 0 && (
            <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
              {results.length}개 발견
            </span>
          )}
        </h2>
        
        {results.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🤖</div>
            <div className="text-gray-500 mb-2">아직 검색 결과가 없습니다</div>
            <div className="text-sm text-gray-400">위의 필터를 설정하고 AI 검색을 시작해보세요</div>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-lg text-gray-900 mb-1">{item.name}</div>
                    <div className="text-sm text-gray-700 mb-2">
                      📍 {item.location} • 💰 예상가치 {item.estimatedValue.toLocaleString()}억원
                    </div>
                    <div className="text-sm text-red-700 bg-red-50 px-2 py-1 rounded">
                      ⚠️ 주요 리스크: {item.riskSummary}
                    </div>
                  </div>
                  <Link 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors" 
                    href={`/projects/${item.id}`}
                  >
                    상세 분석 보기 →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 안내 */}
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">💡 AI 검색 팁</h3>
        <p className="text-gray-600 text-sm">
          더 정확한 결과를 원하시면 구체적인 조건을 설정해보세요. 
          AI가 여러 데이터 소스를 분석하여 최적의 투자 기회를 찾아드립니다.
        </p>
      </div>
    </div>
  );
}
