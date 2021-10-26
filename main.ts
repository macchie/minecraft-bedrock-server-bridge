import { API } from "./src/api/api";
import { DockerBridge } from "./src/shared/docker-bridge";
import { TelegramBot } from "./src/telegram/telegram-bot";

class Main {
  private static dockerBridge: DockerBridge = new DockerBridge();

  public static async execute() {
    await this.dockerBridge.init();

    if (process.env.TELEGRAM_BOT_TOKEN) {
      await TelegramBot.init(this.dockerBridge);
    }

    if (process.env.ENABLE_API && process.env.ENABLE_API.toLowerCase() === 'true') {
      await API.init(this.dockerBridge);
    }
  }
}

Main.execute();