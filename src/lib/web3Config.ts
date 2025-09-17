import { configureChains, createConfig } from 'wagmi';
import { hardhat } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { InjectedConnector } from 'wagmi/connectors/injected';

// Hardhat 로컬 네트워크 설정
export const { chains, publicClient } = configureChains(
  [hardhat],
  [publicProvider()]
);

// Wagmi 클라이언트 설정
export const config = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      chains,
      options: {
        name: 'MetaMask',
        shimDisconnect: true,
      },
    }),
  ],
  publicClient,
});

// 컨트랙트 주소 (배포된 주소로 업데이트)
export const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// 컨트랙트 ABI
export const CONTRACT_ABI = [
  "function invest(string projectId, uint256 amount) public payable",
  "function getProject(string projectId) public view returns (tuple(string id, string name, string location, uint256 price, uint256 totalSupply, bool isActive))",
  "function getBalance(string projectId, address account) public view returns (uint256)",
] as const;