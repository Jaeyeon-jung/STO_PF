'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConstructionProjectCard from '@/components/ConstructionProjectCard';
import { 
  Building2, 
  Factory, 
  Zap, 
  Road, 
  Cpu,
  Train,
  Search,
  Filter,
  TrendingUp,
  BarChart3,
  PieChart
} from 'lucide-react';

// 프로젝트 타입 매핑
const projectTypes = {
  0: { name: '주거용', icon: Building2, color: 'bg-blue-100 text-blue-600' },
  1: { name: '상업용', icon: Building2, color: 'bg-green-100 text-green-600' },
  2: { name: '인프라', icon: Road, color: 'bg-gray-100 text-gray-600' },
  3: { name: '에너지', icon: Zap, color: 'bg-yellow-100 text-yellow-600' },
  4: { name: '산업시설', icon: Factory, color: 'bg-red-100 text-red-600' },
  5: { name: '스마트시티', icon: Cpu, color: 'bg-purple-100 text-purple-600' },
  6: { name: '교통시설', icon: Train, color: 'bg-indigo-100 text-indigo-600' }
};

// 샘플 데이터 (실제로는 API에서 가져옴)
const sampleProjects = [
  {
    id: "busan-bridge-2025",
    name: "부산 해상대교 건설",
    location: "부산광역시 해운대구",
    projectType: 2,
    contractor: "현대건설",
    architect: "삼성물산",
    totalBudget: "100000000000000000000000", // 100,000 ETH in wei
    currentSpent: "25000000000000000000000",   // 25,000 ETH in wei
    estimatedDuration: 1825,
    startDate: 1704067200, // 2024-01-01
    expectedCompletion: 1861920000, // 2029-01-01
    currentPhase: 3, // FOUNDATION
    progressPercentage: 25,
    isOnSchedule: true,
    isOnBudget: true,
    overallRiskScore: 55,
    carbonFootprint: 15000,
    energyEfficiencyScore: 75,
    sustainabilityGrade: "B+",
    riskLevel: "Medium",
    projectStatus: "On Track",
    basePrice: "50000000000000000000", // 50 ETH in wei
    totalSupply: 2000
  },
  {
    id: "solar-plant-jeju",
    name: "제주 해상풍력 발전단지",
    location: "제주특별자치도 서귀포시",
    projectType: 3,
    contractor: "두산에너빌리티",
    architect: "한국전력공사",
    totalBudget: "80000000000000000000000", // 80,000 ETH in wei
    currentSpent: "12000000000000000000000", // 12,000 ETH in wei
    estimatedDuration: 1095,
    startDate: 1704067200,
    expectedCompletion: 1798761600,
    currentPhase: 2, // GROUNDBREAKING
    progressPercentage: 15,
    isOnSchedule: true,
    isOnBudget: true,
    overallRiskScore: 30,
    carbonFootprint: 2000,
    energyEfficiencyScore: 95,
    sustainabilityGrade: "A+",
    riskLevel: "Low",
    projectStatus: "On Track",
    basePrice: "25000000000000000000", // 25 ETH in wei
    totalSupply: 4000
  },
  {
    id: "smart-city-songdo",
    name: "송도 스마트시티 2단계",
    location: "인천광역시 연수구 송도동",
    projectType: 5,
    contractor: "포스코건설",
    architect: "KPF + 삼우설계",
    totalBudget: "150000000000000000000000", // 150,000 ETH in wei
    currentSpent: "45000000000000000000000", // 45,000 ETH in wei
    estimatedDuration: 2190,
    startDate: 1704067200,
    expectedCompletion: 1893456000,
    currentPhase: 4, // STRUCTURE
    progressPercentage: 30,
    isOnSchedule: false,
    isOnBudget: true,
    overallRiskScore: 65,
    carbonFootprint: 8000,
    energyEfficiencyScore: 90,
    sustainabilityGrade: "A",
    riskLevel: "Medium",
    projectStatus: "Warning - Behind Schedule",
    basePrice: "30000000000000000000", // 30 ETH in wei
    totalSupply: 5000
  }
];

