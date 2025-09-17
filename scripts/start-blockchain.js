#!/usr/bin/env node

const { spawn } = require('child_process');
const { exec } = require('child_process');
const path = require('path');

console.log('🚀 블록체인 환경 자동 설정 시작...\n');

// Hardhat 노드가 이미 실행 중인지 확인
function checkHardhatRunning() {
  return new Promise((resolve) => {
    exec('netstat -an | findstr :8545', (error, stdout) => {
      if (stdout.includes(':8545')) {
        console.log('✅ Hardhat 노드가 이미 실행 중입니다.');
        resolve(true);
      } else {
        console.log('📡 Hardhat 노드를 시작합니다...');
        resolve(false);
      }
    });
  });
}

// Hardhat 노드 시작
function startHardhatNode() {
  return new Promise((resolve, reject) => {
    const hardhatProcess = spawn('npx', ['hardhat', 'node'], {
      stdio: 'inherit',
      shell: true
    });

    // 5초 후에 노드가 시작되었다고 가정
    setTimeout(() => {
      console.log('✅ Hardhat 노드 시작 완료!');
      resolve(hardhatProcess);
    }, 5000);

    hardhatProcess.on('error', (error) => {
      console.error('❌ Hardhat 노드 시작 실패:', error.message);
      reject(error);
    });
  });
}

// 컨트랙트 배포
function deployContracts() {
  return new Promise((resolve, reject) => {
    console.log('📜 컨트랙트 배포 중...');
    
    const deployProcess = spawn('npx', ['hardhat', 'run', 'scripts/deploy.ts', '--network', 'localhost'], {
      stdio: 'inherit',
      shell: true
    });

    deployProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ 컨트랙트 배포 완료!');
        resolve();
      } else {
        console.log('⚠️ 컨트랙트 배포 실패 (코드:', code, ')');
        console.log('💡 deploy.ts 스크립트가 없을 수 있습니다. 수동으로 배포해주세요.');
        resolve(); // 실패해도 계속 진행
      }
    });

    deployProcess.on('error', (error) => {
      console.log('⚠️ 컨트랙트 배포 중 오류:', error.message);
      console.log('💡 수동으로 배포해주세요: npx hardhat run scripts/deploy.ts --network localhost');
      resolve(); // 실패해도 계속 진행
    });
  });
}

// 메인 실행 함수
async function main() {
  try {
    const isRunning = await checkHardhatRunning();
    
    if (!isRunning) {
      await startHardhatNode();
      
      // 노드가 완전히 시작될 때까지 잠시 대기
      console.log('⏳ 노드 초기화 대기 중...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await deployContracts();
    }
    
    console.log('\n🎉 블록체인 환경 준비 완료!');
    console.log('📍 RPC URL: http://127.0.0.1:8545');
    console.log('🆔 Chain ID: 31337');
    console.log('\n💡 이제 Next.js 애플리케이션을 시작할 수 있습니다.');
    console.log('   npm run dev');
    
  } catch (error) {
    console.error('\n❌ 블록체인 환경 설정 실패:', error.message);
    console.log('\n🔧 수동 설정 방법:');
    console.log('1. 새 터미널에서: npx hardhat node');
    console.log('2. 컨트랙트 배포: npx hardhat run scripts/deploy.ts --network localhost');
    console.log('3. Next.js 시작: npm run dev');
    process.exit(1);
  }
}

// 프로그램 종료 시 정리
process.on('SIGINT', () => {
  console.log('\n🛑 블록체인 설정 중단됨');
  process.exit(0);
});

main();

