import moment from 'moment';
import MessageReceiveAggregate from '../Model/MessageReceiveAggregate';

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

    static async getTextLeaderboard(msg) {
        const guildId = msg.guild.id,
              start   = new Date();

        let results;
        try {
            results = await MessageReceiveAggregate.aggregate([
                {$match: {guild: guildId.toLong(), year: start.getYear(), month: start.getMonth()}},
                {$group: {_id: "$user", messages: {$sum: "$count"}}},
                {$sort: {messages: -1}}
            ]);
        } catch (e) {
            this.embedError(msg.channel, e);
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
                    text: "Data is slightly delayed | " + moment.duration((new Date()) - start).utc().milliseconds() + 'ms'
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
    }

    static async getVoiceLeaderboard(msg) {
        msg.channel.createMessage("This is currently disabled.");
    }
};
