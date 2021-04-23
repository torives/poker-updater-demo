import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy, get } = deployments;
    const { deployer } = await getNamedAccounts();

    const Descartes = await get("Descartes");
    const Logger = await get("Logger");
    const TurnBasedGame = await deploy("TurnBasedGame", {
        from: deployer,
        log: true,
        args: [Descartes.address, Logger.address],
    });
    await deploy("TurnBasedGameLobby", {
        from: deployer,
        log: true,
        args: [TurnBasedGame.address],
    });
};

export default func;