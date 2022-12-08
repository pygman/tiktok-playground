import * as cc from 'cc';
import {_decorator, Component, Input} from 'cc';
import { Card, Client, PerosnalItem} from "db://assets/scripts/Client";

const {ccclass, property} = _decorator;

@ccclass('CardManage')
export class CardManage extends Component {
    private selected: number = -1;
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
        this.node.getChildByName('CardsBoard').on(Input.EventType.TOUCH_START, (_) => {
            console.log(`CardsBoard clicked`);
            if (this.selected !== -1) {
                this.content.getChildByName(`Card${this.selected}`).getComponent(cc.Sprite).color = cc.Color.WHITE;
                this.selected = -1;
                cc.tween(this.node.getChildByName('Code')).to(0.5, { position: new cc.Vec3(0, -550, 0) }).start();
                this.node.getChildByName('Code').getComponent(cc.EditBox).string = '';
            }
        });
        this.node.getChildByName('DoUpload').on(Input.EventType.TOUCH_END, (_) => {
            console.log(`DoUpload clicked`);
            if (this.selected === -1) {
                alert(`Do Upload have to select a card`);
            }
            // cc.director.loadScene('GameReadyScene');
            const program = this.node.getChildByName('Code').getComponent(cc.EditBox).string;
            this.client.upload_card_program(this.cardPerosnalItems[this.selected].outpoint, program).then((resp) => {
                console.log(`Do Upload Program ${this.selected} success ${resp}`);
            });
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
            if (this.selected === -1) {
                cc.tween(this.node.getChildByName('Code')).to(0.5, { position: new cc.Vec3(0, -150, 0) }).start();
            }
            if (this.selected === i) {
                this.content.getChildByName(`Card${i}`).getComponent(cc.Sprite).color = cc.Color.WHITE;
                this.selected = -1;
            } else {
                if (this.selected !== -1) {
                    this.content.getChildByName(`Card${this.selected}`).getComponent(cc.Sprite).color = cc.Color.WHITE;
                }
                this.selected =  i;
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
