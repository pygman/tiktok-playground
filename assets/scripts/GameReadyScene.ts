import * as cc from "cc";
import { _decorator, Component, Input, Node } from "cc";
import { Card, Client, PerosnalItem } from "db://assets/scripts/Client";
import { default as fengari } from "fengari-web";

const { ccclass, property } = _decorator;

@ccclass("GameReadyManage")
export class GameReadyManage extends Component {
  private tik: number = -1;
  private tok: number = -1;
  private turn: number = -1; // null: -1, tik: 0, tok: 1
  private round: number = 0;
  private started: boolean = false;
  private content: cc.Node;
  private client: Client;

  @property({ type: cc.Prefab })
  private msgBoxPrefab: cc.Prefab;
  @property({ type: cc.Prefab })
  private cardPrefab: cc.Prefab;
  private cardPerosnalItems: PerosnalItem[];
  private cards: Card[];
  onLoad() {
    this.client = this.node.getComponent("Client") as Client;
    this.client.init(
      "http://127.0.0.1:8090",
      "0x8d929e962f940f75aa32054f19a5ea2ce70ae30bfe4ff7cf2dbed70d556265df",
      "ckt1qyq93wzur9h9l6qwyk6d4dvkuufp6gvl08aszz5syl"
    );
    const cardsBoard = this.node.getChildByName("CardsBoard");
    this.content = cardsBoard.getChildByName("view").getChildByName("content");
    this.node.getChildByName("TikCard").on(Input.EventType.TOUCH_END, (_) => {
      console.log(`TikCard clicked`);
      this.onTikCardClick();
    });
    this.node.getChildByName("TokCard").on(Input.EventType.TOUCH_END, (_) => {
      console.log(`TokCard clicked`);
      this.onTokCardClick();
    });
    this.node.on(Input.EventType.TOUCH_START, (_) => {
      console.log(`node clicked`);
      cc.tween(this.node.getChildByName("CardsBoard"))
        .to(0.5, { position: new cc.Vec3(0, -700, 0) }, { easing: "elasticIn" })
        .start();
      setTimeout(() => {
        if (this.tik !== -1) {
          this.content
            .getChildByName(`Card${this.tik}`)
            .getComponent(cc.Sprite).color = cc.Color.WHITE;
        }
        if (this.tok !== -1) {
          this.content
            .getChildByName(`Card${this.tok}`)
            .getComponent(cc.Sprite).color = cc.Color.WHITE;
        }
      }, 500);
    });
    this.node.getChildByName("ToStart").on(Input.EventType.TOUCH_END, (_) => {
      console.log(`ToStart clicked`);
      cc.director.loadScene("StartScene");
    });
    this.node.getChildByName("DoPlay").on(Input.EventType.TOUCH_END, (_) => {
      console.log(`DoPlay clicked`);
      if (this.tik === -1 && this.tok === -1) {
        console.log("cards select are not ready!");
        return;
      }
      this.client
        .start_tiktok_battle(
          this.cardPerosnalItems[this.tik].outpoint,
          this.cardPerosnalItems[this.tok].outpoint
        )
        .then((resp) => {
          console.log("game start!!");
          console.log(resp);
          const msgBoxNode = cc.instantiate(this.msgBoxPrefab);
          msgBoxNode.name = `MsgBox`;
          msgBoxNode.parent = this.node;
          msgBoxNode
            .getChildByName("msg")
            .getComponent(cc.Label).string = `Battle Committed hash: \n${resp}`;
          msgBoxNode.setPosition(0, 500);
          cc.tween(msgBoxNode)
            .to(
              0.5,
              { position: new cc.Vec3(0, 300, 0) },
              { easing: "elasticOut" }
            )
            .delay(3)
            .to(
              0.5,
              { position: new cc.Vec3(0, 500, 0) },
              { easing: "elasticIn" }
            )
            .start();
          setTimeout(() => {
            msgBoxNode.destroy();
          }, 8000);
          this.doBattle();
        });
    });
  }

