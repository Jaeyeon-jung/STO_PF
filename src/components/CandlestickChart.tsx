'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

type CandleData = {
  timestamp: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
};

type CandlestickChartProps = {
  currentPrice: number;
  lastUpdated: Date;
};

export default function CandlestickChart({ currentPrice, lastUpdated }: CandlestickChartProps) {
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [timeRange, setTimeRange] = useState<'1m' | '5m' | '15m' | '1h'>('5m');
  const [isLive, setIsLive] = useState(true);

  // 캔들 데이터 생성 함수
  const generateCandleData = useCallback((basePrice: number, timestamp: Date): CandleData => {
    const variation = 0.98 + Math.random() * 0.04; // ±2% 변동
    const open = basePrice * variation;
    const closeVariation = 0.99 + Math.random() * 0.02; // ±1% 변동
    const close = open * closeVariation;
    
    const highLowRange = Math.abs(close - open) * (1 + Math.random());
    const high = Math.max(open, close) + highLowRange * Math.random();
    const low = Math.min(open, close) - highLowRange * Math.random();
    
    const volume = Math.floor(Math.random() * 1000) + 100;
    const change = close - open;
    const changePercent = (change / open) * 100;

    return {
      timestamp: timestamp.toISOString(),
      time: timestamp.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      open,
      high,
      low,
      close,
      volume,
      change,
      changePercent
    };
  }, []);

  // 초기 데이터 생성
  useEffect(() => {
    const now = new Date();
    const initialData: CandleData[] = [];
    
    // 지난 20개의 캔들 생성 (5분 간격)
    for (let i = 19; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 5 * 60 * 1000));
      initialData.push(generateCandleData(currentPrice, timestamp));
    }
    
    setCandleData(initialData);
  }, [currentPrice, generateCandleData]);

  // 실시간 데이터 업데이트
  useEffect(() => {
    if (isLive) {
      const newCandle = generateCandleData(currentPrice, lastUpdated);
      
      setCandleData(prev => {
        const updated = [...prev];
        
        // 같은 시간 구간이면 업데이트, 다르면 새로 추가
        const lastCandle = updated[updated.length - 1];
        const currentTimeSlot = Math.floor(lastUpdated.getTime() / (5 * 60 * 1000));
        const lastTimeSlot = Math.floor(new Date(lastCandle?.timestamp || 0).getTime() / (5 * 60 * 1000));
        
        if (currentTimeSlot === lastTimeSlot && updated.length > 0) {
          // 같은 5분 구간 - 기존 캔들 업데이트
          updated[updated.length - 1] = {
            ...lastCandle,
            close: currentPrice,
            high: Math.max(lastCandle.high, currentPrice),
            low: Math.min(lastCandle.low, currentPrice),
            change: currentPrice - lastCandle.open,
            changePercent: ((currentPrice - lastCandle.open) / lastCandle.open) * 100
          };
        } else {
          // 새로운 5분 구간 - 새 캔들 추가
          updated.push(newCandle);
        }
        
        // 최대 50개 캔들만 유지
        return updated.length > 50 ? updated.slice(-50) : updated;
      });
    }
  }, [currentPrice, lastUpdated, isLive, generateCandleData]);

  // 시간 범위에 따른 데이터 필터링
  const getFilteredData = useCallback(() => {
    const now = new Date();
    let minutes: number;
    
    switch (timeRange) {
      case '1m': minutes = 1; break;
      case '5m': minutes = 5; break;
      case '15m': minutes = 15; break;
      case '1h': minutes = 60; break;
      default: minutes = 5;
    }
    
    const cutoffTime = now.getTime() - (minutes * 60 * 1000);
    return candleData.filter(data => 
      new Date(data.timestamp).getTime() >= cutoffTime
    );
  }, [candleData, timeRange]);

  const filteredData = getFilteredData();

  // 간소화된 캔들 표시 (점으로만)
  const renderCandlePoints = (data: CandleData[]) => {
    return data.map((candle, index) => {
      const isGreen = candle.close >= candle.open;
      return {
        ...candle,
        fill: isGreen ? '#10b981' : '#ef4444',
        stroke: isGreen ? '#10b981' : '#ef4444'
      };
    });
  };

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isGreen = data.close >= data.open;
      
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg text-sm">
          <p className="font-semibold mb-2">{label}</p>
          <div className="space-y-1">
            <p>시가: <span className="font-mono">{data.open.toFixed(4)} ETH</span></p>
            <p>고가: <span className="font-mono text-red-600">{data.high.toFixed(4)} ETH</span></p>
            <p>저가: <span className="font-mono text-blue-600">{data.low.toFixed(4)} ETH</span></p>
            <p>종가: <span className="font-mono">{data.close.toFixed(4)} ETH</span></p>
            <p className={`${isGreen ? 'text-green-600' : 'text-red-600'}`}>
              변동: {data.change >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
            </p>
            <p className="text-gray-500">거래량: {data.volume}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg border">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            📊 실시간 가격 차트
            <span className="text-lg">🕯️</span>
          </h3>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold">현재가: {currentPrice.toFixed(4)} ETH</span>
              {filteredData.length > 1 && (
                <span className={`px-2 py-1 rounded text-xs ${
                  filteredData[filteredData.length - 1]?.changePercent >= 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {filteredData[filteredData.length - 1]?.changePercent >= 0 ? '+' : ''}
                  {filteredData[filteredData.length - 1]?.changePercent.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* 컨트롤 버튼들 */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['1m', '5m', '15m', '1h'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  timeRange === range
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              isLive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            {isLive ? 'LIVE' : 'PAUSED'}
          </button>
        </div>
      </div>

      {/* 실시간 가격 차트 */}
      <div className="h-80 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              stroke="#666"
              fontSize={12}
              interval={Math.max(0, Math.floor(filteredData.length / 6))}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              domain={['dataMin - 0.001', 'dataMax + 0.001']}
              tickFormatter={(value) => `${value.toFixed(3)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* 고가선 */}
            <Line
              type="linear"
              dataKey="high"
              stroke="#ef4444"
              strokeWidth={1}
              dot={false}
              strokeDasharray="2 2"
            />
            
            {/* 저가선 */}
            <Line
              type="linear"
              dataKey="low"
              stroke="#10b981"
              strokeWidth={1}
              dot={false}
              strokeDasharray="2 2"
            />
            
            {/* 종가선 (메인) */}
            <Line
              type="linear"
              dataKey="close"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={(props) => {
                const { payload, cx, cy } = props;
                if (!payload) return null;
                const isGreen = payload.close >= payload.open;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill={isGreen ? '#10b981' : '#ef4444'}
                    stroke="#ffffff"
                    strokeWidth={1}
                  />
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        
      </div>

      {/* 통계 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
        <div className="text-center">
          <div className="text-sm text-gray-600">24시간 거래량</div>
          <div className="text-lg font-semibold">1,247 ETH</div>
          <div className="text-xs text-green-600">+12.3%</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">24시간 고가</div>
          <div className="text-lg font-semibold text-red-600">
            {Math.max(...filteredData.map(d => d.high)).toFixed(4)} ETH
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">24시간 저가</div>
          <div className="text-lg font-semibold text-green-600">
            {Math.min(...filteredData.map(d => d.low)).toFixed(4)} ETH
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">변동성</div>
          <div className="text-lg font-semibold">
            {filteredData.length > 0 
              ? Math.abs(filteredData[filteredData.length - 1]?.changePercent || 0).toFixed(2)
              : '0.00'
            }%
          </div>
          <div className="text-xs text-gray-500">지난 {timeRange}</div>
        </div>
      </div>
    </div>
  );
}
