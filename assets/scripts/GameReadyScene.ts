import * as cc from 'cc';
import { _decorator, Component, Input, Node } from 'cc';
import { Card, Client, PerosnalItem} from "db://assets/scripts/Client";

const { ccclass, property } = _decorator;

@ccclass('GameReadyManage')
export class GameReadyManage extends Component {
    private tik: number = -1;
    private tok: number = -1;
    private turn: number = -1; // null: -1, tik: 0, tok: 1
    private round: number = 0;
    private started: boolean = false;
    private content: cc.Node;
    private client: Client;

    @property({type: cc.Prefab})
    private cardPrefab: cc.Prefab;
    private cardPerosnalItems: PerosnalItem[];
    private cards: Card[];
    onLoad() {
        this.client = this.node.getComponent("Client") as Client;
        this.client.init(
            'http://127.0.0.1:8090',
            '0x8d929e962f940f75aa32054f19a5ea2ce70ae30bfe4ff7cf2dbed70d556265df',
            'ckt1qyq93wzur9h9l6qwyk6d4dvkuufp6gvl08aszz5syl'
        );
        const cardsBoard = this.node.getChildByName('CardsBoard');
        this.content = cardsBoard.getChildByName('view').getChildByName('content');
        this.node.getChildByName('TikCard').on(Input.EventType.TOUCH_END, (_) => {
            console.log(`TikCard clicked`);
            this.onTikCardClick();
        });
        this.node.getChildByName('TokCard').on(Input.EventType.TOUCH_END, (_) => {
            console.log(`TokCard clicked`);
            this.onTokCardClick();
        });
        this.node.on(Input.EventType.TOUCH_START, (_) => {
            console.log(`node clicked`);
            cc.tween(this.node.getChildByName('CardsBoard')).to(0.5, { position: new cc.Vec3(0, -700, 0) }).start();
            setTimeout(() => {
                if (this.tik !== -1) {
                    this.content.getChildByName(`Card${this.tik}`).getComponent(cc.Sprite).color = cc.Color.WHITE;
                }
                if (this.tok !== -1) {
                    this.content.getChildByName(`Card${this.tok}`).getComponent(cc.Sprite).color = cc.Color.WHITE;
                }
            }, 500);
        });
        this.node.getChildByName('ToStart').on(Input.EventType.TOUCH_END, (_) => {
            console.log(`ToStart clicked`);
            cc.director.loadScene('StartScene');
        });
        this.node.getChildByName('DoPlay').on(Input.EventType.TOUCH_END, (_) => {
            console.log(`DoPlay clicked`);
            if (this.tik === -1 && this.tok === -1) {
                console.log('cards select are not ready!');
                return;
            }
            this.client.start_tiktok_battle(this.cardPerosnalItems[this.tik].outpoint, this.cardPerosnalItems[this.tok].outpoint).then((resp) => {
                console.log('game start!!');
                console.log(resp);
            })
        });
    }

    onTikCardClick() {
        console.log(`TikCard clicked`);
        if (!this.started) {
            this.turn = 0;
            if (this.tik !== -1) {
                this.content.getChildByName(`Card${this.tik}`).getComponent(cc.Sprite).color = cc.Color.CYAN;
            }
            cc.tween(this.node.getChildByName('CardsBoard')).to(0.5, { position: new cc.Vec3(0, -100, 0) }).start();
        }
    }

    onTokCardClick() {
        console.log(`TokCard clicked`);
        if (!this.started) {
            this.turn = 1;
            if (this.tok !== -1) {
                this.content.getChildByName(`Card${this.tok}`).getComponent(cc.Sprite).color = cc.Color.CYAN;
            }
            cc.tween(this.node.getChildByName('CardsBoard')).to(0.5, { position: new cc.Vec3(0, -100, 0) }).start();
        }
    }

    start() {
        console.log('start');
        this.client.get_cards().then((perosnalItems) => {
            if (!perosnalItems || perosnalItems.length < 1) {
                return;
            }
            this.cardPerosnalItems = perosnalItems;
            this.cards = perosnalItems.map((p) => p.data as Card);
            this.loadCards(this.cards);
        })
    }

