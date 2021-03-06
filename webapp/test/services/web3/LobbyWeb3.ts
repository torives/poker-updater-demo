import { describe } from "mocha";
import { expect } from "chai";
import { GameConstants, ChainId } from "../../../src/GameConstants";
import { ServiceConfig } from "../../../src/services/ServiceConfig";
import { PokerToken, PokerToken__factory } from "../../../src/types";
import PokerTokenJson from "../../../src/abis/PokerToken.json";
import TurnBasedGameLobbyJson from "../../../src/abis/TurnBasedGameLobby.json";
import { LobbyWeb3 } from "../../../src/services/web3/LobbyWeb3";
import { TestWeb3Utils } from "./TestWeb3Utils";
import { WalletWeb3 } from "../../../src/services/web3/WalletWeb3";
import { ethers } from "ethers";

describe("LobbyWeb3", function () {
    const aliceAddress: string = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
    const bobAddress: string = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";

    let pokerTokenContractAlice: PokerToken;
    let pokerTokenContractBob: PokerToken;

    let lobbyWeb3Alice: LobbyWeb3;
    let lobbyWeb3Bob: LobbyWeb3;

    this.timeout(60000);

    beforeEach(async () => {
        ServiceConfig.setChainId(ChainId.LOCALHOST_HARDHAT);

        TestWeb3Utils.setSigner(aliceAddress);
        const aliceSigner = ServiceConfig.getSigner();

        TestWeb3Utils.setSigner(bobAddress);
        const bobSigner = ServiceConfig.getSigner();

        pokerTokenContractAlice = PokerToken__factory.connect(PokerTokenJson.address, aliceSigner);
        pokerTokenContractBob = PokerToken__factory.connect(PokerTokenJson.address, bobSigner);

        // approves spending of tokens
        await pokerTokenContractAlice.approve(TurnBasedGameLobbyJson.address, ethers.constants.MaxUint256);
        await pokerTokenContractBob.approve(TurnBasedGameLobbyJson.address, ethers.constants.MaxUint256);

        lobbyWeb3Alice = new LobbyWeb3();
        lobbyWeb3Bob = new LobbyWeb3();
    });

    it("should notify game ready when the correct number of players have joined", async () => {
        const player1Info = { name: "Alice", avatar: 1 };
        const player2Info = { name: "Bob", avatar: 2 };

        // mints tokens for the players to play (alice has minter role)
        await pokerTokenContractAlice.mint(aliceAddress, GameConstants.MIN_FUNDS);
        await pokerTokenContractAlice.mint(bobAddress, GameConstants.MIN_FUNDS);

        // Creates a promise that will only be resolved when gameReady callback for player 1 is called
        let gameReadyResolverPlayer1: (boolean) => void;
        const promiseIsGameReadyPlayer1: Promise<boolean> = new Promise<boolean>((resolve: (boolean) => void) => {
            gameReadyResolverPlayer1 = resolve;
        });

        // Creates a promise that will only be resolved when gameReady callback for player 2 is called
        let gameReadyResolverPlayer2: (boolean) => void;
        const promiseIsGameReadyPlayer2: Promise<boolean> = new Promise<boolean>((resolve: (boolean) => void) => {
            gameReadyResolverPlayer2 = resolve;
        });

        // Player 1 joins the game
        TestWeb3Utils.setSigner(aliceAddress);
        let gameReadyCallbackPlayer1 = function (index, context) {
            gameReadyResolverPlayer1(true);
            console.log("gameReadyCallbackPlayer1 was called with index=" + index);
        };
        lobbyWeb3Alice.joinGame(player1Info, gameReadyCallbackPlayer1);

        // Player 2 joins the game
        TestWeb3Utils.setSigner(bobAddress);

        let gameReadyCallbackPlayer2 = function (index, context) {
            gameReadyResolverPlayer2(true);
            console.log("gameReadyCallbackPlayer2 was called with index=" + index);
        };
        lobbyWeb3Bob.joinGame(player2Info, gameReadyCallbackPlayer2);

        // Check if game ready callback was called for player 1
        await promiseIsGameReadyPlayer1.then((isGameReady) => {
            expect(isGameReady).to.be.true;
        });
        // Check if game ready callback was called for player 2
        await promiseIsGameReadyPlayer2.then((isGameReady) => {
            expect(isGameReady).to.be.true;
        });
    });

    it("should return player funds when leaving game queue", async () => {
        const playerInfo = { name: "Alice", avatar: 1 };

        // set signer as alice
        TestWeb3Utils.setSigner(aliceAddress);

        // mint tokens (alice has minter role)
        await pokerTokenContractAlice.mint(aliceAddress, GameConstants.MIN_FUNDS);

        // collects current player token balance
        const tokenBalance = await WalletWeb3.getPokerTokens();

        // alice joins the game and locks funds
        await lobbyWeb3Alice.joinGame(playerInfo, () => {});
        expect(await WalletWeb3.getPokerTokens()).to.eql(ethers.constants.Zero);

        // alice leaves the game queue and gets funds back
        await lobbyWeb3Alice.leaveQueue();
        expect(await WalletWeb3.getPokerTokens()).to.eql(tokenBalance);
    });
});
