[![Docker Pulls](https://img.shields.io/docker/pulls/macchie/minecraft-bedrock-server-bridge.svg)](https://hub.docker.com/r/macchie/minecraft-bedrock-server-bridge/)
[![GitHub Issues](https://img.shields.io/github/issues-raw/macchie/minecraft-bedrock-server-bridge.svg)](https://github.com/macchie/minecraft-bedrock-server-bridge/issues)

# Minecraft Bedrock Server Bridge

`RCON` replacement for Minecraft Bedrock Dedicated Servers.

Currently allows you to bridge your `server console` to a `Telegram Bot`.

### Setup

[Create a Telegram Bot and obtain the Token.](https://core.telegram.org/bots#3-how-do-i-create-a-bot)

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
      LEVEL_SEED: 2111844826
      VERSION: 1.17.34.02
    ports:
      - 19132:19132/udp
#      - 39132:39132
#      - 39132:39132/udp
#      - 39133:39133
#      - 39133:39133/udp
    volumes:
      - /path/to/data:data
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

Remeber to user `stdin_open` and `tty`, these two properties allows you attach to the Docker container to run commands through the console.

Add a `minecraft_bedrock_server` label under the `labels` list (label value is not important) to flag this container so that the bridge can succesfully discover it.

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

### How To Use

Open `Telegram` and send a message to your bot, every message is passed to the Server console (no filters are applied so far, be careful).

For example, to `say` something to all players you can text:

- `say Hello World!`

or execute any other command:

- `give username diamond_block`
- `daylock`
### To-Do

- Catch Server responses and redirect through request channel (Telegram BOT, Api, etc..)
- Implement HTTP API protocol to send commands
- Add Web Panel ?

### Notes

- Currently working **ONLY** in combination with: [itzg/docker-minecraft-bedrock-server](https://github.com/itzg/docker-minecraft-bedrock-server) **in a Docker Environment**