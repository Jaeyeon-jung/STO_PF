"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

type Project = {
  id: string;
  name: string;
  location: string;
  estimatedValue: number;
  riskSummary: string;
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/projects/${params.id}`);
      const data = await res.json();
      setProject(data.project);
      setLoading(false);
    }
    load();
  }, [params.id]);

  const valueSeries = [
    { year: "Y0", value: 100 },
    { year: "Y1", value: 108 },
    { year: "Y2", value: 117 },
    { year: "Y3", value: 129 },
    { year: "Y4", value: 141 },
  ];

  const riskRadar = [
    { metric: "ESG/TNFD", score: 72 },
    { metric: "금융", score: 58 },
    { metric: "시장", score: 63 },
    { metric: "공사", score: 55 },
    { metric: "규제", score: 49 },
  ];

  if (loading) return <div>로딩 중...</div>;
  if (!project) return <div>프로젝트를 찾을 수 없습니다.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <div className="text-sm text-gray-600">{project.location}</div>
        </div>
        <Link className="text-blue-600 hover:underline text-sm" href="/">← 목록으로</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded border bg-white p-4">
          <div className="font-medium mb-2">자산 가치 평가</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={valueSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-sm text-gray-600">예상 IRR 12.4%, DCF 가치 {project.estimatedValue.toLocaleString()}억</div>
        </div>

        <div className="rounded border bg-white p-4">
          <div className="font-medium mb-2">리스크 지표</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={riskRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="리스크" dataKey="score" stroke="#16a34a" fill="#16a34a" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-sm text-gray-600">요약: {project.riskSummary}</div>
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <div className="font-medium mb-3">액션</div>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Invest</button>
          <button className="px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-900">Risk Deep Dive</button>
          <button className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Return Simulation</button>
          <button className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">ESG Impact</button>
        </div>
      </div>
    </div>
  );
}


