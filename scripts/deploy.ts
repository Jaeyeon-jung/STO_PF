import { ethers } from "hardhat";

async function main() {
  console.log("Deploying RealEstateToken contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const RealEstateToken = await ethers.getContractFactory("RealEstateToken");
  const token = await RealEstateToken.deploy();
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log(`RealEstateToken deployed to: ${address}`);

  // 샘플 프로젝트 등록
  console.log("Registering sample projects...");
  
  const projects = [
    {
      id: "seoul-mixed-101",
      name: "서울역 복합 개발",
      location: "서울 중구",
      price: ethers.parseEther("0.1"), // 0.1 ETH per token
      totalSupply: 1000n
    }
  ];

  try {
    for (const project of projects) {
      console.log(`Registering project: ${project.name}`);
      const tx = await token.registerProject(
        project.id,
        project.name,
        project.location,
        project.price,
        project.totalSupply
      );
      await tx.wait();
      console.log(`Project registered: ${project.id}`);

      // 프로젝트 정보 확인
      const registeredProject = await token.getProject(project.id);
      console.log("Registered project details:", registeredProject);
    }
  } catch (error) {
    console.error("Error registering project:", error);
  }

  console.log("Deployment and setup completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});