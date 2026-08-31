import Phaser from "phaser";
import "./app/style.css";
import { GameScene } from "./app/GameScene.ts";

new Phaser.Game({
  type: Phaser.CANVAS,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#081014",
  render: { antialias: false, pixelArt: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [GameScene],
});
