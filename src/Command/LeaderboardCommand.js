import moment from "moment";
import Cache from "ttl";
import MessageReceiveAggregate from "../Model/MessageReceiveAggregate";

const cache = new Cache();

module.exports = class LeaderboardCommand {
    static get name() {
        return 'leaderboard';
    }
    
    static get config() {
        return {
            guildOnly:       true,
            description:     "View the top 25 posters on your server!",
            fullDescription: "View the top 25 posters on your server!"
        }
    }
    
    static run(msg, args) {
        return LeaderboardCommand.getTextLeaderboard.call(this, msg);
    }
    
    static async getTextLeaderboard(msg) {
        const guildId = msg.guild.id,
              start   = new Date();
        
        
        const key = `${msg.guild.id}.leaderboard`;
        let users = cache.get(key);
        if (users === undefined) {
            let results;
            try {
                results = await MessageReceiveAggregate.aggregate([
                    {$match: {guild: guildId.toLong(), year: start.getFullYear(), month: start.getMonth() + 1}},
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
            
            cache.put(key, users, 60 * 10 * 1000);
        }
        
        if (users.length === 0) {
            return await msg.channel.createMessage("No stats for this server. Try again later.");
        }
        
        await msg.channel.createMessage({
            embed: {
                author:    {
                    name: "Current Leaderboard"
                },
                footer:    {
                    text: "Data is slightly delayed | " + moment.duration((new Date()) - start).milliseconds() + 'ms'
                },
                type:      "rich",
                title:     "Leaderboard for the last: 30 Days",
                timestamp: moment().utc(),
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
};
