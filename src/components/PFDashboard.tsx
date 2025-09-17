'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar,
  Users,
  Banknote,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Percent
} from 'lucide-react';

// PF 단계 매핑
const pfPhases = {
  0: { name: '기획', color: 'bg-gray-100 text-gray-600', icon: Building2 },
  1: { name: '금융조달완료', color: 'bg-blue-100 text-blue-600', icon: Banknote },
  2: { name: '건설', color: 'bg-orange-100 text-orange-600', icon: Building2 },
  3: { name: '운영', color: 'bg-green-100 text-green-600', icon: TrendingUp },
  4: { name: '리파이낸싱', color: 'bg-purple-100 text-purple-600', icon: Percent },
  5: { name: '출구', color: 'bg-red-100 text-red-600', icon: Target }
};

interface PFProject {
  id: string;
  name: string;
  location: string;
  totalProjectCost: string;
  equityAmount: string;
  debtAmount: string;
  equityRatio: number;
  debtRatio: number;
  stoTokenSupply: number;
  stoTokenPrice: string;
  currentPhase: number;
  totalRevenue: string;
  operatingExpenses: string;
  netCashFlow: string;
  dscr: number; // basis points
  totalDividendsPaid: string;
  equityRaised: string;
  debtRaised: string;
  lenders: string[];
  interestRates: number[];
  maturityDates: number[];
  isFinancialClosed: boolean;
  financialCloseDate?: number;
}

interface InvestorPosition {
  projectId: string;
  tokenAmount: number;
  investmentAmount: string;
  totalDividends: string;
  pendingDividends: string;
  currentValue: string;
  roi: number;
}

interface PFDashboardProps {
  projects: PFProject[];
  investorPositions: InvestorPosition[];
  onInvest?: (projectId: string, amount: string) => void;
  onClaimDividends?: (projectId: string) => void;
}

