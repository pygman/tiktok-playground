import * as cc from 'cc';
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CheckGraphics')
export class CheckGraphics extends Component {

    onLoad() {
        const ui = this.node.getComponent(cc.UITransform);
        const { x, y } = ui.contentSize;
        console.log(`CheckGraphics ${x} ${y}`);
        const ctx = this.node.getComponent(cc.Graphics)
        ctx.lineWidth = 2;
        ctx.strokeColor = cc.Color.BLACK;
        ctx.moveTo(-x/2, -y/2);
        ctx.lineTo(x/2, -y/2);
        ctx.lineTo(x/2, y/2);
        ctx.lineTo(-x/2, y/2);
        ctx.lineTo(-x/2, -y/2);
        ctx.stroke();
    }

    start() {

    }

    update(deltaTime: number) {
        
    }
}