    tiktokLoadCard(nodeName: string, i: number) {
        const cardPlace = this.node.getChildByName(nodeName);
        const oldCard = cardPlace.getChildByName('Card');
        if (oldCard) {
            oldCard.destroy();
        }
        const cardNode = cc.instantiate(this.cardPrefab)
        cardNode.name = `Card`;
        cardNode.parent = this.node.getChildByName(nodeName)
        cardNode.getComponent(cc.Sprite).color = cc.Color.CYAN;
        cardNode.setPosition(0, 0);
        const card = this.cards[i];
        cc.loader.load({ url: card.texture, type: 'png' }, (err, texture) => {
            if (err) return;
            cardNode.getChildByName('pic').getComponent(cc.Sprite).spriteFrame = cc.SpriteFrame.createWithImage(texture as cc.ImageAsset);
        })
        cardNode.getChildByName('title').getComponent(cc.Label).string = card.name;
        cardNode.getChildByName('desc').getComponent(cc.Label).string = `  ${card.rarity}\nlevel: ${card.level}\nweapon: ${card.weapon}\nskill: ${card.skill}\n`;
        cardNode.on(Input.EventType.TOUCH_END, (_) => {
            console.log(`card${i} clicked`);
            if (nodeName === 'TikCard') {
                this.onTikCardClick();
            }
            if (nodeName === 'TokCard') {
                this.onTokCardClick();
            }
        });
    }

    loadCards(cards: Card[]) {
        const linage = Math.floor((cards.length + 2) / 3);
        const ui = this.content.getComponent(cc.UITransform)
        console.log(`linage: ${linage}`);
        ui.setContentSize(ui.contentSize.width, linage * 400 + 200);
        this.content.removeAllChildren();

        const cardClick = (i: number) => {
            if (this.turn === 0) {
                console.log(`tik load ${i}`);
                this.tiktokLoadCard('TikCard', i)
                if (this.tik !== -1) {
                    this.content.getChildByName(`Card${this.tik}`).getComponent(cc.Sprite).color = cc.Color.WHITE;
                }
                this.tik = i;
                const tikSprite = this.content.getChildByName(`Card${i}`).getComponent(cc.Sprite);
                tikSprite.color = cc.Color.CYAN;
                cc.tween(this.node.getChildByName('CardsBoard')).to(0.5, { position: new cc.Vec3(0, -700, 0) }).start();
                setTimeout(() => tikSprite.color = cc.Color.WHITE, 500);
            }
            if (this.turn === 1) {
                console.log(`tok load ${i}`);
                this.tiktokLoadCard('TokCard', i)
                if (this.tok !== -1) {
                    this.content.getChildByName(`Card${this.tok}`).getComponent(cc.Sprite).color = cc.Color.WHITE;
                }
                this.tok = i;
                const tokSprite = this.content.getChildByName(`Card${i}`).getComponent(cc.Sprite);
                tokSprite.color = cc.Color.CYAN;
                cc.tween(this.node.getChildByName('CardsBoard')).to(0.5, { position: new cc.Vec3(0, -700, 0) }).start();
                setTimeout(() => tokSprite.color = cc.Color.WHITE, 500);
            }
        }

        cards.forEach((card, i) => {
            const cardNode = cc.instantiate(this.cardPrefab)
            cardNode.name = `Card${i}`;
            cardNode.parent = this.content;
            cardNode.setPosition([-320, 0, 320][i % 3], -180 - Math.floor(i / 3) * 400);
            cc.loader.load({ url: card.texture, type: 'png' }, (err, texture) => {
                if (err) return;
                cardNode.getChildByName('pic').getComponent(cc.Sprite).spriteFrame = cc.SpriteFrame.createWithImage(texture as cc.ImageAsset);
            })
            // cc.assetManager.loadRemote(card.texture, { ext: 'png' }, (err, asset) => {
            // if (err) return;
            //     cardNode.getChildByName('pic').getComponent(cc.Sprite).spriteFrame = cc.SpriteFrame.createWithImage(asset as cc.ImageAsset);
            // })
            cardNode.getChildByName('title').getComponent(cc.Label).string = card.name;
            cardNode.getChildByName('desc').getComponent(cc.Label).string = `  ${card.rarity}\nlevel: ${card.level}\nweapon: ${card.weapon}\nskill: ${card.skill}\n`;
            cardNode.on(Input.EventType.TOUCH_END, (_) => {
                console.log(`card${i} clicked`);
                cardClick(i);
            });
        })
    }
}
