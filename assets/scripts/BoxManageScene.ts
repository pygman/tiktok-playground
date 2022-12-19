import * as cc from 'cc';
import { _decorator, Component, Input, Node } from 'cc';
// import { Box, MockedClient as Client, PerosnalItem } from "db://assets/scripts/Client";
import { Box, Client, PerosnalItem } from "db://assets/scripts/Client";

const { ccclass, property } = _decorator;

@ccclass('BoxManage')
export class BoxManage extends Component {
    private selected: number = -1;
    private client: Client;

    @property({type: cc.Prefab})
    private boxPrefab: cc.Prefab;
    @property({type: cc.Prefab})
    private msgBoxPrefab: cc.Prefab;
    private boxPerosnalItems: PerosnalItem[];
    private boxes: Box[];

    onLoad() {
        this.client = this.node.getComponent("Client") as Client;
        this.client.init(
            'http://127.0.0.1:8090',
            '0x8d929e962f940f75aa32054f19a5ea2ce70ae30bfe4ff7cf2dbed70d556265df',
            'ckt1qyq93wzur9h9l6qwyk6d4dvkuufp6gvl08aszz5syl'
        );
        console.log(this.client);
        console.log(Client);
        this.node.getChildByName('BuyBag').on(Input.EventType.TOUCH_END, (_) => {
            console.log(`BuyBag clicked`);
        });
        this.node.getChildByName('ToStart').on(Input.EventType.TOUCH_END, (_) => {
            console.log(`ToStart clicked`);
            cc.director.loadScene('StartScene');
        });
        // load boxes
        this.client.get_boxes().then((perosnalItems) => {
            if (!perosnalItems || perosnalItems.length < 1) {
                return;
            }
            this.boxPerosnalItems = perosnalItems;
            this.boxes = perosnalItems.map((p) => p.data as Box);
            this.boxes.map((box, i) => {
                const boxNode = cc.instantiate(this.boxPrefab);
                boxNode.name = `Box${i}`;
                boxNode.parent = this.node;
                const scale = 0.5 + 0.05 * box.max_cards;
                boxNode.setScale(scale, scale);
                boxNode.setPosition(560 * 2 * (i + 1) / (this.boxes.length + 1) - 560, 20);
                boxNode.getComponent(cc.Animation).play('idle');
                boxNode.on(Input.EventType.TOUCH_END, (_) => {
                    console.log(`Box${i} clicked`);
                    bagClick(i);
                });
            });
        })
        const bagClick = (i: number) => {
            if (this.selected !== -1) {
                this.node.getChildByName(`Box${this.selected}`).getComponent(cc.Animation).play('idle');
            }
            this.selected = i;
            this.node.getChildByName(`Box${i}`).getComponent(cc.Animation).play('roll');
        }
        this.node.getChildByName('DoBuy').on(Input.EventType.TOUCH_END, (_) => {
            console.log(`DoBuy clicked`);
            if (this.selected !== -1) {
                this.node.getChildByName(`Box${this.selected}`).getComponent(cc.Animation).play('open');
                this.client.open_box(this.boxPerosnalItems[this.selected].outpoint).then((resp) => {
                    const msgBoxNode = cc.instantiate(this.msgBoxPrefab);
                    msgBoxNode.name = `MsgBox`;
                    msgBoxNode.parent = this.node;
                    msgBoxNode.getChildByName('msg').getComponent(cc.Label).string = `Do Buy Box ${this.selected} success hash:\n${resp}`;
                    msgBoxNode.setPosition(0, 500);
                    cc.tween(msgBoxNode)
                        .to(0.5, { position: new cc.Vec3(0, 300, 0) }, { easing: 'elasticOut' })
                        .delay(3)
                        .to(0.5, { position: new cc.Vec3(0, 500, 0) }, { easing: 'elasticIn' })
                        .start();
                    setTimeout(() => {
                        msgBoxNode.destroy();
                    }, 8000);
                })
            }
        });
    }

    start() {

    }
}
