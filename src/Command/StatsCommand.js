import MessageReceiveAggregate from "../Model/MessageReceiveAggregate";

export default class StatsCommand {
    static get name() { return 'stats'; }

    static get config() {
        return {};
    }

    static async run(msg) {
        let messagesReceived = await MessageReceiveAggregate.aggregate([{$group: {_id: "all", count: {$sum: "$count"}}}]);

        msg.channel.createMessage({
            embed: {
                author:    {
                    name: "Bot Stats"
                },
                type:      "rich",
                timestamp: new Date(),
                color:     0xFF9800,
                footer:    {
                    text: `Uptime: ${format(this.client.uptime / 1000)} | Memory Usage: ${formatSizeUnits(process.memoryUsage().heapUsed)}`
                },
                fields:    [
                    {
                        inline: true,
                        name:   "__Servers:__",
                        value:  this.client.guilds.size
                    },
                    {
                        inline: true,
                        name:   "__Users:__",
                        value:  this.client.users.size + " / " + this.client.guilds.map(s => s.memberCount).reduce((a, b) => a + b)
                    },
                    {
                        inline: true,
                        name:   "__Messages Received:__",
                        value: messagesReceived.map(x => x.count).reduce((a, b) => a + b)
                    }
                ]
            }
        }).catch(e => console.log(e.response));
    }
}

function format(seconds) {
    function pad(s) {
        return (s < 10 ? '0' : '') + s;
    }

    const hours   = Math.floor(seconds / (60 * 60)),
          minutes = Math.floor(seconds % (60 * 60) / 60);

    seconds = Math.floor(seconds % 60);

    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}

function formatSizeUnits(bytes) {
    if (bytes >= 1073741824) {bytes = (bytes / 1073741824).toFixed(2) + ' GB';}
    else if (bytes >= 1048576) {bytes = (bytes / 1048576).toFixed(2) + ' MB';}
    else if (bytes >= 1024) {bytes = (bytes / 1024).toFixed(2) + ' KB';}
    else if (bytes > 1) {bytes = bytes + ' bytes';}
    else if (bytes == 1) {bytes = bytes + ' byte';}
    else {bytes = '0 byte';}
    return bytes;
}
