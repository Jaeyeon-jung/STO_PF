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

const regions = ["지역", "서울", "부산", "인천", "경기", "세종"];
const sizes = ["규모", "소형", "중형", "대형"];
const devTypes = ["개발유형", "주거", "상업", "복합", "물류"];
const assetClasses = ["자산군", "토지", "오피스", "리테일", "주거"];
const esgOptions = ["ESG기준", "ESG 고", "ESG 중", "ESG 저"];
const riskLevels = ["리스크수준", "낮음", "중간", "높음"];

type SearchResult = {
  id: string;
  name: string;
  location: string;
  estimatedValue: number;
  riskSummary: string;
};

export default function Home() {
  const [filters, setFilters] = useState<Filters>({
    projectName: "",
    region: regions[0],
    size: sizes[0],
    devType: devTypes[0],
    assetClass: assetClasses[0],
    esg: esgOptions[0],
    risk: riskLevels[0],
  });
  const [results, setResults] = useState<SearchResult[]>([]);
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
      <div className="rounded-lg border bg-white p-6">
        <h1 className="mb-4 text-2xl font-semibold">프로젝트 검색</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            className="border rounded px-3 py-2"
            placeholder="프로젝트명 또는 주소 입력"
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
            <div className="font-medium text-gray-800 mb-1">자동 생성 프롬프트</div>
            <div className="whitespace-pre-wrap break-words">{prompt}</div>
          </div>
          <button
            onClick={onSearch}
            className="shrink-0 inline-flex items-center justify-center rounded bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
            disabled={loading}
          >
            {loading ? "검색 중..." : "검색"}
          </button>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">검색 결과</h2>
        {results.length === 0 ? (
          <div className="text-sm text-gray-500">검색 결과가 없습니다.</div>
        ) : (
          <ul className="divide-y">
            {results.map((item) => (
              <li key={item.id} className="py-4 flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-600">{item.location} · 예상가치 {item.estimatedValue.toLocaleString()}억</div>
                  <div className="text-xs text-rose-600 mt-1">주요 리스크: {item.riskSummary}</div>
                </div>
                <Link className="text-blue-600 hover:underline text-sm" href={`/projects/${item.id}`}>상세 보기</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
