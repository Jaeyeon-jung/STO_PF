import { NextResponse } from "next/server";
import { BlockchainConnectionManager } from "../../../../lib/blockchainUtils";
import BLOCKCHAIN_CONFIG, { BLOCKCHAIN_SETUP_GUIDE } from "../../../../config/blockchain";

export async function GET() {
  if (!BLOCKCHAIN_CONFIG.ENABLED) {
    return NextResponse.json({
      isConnected: false,
      mode: 'calculation_only',
      message: '블록체인 연결이 비활성화되었습니다. 실시간 계산 모드로 동작합니다.',
      timestamp: new Date().toISOString(),
      config: {
        enabled: BLOCKCHAIN_CONFIG.ENABLED,
        rpcUrl: BLOCKCHAIN_CONFIG.RPC_URL,
        contractAddress: BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS
      },
      features: [
        '✅ 실시간 시장 데이터 분석',
        '✅ 동적 투자 등급 계산',
        '✅ AI 기반 배당 예측',
        '✅ 뉴스 이벤트 영향 분석'
      ],
      setupGuide: BLOCKCHAIN_SETUP_GUIDE
    });
  }

  try {
    const connectionManager = BlockchainConnectionManager.getInstance();
    const connectionInfo = await connectionManager.testConnection();
    
    const response = {
      ...connectionInfo,
      timestamp: new Date().toISOString(),
      setupGuide: connectionInfo.isConnected ? null : BlockchainConnectionManager.getHardhatSetupGuide()
    };

    return NextResponse.json(response);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    
    return NextResponse.json({
      isConnected: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      setupGuide: BlockchainConnectionManager.getHardhatSetupGuide()
    }, { status: 500 });
  }
}
