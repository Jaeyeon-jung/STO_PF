// 블록체인 연결 설정
export const BLOCKCHAIN_CONFIG = {
  // 블록체인 연결 활성화/비활성화
  ENABLED: true, // 블록체인 활성화
  
  // RPC URL 설정
  RPC_URL: "http://127.0.0.1:8545",
  
  // 연결 타임아웃 (밀리초)
  CONNECTION_TIMEOUT: 2000,
  
  // 재시도 간격 (밀리초)
  RETRY_INTERVAL: 30000,
  
  // 컨트랙트 주소
  CONTRACT_ADDRESS: "0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf",
  
  // 로깅 설정
  VERBOSE_LOGGING: false, // true로 변경하면 상세 로그 출력
};

// 개발자를 위한 설정 안내
export const BLOCKCHAIN_SETUP_GUIDE = `
🔧 블록체인 연결 활성화 방법:

1. src/config/blockchain.ts 파일에서 ENABLED를 true로 변경
2. Hardhat 네트워크 시작:
   npx hardhat node
3. 컨트랙트 배포:
   npx hardhat run scripts/deploy.ts --network localhost
4. 애플리케이션 재시작

현재 상태: ${BLOCKCHAIN_CONFIG.ENABLED ? '✅ 활성화됨' : '❌ 비활성화됨'}
`;

export default BLOCKCHAIN_CONFIG;

