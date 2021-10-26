[![Docker Pulls](https://img.shields.io/docker/pulls/macchie/minecraft-bedrock-server-bridge.svg)](https://hub.docker.com/r/macchie/minecraft-bedrock-server-bridge/)
[![GitHub Issues](https://img.shields.io/github/issues-raw/macchie/minecraft-bedrock-server-bridge.svg)](https://github.com/macchie/minecraft-bedrock-server-bridge/issues)

# Minecraft Bedrock Server Bridge

`RCON` replacement for Minecraft Bedrock Dedicated Servers.

Currently allows you to bridge your `server console` to a `Telegram Bot`.

### Setup

[Create a Telegram Bot and obtain the Token](https://core.telegram.org/bots#3-how-do-i-create-a-bot)

Extend your `itzg/docker-minecraft-bedrock-server` `docker-compose.yml` file to produce something similar:

```yaml
version: '3.4'

services:
  bds:
    image: itzg/minecraft-bedrock-server
    environment:
      EULA: "TRUE"
      GAMEMODE: creative
      SERVER_NAME: Your Server Name
    ports:
      - 19132:19132/udp
#      - 39133:39133/udp
    volumes:
      - /path/to/your/data:/data
    labels:
      minecraft_bedrock_server: "true"
    stdin_open: true
    tty: true
    sysctls:
      net.ipv4.ip_local_port_range: 39132 39133
  
  bds_bridge:
    image: macchie/minecraft-bedrock-server-bridge
    environment:
      - TELEGRAM_BOT_TOKEN=12345
      - TELEGRAM_BOT_ADMINS=username1,username2
    volume:
      - /var/run/docker.sock:/var/run/docker.sock
```

Make sure you set your Server with:

```yaml
stdin_open: true
tty: true
labels:
  minecraft_bedrock_server: "true"
```

Remeber to set `stdin_open` and `tty`, these two properties allows you attach to the Docker container to run commands through the console.

Add a `minecraft_bedrock_server` label under the `labels` list (value is not important) to flag this container so that the bridge can succesfully discover it.

Also, add a new `bds_bridge` service and set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_ADMINS`:

```yaml
bds_bridge:
  image: macchie/minecraft-bedrock-server-bridge
  environment:
    - TELEGRAM_BOT_TOKEN=12345
    - TELEGRAM_BOT_ADMINS=username1,username2
  volume:
    - /var/run/docker.sock:/var/run/docker.sock
```

### Configuration

Configuration is achieved via `environment variables` on your bridge container, here is a list of available env variables:

- `BDS_CONTAINER_LABEL` - used to change the Docker container label (optional, default: `minecraft_bedrock_server`)
- `TELEGRAM_BOT_TOKEN` - your Telegram BOT token, if set enables Telegram BOT (default: `null`)
- `TELEGRAM_BOT_ADMINS` - a comma separated list of Telegram usernames that will be able to communicate with the BOT (optional, default: `null`)
- `ENABLE_API` - enables experimental HTTP API support (optional, default: `false`)
- `API_TOKEN` - if set the token will be checked to authenticate the request (optional, default: `null`)
- `API_PORT` - used to change the HTTP API port (optional, default: `17394`)

### How To Use

##### Using Telegram BOT

Open `Telegram` and send a message to your bot, every message is passed to the Server console.

For example, to `say` something to all players you can text (you can send you messages with or without the `/` character):

- `say Hello World!`

or execute any other command:

- `/give username diamond_block`
- `daylock`

The command response will be texted back to you by the BOT, if the command generates no output a confirmation of execution is sent back.

##### Using HTTP API

The HTTP API exposes a single `/execute` endpoint, the request is made in standard JSON format, here is an example via `CURL` (any HTTP client is valid):

```bash
$ curl -L -X POST 'http://<your-server-address>:17394/execute' \
    -H 'Content-Type: application/json' \
    --data-raw '{ "command": "say Hello World!" }'
```

```bash
$ curl -L -X POST 'http://<your-server-address>:17394/execute' \
    -H 'Content-Type: application/json' \
    --data-raw '{ "command": "/give username diamond_block" }'
```

The HTTP API response is also in standard JSON format and looks like this:

```json
{
  "status":200,
  "response":"There are 0/10 players online:"
}
```

### Notes

- Currently working **ONLY** in combination with: [itzg/docker-minecraft-bedrock-server](https://github.com/itzg/docker-minecraft-bedrock-server) **in a Docker Environment**
### To-Do

- Add Web Panel ?

