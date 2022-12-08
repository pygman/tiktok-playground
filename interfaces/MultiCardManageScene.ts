import * as cc from 'cc';
import {_decorator, Component, Input} from 'cc';
import { Card, Client, PerosnalItem} from "db://assets/scripts/Client";

const {ccclass, property} = _decorator;

@ccclass('CardManage')
export class CardManage extends Component {
    private selectedCards: Set<number> = new Set();
    private content: cc.Node;
    private client: Client;

    @property({type: cc.Prefab})
    private cardPrefab: cc.Prefab;
    private cardPerosnalItems: PerosnalItem[];
    private cards: Card[];

    onLoad() {
        this.client = this.node.getComponent("Client") as Client;
        const cardsBoard = this.node.getChildByName('CardsBoard');
        this.content = cardsBoard.getChildByName('view').getChildByName('content');

        this.node.getChildByName('BuyCard').on(Input.EventType.TOUCH_END, (_) => {
            console.log(`BuyBag clicked`);
        });
        this.node.getChildByName('ToStart').on(Input.EventType.TOUCH_END, (_) => {
            console.log(`ToStart clicked`);
            cc.director.loadScene('StartScene');
        });

        /*
        const cardClick = (i: number) => {
            if (this.selected !== 0) {
                this.node.getChildByName(`Card${this.selected}`).getComponent(cc.Sprite).color = cc.Color.WHITE;
            }
            this.selected = i;
            this.node.getChildByName(`Card${i}`).getComponent(cc.Sprite).color = cc.Color.CYAN;
        }
        this.node.getChildByName('Card1').on(Input.EventType.TOUCH_END, (_) => {
            console.log(`Card1 clicked`);
            cardClick(1);
        });
        this.node.getChildByName('Card2').on(Input.EventType.TOUCH_END, (_) => {
            console.log(`Card2 clicked`);
            cardClick(2);
        });
        this.node.getChildByName('Card3').on(Input.EventType.TOUCH_END, (_) => {
            console.log(`Card3 clicked`);
            cardClick(3);
        });
        this.node.getChildByName('SetTik').on(Input.EventType.TOUCH_END, (_) => {
            console.log(`SetTik clicked`);
            if (this.selected === 0) {
                return;
            }
            if (this.tik !== 0) {
                this.node.getChildByName(`Card${this.tik}`).getChildByName('Group')
                    .getComponent(cc.Label).string = '';
            }
            if (this.tok === this.selected) {
                this.tok = 0;
            }
            this.tik = this.selected;
            this.node.getChildByName(`Card${this.selected}`).getChildByName('Group')
                .getComponent(cc.Label).string = 'Tik';
        });
        this.node.getChildByName('SetTok').on(Input.EventType.TOUCH_END, (_) => {
            console.log(`SetTok clicked`);
            if (this.selected === 0) {
                return;
            }
            if (this.tok !== 0) {
                this.node.getChildByName(`Card${this.tik}`).getChildByName('Group')
                    .getComponent(cc.Label).string = '';
            }
            if (this.tik === this.selected) {
                this.tik = 0;
            }
            this.tok = this.selected;
            this.node.getChildByName(`Card${this.selected}`).getChildByName('Group')
                .getComponent(cc.Label).string = 'Tok';
        });
         */
        this.node.getChildByName('DoUpload').on(Input.EventType.TOUCH_END, (_) => {
            console.log(`DoUpload clicked`);
            if (this.selectedCards.size < 2) {
                alert(`Do Upload at least two cards`);
            }
            cc.director.loadScene('GameReadyScene');
        });
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

    loadCards(cards: Card[]) {
        const linage = Math.floor((cards.length + 2) / 3);
        const ui = this.content.getComponent(cc.UITransform)
        console.log(`linage: ${linage}`);
        ui.setContentSize(ui.contentSize.width, linage * 400 + 200);
        this.content.removeAllChildren();

        const cardClick = (i: number) => {
            if (this.selectedCards.has(i)) {
                this.content.getChildByName(`Card${i}`).getComponent(cc.Sprite).color = cc.Color.WHITE;
                this.selectedCards.delete(i);
            } else {
                this.selectedCards.add(i);
                this.content.getChildByName(`Card${i}`).getComponent(cc.Sprite).color = cc.Color.CYAN;
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