export default function ConstructionPage() {
  const [projects, setProjects] = useState(sampleProjects);
  const [filteredProjects, setFilteredProjects] = useState(sampleProjects);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // 필터링 로직
  useEffect(() => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(project => 
        project.projectType === parseInt(selectedType)
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(project => {
        switch (selectedStatus) {
          case 'on-track': return project.projectStatus === 'On Track';
          case 'warning': return project.projectStatus.includes('Warning');
          case 'critical': return project.projectStatus.includes('Critical');
          case 'completed': return project.projectStatus === 'Completed';
          default: return true;
        }
      });
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, selectedType, selectedStatus]);

  // 통계 계산
  const stats = {
    totalProjects: projects.length,
    totalInvestment: projects.reduce((sum, p) => sum + parseFloat(p.totalBudget) / 1e18, 0),
    averageProgress: projects.reduce((sum, p) => sum + p.progressPercentage, 0) / projects.length,
    onTrackProjects: projects.filter(p => p.projectStatus === 'On Track').length
  };

  const handleInvest = (projectId: string) => {
    console.log(`투자하기: ${projectId}`);
    // 실제 투자 로직 구현
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">대규모 건설 프로젝트</h1>
        <p className="text-gray-600">블록체인 기반 건설 프로젝트 투자 플랫폼</p>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projects">프로젝트 목록</TabsTrigger>
          <TabsTrigger value="analytics">투자 분석</TabsTrigger>
          <TabsTrigger value="portfolio">포트폴리오</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalProjects}</div>
                    <div className="text-sm text-gray-600">총 프로젝트</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalInvestment.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                    <div className="text-sm text-gray-600">총 투자 규모 (ETH)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold">{stats.averageProgress.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">평균 진행률</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold">{stats.onTrackProjects}</div>
                    <div className="text-sm text-gray-600">정상 진행 중</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 필터 및 검색 */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="프로젝트명 또는 위치로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="프로젝트 타입" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 타입</SelectItem>
                {Object.entries(projectTypes).map(([key, type]) => (
                  <SelectItem key={key} value={key}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="진행 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="on-track">정상 진행</SelectItem>
                <SelectItem value="warning">주의 필요</SelectItem>
                <SelectItem value="critical">위험</SelectItem>
                <SelectItem value="completed">완공</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 프로젝트 타입별 필터 버튼 */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('all')}
            >
              전체
            </Button>
            {Object.entries(projectTypes).map(([key, type]) => {
              const Icon = type.icon;
              return (
                <Button
                  key={key}
                  variant={selectedType === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(key)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{type.name}</span>
                </Button>
              );
            })}
          </div>

          {/* 프로젝트 목록 */}
          <div className="space-y-6">
            {filteredProjects.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-gray-500">검색 조건에 맞는 프로젝트가 없습니다.</div>
                </CardContent>
              </Card>
            ) : (
              filteredProjects.map((project) => (
                <ConstructionProjectCard
                  key={project.id}
                  project={project}
                  onInvest={handleInvest}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>프로젝트 타입별 분포</CardTitle>
                <CardDescription>투자 규모 기준</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(projectTypes).map(([key, type]) => {
                    const typeProjects = projects.filter(p => p.projectType === parseInt(key));
                    const totalInvestment = typeProjects.reduce((sum, p) => sum + parseFloat(p.totalBudget) / 1e18, 0);
                    const percentage = totalInvestment / stats.totalInvestment * 100;
                    
                    if (totalInvestment === 0) return null;
                    
                    const Icon = type.icon;
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4" />
                            <span className="text-sm font-medium">{type.name}</span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {totalInvestment.toLocaleString(undefined, {maximumFractionDigits: 0})} ETH ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>리스크 분석</CardTitle>
                <CardDescription>프로젝트별 리스크 수준</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium truncate">{project.name}</span>
                        <Badge variant={
                          project.riskLevel === 'Low' ? 'default' :
                          project.riskLevel === 'Medium' ? 'secondary' : 'destructive'
                        }>
                          {project.riskLevel}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            project.overallRiskScore < 40 ? 'bg-green-500' :
                            project.overallRiskScore < 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${project.overallRiskScore}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>내 투자 포트폴리오</CardTitle>
              <CardDescription>투자한 건설 프로젝트 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-gray-500">
                  아직 투자한 프로젝트가 없습니다.<br/>
                  위 프로젝트들에 투자해보세요!
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


