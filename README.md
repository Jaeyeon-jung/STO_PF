# 🏢 STO-PF: 부동산 PF 토큰화 플랫폼

**블록체인 기반 부동산 프로젝트 파이낸싱(PF) 토큰화 및 투자 플랫폼**

Next.js + Hardhat + Chainlink + AI를 결합한 혁신적인 부동산 투자 플랫폼입니다.  
부동산 개발 프로젝트를 ERC-1155 토큰으로 토큰화하여 PF 구조의 투자를 가능하게 합니다.

## ✨ 주요 특징

### 🏗️ **부동산 PF 토큰화**
- 대규모 부동산 개발 프로젝트를 소액 토큰으로 분할
- ERC-1155 기반 멀티 토큰 시스템
- 전문적인 PF 구조로 안정적인 수익 창출

### 🤖 **AI 강화 가격 예측**
- Chainlink Oracle 실시간 시장 데이터
- GPT 기반 투자 분석 및 리스크 평가
- 커스텀 메트릭: 지역 수요, 개발 진행률, 인프라 점수

### 📊 **하이브리드 가격 시스템**
- 체인링크 데이터 + 커스텀 메트릭 + AI 예측 결합
- 실시간 동적 가격 책정
- 투명한 가격 산정 알고리즘

### 💎 **투명한 수익 분배**
- 스마트 컨트랙트 기반 자동 배당
- 임대 수익 및 매각 수익 실시간 분배
- DSCR(부채상환비율) 기반 리스크 관리

## 🚀 실행 방법

### 전체 시스템 실행 (권장)
```bash
npm install
npm run blockchain:start  # 블록체인 + 웹서버 자동 실행
```

