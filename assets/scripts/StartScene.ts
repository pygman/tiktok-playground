import * as cc from 'cc';
import { _decorator, Component, Input, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('startScene')
export class startScene extends Component {
    onLoad() {
        this.node.getChildByName('ToBox').on(Input.EventType.TOUCH_END, (_) => {
            cc.director.loadScene('BoxManageScene');
        });
        this.node.getChildByName('ToCard').on(Input.EventType.TOUCH_END, (_) => {
            cc.director.loadScene('CardManageScene');
        });
        this.node.getChildByName('ToGame').on(Input.EventType.TOUCH_END, (_) => {
            cc.director.loadScene('GameReadyScene');
        });
    }

    start() {

    }
}
