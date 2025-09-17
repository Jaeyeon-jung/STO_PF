'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Factory, 
  Zap, 
  Road, 
  TreePine, 
  Train,
  Cpu,
  Calendar,
  DollarSign,
  AlertTriangle,
  Leaf,
  TrendingUp,
  MapPin,
  Users,
  Clock
} from 'lucide-react';

// 프로젝트 타입 아이콘 매핑
const projectTypeIcons = {
  0: Building2,    // RESIDENTIAL
  1: Building2,    // COMMERCIAL  
  2: Road,         // INFRASTRUCTURE
  3: Zap,          // ENERGY
  4: Factory,      // INDUSTRIAL
  5: Cpu,          // SMART_CITY
  6: Train         // TRANSPORTATION
};

// 프로젝트 타입 이름 매핑
const projectTypeNames = {
  0: '주거용',
  1: '상업용', 
  2: '인프라',
  3: '에너지',
  4: '산업시설',
  5: '스마트시티',
  6: '교통시설'
};

// 건설 단계 이름 매핑
const phaseNames = {
  0: '기획/설계',
  1: '인허가',
  2: '착공',
  3: '기초공사',
  4: '골조공사',
  5: '내부공사',
  6: '마감공사',
  7: '시험/검수',
  8: '완공'
};

interface ConstructionProject {
  id: string;
  name: string;
  location: string;
  projectType: number;
  contractor: string;
  architect: string;
  totalBudget: string;
  currentSpent: string;
  estimatedDuration: number;
  startDate: number;
  expectedCompletion: number;
  currentPhase: number;
  progressPercentage: number;
  isOnSchedule: boolean;
  isOnBudget: boolean;
  overallRiskScore: number;
  carbonFootprint: number;
  energyEfficiencyScore: number;
  sustainabilityGrade: string;
  riskLevel: string;
  projectStatus: string;
  basePrice: string;
  totalSupply: number;
}

interface ConstructionProjectCardProps {
  project: ConstructionProject;
  onInvest?: (projectId: string) => void;
}

