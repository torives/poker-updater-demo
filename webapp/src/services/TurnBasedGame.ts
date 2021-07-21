import { ServiceConfig, ServiceType, ServiceImpl } from "./ServiceConfig";
import { TurnBasedGameMock } from "./mock/TurnBasedGameMock";
import { TurnBasedGameWeb3 } from "./web3/TurnBasedGameWeb3";
// import { TurnBasedGameWeb3 } from "./web3/TurnBasedGameWeb3";

export interface TurnBasedGame {
    // turn submission
    submitTurn(data: string): Promise<any>;
    receiveTurnOver(): Promise<string>;

    // result claim and confirmation
    claimResult(data: any): Promise<void>;
    receiveResultClaimed(): Promise<any>;
    confirmResult(onResultConfirmed?: (any) => any);
    receiveGameOver(onGameOverReceived: (any) => any);

    // challenge and verification
    challengeGame(msg: string, onGameChallenged?: (string) => any);
    receiveGameChallenged(onGameChallengeReceived: (string) => any);
    receiveVerificationUpdate(onVerificationUpdate?: (VerificationState, string) => any);
    applyVerificationResult(onApplyResultSent: (any) => any);
}

export class TurnBasedGameFactory {
    /**
     * Creates a new Transport instance based on service configuration
     *
     * @returns the Transport instance
     */
    public static create(gameIndex: number): TurnBasedGame {
        const impl = ServiceConfig.get(ServiceType.Transport);
        if (impl === ServiceImpl.Mock) {
            // mock TurnBasedGame
            return new TurnBasedGameMock();
        } else if (impl == ServiceImpl.Web3) {
            // web3 TurnBasedGame
            return new TurnBasedGameWeb3(gameIndex);
        } else {
            // unknown implementation configured
            throw `Unknown transport configuration '${impl}'!`;
        }
    }
}
