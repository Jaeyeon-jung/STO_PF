// 블록체인 연결 유틸리티
import { ethers } from "ethers";

export interface BlockchainConnectionInfo {
  isConnected: boolean;
  networkId?: number;
  networkName?: string;
  blockNumber?: number;
  error?: string;
}

export class BlockchainConnectionManager {
  private static instance: BlockchainConnectionManager;
  private provider: ethers.JsonRpcProvider | null = null;
  private lastConnectionCheck = 0;
  private connectionInfo: BlockchainConnectionInfo = { isConnected: false };

  private constructor() {}

  static getInstance(): BlockchainConnectionManager {
    if (!BlockchainConnectionManager.instance) {
      BlockchainConnectionManager.instance = new BlockchainConnectionManager();
    }
    return BlockchainConnectionManager.instance;
  }

  // 블록체인 연결 테스트
  async testConnection(rpcUrl = "http://127.0.0.1:8545"): Promise<BlockchainConnectionInfo> {
    const now = Date.now();
    
    // 30초 캐시
    if (now - this.lastConnectionCheck < 30000 && this.connectionInfo.isConnected) {
      return this.connectionInfo;
    }

    try {
      console.log(`🔗 블록체인 연결 시도: ${rpcUrl}`);
      
      // 더 robust한 provider 설정
      this.provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
        staticNetwork: ethers.Network.from({
          name: "hardhat",
          chainId: 31337
        }),
        batchMaxCount: 1,
        batchStallTime: 10
      });

      // 연결 테스트를 위한 간단한 호출
      console.log(`📡 네트워크 정보 조회 중...`);
      
      // 3초 타임아웃으로 설정
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('연결 타임아웃 (3초)')), 3000)
      );

      // 네트워크 정보와 블록 번호 동시 조회
      const [network, blockNumber] = await Promise.all([
        Promise.race([this.provider.getNetwork(), timeoutPromise]),
        Promise.race([this.provider.getBlockNumber(), timeoutPromise])
      ]);

      this.connectionInfo = {
        isConnected: true,
        networkId: Number(network.chainId),
        networkName: this.getNetworkName(Number(network.chainId)),
        blockNumber
      };

      console.log(`✅ 블록체인 연결 성공!`);
      console.log(`   네트워크: ${this.connectionInfo.networkName}`);
      console.log(`   체인 ID: ${this.connectionInfo.networkId}`);
      console.log(`   현재 블록: ${this.connectionInfo.blockNumber}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      
      this.connectionInfo = {
        isConnected: false,
        error: errorMessage
      };

      console.log(`❌ 블록체인 연결 실패: ${errorMessage}`);
      console.log(`💡 해결 방법:`);
      console.log(`   1. Hardhat 노드가 실행 중인지 확인: npx hardhat node`);
      console.log(`   2. RPC URL 확인: ${rpcUrl}`);
      console.log(`   3. 포트 8545가 사용 가능한지 확인`);
    }

    this.lastConnectionCheck = now;
    return this.connectionInfo;
  }

  // 네트워크 이름 반환
  private getNetworkName(chainId: number): string {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 5: return 'Goerli Testnet';
      case 11155111: return 'Sepolia Testnet';
      case 1337: 
      case 31337: return 'Hardhat Local';
      default: return `Unknown Network (${chainId})`;
    }
  }

  // 현재 연결 정보 반환
  getConnectionInfo(): BlockchainConnectionInfo {
    return this.connectionInfo;
  }

  // 연결 상태 초기화
  resetConnection(): void {
    this.provider = null;
    this.connectionInfo = { isConnected: false };
    this.lastConnectionCheck = 0;
  }

  // Hardhat 네트워크 시작 가이드
  static getHardhatSetupGuide(): string {
    return `
🔧 Hardhat 로컬 네트워크 시작 방법:

1. 터미널에서 프로젝트 루트로 이동
2. 다음 명령어 실행:
   npx hardhat node

3. 또는 package.json에 스크립트가 있다면:
   npm run node

4. 네트워크가 시작되면 다음과 같은 메시지가 나타납니다:
   "Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/"

5. 컨트랙트 배포:
   npx hardhat run scripts/deploy.ts --network localhost

⚠️  주의사항:
- Hardhat 네트워크는 개발 전용입니다
- 네트워크를 중지하면 모든 데이터가 사라집니다
- 포트 8545가 사용 중이 아닌지 확인하세요
    `;
  }
}

// 블록체인 연결 상태 확인 함수 (편의용)
export async function checkBlockchainConnection(): Promise<BlockchainConnectionInfo> {
  const manager = BlockchainConnectionManager.getInstance();
  return await manager.testConnection();
}

// Hardhat 설정 확인 (서버 사이드에서만 사용)
export function validateHardhatConfig() {
  try {
    // Node.js 환경에서만 실행
    if (typeof window === 'undefined') {
      const fs = require('fs');
      const path = require('path');
      
      const requiredFiles = [
        'hardhat.config.ts',
        'hardhat.config.js'
      ];

      for (const file of requiredFiles) {
        if (fs.existsSync(path.join(process.cwd(), file))) {
          console.log(`✅ ${file} 발견`);
          return true;
        }
      }

      console.log('❌ Hardhat 설정 파일을 찾을 수 없습니다.');
      console.log(BlockchainConnectionManager.getHardhatSetupGuide());
      return false;
    }
    return true;
  } catch (error) {
    console.log('설정 파일 확인 중 오류:', error);
    return false;
  }
}
