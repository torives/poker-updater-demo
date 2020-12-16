export class Card extends Phaser.GameObjects.Container {

    private image: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene, x: number, y: number) {

        super(scene);

        this.x = x;
        this.y = y;

        this.image = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_2", "card-back");
        this.add(this.image);
    }

    public setValue(card: {value: number, suit: number}) {

        if (!card) {
            this.image.setFrame("card-back");
        } else {

            if (this.image.frame.name === (card.suit + "_" + (card.value + 1))) {
                return;
            }

            this.scene.tweens.add({
                targets: this,
                scaleX: 0,
                ease: Phaser.Math.Easing.Linear,
                duration: 100,
                onComplete: () => {
                    this.image.setFrame(card.suit + "_" + (card.value + 1));
                    this.scene.tweens.add({
                        targets: this,
                        scaleX: 1,
                        ease: Phaser.Math.Easing.Linear,
                        duration: 100
                    });
                },
                onCompleteScope: this
            });
        }
    }
}