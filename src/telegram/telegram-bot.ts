
import { Context, Telegraf } from 'telegraf';
import { BDSCommands } from '../shared/bds-commands';
import { BridgeCommand, DockerBridge } from '../shared/docker-bridge';

export class TelegramBot {

  private static bot: Telegraf;
  private static admins: string[] = [];
  private static bridge: DockerBridge;

  public static async init(_bridge: DockerBridge) {
    // set bridge
    this.bridge = _bridge;

    // init telegram bot
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

    // set admins
    if (process.env.TELEGRAM_BOT_ADMINS) {
      this.admins = process.env.TELEGRAM_BOT_ADMINS.split(`,`);
    }

    // register handlers
    this.bot.on('message', this.onMessage.bind(this));

    this.bridge.on('telegram-response', (data) => {
      this.bot.telegram.sendMessage(data.chatId, data.response);
    });

    // showtime
    await this.bot.launch();
  }

  // private

  private static async onMessage(ctx: Context) {
    try {
      const username = ctx.from?.username || ``;
      const command = this.parseCommand(ctx);

      if (!ctx.chat || !ctx.chat?.id) {
        return;
      }

      if (!command) {
        ctx.reply(`Command '${(ctx.message as any).text}' is invalid!`);
        return;
      }

      if (this.admins.includes(username) === false) {
        ctx.reply(`Sorry ${username}, you are not an admin!`)
        return;
      }

      if (this.bridge.isAttached) {
        if (ctx.chat?.id) {
          this.bridge.sendMessage(new BridgeCommand('telegram', command, ctx.chat.id));
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  private static parseCommand(ctx: Context) {
    const message = (ctx.message as any).text;
    let [cmd, ...args] = message.split(' ');

    if (cmd.startsWith('/')) {
      cmd = cmd.substring(1);
    }

    if (BDSCommands.includes(cmd)) {
      console.log(`Executing command '${cmd}' with args '${args || null}'...`);
      return `${cmd} ${args ? args.join(' ') : ''}`;
    } else {
      console.log(`Command '${message}' is invalid!`);
      return null;
    }

  }
}