  doBattle() {
    const content = this.node
      .getChildByName("Steps")
      .getChildByName("view")
      .getChildByName("content");
    content.removeAllChildren();
    for (this.round = 0; this.round < 20; this.round++) {
      this.node.getChildByName("Round").getComponent(cc.Label).string =
        this.round.toString();
      this.cards[this.tik].program;
      let tikResult;
      try {
        tikResult = fengari.load(`
                    local round = ${this.round}
                    -- local object = ${this.cards[this.tok]}
                    ${this.cards[this.tik].program}
                `)();
      } catch (e) {
        console.error(e);
        break;
      }
      // console.log(tikResult);
      const tikItem = new cc.Node();
      tikItem.name = `tikItem${this.round}`;
      tikItem.layer = cc.Layers.Enum.UI_2D;
      tikItem.addComponent(cc.Label);
      tikItem.getComponent(cc.Label).color = cc.Color.BLACK;
      tikItem.getComponent(cc.Label).fontSize = 16;
      tikItem.getComponent(cc.Label).string = `Tik: ${tikResult}`;
      tikItem.getComponent(cc.UITransform).setContentSize(100, 25);
      tikItem.parent = content;
      tikItem.setPosition(-80, -10 - this.round * 30);

      this.cards[this.tik].program;
      let tokResult;
      try {
        tokResult = fengari.load(`
                    local round = ${this.round}
                    -- local object = ${this.cards[this.tik]}
                    ${this.cards[this.tik].program}
                `)();
      } catch (e) {
        console.error(e);
        break;
      }
      console.log(tokResult);
      const tokItem = new cc.Node(`tokItem${this.round}`);
      tokItem.layer = cc.Layers.Enum.UI_2D;
      tokItem.addComponent(cc.Label);
      tokItem.getComponent(cc.Label).color = cc.Color.BLACK;
      tokItem.getComponent(cc.Label).fontSize = 16;
      tokItem.getComponent(cc.Label).string = `Tok: ${tikResult}`;
      tokItem.getComponent(cc.UITransform).setContentSize(100, 25);
      tokItem.parent = content;
      tokItem.setPosition(20, -25 - this.round * 30);

      if (
        tikResult === "游戏结束" ||
        tikResult === "Game Over" ||
        tokResult === "游戏结束" ||
        tokResult === "Game Over"
      ) {
        break;
      }
    }
    if (this.round === 20) {
      const overItem = new cc.Node(`tokItem${this.round}`);
      overItem.layer = cc.Layers.Enum.UI_2D;
      overItem.addComponent(cc.Label);
      overItem.getComponent(cc.Label).color = cc.Color.BLACK;
      overItem.getComponent(cc.Label).fontSize = 16;
      overItem.getComponent(cc.Label).string = `游戏结束`;
      overItem.getComponent(cc.UITransform).setContentSize(100, 25);
      overItem.parent = content;
      overItem.setPosition(0, -650);
    }
    /*
        const msgBoxNode = cc.instantiate(this.msgBoxPrefab);
        msgBoxNode.name = `MsgBox`;
        msgBoxNode.parent = this.node;
        msgBoxNode.getChildByName('msg').getComponent(cc.Label).string = `Game Over`;
        msgBoxNode.setPosition(0, 500);
        cc.tween(msgBoxNode)
            .to(0.5, { position: new cc.Vec3(0, 300, 0) }, { easing: 'elasticOut' })
            .delay(3)
            .to(0.5, { position: new cc.Vec3(0, 500, 0) }, { easing: 'elasticIn' })
            .start();
        setTimeout(() => {
            msgBoxNode.destroy();
        }, 8000);
         */
  }

  onTikCardClick() {
    console.log(`TikCard clicked`);
    if (!this.started) {
      this.turn = 0;
      if (this.tik !== -1) {
        this.content
          .getChildByName(`Card${this.tik}`)
          .getComponent(cc.Sprite).color = cc.Color.CYAN;
      }
      cc.tween(this.node.getChildByName("CardsBoard"))
        .to(
          0.5,
          { position: new cc.Vec3(0, -100, 0) },
          { easing: "elasticOut" }
        )
        .start();
    }
  }

  onTokCardClick() {
    console.log(`TokCard clicked`);
    if (!this.started) {
      this.turn = 1;
      if (this.tok !== -1) {
        this.content
          .getChildByName(`Card${this.tok}`)
          .getComponent(cc.Sprite).color = cc.Color.CYAN;
      }
      cc.tween(this.node.getChildByName("CardsBoard"))
        .to(
          0.5,
          { position: new cc.Vec3(0, -100, 0) },
          { easing: "elasticOut" }
        )
        .start();
    }
  }

  start() {
    console.log("start");
    this.client.get_cards().then((perosnalItems) => {
      if (!perosnalItems || perosnalItems.length < 1) {
        return;
      }
      this.cardPerosnalItems = perosnalItems;
      this.cards = perosnalItems.map((p) => p.data as Card);

      // TODO filter none program
      // this.loadCards(this.cards.filter((card) => card.program));
      this.loadCards(this.cards);
    });
  }

