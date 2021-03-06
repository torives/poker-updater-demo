import { GameVars } from "../../../GameVars";
import { RoomManager } from "../RoomManager";
import { Card } from "./Card";

export class CommunityCards extends Phaser.GameObjects.Container {

    private cards: Card[];

    constructor(scene: Phaser.Scene) {

        super(scene);

        for (let i = 0; i < 5; i++) {
            let mark = new Phaser.GameObjects.Image(this.scene, -220 + 110 * i, 0, "texture_atlas_1", "mark_card");
            this.add(mark);
        }

        this.cards = [];

        for (let i = 0; i < 5; i++) {
            let card = new Card(this.scene, -220 + 110 * i, 0);
            card.visible = false;
            this.add(card);
            this.cards.push(card);
        }

        this.setScalesAndPostions();
    }

    public setScalesAndPostions(): void {

        let reducedScale = .75;

        if (GameVars.landscape) {
            this.setScale(reducedScale * GameVars.scaleX, reducedScale * 1);
            this.y = 30;
        } else {
            this.setScale(reducedScale * 1, GameVars.scaleY * reducedScale);
            this.y = 0;
        }
    }

    public markCards(endData: any): void {

        let winnerHand = [];

        if (endData.isWinner[GameVars.playerIndex]) {
            if (endData.hands && endData.hands[GameVars.playerIndex]) {
                winnerHand = endData.hands[GameVars.playerIndex];
            } 
        } else if (endData.isWinner[GameVars.opponentIndex]) {
            if (endData.hands && endData.hands[GameVars.opponentIndex]) {
                winnerHand = endData.hands[GameVars.opponentIndex];
            }
        }

        if (winnerHand && winnerHand.length) {

            for (let i = 0; i < winnerHand.length; i++) {
                let winnerHandCard = winnerHand[i];
                for (let j = 0; j < this.cards.length; j++) {
                    if (winnerHandCard && this.cards[j].info && winnerHandCard.toIndex() === this.cards[j].info.toIndex()) {
                        this.cards[j].showMark();
                    }
                }
            }
        }
    }

    public resetTable(): void {

        for (let i = 0; i < 5; i++) {
            this.cards[i].hideCard();
        }
    }

    public async setCards(): Promise<void> {

        let cards = await RoomManager.getCommunityCards();

        for (let i = 0; i < 5; i++) {
            this.cards[i].showCard(cards[i], i * 100 + 1000);
        }
    }
}
