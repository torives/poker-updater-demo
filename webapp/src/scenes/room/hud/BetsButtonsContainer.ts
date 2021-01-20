import { RaiseButton } from './RaiseButton';
import { GameVars } from './../../../GameVars';
import { GameConstants } from './../../../GameConstants';
import { BetButton } from './BetButton';
import { RoomManager } from "../RoomManager";

export class BetsButtonsContainer extends Phaser.GameObjects.Container {

    constructor(scene: Phaser.Scene) {

        super(scene);
    }

    public show(): void {

        this.visible = true;

        this.setButtons();
    }

    public setButtons(): void {

        this.removeAll();

        let scaleX = Math.min(GameVars.scaleX, 1.2);

        if (RoomManager.getPlayerBets() < RoomManager.getOpponentBets()) {

            if (GameVars.landscape) {
                let foldButton = new BetButton(this.scene, GameConstants.ACTION_FOLD, -402 / scaleX, 16 / scaleX);
                this.add(foldButton);
    
                let callButton = new BetButton(this.scene, GameConstants.ACTION_CALL, -207 / scaleX, 23 / scaleX);
                this.add(callButton);
    
                let raiseButton = new RaiseButton(this.scene, 195 / scaleX, 57.4 / scaleX);
                this.add(raiseButton);
    
                let btn_divider = new Phaser.GameObjects.Image(this.scene, foldButton.x + 80 / scaleX, -35, "texture_atlas_1", "btn_divider");
                this.add(btn_divider);
    
                btn_divider = new Phaser.GameObjects.Image(this.scene, callButton.x + 115 / scaleX, -35, "texture_atlas_1", "btn_divider");
                this.add(btn_divider);
            } else {
                let foldButton = new BetButton(this.scene, GameConstants.ACTION_FOLD, -330, 14);
                this.add(foldButton);
    
                let callButton = new BetButton(this.scene, GameConstants.ACTION_CALL, -170, 18);
                this.add(callButton);
    
                let raiseButton = new RaiseButton(this.scene, 160, 48);
                this.add(raiseButton);
    
                let btn_divider = new Phaser.GameObjects.Image(this.scene, foldButton.x + 70, -35, "texture_atlas_1", "btn_divider");
                this.add(btn_divider);
    
                btn_divider = new Phaser.GameObjects.Image(this.scene, callButton.x + 90, -35, "texture_atlas_1", "btn_divider");
                this.add(btn_divider);
            }
        } else {

            if (GameVars.landscape) {
                let checkButton = new BetButton(this.scene, GameConstants.ACTION_CHECK, -330 / scaleX, 30 / scaleX);
                this.add(checkButton);
        
                let raiseButton = new RaiseButton(this.scene, 151 / scaleX, 66.2 / scaleX);
                this.add(raiseButton);
        
                let btn_divider = new Phaser.GameObjects.Image(this.scene, checkButton.x + 150 / scaleX, -35, "texture_atlas_1", "btn_divider");
                this.add(btn_divider);
            } else {
                let checkButton = new BetButton(this.scene, GameConstants.ACTION_CHECK, -300, 20);
                this.add(checkButton);

                let raiseButton = new RaiseButton(this.scene, 100, 60);
                this.add(raiseButton);

                let btn_divider = new Phaser.GameObjects.Image(this.scene, checkButton.x + 100 / scaleX, -35, "texture_atlas_1", "btn_divider");
                this.add(btn_divider);
            }
        } 
    }
}
