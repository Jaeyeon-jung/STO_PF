'use client';

import { useState, useEffect } from 'react';

type MarketData = {
  volume24h: number;
  marketCap: number;
  holders: number;
  avgPrice: number;
  highPrice: number;
  lowPrice: number;
  priceChange24h: number;
};

type OrderBookEntry = {
  price: number;
  amount: number;
  total: number;
};

export default function TradingWidgets() {
  const [marketData, setMarketData] = useState<MarketData>({
    volume24h: 1247.52,
    marketCap: 12475200,
    holders: 1834,
    avgPrice: 0.1125,
    highPrice: 0.1189,
    lowPrice: 0.1067,
    priceChange24h: 3.2
  });

  const [orderBook, setOrderBook] = useState<{
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
  }>({
    bids: [],
    asks: []
  });

  // 오더북 데이터 시뮬레이션
  useEffect(() => {
    const generateOrderBook = () => {
      const basePrice = 0.1125;
      const bids: OrderBookEntry[] = [];
      const asks: OrderBookEntry[] = [];

      // 매수 주문 (가격이 높은 순)
      for (let i = 0; i < 8; i++) {
        const price = basePrice - (i + 1) * 0.0005;
        const amount = Math.random() * 50 + 10;
        bids.push({
          price,
          amount,
          total: price * amount
        });
      }

      // 매도 주문 (가격이 낮은 순)
      for (let i = 0; i < 8; i++) {
        const price = basePrice + (i + 1) * 0.0005;
        const amount = Math.random() * 50 + 10;
        asks.push({
          price,
          amount,
          total: price * amount
        });
      }

      setOrderBook({ bids, asks });
    };

    generateOrderBook();
    const interval = setInterval(generateOrderBook, 3000);
    return () => clearInterval(interval);
  }, []);

  // 마켓 데이터 업데이트
  useEffect(() => {
    const updateMarketData = () => {
      setMarketData(prev => ({
        ...prev,
        volume24h: prev.volume24h + (Math.random() - 0.5) * 100,
        holders: prev.holders + Math.floor(Math.random() * 3),
        priceChange24h: prev.priceChange24h + (Math.random() - 0.5) * 0.5
      }));
    };

    const interval = setInterval(updateMarketData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 마켓 데이터 위젯 */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          📊 마켓 데이터
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500">24시간 거래량</div>
              <div className="font-semibold text-lg">
                {marketData.volume24h.toFixed(2)} ETH
              </div>
              <div className="text-xs text-green-600">+12.3%</div>
            </div>
            
            <div>
              <div className="text-xs text-gray-500">시가총액</div>
              <div className="font-semibold">
                ${marketData.marketCap.toLocaleString()}
              </div>
            </div>
            
            <div>
              <div className="text-xs text-gray-500">홀더 수</div>
              <div className="font-semibold">
                {marketData.holders.toLocaleString()}
              </div>
              <div className="text-xs text-blue-600">+{Math.floor(Math.random() * 5)} 오늘</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500">24시간 고가</div>
              <div className="font-semibold text-red-600">
                {marketData.highPrice.toFixed(4)} ETH
              </div>
            </div>
            
            <div>
              <div className="text-xs text-gray-500">24시간 저가</div>
              <div className="font-semibold text-green-600">
                {marketData.lowPrice.toFixed(4)} ETH
              </div>
            </div>
            
            <div>
              <div className="text-xs text-gray-500">평균 가격</div>
              <div className="font-semibold">
                {marketData.avgPrice.toFixed(4)} ETH
              </div>
              <div className={`text-xs ${
                marketData.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {marketData.priceChange24h >= 0 ? '+' : ''}{marketData.priceChange24h.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 오더북 위젯 */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold mb-4 flex items-center justify-between">
          📈 오더북
          <div className="text-xs text-gray-500">실시간 호가</div>
        </h3>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          {/* 매도 주문 */}
          <div>
            <div className="text-red-600 font-semibold mb-2 text-center">매도 (Ask)</div>
            <div className="space-y-1">
              {orderBook.asks.slice().reverse().map((ask, index) => (
                <div key={index} className="flex justify-between items-center py-1 px-2 bg-red-50 rounded">
                  <span className="text-red-600 font-mono">
                    {ask.price.toFixed(4)}
                  </span>
                  <span className="text-gray-600">
                    {ask.amount.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 매수 주문 */}
          <div>
            <div className="text-green-600 font-semibold mb-2 text-center">매수 (Bid)</div>
            <div className="space-y-1">
              {orderBook.bids.map((bid, index) => (
                <div key={index} className="flex justify-between items-center py-1 px-2 bg-green-50 rounded">
                  <span className="text-green-600 font-mono">
                    {bid.price.toFixed(4)}
                  </span>
                  <span className="text-gray-600">
                    {bid.amount.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* 스프레드 정보 */}
        <div className="mt-4 pt-3 border-t text-center">
          <div className="text-xs text-gray-500">스프레드</div>
          <div className="font-semibold">
            {orderBook.asks.length > 0 && orderBook.bids.length > 0 
              ? (orderBook.asks[0].price - orderBook.bids[0].price).toFixed(6)
              : '0.000000'
            } ETH
          </div>
        </div>
      </div>
    </div>
  );
}

