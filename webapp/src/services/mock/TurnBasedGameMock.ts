import { ethers } from "ethers";
import { VerificationState, VerificationStates } from "../Game";
import { TurnBasedGame, TurnInfo } from "../TurnBasedGame";
import { LobbyMock } from "./LobbyMock";

/**
 * TurnBasedGame mock implementation
 *
 * Expects to be connected to another instance of TurnBasedGameMock
 */
export class TurnBasedGameMock implements TurnBasedGame {
    other: TurnBasedGameMock;
    turnInfoQueue: Array<TurnInfo>;
    onTurnOverReceivedResolvers: Array<(any) => any>;

    playerStake = ethers.BigNumber.from(0);
    confirmedResult: any;
    claimedResult: any;
    onResultClaimReceived: (any) => any;
    onGameOverReceived: (any) => any;

    onGameChallengeReceived: (message: string) => any;
    onVerificationUpdate: (update: [VerificationState, string]) => any;
    challengerIndex: number;
    verificationState: VerificationState;

    constructor(private gameIndex, private playerIndex: number) {
        this.turnInfoQueue = [];
        this.onTurnOverReceivedResolvers = [];
    }

    connect(other: TurnBasedGameMock) {
        this.other = other;
        other.other = this;
    }

    // turn submission
    submitTurn(info: TurnInfo): Promise<TurnInfo> {
        return new Promise((resolve, reject) => {
            if (this.confirmedResult !== undefined) {
                // game has ended: no longer accepts submissions
                reject("Game result has been confirmed and game has ended: turn submissions no longer accepted");
                return;
            }
            if (this.claimedResult !== undefined) {
                // claim has been made: no longer accepts submissions
                reject("Game result has been claimed: turn submissions no longer accepted");
                return;
            }
            if (this.challengerIndex !== undefined) {
                // game has been challenged: no longer accepts submissions
                reject("Game has been challenged: turn submissions no longer accepted");
                return;
            }
            try {
                this.other.turnInfoQueue.push(info);
                this.playerStake = info.playerStake;
                resolve(info);
                this.other._dispatchTurn();
            } catch (error) {
                reject(error);
            }
        });
    }

    receiveTurnOver() {
        return new Promise<TurnInfo>((resolve) => {
            this.onTurnOverReceivedResolvers.push(resolve);
            this._dispatchTurn();
        });
    }

    private _dispatchTurn() {
        const info = this.turnInfoQueue.shift();
        if (!info) return;
        const resolve = this.onTurnOverReceivedResolvers.shift();
        if (!resolve) {
            this.turnInfoQueue.unshift(info);
            return;
        }
        setTimeout(() => {
            resolve(info);
            this._dispatchTurn();
        }, 10);
    }

    //
    // CLAIM RESULT HANDLING
    //
    private _onClaimResult(claimedResult) {
        // set state
        this.claimedResult = claimedResult;
        // call listener
        setTimeout(() => {
            if (this.onResultClaimReceived) {
                this.onResultClaimReceived(claimedResult);
            }
        }, 10);
    }
    claimResult(claimedResult: any): Promise<void> {
        return new Promise(async (resolve) => {
            this.claimedResult = claimedResult;
            resolve();
            this.other._onClaimResult(claimedResult);
        });
    }
    receiveResultClaimed() {
        return new Promise<any>((resolve) => {
            this.onResultClaimReceived = resolve;
        });
    }

    //
    // CONFIRM RESULT AND GAME END HANDLING
    //
    private _onGameEnd(confirmedResult) {
        this.confirmedResult = confirmedResult;
        if (this.onGameOverReceived) {
            this.onGameOverReceived(confirmedResult);
        }
    }
    confirmResult(): Promise<void> {
        return new Promise<void>((resolve) => {
            resolve();
            this._onGameEnd(this.claimedResult);
            this.other._onGameEnd(this.claimedResult);
        });
    }
    receiveGameOver(): Promise<any> {
        return new Promise<any>((resolve) => {
            this.onGameOverReceived = resolve;
        });
    }

    //
    // CHALLENGE AND VERIFICATION
    //
    private _setVerificationState(gameIndex, newState, message) {
        // sets verification state and triggers callback
        this.verificationState = newState;
        if (this.onVerificationUpdate) {
            this.onVerificationUpdate([this.verificationState, message]);
        }
        if (newState == VerificationState.ENDED) {
            // verification ended, game ends with cheater losing everything
            const result = this._computeResultVerification();
            this._onGameEnd(result);
            this.other._onGameEnd(result);
        } else {
            // simulates verification progress (one step every 5 sec, let's skip VerificationStates.RESULT_CHALLENGED)
            newState = this._incrementVerificationState(newState);
            if (newState == VerificationState.RESULT_CHALLENGED) {
                newState = this._incrementVerificationState(newState);
            }
            setTimeout(() => this._setVerificationState(gameIndex, newState, message), 5000);
        }
    }

    private _incrementVerificationState(state) {
        // verification states ordering
        const newState = Math.min(VerificationStates.indexOf(state) + 1, VerificationStates.length - 1);
        return VerificationStates[newState];
    }

    private _computeResultTimeout() {
        // whoever claims the timeout is calling this method and is assumed to be the winner
        // - winner gets the other player's stake
        // - players funds are extracted from LobbyMock (since necessarily we have config `transport=mock`)
        const fundsShare = Array(2);
        fundsShare[this.playerIndex] = LobbyMock.PLAYER_FUNDS.add(this.other.playerStake);
        fundsShare[this.other.playerIndex] = LobbyMock.PLAYER_FUNDS.sub(this.other.playerStake);
        return fundsShare;
    }

    private _computeResultVerification() {
        // challenger is assumed to be the honest part and will win everything
        // - players funds are extracted from LobbyMock (since necessarily we have config `transport=mock`)
        const winner = this.challengerIndex;
        const loser = winner == this.playerIndex ? this.other.playerIndex : this.playerIndex;
        const fundsShare = Array(2);
        fundsShare[winner] = LobbyMock.PLAYER_FUNDS.mul(2);
        fundsShare[loser] = ethers.BigNumber.from(0);
        return fundsShare;
    }

    private _onGameChallenged(gameIndex, msg, challengerIndex) {
        this.challengerIndex = challengerIndex;
        if (this.onGameChallengeReceived) {
            this.onGameChallengeReceived(msg);
        }
        setTimeout(() => this._setVerificationState(gameIndex, VerificationState.STARTED, msg), 3000);
    }

    claimTimeout(): Promise<void> {
        return new Promise<void>((resolve) => {
            resolve();
            const result = this._computeResultTimeout();
            this._onGameEnd(result);
            this.other._onGameEnd(result);
        });
    }

    challengeGame(msg: string): Promise<void> {
        return new Promise<void>((resolve) => {
            resolve();
            this._onGameChallenged(this.gameIndex, msg, this.playerIndex);
            this.other._onGameChallenged(this.gameIndex, msg, this.playerIndex);
        });
    }

    receiveGameChallenged(): Promise<any> {
        return new Promise<any>((resolve) => {
            this.onGameChallengeReceived = resolve;
        });
    }

    receiveVerificationUpdate(): Promise<[VerificationState, string]> {
        return new Promise<any>((resolve) => {
            this.onVerificationUpdate = resolve;
        });
    }
}
