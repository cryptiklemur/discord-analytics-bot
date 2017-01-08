import moment from 'moment';
import MessageReceiveEvent from '../Model/MessageReceiveEvent';
import VoiceEvent from '../Model/VoiceEvent';

module.exports = class LeaderboardCommand {
    static get name() { return 'leaderboard'; }

    static get config() {
        return {
            guildOnly:       true,
            description:     "View the top 25 posters on your server! Can check `voice` and `text`.",
            fullDescription: "View the top 25 posters on your server! Can check `voice` and `text`."
        }
    }

    static run(msg, args) {
        const type = args[0] || 'text';

        switch (type) {
            case 'text':
                return LeaderboardCommand.getTextLeaderboard.call(this, msg);
            case 'voice':
                return LeaderboardCommand.getVoiceLeaderboard.call(this, msg);
            default:
                msg.channel.createMessage("That's not a valid leaderboard type!");
                return;
        }
    }

    static getTextLeaderboard(msg) {
        const guildId = msg.guild.id,
              start   = new Date();

        MessageReceiveEvent.aggregate([
            {$match: {guild: guildId.toLong()}},
            {$group: {_id: "$user", messages: {$sum: 1}}},
            {$sort: {messages: -1}}
        ], (err, results) => {
            console.log(results);
            if (err) {
                this.embedError(msg.channel, err);
                return;
            }

            const users = results.map(x => {
                const user = this.client.users.get(x._id.toString());
                if (!user || user.bot || this.getConfig(guildId).ignoredUsers.indexOf(user.id) >= 0) {
                    return;
                }

                return {user: user, messages: x.messages};
            }).filter(x => !!x);

            if (users.length === 0) {
                msg.channel.createMessage("No stats for this server. Try again later.");
                return;
            }

            msg.channel.createMessage({
                embed: {
                    author:    {
                        name: "Current Leaderboard"
                    },
                    footer:    {
                        text: moment.duration((new Date()) - start).milliseconds() + 'ms'
                    },
                    type:      "rich",
                    title:     "Leaderboard for the last: 30 Days",
                    timestamp: new Date(),
                    color:     0x00FF00,
                    fields:    users.slice(0, 25).map((x, index) => {
                        return {
                            inline: true,
                            name:   index + 1 + ") " + x.user.username,
                            value:  x.messages + ' messages'
                        }
                    })
                }
            }).catch(e => this.embedError(msg.channel, e));
        });
    }

    static async getVoiceLeaderboard(msg) {
        const guildId = msg.guild.id,
              start   = new Date();

        const docs = await VoiceEvent.find({
            server:    guildId,
            leftEvent: true,
            leftTime:  {$exists: true}
        });

        const users = [];
        docs.forEach(doc => {
            const user    = this.client.users.get(doc.user.toString()),
                  channel = msg.guild.channels.get(doc.channel.toString());
            if (!user || user.bot || this.getConfig(guildId).ignoredUsers.indexOf(user.id) >= 0) {
                return;
            }
            if (this.getConfig(guildId).ignoredChannels.indexOf(channel.id) >= 0) {
                return;
            }

            let index = users.findIndex(u => u.user == doc.user.toString());
            if (index === -1) {
                index = users.length;
                users.push({user: doc.user.toString(), duration: 0});
            }

            users[index].duration += (doc.leftTime - doc.timestamp);
        });
    }
};
