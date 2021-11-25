import Portis from "@portis/web3";
import { GameConstants } from "../../GameConstants";
import { ServiceConfig } from "../ServiceConfig";
import { AbstractOnboarding } from "./AbstractOnboarding";
import { ethers } from "ethers";

export class OnboardingPortis extends AbstractOnboarding {
    private static portis: Portis;
    private static isLogged;

    /**
     * Starts user onboarding using Web3
     */
    public static async start(onChange) {
        if (!this.portis) {
            this.portis = new Portis(GameConstants.PROVIDER_PORTIS_APPID, {
                nodeUrl: GameConstants.CHAIN_ENDPOINTS[ServiceConfig.getChainId()],
                chainId: ServiceConfig.getChainId(),
            });
        }

        this.portis.onLogin(async (walletAddress, email, reputation) => {
            this.setSigner(walletAddress);
            this.isLogged = true;
            this.update(onChange);
        });

        this.portis.onActiveWalletChanged((walletAddress) => {
            this.setSigner(walletAddress);
            this.update(onChange);
        });

        this.portis.showPortis().then(() => {
            this.update(onChange);
        });

        this.update(onChange);
    }

    /**
     * Main web3 update procedure
     */
    private static async update(onChange) {
        try {
            // While Portis is initializing
            if (this.isLogged == undefined) {
                onChange({
                    label: "Connecting to wallet...",
                    onclick: undefined,
                    loading: true,
                    error: false,
                    ready: false,
                });
                return;
            }

            // Portis initialized but user is not logged in
            if (this.isLogged == false) {
                onChange({
                    label: "Connect to wallet",
                    onclick: this.connectWallet.bind(this),
                    loading: false,
                    error: false,
                    ready: false,
                });
                return;
            }

            // checks if the connected wallet's network is known/supported
            const chainName = GameConstants.CHAIN_NAMES[ServiceConfig.getChainId()];
            if (!chainName) {
                onChange({
                    label: "Unsupported network",
                    onclick: this.connectWallet.bind(this),
                    loading: false,
                    error: true,
                    ready: false,
                });
                return;
            }

            // checks if player has an unfinished ongoing game
            if (await super.checkUnfinishedGame(onChange, chainName, this.update.bind(this))) {
                return;
            }

            // checks player's balance to see if he has enough tokens to play
            if (!(await super.checkBalance(onChange, chainName))) {
                return;
            }

            // checks player's allowance to see if the Lobby contract can manage the player's tokens
            if (!(await super.checkAllowance(onChange, false))) {
                return;
            }
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
        this.portis.showPortis().then(() => {
            this.update(onChange);
        });
    }

    /**
     * Sets signer for the application
     */
    private static setSigner(address: string) {
        const web3Provider = new ethers.providers.Web3Provider(this.portis.provider);
        const signer = web3Provider.getSigner(address);
        ServiceConfig.currentInstance.setSigner(signer);
        console.log(`Connected to account '${address}' via Portis`);
    }
}
