// Web3 설정 및 체인링크 연동을 위한 유틸리티

import { ethers } from 'ethers';
import { ChainlinkDataProvider } from './chainlinkIntegration';

// Web3 연결 상태 관리
export class Web3Manager {
  private static instance: Web3Manager;
  private provider: ethers.BrowserProvider | null = null;
  private chainlinkProvider: ChainlinkDataProvider | null = null;
  private isConnected = false;

  private constructor() {}

  static getInstance(): Web3Manager {
    if (!Web3Manager.instance) {
      Web3Manager.instance = new Web3Manager();
    }
    return Web3Manager.instance;
  }

  // Web3 연결 초기화
  async initialize(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        console.log('⚠️ MetaMask가 설치되지 않았습니다.');
        return false;
      }

      // 사용자 계정 연결 요청
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Provider 생성
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.chainlinkProvider = new ChainlinkDataProvider(this.provider, 'ethereum');
      this.isConnected = true;

      console.log('✅ Web3 연결 성공');
      return true;
    } catch (error) {
      console.error('❌ Web3 연결 실패:', error);
      return false;
    }
  }

  // 체인 ID 확인 및 변경
  async ensureCorrectNetwork(): Promise<boolean> {
    if (!this.provider) return false;

    try {
      const network = await this.provider.getNetwork();
      const ethereumChainId = 1; // Ethereum Mainnet

      if (Number(network.chainId) !== ethereumChainId) {
        // 네트워크 변경 요청
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${ethereumChainId.toString(16)}` }],
        });
      }

      console.log('✅ 올바른 네트워크에 연결됨:', network.name);
      return true;
    } catch (error) {
      console.error('❌ 네트워크 변경 실패:', error);
      return false;
    }
  }

  // 체인링크 데이터 조회
  async getChainlinkData() {
    if (!this.chainlinkProvider) {
      throw new Error('Web3가 연결되지 않았습니다.');
    }

    return await this.chainlinkProvider.getRealEstateAnalysisData();
  }

  // 연결 상태 확인
  isWeb3Connected(): boolean {
    return this.isConnected && this.provider !== null;
  }

  // Provider 반환
  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }
}

// React Hook으로 사용할 수 있는 Web3 훅
export function useWeb3() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const web3Manager = Web3Manager.getInstance();
      const connected = await web3Manager.initialize();
      
      if (connected) {
        const networkOk = await web3Manager.ensureCorrectNetwork();
        if (networkOk) {
          setIsConnected(true);
        } else {
          setError('올바른 네트워크에 연결할 수 없습니다.');
        }
      } else {
        setError('Web3 연결에 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  };

  const getChainlinkData = async () => {
    if (!isConnected) {
      throw new Error('Web3가 연결되지 않았습니다.');
    }

    const web3Manager = Web3Manager.getInstance();
    return await web3Manager.getChainlinkData();
  };

  return {
    isConnected,
    isLoading,
    error,
    connect,
    getChainlinkData
  };
}

// 전역 타입 선언
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