export default function ConstructionProjectCard({ project, onInvest }: ConstructionProjectCardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const ProjectIcon = projectTypeIcons[project.projectType as keyof typeof projectTypeIcons] || Building2;
  
  // 상태에 따른 색상 결정
  const getStatusColor = (status: string) => {
    if (status.includes('Critical')) return 'destructive';
    if (status.includes('Warning')) return 'secondary';
    if (status === 'Completed') return 'default';
    return 'default';
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Very High': return 'destructive';
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'default';
      default: return 'default';
    }
  };

  const getSustainabilityColor = (grade: string) => {
    if (grade.startsWith('A')) return 'default';
    if (grade.startsWith('B')) return 'secondary';
    return 'outline';
  };

  const formatCurrency = (wei: string) => {
    try {
      const eth = parseFloat(wei) / 1e18;
      return `${eth.toLocaleString()} ETH`;
    } catch {
      return '0 ETH';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('ko-KR');
  };

  const calculateDaysRemaining = () => {
    const now = Date.now() / 1000;
    const remaining = project.expectedCompletion - now;
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60)));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ProjectIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">{project.name}</CardTitle>
              <CardDescription className="flex items-center space-x-2 mt-1">
                <MapPin className="h-4 w-4" />
                <span>{project.location}</span>
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge variant={getStatusColor(project.projectStatus)}>
              {project.projectStatus}
            </Badge>
            <Badge variant="outline">
              {projectTypeNames[project.projectType as keyof typeof projectTypeNames]}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="progress">진행상황</TabsTrigger>
            <TabsTrigger value="risk">리스크</TabsTrigger>
            <TabsTrigger value="sustainability">지속가능성</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">시공사:</span>
                  <span className="font-medium">{project.contractor}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">설계사:</span>
                  <span className="font-medium">{project.architect}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">총 예산:</span>
                  <span className="font-medium">{formatCurrency(project.totalBudget)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">공사 기간:</span>
                  <span className="font-medium">{Math.ceil(project.estimatedDuration / 365)}년</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">토큰 가격:</span>
                  <span className="font-medium">{formatCurrency(project.basePrice)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">발행량:</span>
                  <span className="font-medium">{project.totalSupply.toLocaleString()} 토큰</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">시작일:</span>
                  <span className="font-medium">{formatDate(project.startDate)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">완공 예정:</span>
                  <span className="font-medium">{formatDate(project.expectedCompletion)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button 
                onClick={() => onInvest?.(project.id)}
                className="w-full"
                size="lg"
              >
                투자하기 ({formatCurrency(project.basePrice)} / 토큰)
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">전체 진행률</span>
                    <span className="text-sm text-gray-600">{project.progressPercentage}%</span>
                  </div>
                  <Progress value={project.progressPercentage} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">현재 단계</span>
                    <Badge variant="outline">
                      {phaseNames[project.currentPhase as keyof typeof phaseNames]}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">일정 준수</span>
                    <Badge variant={project.isOnSchedule ? 'default' : 'destructive'}>
                      {project.isOnSchedule ? '✅ 정상' : '⚠️ 지연'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">예산 준수</span>
                    <Badge variant={project.isOnBudget ? 'default' : 'destructive'}>
                      {project.isOnBudget ? '✅ 정상' : '⚠️ 초과'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium">예산 집행 현황</span>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>집행액</span>
                      <span>{formatCurrency(project.currentSpent)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>총 예산</span>
                      <span>{formatCurrency(project.totalBudget)}</span>
                    </div>
                    <Progress 
                      value={(parseFloat(project.currentSpent) / parseFloat(project.totalBudget)) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {calculateDaysRemaining()}
                    </div>
                    <div className="text-sm text-gray-600">완공까지 남은 일수</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">종합 리스크 점수</span>
                  <Badge variant={getRiskColor(project.riskLevel)}>
                    {project.riskLevel} ({project.overallRiskScore}/100)
                  </Badge>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">리스크 수준</span>
                    <span className="text-sm text-gray-600">{project.overallRiskScore}/100</span>
                  </div>
                  <Progress value={project.overallRiskScore} className="h-2" />
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">주요 리스크 요소</span>
                  </div>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• 기상 조건에 따른 공사 지연 가능성</li>
                    <li>• 자재비 상승으로 인한 예산 초과 위험</li>
                    <li>• 인허가 지연에 따른 일정 차질</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">리스크 완화 방안</h4>
                <div className="space-y-3">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="font-medium text-green-800 text-sm">보험 가입</div>
                    <div className="text-green-700 text-xs mt-1">
                      건설공사보험 및 배상책임보험 가입으로 재정적 리스크 완화
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="font-medium text-green-800 text-sm">전문가 자문단</div>
                    <div className="text-green-700 text-xs mt-1">
                      각 분야 전문가로 구성된 자문단을 통한 기술적 리스크 관리
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="font-medium text-green-800 text-sm">정기 모니터링</div>
                    <div className="text-green-700 text-xs mt-1">
                      주간 진행상황 점검 및 월간 리스크 재평가 실시
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sustainability" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">지속가능성 등급</span>
                  <Badge variant={getSustainabilityColor(project.sustainabilityGrade)}>
                    {project.sustainabilityGrade}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">에너지 효율성</span>
                      <span className="text-sm text-gray-600">{project.energyEfficiencyScore}/100</span>
                    </div>
                    <Progress value={project.energyEfficiencyScore} className="h-2" />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Leaf className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">탄소 발자국</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {project.carbonFootprint.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-700">톤 CO₂</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">친환경 특징</h4>
                <div className="space-y-3">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="font-medium text-green-800 text-sm">재생 에너지 활용</div>
                    <div className="text-green-700 text-xs mt-1">
                      태양광 패널 설치로 건설 현장 전력 공급
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="font-medium text-green-800 text-sm">친환경 자재</div>
                    <div className="text-green-700 text-xs mt-1">
                      재활용 콘크리트 및 친환경 인증 자재 사용
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="font-medium text-green-800 text-sm">폐기물 관리</div>
                    <div className="text-green-700 text-xs mt-1">
                      건설 폐기물 70% 이상 재활용 목표
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="font-medium text-green-800 text-sm">친환경 인증</div>
                    <div className="text-green-700 text-xs mt-1">
                      녹색건축물 인증 및 LEED 인증 추진
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


