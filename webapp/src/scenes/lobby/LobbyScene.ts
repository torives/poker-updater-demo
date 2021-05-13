import { AudioManager } from "../../AudioManager";
import { GameConstants } from "../../GameConstants";
import { GameManager } from "../../GameManager";
import { GameVars } from "../../GameVars";
import { MatchingLayer } from "./MatchingLayer";

export class LobbyScene extends Phaser.Scene {

    public static currentInstance: LobbyScene;

    private background: Phaser.GameObjects.Image;
    private backContainer: Phaser.GameObjects.Container;
    private topContainer: Phaser.GameObjects.Container;
    private matchingLayer: MatchingLayer;

    constructor() {

        super("LobbyScene");

        LobbyScene.currentInstance = this;
    }

    public create(): void {

        GameManager.setCurrentScene(this);

        this.background = new Phaser.GameObjects.Image(this, GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2, "texture_atlas_1", "bg_gradient");
        this.background.setScale(2);
        this.add.existing(this.background);

        this.backContainer = new Phaser.GameObjects.Container(this);
        this.add.existing(this.backContainer);

        let backButton = new Phaser.GameObjects.Image(this, 50, 50, "texture_atlas_1", "btn_back");
        backButton.setInteractive();
        backButton.on("pointerover", () => {
            backButton.setScale(1.05);
        }, this);
        backButton.on("pointerout", () => {
            backButton.setScale(1);
        }, this);
        backButton.on("pointerup", () => {
            AudioManager.playSound("btn_click");
            GameManager.enterSplashScene();
        }, this);
        this.backContainer.add(backButton);

        this.topContainer = new Phaser.GameObjects.Container(this);
        this.topContainer.setPosition(GameConstants.GAME_WIDTH / 2, 0);
        this.add.existing(this.topContainer);

        let title = new Phaser.GameObjects.Image(this, 0, 10, "texture_atlas_1", "logo_main");
        title.setOrigin(.5, 0);
        title.setScale(.75);
        this.topContainer.add(title);

        let powered = new Phaser.GameObjects.Text(this, 0, 230, " powered by Cartesi ", {fontFamily: "Oswald-Medium", fontSize: "20px", color: "#FFFFFF"});
        powered.setOrigin(.5, 0);
        powered.setShadow(1, 1, "#000000", 5);
        this.topContainer.add(powered);

        this.matchingLayer = new MatchingLayer(this);
        this.add.existing(this.matchingLayer);

        this.onOrientationChange();
    }

    public onOpponentJoined(): void {

        this.matchingLayer.onStopScrolling();
    }

    public onOrientationChange(): void {

        if (GameVars.landscape) {
            if (GameVars.scaleX > 1.2) {
                this.topContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
                this.backContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
            } else {
                this.topContainer.setScale(GameVars.scaleX, 1);
                this.backContainer.setScale(GameVars.scaleX, 1);
            }
        } else {
            this.topContainer.setScale(1.2, GameVars.scaleY * 1.2);
            this.backContainer.setScale(1.2, GameVars.scaleY * 1.2);
        }

        this.matchingLayer.setScalesAndPositions();
    }
}