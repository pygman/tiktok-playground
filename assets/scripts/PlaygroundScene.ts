import * as cc from 'cc';
import { _decorator } from 'cc';
import { default as fengari } from 'fengari-web';
const { ccclass, property } = _decorator;

@ccclass('playground')
export class playground extends cc.Component {

    @property({type: cc.Prefab})
    private check: cc.Prefab;

    onLoad() {
        console.log('onLoad');
        fengari.load('print("hello lua")')();
        const result = fengari.load(`
            local x = 1
            local y = 2
            function add(x, y)
                return x + y;
            end
            return add(x, y);
        `)();
        console.log(result);
    }

    start() {
        // todo m * n
        const check1 = cc.instantiate(this.check)
        check1.parent = this.node;
        check1.setPosition(0, 0);
    }

    update(deltaTime: number) {

    }
}
