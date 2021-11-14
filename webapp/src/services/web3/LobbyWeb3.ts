import { ethers } from "ethers";
import TurnBasedGame from "../../abis/TurnBasedGame.json";
import TurnBasedGameContext from "../../abis/TurnBasedGameContext.json";
import TurnBasedGameLobby from "../../abis/TurnBasedGameLobby.json";
import PokerToken from "../../abis/PokerToken.json";
import { TurnBasedGame__factory } from "../../types";
import { TurnBasedGameContext__factory } from "../../types";
import { TurnBasedGameLobby__factory } from "../../types";
import { PokerToken__factory } from "../../types";
import { GameConstants } from "../../GameConstants";
import { ServiceConfig } from "../ServiceConfig";
import { Web3Utils } from "./Web3Utils";
import { ErrorHandler } from "../ErrorHandler";

export class LobbyWeb3 {
    /**
     * Joins a new Texas Holdem game using Web3
     */
    public static async joinGame(playerInfo: Object, gameReadyCallback) {
        // retrieves signer + chainId (e.g., from metamask)
        const signer = ServiceConfig.getSigner();
        const chainId = ServiceConfig.getChainId();

        const playerAddress = await signer.getAddress();

        // connects to the TurnBasedGame and TurnBasedGameLobby contracts
        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, signer);
        const gameContract = TurnBasedGame__factory.connect(TurnBasedGame.address, signer);
        const contextContract = TurnBasedGameContext__factory.connect(TurnBasedGameContext.address, signer);
        const lobbyContract = TurnBasedGameLobby__factory.connect(TurnBasedGameLobby.address, signer);
        const gameContextContract = contextContract.attach(gameContract.address);

        // cancels any current event listening
        gameContextContract.removeAllListeners();

        // listens to GameReady events indicating that a game has been created
        gameContextContract.on("GameReady", (index, ctx) => {
            // checks if player is participating in the newly created game
            const playerIndex = ctx.players.indexOf(playerAddress);
            if (playerIndex == -1) {
                // player is not participating in the game: ignore it
                return;
            }

            // copies relevant context data of the newly created game
            const context: any = {
                gameTemplateHash: ctx.gameTemplateHash,
                gameMetadata: ctx.gameMetadata,
                players: ctx.players,
                playerFunds: ctx.playerFunds,
                playerInfos: new Array(ctx.players.length),
                playerIndex: playerIndex,
                opponentIndex: playerIndex == 0 ? 1 : 0,
            };

            // decodes player infos
            for (let i = 0; i < ctx.players.length; i++) {
                context.playerInfos[i] = JSON.parse(ethers.utils.toUtf8String(ctx.playerInfos[i]));
            }

            // cancels event listening and calls callback
            gameContextContract.removeAllListeners();
            gameReadyCallback(index, context);
        });

        // retrieves player's balance to see how much he will bring to the table
        const playerFunds = await pokerTokenContract.balanceOf(playerAddress);

        // retrieves validator addresses for the selected chain
        const validators = GameConstants.VALIDATORS[chainId];
        if (!validators || !validators.length) {
            console.error("No validators defined for the selected chain with ID " + chainId);
        }

        // Encode player infos
        let encodedPlayerInfo = Web3Utils.toUint8Array(playerInfo);

        // joins game by calling Lobby smart contract
        await ErrorHandler.execute("joinGame", async () => {
            const tx = await lobbyContract.joinGame(
                GameConstants.GAME_TEMPLATE_HASH,
                GameConstants.GAME_METADATA,
                validators,
                GameConstants.TIMEOUT_SECONDS,
                GameConstants.NUM_PLAYERS,
                GameConstants.MIN_FUNDS,
                PokerToken.address,
                playerFunds,
                encodedPlayerInfo
            );
            console.log(`Submitted join game request (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`);
        });
    }
}
