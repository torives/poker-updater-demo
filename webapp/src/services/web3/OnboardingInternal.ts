import { GameConstants } from "../../GameConstants";
import { ServiceConfig } from "../ServiceConfig";
import { AbstractOnboarding } from "./AbstractOnboarding";
import { ethers } from "ethers";
import { GameVars } from "../../GameVars";
import { GameManager } from "../../GameManager";

export class OnboardingInternal extends AbstractOnboarding {
    private static wallet: ethers.Wallet;
    private static password = "53H#YwnPc!#2";

    /**
     * Starts user onboarding using Web3
     */
    public static async start(onChange) {
        this.update(onChange);
    }

    /**
     * Main web3 update procedure
     */
    private static async update(onChange) {
        try {
            if (this.wallet == undefined) {
                // wallet not initialized
                this.connectWallet(onChange);
                onChange({
                    label: "Connecting to wallet...",
                    onclick: undefined,
                    loading: true,
                    error: false,
                    ready: false,
                });
                return;
            }

            // checks player account's status
            const chainName = GameConstants.CHAIN_NAMES[ServiceConfig.getChainId()];
            super.checkAccountStatus(onChange, chainName, this.update.bind(this));
        } catch (error) {
            console.error(error);
            onChange({
                label: "Unexpected error",
                onclick: undefined,
                loading: false,
                error: true,
                ready: false,
            });
        }
    }

    /**
     * Connects to an Ethereum wallet
     * @param onChange
     */
    private static async connectWallet(onChange) {
        // TODO: ask user for password
        const password = this.password;

        if (!GameVars.gameData.walletEncryptedJson) {
            // no wallet stored locally: creates a new wallet and saves corresponding encrypted JSON to local storage
            console.log(`Creating new internal wallet..`);
            this.wallet = ethers.Wallet.createRandom();
            GameVars.gameData.walletEncryptedJson = await this.wallet.encrypt(password);
            GameManager.writeGameData();
        } else {
            // decrypts previously stored encrypted wallet JSON
            this.wallet = await ethers.Wallet.fromEncryptedJson(GameVars.gameData.walletEncryptedJson, password);
        }

        // connects wallet to configured chain's JSON-RPC endpoint
        const endpoint = GameConstants.CHAIN_ENDPOINTS[ServiceConfig.getChainId()];
        const provider = new ethers.providers.JsonRpcProvider(endpoint);
        this.wallet = this.wallet.connect(provider);

        // sets configured wallet as signer
        const walletAddress = await this.wallet.getAddress();
        ServiceConfig.setSigner(this.wallet);
        console.log(`Connected to internal wallet '${walletAddress}'`);

        this.update(onChange);
    }
}