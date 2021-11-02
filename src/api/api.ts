
import cors from 'cors';
import express from 'express';
import { BDSCommands } from '../shared/bds-commands';
import { BridgeCommand, DockerBridge } from '../shared/docker-bridge';
import { Helpers } from '../shared/helpers';

export class API {

  private static address: string = '0.0.0.0';
  private static server: express.Express;
  private static bridge: DockerBridge;
  private static response: BridgeCommand | null;

  public static async init(_bridge: DockerBridge) {
    // set bridge
    this.bridge = _bridge;

    // initialize express
    this.server = express();
    // add cors for cross-origin requests
    this.server.use(cors());
    // enable json auto body parsing
    this.server.use(express.json());

    // register handlers
    this.server.post('/execute', this.executeCommand.bind(this));
    
    this.bridge.on('api-response', (data) => {
      this.response = data;
    });
    
    // listen on specified port
    this.server.listen(process.env.API_PORT || 17394, () => {
      console.log(`API listening on ${this.address}:${process.env.API_PORT || 17394}`)
    })

  }

  // private

  private static async executeCommand(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
      const command = this.parseCommand(req.body.command);
      
      if (!command) {
        return { status: 513, message: `Command '${req.body.command}' is invalid!`};
      }

      if (process.env.API_TOKEN && process.env.API_TOKEN !== req.body.token) {
        res.send({ status: 401, response: `not authorized`})
        return res.end()
      }

      if (this.bridge.isAttached) {
        this.response = null;
        this.bridge.sendMessage(new BridgeCommand('api', command));
      }

      let reqStartTime = new Date().getTime();

      while (!this.response) {
        // if (new Date().getTime() - reqStartTime > 3000) {
        //   await this.bridge.init();
        //   this.bridge.sendMessage(new BridgeCommand('api', command));
        // }

        await Helpers.sleep(1);
      }

      res.send({ status: 200, response: this.response.response})
      return res.end()
    } catch (err) {
      console.log(err);
    }
  }

  private static parseCommand(message: string) {
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