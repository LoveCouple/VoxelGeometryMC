/* eslint-disable @typescript-eslint/no-empty-function */
import {
  BeforeChatEvent,
  world,
  BlockLocation,
  MinecraftBlockTypes,
  BlockType,
  Player,
  Dimension,
  BlockPlaceEvent,
  ItemUseEvent,
  BlockRaycastOptions,
  system,
  ItemStack,
  EntityInventoryComponent,
} from "@minecraft/server";
import { ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
// @ts-ignore
import * as PureEval from "./pureeval/PureEval.js";
import { Sandbox } from "./command";
import { expression } from "./expression";
import { circle, sphere, line, torus, turtle } from "./generator";
import { scale, rotate, swap, embed, move, center, moveCenter, moveTo } from "./transform";
import * as LSystem from "./lsystem";
import { LocationTrans, Tellraw } from "./utils";
import { DLA2D } from "./DLA2D.js";
import { DLA3D } from "./DLA3D.js";
export type Config = {
  block: BlockType;
  origin: BlockLocation;
  player: Player | null;
  dimension: Dimension;
  env: object;
};

export default class System {
  config: Config;
  evaluator: Sandbox;
  // eslint-disable-next-line @typescript-eslint/ban-types
  funcs: { [key: string]: Function } = {
    // Pure
    circle,
    sphere,
    line,
    torus,
    turtle,
    expression,
    // Transform
    scale,
    rotate,
    center,
    moveCenter,
    moveTo,
    swap,
    embed,
    move,
    DLA2D,
    DLA3D,
    ...PureEval,
    ...LSystem,
    // Effect
    plot: this.plot,
    place: this.placeMode,
    brush: this.bursh,
    say: this.tellraw,
    code: this.codeEditor,
    getpos: () => {
      this.setPosition(this.getPlayerPosition());
    },
  };
  callbacks: { [key: string]: (a: any) => void } = {};
  savedCode = "";
  // callbacks: { [key: string]: Function } = {};
  constructor() {
    this.config = {
      block: MinecraftBlockTypes.ironBlock,
      origin: new BlockLocation(0, 0, 0),
      player: null,
      dimension: world.getDimension("overworld"),
      env: {},
    };
    for (const p of this.config.dimension.getPlayers({ closest: 5 })) {
      this.config.player = p;
    }
    this.evaluator = new Sandbox(this.funcs);
    this.evaluator.updateEnv(this.config);
  }

  run() {
    this.subscribe();
    this.boardcast("System initialized");
  }

  // Subscribe

  subscribe() {
    world.events.itemUse.subscribe((eventData) => {
      if (eventData.item.typeId === "minecraft:blaze_rod") {
        this.codeEditor(this.config.player!);
      }
    });
    world.events.beforeChat.subscribe((eventData: BeforeChatEvent) => {
      const player = eventData.sender;
      if (this.config.player === null) this.config.player = player;
      const Chat = eventData.message;
      if (Chat.startsWith("-")) {
        eventData.cancel = true;
        const script = Chat.substring(1).trim();
        this.tellraw(`<< §3${script}`);
        this.evaluator.updateEnv({
          callbacks: this.callbacks,
          setBlock: this.setBlock,
          config: this.config,
          player: Player,
        });
        try {
          const result = this.evaluator.eval(script);
          if (result) {
            this.tellraw(`>> §e${result}`);
          } else {
            this.tellraw(`>> §eSuccess`);
          }
        } catch (e) {
          this.tellraw(`>> §4${e}`);
        }
      }
    });

    world.events.blockPlace.subscribe(() => {});
  }

  // Code editor : For long script editing
  codeEditor(player: Player) {
    const m = new ModalFormData();
    m.title("Voxel Geometry");
    m.textField("Console", "code here", this.savedCode);
    m.show(player).then((v: ModalFormResponse) => {
      if (!v.canceled) {
        v.formValues?.forEach((v: string) => {
          this.savedCode = v;
          this.evaluator.updateEnv({
            callbacks: this.callbacks,
            setBlock: this.setBlock,
            config: this.config,
            player: player,
          });
          try {
            const result = this.evaluator.eval(v);
            if (result) {
              this.tellraw(`>> §e${result}`);
            } else {
              this.tellraw(`>> §eSuccess`);
            }
          } catch (e) {
            this.tellraw(`>> §4${e}`);
          }
        });
      }
    });
  }

  // World Action
  fill(blockType: BlockType, begin: BlockLocation, end: BlockLocation) {
    const [xFrom, yFrom, zFrom, xTo, yTo, zTo] = [begin.x, begin.y, begin.z, end.x, end.y, end.z];
    for (let x = xFrom; x <= xTo; ++x) {
      for (let y = yFrom; y <= yTo; ++y) {
        for (let z = zFrom; z <= zTo; ++z) {
          this.config.dimension.getBlock(new BlockLocation(x, y, z)).setType(blockType);
        }
      }
    }
  }

  plot(blocks: BlockLocation[], pos = this.config.origin, tile = this.config.block): void {
    blocks.forEach((block) => {
      this.setBlock(tile, new BlockLocation(block.x + pos.x, block.y + pos.y, block.z + pos.z));
    });
  }

  setBlocks(blockType: BlockType, blocks: BlockLocation[]) {
    blocks.forEach((block) => {
      this.config.dimension.getBlock(block).setType(blockType);
    });
  }

  setBlock(block: BlockType, pos: BlockLocation) {
    this.config.dimension.getBlock(pos).setType(block);
  }

  placeMode(blocks: BlockLocation[] = []): void {
    if (this.callbacks["place"]) {
      const callback: (a: BlockPlaceEvent) => void = this.callbacks["place"];
      world.events.blockPlace.unsubscribe(callback);
      delete this.callbacks["place"];
    }
    if (blocks.length !== 0) {
      this.callbacks["place"] = world.events.blockPlace.subscribe((eventData) => {
        const pos = eventData.block.location;
        const block = eventData.block.type;
        this.plot(blocks, pos, block);
      });
    }
  }

  bursh(blocks: BlockLocation[] = []): void {
    if (this.callbacks["brush"]) {
      const callback: (a: ItemUseEvent) => void = this.callbacks["brush"];
      world.events.itemUse.unsubscribe(callback);
      delete this.callbacks["brush"];
    }
    if (blocks.length !== 0) {
      this.callbacks["brush"] = world.events.itemUse.subscribe((eventData) => {
        const opt: BlockRaycastOptions = {
          maxDistance: 256,
          includeLiquidBlocks: false,
          includePassableBlocks: true,
        };
        const block = eventData.source.getBlockFromViewVector(opt);
        if (block != undefined && eventData.item.typeId === "minecraft:stick") {
          const pos = block.location;
          this.plot(blocks, pos);
        }
      });
    }
  }

  cloneArea(target: BlockLocation, begin: BlockLocation, end: BlockLocation) {
    const [xFrom, yFrom, zFrom, xTo, yTo, zTo] = [begin.x, begin.y, begin.z, end.x, end.y, end.z];
    for (let x = xFrom; x <= xTo; ++x) {
      for (let y = yFrom; y <= yTo; ++y) {
        for (let z = zFrom; z <= zTo; ++z) {
          this.setBlock(
            this.getBlock(new BlockLocation(x, y, z)),
            new BlockLocation(target.x + x - xFrom, target.y + y - yFrom, target.z + z - zFrom)
          );
        }
      }
    }
  }

  // Info :

  tellraw(...message: string[]) {
    this.config.dimension.runCommandAsync(Tellraw(this.config.player!.name, ...message.map((m) => `§6${m}`)));
  }

  boardcast(...message: string[]) {
    this.config.dimension.runCommandAsync(Tellraw("@a", ...message.map((m) => `§e${m}`)));
  }

  getPlayerPosition(): BlockLocation {
    return LocationTrans(this.config.player!.location);
  }

  getBlock(pos: BlockLocation): BlockType {
    return this.config.dimension.getBlock(pos).type;
  }

  // Modify config

  setPosition(pos: BlockLocation) {
    this.config.origin = pos;
  }

  getItemInHand(): ItemStack {
    const playerComp: EntityInventoryComponent = this.config.player?.getComponent(
      "inventory"
    ) as EntityInventoryComponent;
    return playerComp.container.getItem(this.config.player!.selectedSlot);
  }

  // Watch Dog
  watch_dog() {
    system.events.beforeWatchdogTerminate.subscribe((e) => {
      if (e.terminateReason == "hang") {
        e.cancel = true;
      }
    });
  }
}
