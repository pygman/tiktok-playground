import { _decorator, Component, Node } from 'cc';
import { default as fengari } from 'fengari-web';
const { ccclass, property } = _decorator;

@ccclass('playground')
export class playground extends Component {

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

    }

    update(deltaTime: number) {

    }
}
