import { DockerBridge } from "./src/docker-bridge";
import { TelegramBot } from "./src/telegram-bot";

const main = async () => {
  if (process.env.TELEGRAM_BOT_TOKEN) {
    await TelegramBot.init();
  }

  await DockerBridge.init();
}

main();