export default function PFDashboard({ 
  projects, 
  investorPositions, 
  onInvest, 
  onClaimDividends 
}: PFDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProject, setSelectedProject] = useState<string>('');

  const formatCurrency = (wei: string) => {
    try {
      const eth = parseFloat(wei) / 1e18;
      if (eth >= 1000000) return `${(eth / 1000000).toFixed(1)}M ETH`;
      if (eth >= 1000) return `${(eth / 1000).toFixed(1)}K ETH`;
      return `${eth.toLocaleString()} ETH`;
    } catch {
      return '0 ETH';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('ko-KR');
  };

  const formatDSCR = (dscr: number) => {
    return (dscr / 10000).toFixed(2) + 'x';
  };

  // 포트폴리오 통계 계산
  const portfolioStats = {
    totalInvestment: investorPositions.reduce((sum, pos) => sum + parseFloat(pos.investmentAmount) / 1e18, 0),
    totalDividends: investorPositions.reduce((sum, pos) => sum + parseFloat(pos.totalDividends) / 1e18, 0),
    pendingDividends: investorPositions.reduce((sum, pos) => sum + parseFloat(pos.pendingDividends) / 1e18, 0),
    averageROI: investorPositions.reduce((sum, pos) => sum + pos.roi, 0) / Math.max(investorPositions.length, 1),
    projectCount: investorPositions.length
  };

  const getDSCRColor = (dscr: number) => {
    const ratio = dscr / 10000;
    if (ratio >= 1.5) return 'text-green-600';
    if (ratio >= 1.2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPhaseProgress = (phase: number) => {
    return ((phase + 1) / 6) * 100;
  };

  return (
    <div className="space-y-6">
      {/* 포트폴리오 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{portfolioStats.totalInvestment.toFixed(2)}</div>
                <div className="text-sm text-gray-600">총 투자금액 (ETH)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{portfolioStats.totalDividends.toFixed(2)}</div>
                <div className="text-sm text-gray-600">총 배당수익 (ETH)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{portfolioStats.pendingDividends.toFixed(2)}</div>
                <div className="text-sm text-gray-600">대기 배당 (ETH)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{portfolioStats.averageROI.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">평균 ROI</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">프로젝트 개요</TabsTrigger>
          <TabsTrigger value="investments">내 투자</TabsTrigger>
          <TabsTrigger value="cashflow">현금흐름</TabsTrigger>
          <TabsTrigger value="financing">금융구조</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {projects.map((project) => {
              const PhaseIcon = pfPhases[project.currentPhase as keyof typeof pfPhases]?.icon || Building2;
              const phaseInfo = pfPhases[project.currentPhase as keyof typeof pfPhases];
              
              return (
                <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <PhaseIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{project.name}</CardTitle>
                          <CardDescription>{project.location}</CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={phaseInfo?.color}>
                          {phaseInfo?.name}
                        </Badge>
                        <div className="text-sm text-gray-600">
                          총사업비: {formatCurrency(project.totalProjectCost)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* 자본구조 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">자본구조</span>
                        <span className="text-sm text-gray-600">
                          자기자본 {project.equityRatio/100}% | 타인자본 {project.debtRatio/100}%
                        </span>
                      </div>
                      <div className="flex h-4 rounded-lg overflow-hidden">
                        <div 
                          className="bg-blue-500" 
                          style={{ width: `${project.equityRatio/100}%` }}
                        ></div>
                        <div 
                          className="bg-gray-400" 
                          style={{ width: `${project.debtRatio/100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>자기자본: {formatCurrency(project.equityAmount)}</span>
                        <span>타인자본: {formatCurrency(project.debtAmount)}</span>
                      </div>
                    </div>

                    {/* PF 단계 진행률 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">PF 단계 진행률</span>
                        <span className="text-sm text-gray-600">
                          {getPhaseProgress(project.currentPhase).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={getPhaseProgress(project.currentPhase)} className="h-2" />
                    </div>

                    {/* 주요 지표 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">STO 조달률</div>
                        <div className="font-semibold">
                          {((parseFloat(project.equityRaised) / parseFloat(project.equityAmount)) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">토큰 가격</div>
                        <div className="font-semibold">{formatCurrency(project.stoTokenPrice)}</div>
                      </div>
                      {project.currentPhase >= 3 && (
                        <>
                          <div>
                            <div className="text-gray-600">DSCR</div>
                            <div className={`font-semibold ${getDSCRColor(project.dscr)}`}>
                              {formatDSCR(project.dscr)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">배당지급</div>
                            <div className="font-semibold">{formatCurrency(project.totalDividendsPaid)}</div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* 투자 버튼 */}
                    {project.currentPhase === 0 && (
                      <div className="pt-2 border-t">
                        <Button 
                          onClick={() => onInvest?.(project.id, project.stoTokenPrice)}
                          className="w-full"
                          size="sm"
                        >
                          STO 투자하기 ({formatCurrency(project.stoTokenPrice)} / 토큰)
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <div className="grid gap-4">
            {investorPositions.map((position) => {
              const project = projects.find(p => p.id === position.projectId);
              if (!project) return null;

              return (
                <Card key={position.projectId}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription>보유 토큰: {position.tokenAmount.toLocaleString()}개</CardDescription>
                      </div>
                      <Badge variant={position.roi >= 0 ? 'default' : 'destructive'}>
                        ROI: {position.roi.toFixed(1)}%
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">투자금액</div>
                        <div className="font-semibold">{formatCurrency(position.investmentAmount)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">현재가치</div>
                        <div className="font-semibold">{formatCurrency(position.currentValue)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">총 배당수익</div>
                        <div className="font-semibold text-green-600">{formatCurrency(position.totalDividends)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">대기 배당</div>
                        <div className="font-semibold text-blue-600">{formatCurrency(position.pendingDividends)}</div>
                      </div>
                    </div>

                    {parseFloat(position.pendingDividends) > 0 && (
                      <div className="pt-2 border-t">
                        <Button 
                          onClick={() => onClaimDividends?.(position.projectId)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          배당 수령하기 ({formatCurrency(position.pendingDividends)})
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          {projects.filter(p => p.currentPhase >= 3).map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle>{project.name} - 현금흐름 분석</CardTitle>
                <CardDescription>운영 단계 재무 성과</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">총 수익</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(project.totalRevenue)}
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-800">운영비용</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(project.operatingExpenses)}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">순현금흐름</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(project.netCashFlow)}
                    </div>
                  </div>
                </div>

                {/* DSCR 지표 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">원리금상환비율 (DSCR)</span>
                    <Badge variant={project.dscr >= 15000 ? 'default' : project.dscr >= 12000 ? 'secondary' : 'destructive'}>
                      {formatDSCR(project.dscr)}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    안전 기준: 1.2x 이상 (우수: 1.5x 이상)
                  </div>
                  <Progress 
                    value={Math.min((project.dscr / 20000) * 100, 100)} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="financing" className="space-y-4">
          {projects.filter(p => p.isFinancialClosed).map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle>{project.name} - 금융구조</CardTitle>
                <CardDescription>
                  금융조달 완료일: {project.financialCloseDate ? formatDate(project.financialCloseDate) : 'N/A'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* 자본구조 차트 */}
                <div>
                  <h4 className="font-medium mb-3">자본구조 분석</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">자기자본 (STO)</span>
                      <span className="font-medium">{formatCurrency(project.equityAmount)}</span>
                    </div>
                    <Progress value={project.equityRatio/100} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">타인자본 (PF대출)</span>
                      <span className="font-medium">{formatCurrency(project.debtAmount)}</span>
                    </div>
                    <Progress value={project.debtRatio/100} className="h-2" />
                  </div>
                </div>

                {/* 대출 기관 정보 */}
                <div>
                  <h4 className="font-medium mb-3">대출 기관별 구성</h4>
                  <div className="space-y-2">
                    {project.lenders.map((lender, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{lender}</div>
                          <div className="text-sm text-gray-600">
                            이자율: {(project.interestRates[index] / 100).toFixed(2)}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">대출금액</div>
                          <div className="text-sm text-gray-600">만기: {formatDate(project.maturityDates[index])}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 금융 지표 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="font-medium text-blue-800 mb-1">평균 대출이자율</div>
                    <div className="text-xl font-bold text-blue-600">
                      {project.interestRates.length > 0 
                        ? (project.interestRates.reduce((sum, rate) => sum + rate, 0) / project.interestRates.length / 100).toFixed(2) + '%'
                        : 'N/A'
                      }
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="font-medium text-green-800 mb-1">레버리지 비율</div>
                    <div className="text-xl font-bold text-green-600">
                      {(project.debtRatio / project.equityRatio).toFixed(1)}:1
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}



