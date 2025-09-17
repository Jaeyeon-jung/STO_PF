'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

type PricePoint = {
  time: string;
  price: number;
  timestamp: number;
};

type SimplePriceChartProps = {
  currentPrice: number;
  lastUpdated: Date;
  isLive: boolean;
  onToggleLive: () => void;
};

export default function SimplePriceChart({
  currentPrice,
  lastUpdated,
  isLive,
  onToggleLive
}: SimplePriceChartProps) {
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [timeRange, setTimeRange] = useState<'1m' | '5m' | '15m' | '1h'>('5m');

  // 초기 데이터 생성 (클라이언트에서만 실행)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const now = Date.now();
    const initialData: PricePoint[] = [];
    
    // 지난 30개 포인트 생성
    for (let i = 29; i >= 0; i--) {
      const timestamp = now - (i * 60 * 1000); // 1분 간격
      const basePrice = currentPrice || 0.1; // 실제 현재 가격을 기준으로
      const variation = (Math.random() - 0.5) * 0.005; // 변동폭 줄임
      const price = Math.max(0.001, basePrice + variation);
      
      initialData.push({
        time: new Date(timestamp).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        price: Number(price.toFixed(6)),
        timestamp
      });
    }
    
    setPriceData(initialData);
  }, []);

  // 실시간 데이터 업데이트
  useEffect(() => {
    if (!isLive || typeof window === 'undefined') return;

    const interval = setInterval(() => {
      const now = Date.now();
      // 실제 가격에 작은 변동 추가 (시장 변동성 시뮬레이션)
      const basePrice = currentPrice || 0.1;
      const marketVolatility = (Math.random() - 0.5) * 0.003; // ±0.3% 변동
      const simulatedPrice = basePrice + marketVolatility;
      
      const newPoint: PricePoint = {
        time: new Date(now).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        price: Number(Math.max(0.001, simulatedPrice).toFixed(6)),
        timestamp: now
      };

      setPriceData(prev => {
        const updated = [...prev, newPoint];
        // 최대 100개 포인트만 유지
        return updated.length > 100 ? updated.slice(-100) : updated;
      });
    }, 5000); // 5초마다 업데이트 (더 빈번하게)

    return () => clearInterval(interval);
  }, [isLive, currentPrice]);

  // 시간 범위에 따른 데이터 필터링
  const getFilteredData = () => {
    const now = Date.now();
    const ranges = {
      '1m': 1 * 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000
    };
    
    const cutoff = now - ranges[timeRange];
    return priceData.filter(point => point.timestamp >= cutoff);
  };

  const filteredData = getFilteredData();
  const latestPrice = filteredData.length > 0 ? filteredData[filteredData.length - 1].price : currentPrice;
  const firstPrice = filteredData.length > 0 ? filteredData[0].price : currentPrice;
  const priceChange = latestPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="text-sm font-medium">{`시간: ${label}`}</p>
          <p className="text-sm">
            <span className="text-blue-600">가격: </span>
            <span className="font-bold">{payload[0].value.toFixed(6)} ETH</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800">실시간 가격 차트</h3>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-2xl font-bold text-blue-600">
              {latestPrice.toFixed(6)} ETH
            </span>
            <span className={`text-sm px-2 py-1 rounded ${
              priceChange >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLive}
            className={`px-3 py-1 rounded text-sm font-medium ${
              isLive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isLive ? '● LIVE' : '⏸ PAUSED'}
          </button>
        </div>
      </div>

      {/* 시간 범위 버튼 */}
      <div className="flex gap-2 mb-4">
        {(['1m', '5m', '15m', '1h'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              timeRange === range
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* 차트 */}
      <div className="h-80">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                stroke="#666"
                fontSize={12}
                interval={Math.max(0, Math.floor(filteredData.length / 8))}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                domain={['dataMin - 0.001', 'dataMax + 0.001']}
                tickFormatter={(value) => value.toFixed(4)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-center">
              <div className="animate-pulse">데이터 로딩 중...</div>
            </div>
          </div>
        )}
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
        <div className="text-center">
          <div className="text-sm text-gray-600">최고가</div>
          <div className="font-bold text-green-600">
            {filteredData.length > 0 ? Math.max(...filteredData.map(d => d.price)).toFixed(6) : currentPrice.toFixed(6)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">최저가</div>
          <div className="font-bold text-red-600">
            {filteredData.length > 0 ? Math.min(...filteredData.map(d => d.price)).toFixed(6) : currentPrice.toFixed(6)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">데이터 포인트</div>
          <div className="font-bold text-blue-600">
            {filteredData.length}개
          </div>
        </div>
      </div>
    </div>
  );
}
