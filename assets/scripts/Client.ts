import { _decorator, Component, Node } from "cc";
// import axios from "axios/dist/browser/axios.cjs";
// import * as axios from "../lib/dist/axios.min.js";
// import {key as Secp256k1} from "@ckb-lumos/hd";
// import * as elliptic from "../librarys/elliptic.min";
const { ccclass, property } = _decorator;

export interface Box {
  box_id: number;
  max_cards: number;
}

export interface Card {
  id: number;
  level: number;
  rarity: string;
  weapon: string;
  skill: string;
  race: string;
  tribe: string;
  program?: string;
  name?: string;
  texture?: string;
}

export interface Outpoint {
  tx_hash: string;
  index: number;
}

export interface RawOutpoint {
  tx_hash: string;
  index: string;
}

export interface PerosnalItem {
  data: Box | Card;
  outpoint: Outpoint;
}

export interface PerosnalRawItem {
  data: string;
  outpoint: RawOutpoint;
}

export interface PurchaseBoxResult {
  digest: string;
  payment: string;
}

type TxHash = string;

declare global {
  interface Window {
    elliptic: any;
  }
}

@ccclass("Client")
export class Client extends Component {
  url: string;
  privkey: string;
  address: string;
  project_typeargs: string;

  public init(url: string, privkey: string, address: string) {
    this.url = url;
    this.privkey = privkey;
    this.address = address;
    this.project_typeargs =
      "0x6f7efd4a0dea388dcd260b97dce553b6ef75551aa3bea412e40686689880a70f";
    console.log(window.document.documentElement);
    setTimeout(() => {
      if (!document.getElementById("ellipticScript")) {
        const ellipticScript = document.createElement("script");
        ellipticScript.setAttribute("id", "ellipticScript");
        ellipticScript.setAttribute(
          "src",
          "https://cdnjs.cloudflare.com/ajax/libs/elliptic/6.5.4/elliptic.min.js"
        );
        document.body.appendChild(ellipticScript);
      }
    }, 1000);
  }

  /*
    private request(method: string, param: any): Promise<any> {
        return axios.post(
            this.url,
            {
                jsonrpc: "2.0",
                method,
                params: param,
                id: 1,
            },
            {
                headers: {
                    "content-type": "application/json; charset=utf-8",
                },
            }
        );
    }
     */

