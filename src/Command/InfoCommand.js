import moment from 'moment';
import Cache from "ttl";
import MessageReceiveAggregate from '../Model/MessageReceiveAggregate';

const cache = new Cache();

/**
 * Outputs to the screen the following stats:
 *
 * Messages per hour
 * Total recorded messages this month
 * Total recorded messages this week
 * Total recorded messages today
 * Most active hour of day
 * Top Channels
 *
 * @type {InfoCommand}
 */
module.exports = class InfoCommand {
    static get name() { return 'info'; }

    static get config() {
        return {
            guildOnly:       true,
            description:     "View the posting information of a user",
            fulLDescription: "View the posting information of a user."
        }
    }

    static async run(msg, args) {
        console.log(msg);
        const guildId = msg.guild.id,
              start   = new Date();

        if (args.length > 1) {
            return "Please mention a user to get information about.";
        }

        const usr = msg.guild.members.get((msg.mentions.length > 0 ? msg.mentions[0] : msg.author).id);
        if (this.getConfig(guildId).ignoredUsers.indexOf(usr.id) >= 0) {
            return "That user has no stats."
        }
    
        const key = `${usr.id}.leaderboard`;
        let events = cache.get(key);
        if (events === undefined) {
            try {
                events = await MessageReceiveAggregate.aggregate([
                    {
                        $match: {
                            user:  usr.id.toLong(),
                            guild: guildId.toLong(),
                            year:  start.getFullYear(),
                            month: start.getMonth() + 1
                        }
                    },
                    {$group: {_id: {channel: '$channel', timestamp: '$timestamp'}, messages: {$sum: "$count"}}}
                ]);
            } catch (e) {
                this.embedError(msg.channel, e);
                return;
            }
            
            cache.put(key, events, 60 * 10 * 1000);
        }

        if (!events || events.length === 0) {
            await msg.channel.createMessage("I can't find that user in my database! (Events are slightly delayed)");
            return;
        }

        let hours = [];
        events.forEach(x => {
            let date  = moment(x._id.timestamp).utc(),
                hour  = date.hour(),
                index = hours.findIndex(a => a[0] == hour);

            if (index >= 0) {
                hours[index][1] += x.messages;

                return;
            }

            hours.push([hour, 1]);
        });
        hours = hours.sort((a, b) => a[1] < b[1]);

        let channels = [];
        events
            .filter(x => this.getConfig(guildId).ignoredChannels.indexOf(x._id.channel) === -1)
            .forEach(x => {
                let index = channels.findIndex(a => a.id == x._id.channel);
                if (index >= 0) {
                    channels[index].messages += x.messages;

                    return;
                }

                channels.push({id: x._id.channel, messages: x.messages});
            });

        let days = [];
        events.forEach(x => {
            let date  = moment(x._id.timestamp).utc(),
                day   = date.weekday(),
                index = days.findIndex(a => a[0] == day);

            if (index >= 0) {
                days[index][1] += x.messages;

                return;
            }

            days.push([day, 1]);
        }, {});

        const totalEventCount    = events.map(x => x.messages).reduce((a, b) => a + b),
              eventsPerHour      = (totalEventCount / (30 * 24)).toFixed(2).toLocaleString(),
              messagesThisMonth  = totalEventCount,
              messagesThisWeek   = events.filter(x => x._id.timestamp >= moment().subtract(7, 'days')).length,
              messagesToday      = events.filter(x => x._id.timestamp >= moment().subtract(1, 'days')).length,
              mostActiveDay      = days.length > 0
                  ? moment(days[0][0], "d").format('dddd')
                  : "No Active Days",
              mostActiveHour     = hours.length > 0
                  ? moment(hours[0][0], "H").format('h:00 a')
                  : "No Active Hours",
              mostActiveChannels = channels.sort((a, b) => b.messages - a.message);

        let mostActiveChannel;
        if (mostActiveChannels.length === 0) {
            mostActiveChannel = "No Channel";
        } else {
            mostActiveChannel = msg.guild.channels.get(mostActiveChannels[0].id.toString());
            if (!mostActiveChannel) {
                mostActiveChannel = mostActiveChannels[0].id;
            } else {
                mostActiveChannel = mostActiveChannel.mention;
            }
        }

        await msg.channel.createMessage({
            embed: {
                author:    {
                    name: "Analytics Bot"
                },
                type:      "rich",
                title:     `Information on ${usr.username} for the last: 30 days`,
                footer:    {
                    text: "Data is slightly delayed | All times are in UTC | " + moment.duration((new Date()) - start).milliseconds() + 'ms'
                },
                timestamp: moment().utc(),
                color:     0x00FF00,
                fields:    [
                    {
                        inline: true,
                        name:   '__User Joined:__',
                        value:  moment(usr.joinedAt).utc().format("MMM Do 'YY, h:mm a")
                    },
                    {
                        inline: true,
                        name:   '__Messages per Hour:__',
                        value:  eventsPerHour + ' messages / hour'
                    }, {
                        inline: true,
                        name:   '__Messages this D/W/M:__',
                        value:  messagesToday + ' / ' + messagesThisWeek + ' / ' + messagesThisMonth + ' messages'
                    }, {
                        inline: true,
                        name:   '__Most Active Day:__',
                        value:  mostActiveDay.toLocaleString('en-us', {weekday: 'long'})
                    }, {
                        inline: true,
                        name:   '__Most Active Hour:__',
                        value:  mostActiveHour
                    }, {
                        inline: true,
                        name:   '__Most Active Channel:__',
                        value:  mostActiveChannel
                    }
                ]
            }
        }).catch(e => this.embedError(msg.channel, e.response));
    }
};
