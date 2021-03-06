import { BigNumber } from "ethers";

export class GameVars {

    public static gameData: GameData;
    public static appState: AppState;
    public static scaleY: number;
    public static scaleX: number;
    public static landscape: boolean;
    public static aspectRatio: number;
    public static currentScene: Phaser.Scene;

    public static gameIndex: BigNumber;
    public static playerIndex: number;
    public static playerFunds: BigNumber;

    public static opponentAvatar: number;
    public static opponentName: string;
    public static opponentIndex: number;
    public static opponentFunds: BigNumber;

    public static raiseValue: BigNumber;
  
    public static formatNumber(value: number): string {

        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    public static formatString(value: string): string {

        let newStr = value.replace(/_/g, " ");
        newStr = newStr.charAt(0).toUpperCase() + newStr.slice(1);

        return newStr;
    }
}