  private request(method: string, param: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const data = JSON.stringify({
        jsonrpc: "2.0",
        method,
        params: param,
        id: 1,
      });
      xhr.open("POST", this.url);
      xhr.setRequestHeader("content-type", "application/json; charset=utf-8");
      xhr.onload = function () {
        resolve({
          status: xhr.status,
          data: JSON.parse(xhr.responseText),
        });
      };
      xhr.onerror = function () {
        reject("Request failed");
      };
      xhr.ontimeout = function () {
        reject("Request timeout");
      };
      xhr.send(data);
    });
  }

  private make_transaction_digest(
    call_func: string,
    outpoints: Array<RawOutpoint> | null
  ): Promise<any> {
    let sender: string | null = this.address;
    if (outpoints !== null) {
      sender = null;
    }
    return this.request("ko_makeRequestTransactionDigest", {
      contract_call: call_func,
      sender: sender,
      inputs: outpoints,
      candidates: [],
      components: [],
      project_type_args: this.project_typeargs,
    }).then((response) => {
      if (response.status != 200 || response.data.result === undefined) {
        throw response.data.error;
      }
      return response.data.result;
    });
  }

  private send_transaction(digest: string): Promise<TxHash> {
    if (!digest.startsWith("0x")) {
      digest = "0x" + digest;
    }
    // let signature = Secp256k1.signRecoverable(digest, this.privkey).slice(2);
    const ec = new (window.elliptic as any).ec("secp256k1");
    const key = ec.keyFromPrivate(this.privkey.slice(2));
    const { r, s, recoveryParam } = key.sign(digest.slice(2), {
      canonical: true,
    });
    if (recoveryParam === null) {
      throw new Error("Sign message failed!");
    }
    const fmtR = r.toString(16).padStart(64, "0");
    const fmtS = s.toString(16).padStart(64, "0");
    const fmtRecoverableParam = recoveryParam.toString(16).padStart(2, "0");
    let signature = fmtR + fmtS + fmtRecoverableParam;
    console.log(`signature: ${signature}`);
    return this.request("ko_sendTransactionSignature", {
      digest,
      signature,
    }).then((response) => {
      if (response.status != 200 || response.data.result === undefined) {
        throw response.data.error;
      }
      return response.data.result;
    });
  }

  // private send_transaction(digest: string): Promise<TxHash> {
  //     if (!digest.startsWith("0x")) {
  //         digest = "0x" + digest;
  //     }
  //     let signature = Secp256k1.signRecoverable(digest, this.privkey).slice(2);
  //     return this.request("ko_sendTransactionSignature", {
  //         digest,
  //         signature,
  //     }).then((response) => {
  //         if (response.status != 200 || response.data.result === undefined) {
  //             throw response.data.error;
  //         }
  //         return response.data.result;
  //     });
  // }

  private fetch_perosnal_data(): Promise<Array<PerosnalRawItem>> {
    return this.request("ko_fetchPersonalData", {
      address: this.address,
      project_type_args: this.project_typeargs,
    }).then((response) => {
      console.log(response);
      if (response.status != 200 || response.data.result === undefined) {
        throw response.data.error;
      }
      return response.data.result.data;
    });
  }

  private raw_outpoint(outpoint: Outpoint): RawOutpoint {
    return {
      tx_hash: outpoint.tx_hash,
      index: "0x" + outpoint.index.toString(16),
    };
  }

  public wait_transaction_committed(hash: TxHash): Promise<TxHash | null> {
    return this.request("ko_waitRequestTransactionCommitted", {
      request_hash: hash,
      project_type_args: this.project_typeargs,
    }).then((response) => {
      if (response.status != 200 || response.data.result === undefined) {
        throw response.data.error;
      }
      return response.data.result;
    });
  }

  public purchase_box(): Promise<TxHash> {
    return this.make_transaction_digest("purchase_box()", null).then(
      (result: PurchaseBoxResult) => {
        return this.send_transaction(result.digest);
      }
    );
  }

  public open_box(box: Outpoint): Promise<TxHash> {
    return this.make_transaction_digest("open_box()", [
      this.raw_outpoint(box),
    ]).then((result) => {
      return this.send_transaction(result.digest);
    });
  }

  public upload_card_program(card: Outpoint, program: string): Promise<TxHash> {
    return this.make_transaction_digest(`set_card_program(${program})`, [
      this.raw_outpoint(card),
    ]).then((result) => {
      return this.send_transaction(result.digest);
    });
  }

  public start_tiktok_battle(
    card1: Outpoint,
    card2: Outpoint
  ): Promise<TxHash> {
    return this.make_transaction_digest(`start_tiktok_battle()`, [
      this.raw_outpoint(card1),
      this.raw_outpoint(card2),
    ]).then((result) => {
      return this.send_transaction(result.digest);
    });
  }

  public get_boxes(): Promise<Array<PerosnalItem>> {
    return this.fetch_perosnal_data().then((personal_items) => {
      return personal_items
        .map((item) => {
          let nft = JSON.parse(item.data);
          if (nft.box_id !== undefined) {
            return {
              data: nft as Box,
              outpoint: {
                tx_hash: item.outpoint.tx_hash,
                index: parseInt(item.outpoint.index, 16),
              },
            };
          } else {
            return null;
          }
        })
        .filter((item) => item !== null);
    });
  }

  public get_cards(): Promise<Array<PerosnalItem>> {
    return this.fetch_perosnal_data().then((personal_items) => {
      return personal_items
        .map((item) => {
          let nft = JSON.parse(item.data);
          if (nft.id !== undefined) {
            return {
              data: nft as Card,
              outpoint: {
                tx_hash: item.outpoint.tx_hash,
                index: parseInt(item.outpoint.index, 16),
              },
            };
          } else {
            return null;
          }
        })
        .filter((item) => item !== null)
        .map((item) => {
          let id = item.data.id;
          item.data.name = `卡牌 ${id}`;
          item.data.texture = `https://caihong.love/tiktok-playground/assets/cards/r${(
            id + 1
          )
            .toString()
            .padStart(2, "0")}.png`;
          return item;
        });
    });
  }
}

//   public purchase_box(): Promise<TxHash> {
//     return new Promise((resolve) => resolve("0x0"));
//   }

//   public async open_box(box: Outpoint): Promise<TxHash> {
//     return new Promise((resolve) => resolve("0x0"));
//   }

//   public async upload_card_program(
//     card: Outpoint,
//     program: string
//   ): Promise<TxHash> {
//     return new Promise((resolve) => resolve("0x0"));
//   }

//   public async start_tiktok_battle(
//     card1: Outpoint,
//     card2: Outpoint
//   ): Promise<TxHash> {
//     return new Promise((resolve) => resolve("0x0"));
//   }

//   public get_boxes(): Promise<Array<PerosnalItem>> {
//     return new Promise((resolve) =>
//       resolve([
//         {
//           data: {
//             box_id: 1,
//             max_cards: 2,
//           },
//           outpoint: {
//             tx_hash: "0x0",
//             index: 0,
//           },
//         },
//         {
//           data: {
//             box_id: 2,
//             max_cards: 1,
//           },
//           outpoint: {
//             tx_hash: "0x0",
//             index: 0,
//           },
//         },
//         {
//           data: {
//             box_id: 3,
//             max_cards: 3,
//           },
//           outpoint: {
//             tx_hash: "0x0",
//             index: 0,
//           },
//         },
//       ])
//     );
//   }

//   public get_cards(): Promise<Array<PerosnalItem>> {
//     return new Promise((resolve) =>
//       resolve(
//         [...Array(38).keys()]
//           .map((i) => ({
//             id: i,
//             level: i,
//             rarity: "",
//             weapon: "rocket",
//             skill: "jump",
//             race: "g",
//             tribe: "a",
//             program: "",
//             name: `卡牌 ${i}`,
//             texture: `https://caihong.love/tiktok-playground/assets/cards/r${(
//               i + 1
//             )
//               .toString()
//               .padStart(2, "0")}.png`,
//           }))
//           .map((card) => ({
//             data: card,
//             outpoint: {
//               tx_hash: "0x0",
//               index: 0,
//             },
//           }))
//       )
//     );
//   }
// }