  tiktokLoadCard(nodeName: string, i: number) {
    const cardPlace = this.node.getChildByName(nodeName);
    const oldCard = cardPlace.getChildByName("Card");
    if (oldCard) {
      oldCard.destroy();
    }
    const cardNode = cc.instantiate(this.cardPrefab);
    cardNode.name = `Card`;
    cardNode.parent = this.node.getChildByName(nodeName);
    cardNode.getComponent(cc.Sprite).color = cc.Color.CYAN;
    cardNode.setPosition(0, 0);
    const card = this.cards[i];
    if (card.texture) {
      cc.loader.load({ url: card.texture, type: "png" }, (err, texture) => {
        if (err) return;
        cardNode.getChildByName("pic").getComponent(cc.Sprite).spriteFrame =
          cc.SpriteFrame.createWithImage(texture as cc.ImageAsset);
      });
    }
    cardNode.getChildByName("title").getComponent(cc.Label).string = card.name;
    cardNode
      .getChildByName("desc")
      .getComponent(
        cc.Label
      ).string = `  ${card.rarity}\nlevel: ${card.level}\nweapon: ${card.weapon}\nskill: ${card.skill}\nrace: ${card.race}\ntribe: ${card.tribe}\n`;
    cardNode.on(Input.EventType.TOUCH_END, (_) => {
      console.log(`card${i} clicked`);
      if (nodeName === "TikCard") {
        this.onTikCardClick();
      }
      if (nodeName === "TokCard") {
        this.onTokCardClick();
      }
    });
  }

  loadCards(cards: Card[]) {
    const linage = Math.floor((cards.length + 2) / 3);
    const ui = this.content.getComponent(cc.UITransform);
    console.log(`linage: ${linage}`);
    ui.setContentSize(ui.contentSize.width, linage * 400 + 200);
    this.content.removeAllChildren();

    const cardClick = (i: number) => {
      if (this.turn === 0) {
        console.log(`tik load ${i}`);
        this.tiktokLoadCard("TikCard", i);
        if (this.tik !== -1) {
          this.content
            .getChildByName(`Card${this.tik}`)
            .getComponent(cc.Sprite).color = cc.Color.WHITE;
        }
        this.tik = i;
        const tikSprite = this.content
          .getChildByName(`Card${i}`)
          .getComponent(cc.Sprite);
        tikSprite.color = cc.Color.CYAN;
        cc.tween(this.node.getChildByName("CardsBoard"))
          .to(
            0.5,
            { position: new cc.Vec3(0, -700, 0) },
            { easing: "elasticIn" }
          )
          .start();
        setTimeout(() => (tikSprite.color = cc.Color.WHITE), 500);
      }
      if (this.turn === 1) {
        console.log(`tok load ${i}`);
        this.tiktokLoadCard("TokCard", i);
        if (this.tok !== -1) {
          this.content
            .getChildByName(`Card${this.tok}`)
            .getComponent(cc.Sprite).color = cc.Color.WHITE;
        }
        this.tok = i;
        const tokSprite = this.content
          .getChildByName(`Card${i}`)
          .getComponent(cc.Sprite);
        tokSprite.color = cc.Color.CYAN;
        cc.tween(this.node.getChildByName("CardsBoard"))
          .to(
            0.5,
            { position: new cc.Vec3(0, -700, 0) },
            { easing: "elasticIn" }
          )
          .start();
        setTimeout(() => (tokSprite.color = cc.Color.WHITE), 500);
      }
    };

    cards.forEach((card, i) => {
      const cardNode = cc.instantiate(this.cardPrefab);
      cardNode.name = `Card${i}`;
      cardNode.parent = this.content;
      cardNode.setPosition(
        [-320, 0, 320][i % 3],
        -180 - Math.floor(i / 3) * 400
      );
      if (card.texture) {
        cc.loader.load({ url: card.texture, type: "png" }, (err, texture) => {
          if (err) return;
          cardNode.getChildByName("pic").getComponent(cc.Sprite).spriteFrame =
            cc.SpriteFrame.createWithImage(texture as cc.ImageAsset);
        });
      }
      // cc.assetManager.loadRemote(card.texture, { ext: 'png' }, (err, asset) => {
      // if (err) return;
      //     cardNode.getChildByName('pic').getComponent(cc.Sprite).spriteFrame = cc.SpriteFrame.createWithImage(asset as cc.ImageAsset);
      // })
      cardNode.getChildByName("title").getComponent(cc.Label).string =
        card.name;
      cardNode
        .getChildByName("desc")
        .getComponent(
          cc.Label
        ).string = `  ${card.rarity}\nlevel: ${card.level}\nweapon: ${card.weapon}\nskill: ${card.skill}\nrace: ${card.race}\ntribe: ${card.tribe}\n`;
      cardNode.on(Input.EventType.TOUCH_END, (_) => {
        console.log(`card${i} clicked`);
        cardClick(i);
      });
    });
  }
}
