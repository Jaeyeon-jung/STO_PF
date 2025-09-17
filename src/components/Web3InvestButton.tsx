import { useState } from 'react';
import { ethers } from 'ethers';

type Project = {
  id: string;
  name: string;
  location: string;
  estimatedValue: number;
  riskSummary: string;
};

// MetaMask window 객체 타입 확장
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Web3InvestButton({ project }: { project: Project }) {
  const [amount, setAmount] = useState('1');
  const [showModal, setShowModal] = useState(false);
  const [tokenPrice, setTokenPrice] = useState('0.1'); // 기본값
  const [loading, setLoading] = useState(false);
  
  const handleInvest = () => {
    // MetaMask 연결 확인
    if (typeof window !== 'undefined' && window.ethereum) {
      setShowModal(true);
    } else {
      alert('MetaMask가 설치되어 있지 않습니다. MetaMask를 설치한 후 다시 시도해주세요.');
    }
  };

  const handleConfirmInvest = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) {
        alert('MetaMask가 설치되어 있지 않습니다.');
        return;
      }

      console.log('🚀 투자 트랜잭션 시작:', { project: project.name, amount });
      
      // MetaMask 연결 및 네트워크 확인
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // 네트워크가 Hardhat 로컬 네트워크인지 확인 (1337 또는 31337)
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const chainIdDecimal = parseInt(chainId, 16);
      console.log('현재 네트워크 체인 ID:', chainId, '(decimal:', chainIdDecimal, ')');
      
      // 1337 (0x539) 또는 31337 (0x7a69) 둘 다 허용
      if (chainIdDecimal !== 1337 && chainIdDecimal !== 31337) {
        console.log('⚠️ 잘못된 네트워크 감지. Hardhat Local로 전환 필요');
        
        // 먼저 31337로 전환 시도
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7a69' }], // 31337
          });
        } catch (switchError: any) {
          // 31337이 없으면 1337로 시도
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x539' }], // 1337
              });
            } catch (secondError: any) {
              // 둘 다 없으면 31337 네트워크 추가
              if (secondError.code === 4902) {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x7a69',
                    chainName: 'Hardhat Local',
                    rpcUrls: ['http://127.0.0.1:8545'],
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18
                    }
                  }]
                });
              } else {
                throw secondError;
              }
            }
          } else {
            throw switchError;
          }
        }
      } else {
        console.log('✅ 올바른 Hardhat 네트워크에 연결됨:', chainIdDecimal);
      }

      // Provider 및 Signer 설정
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 컨트랙트 설정 (최신 AI 강화 버전)
      const contractAddress = '0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f';
      const contractABI = [
        "function invest(string memory projectId, uint256 amount) public payable",
        "function getCurrentTokenPrice(string memory projectId) public view returns (uint256)",
        "function getProject(string memory projectId) public view returns (tuple(string id, string name, string location, uint256 basePrice, uint256 totalSupply, bool isActive, address priceFeed, bool useDynamicPricing, bool useHybridIndex))"
      ];

      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // 현재 토큰 가격 조회
      const currentTokenPrice = await contract.getCurrentTokenPrice(project.id);
      const totalCost = currentTokenPrice * BigInt(amount);

      // UI 업데이트용 토큰 가격 설정
      setTokenPrice(ethers.formatEther(currentTokenPrice));

      console.log('💰 투자 정보:', {
        tokenPrice: ethers.formatEther(currentTokenPrice),
        amount: amount,
        totalCost: ethers.formatEther(totalCost)
      });

      // 투자 트랜잭션 실행
      const tx = await contract.invest(project.id, amount, {
        value: totalCost
      });

      console.log('📝 트랜잭션 해시:', tx.hash);
      alert(`투자 트랜잭션이 전송되었습니다!\n트랜잭션 해시: ${tx.hash}\n\n확인을 기다리는 중...`);

      // 트랜잭션 확인 대기
      const receipt = await tx.wait();
      console.log('✅ 트랜잭션 확인:', receipt);
      
      alert(`투자가 완료되었습니다! 🎉\n프로젝트: ${project.name}\n수량: ${amount} 토큰\n총 비용: ${ethers.formatEther(totalCost)} ETH`);
      setShowModal(false);

    } catch (error: any) {
      console.error('❌ 투자 실패:', error);
      
      let errorMessage = '투자 중 오류가 발생했습니다.';
      if (error.code === 4001) {
        errorMessage = '사용자가 트랜잭션을 취소했습니다.';
      } else if (error.code === -32603) {
        errorMessage = '네트워크 연결 문제가 발생했습니다. Hardhat 로컬 네트워크가 실행 중인지 확인해주세요.\n\n해결 방법:\n1. 새 터미널에서 "npx hardhat node" 실행\n2. MetaMask에서 Hardhat Local 네트워크 선택';
      } else if (error.code === 4902) {
        errorMessage = 'Hardhat Local 네트워크가 MetaMask에 추가되지 않았습니다.\n\nMetaMask에서 수동으로 네트워크를 추가해주세요:\n- 네트워크 이름: Hardhat Local\n- RPC URL: http://127.0.0.1:8545\n- 체인 ID: 31337\n- 통화: ETH';
      } else if (error.reason) {
        errorMessage = `트랜잭션 실패: ${error.reason}`;
      } else {
        errorMessage = `오류 코드 ${error.code}: ${error.message || '알 수 없는 오류'}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleInvest}
        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
      >
        Invest
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">{project.name} 투자</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                투자 수량
              </label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="mb-4 text-sm text-gray-600">
              <p>컨트랙트 주소: 0x5FbDB2315678afecb367f032d93F642f64180aa3</p>
              <p>토큰 가격: {tokenPrice} ETH per token</p>
              <p>총 비용: {(parseFloat(amount) * parseFloat(tokenPrice)).toFixed(4)} ETH</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                취소
              </button>
              <button
                onClick={handleConfirmInvest}
                disabled={loading}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}