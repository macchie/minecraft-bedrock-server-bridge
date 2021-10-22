
import { Context, Telegraf } from 'telegraf';
import { DockerBridge } from './docker-bridge';

export class TelegramBot {

  private static bot: Telegraf;
  private static admins: string[] = [];

  public static async init() {
    // init telegram bot
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

    // set admins
    if (process.env.TELEGRAM_BOT_ADMINS) {
      this.admins = process.env.TELEGRAM_BOT_ADMINS.split(`,`);
    }

    // register handlers
    this.bot.command('start', this.onStart.bind(this));
    this.bot.on('message', this.onMessage.bind(this));

    // showtime
    await this.bot.launch();
  }

  // private

  private static async onStart(ctx: Context) {
    try {
      
    } catch (error) {
      console.log(error);
    }
  }



  private static async onMessage(ctx: Context) {
    try {
      const username = ctx.from?.username || ``;

      if (this.admins.includes(username) === false) {
        ctx.reply(`Sorry ${username}, you are not an admin!`)
        return;
      }

      if (DockerBridge.isAttached) {
        let msg = (ctx.message as any).text;

        if (msg === 'stop') {
          // do not allow server stop
          return;
        }
        
        DockerBridge.sendMessage(msg);
      }
    } catch (err) {
      console.log(err);
    }
  }
}