### 개별 실행
```bash
# 방법 1: Hardhat 로컬 네트워크 + 배포
npm run blockchain:node    # 터미널 1
npm run blockchain:deploy  # 터미널 2
npm run dev               # 터미널 3

# 방법 2: 실시간 계산 모드 (블록체인 없이)
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 🎯 핵심 기능

### 📱 **프론트엔드 기능**
- **홈페이지**: 부동산 PF 플랫폼 소개, AI 강화 기능 안내
- **AI 검색**: GPT 기반 프로젝트 분석 및 투자 추천
- **투자 대시보드**: 포트폴리오 관리, 수익률 추적, 배당 현황
- **프로젝트 상세**: 실시간 가격 차트, 리스크 분석, 투자 버튼
- **건설 프로젝트**: 공사 진행률, 예산 관리, 리스크 모니터링
- **프로젝트 파이낸스**: PF 구조 분석, DSCR 추적, 자금 조달 현황

### ⛓️ **블록체인 기능**
- **ERC-1155 토큰**: 다중 프로젝트 토큰 발행 및 관리
- **업그레이드 가능**: 투명 프록시 패턴으로 모듈별 업그레이드
- **모듈형 아키텍처**: Core, Pricing, Dividend, AI 모듈 분리
- **Chainlink 오라클**: 실시간 시장 데이터 통합
- **자동 배당**: 스마트 컨트랙트 기반 수익 분배

### 🤖 **AI & 데이터 기능**
- **GPT 분석**: 프로젝트 투자 가치 평가
- **하이브리드 가격**: 체인링크 + 커스텀 + AI 데이터 융합
- **리스크 평가**: 다차원 리스크 분석 및 점수화
- **실시간 계산**: 블록체인 없이도 동작하는 백업 시스템

## 🏗️ 기술 아키텍처

### **프론트엔드**
```
Next.js 15 (App Router) + TypeScript
├── UI: Tailwind CSS + Radix UI
├── 차트: Recharts
├── Web3: Wagmi + Viem
└── AI: OpenAI GPT API
```

### **블록체인 (Hardhat)**
```
Ethereum 호환 네트워크
├── 스마트 컨트랙트: Solidity ^0.8.20
├── 프록시 패턴: OpenZeppelin Upgradeable
├── 오라클: Chainlink Aggregator V3
└── 토큰 표준: ERC-1155 (Multi-Token)
```

### **스마트 컨트랙트 구조**

#### 🔗 **모듈형 아키텍처**
```
RealEstateProxyManager (프록시 관리자)
├── RealEstateCore (핵심 토큰 시스템)
├── PricingModule (가격 계산 엔진)
├── DividendModule (배당 시스템)
└── AIModule (AI 예측 모듈)
```

#### 📊 **PricingModule 하이브리드 시스템**
- **Chainlink 데이터**: ETH/USD, 부동산 지수, 변동성
- **커스텀 메트릭**: 지역 수요(0-1000), 개발 진행률(0-100%), 인프라 점수(0-100)
- **AI 예측**: GPT 기반 가격 예측, 신뢰도 점수, 리스크 점수
- **가중 평균**: 세 가지 데이터 소스의 동적 가중치 조합

#### 💰 **DividendModule PF 구조**
- **자기자본**: 20% (토큰 투자자)
- **PF 대출**: 80% (은행/금융기관)
- **DSCR 관리**: 부채상환비율 실시간 모니터링
- **수익 분배**: 임대료, 매각 수익 자동 분배

## 🔌 API 엔드포인트

### **프로젝트 관련**
- `POST /api/search` - 프로젝트 검색 및 필터링
- `GET /api/projects/[id]` - 프로젝트 상세 정보
- `POST /api/ai-analysis` - AI 기반 프로젝트 분석
- `POST /api/ai-price-prediction` - AI 가격 예측

### **블록체인 관련**
- `GET /api/blockchain/status` - 블록체인 연결 상태
- `POST /api/blockchain/invest` - 토큰 투자 (개발 예정)
- `GET /api/blockchain/portfolio` - 포트폴리오 조회 (개발 예정)

## 📋 개발 현황

### ✅ **완료된 기능**
- [x] 모듈형 스마트 컨트랙트 아키텍처 (Core, Pricing, Dividend, AI)
- [x] Chainlink 오라클 통합 및 하이브리드 가격 시스템
- [x] AI 기반 프로젝트 분석 및 가격 예측 API
- [x] Next.js 프론트엔드 (홈, AI 검색, 투자 대시보드)
- [x] 실시간 계산 모드 (블록체인 독립 실행)
- [x] 건설 프로젝트 및 PF 대시보드 컴포넌트
- [x] ERC-1155 기반 멀티 토큰 시스템
- [x] 업그레이드 가능한 프록시 패턴

### 🚧 **개발 중**
- [ ] Web3 지갑 연동 (MetaMask, WalletConnect)
- [ ] 실제 토큰 투자 및 거래 기능
- [ ] 배당 수령 및 포트폴리오 관리
- [ ] Chainlink 실제 가격 피드 연동
- [ ] 테스트넷 배포 및 검증

### 🔮 **향후 계획**
- [ ] 메인넷 배포
- [ ] 실제 부동산 프로젝트 온보딩
- [ ] KYC/AML 규정 준수
- [ ] 기관 투자자 대시보드
- [ ] 모바일 앱 개발

## 🧪 테스트 및 검증

### **스마트 컨트랙트 테스트**
```bash
npx hardhat test                    # 전체 테스트 실행
npx hardhat test test/PricingModule.test.ts  # 특정 모듈 테스트
```

### **AI 및 오라클 테스트**
```bash
npx hardhat run scripts/test-ai-integration.ts
npx hardhat run scripts/test-chainlink.ts
npx hardhat run scripts/test-hybrid-oracle.ts
```

### **배포 테스트**
```bash
npx hardhat run scripts/deploy-modular-system.ts --network localhost
```

## 📝 주요 스크립트

- `scripts/deploy-modular-system.ts` - 전체 모듈 시스템 배포
- `scripts/test-ai-integration.ts` - AI 모듈 통합 테스트
- `scripts/test-hybrid-oracle.ts` - 하이브리드 오라클 테스트
- `scripts/start-blockchain.js` - 원클릭 블록체인 환경 구축

---
