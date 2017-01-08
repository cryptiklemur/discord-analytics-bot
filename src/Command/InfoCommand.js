import moment from 'moment';
import MessageReceiveEvent from '../Model/MessageReceiveEvent';

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
        const guildId    = msg.guild.id,
              start      = new Date();

        if (args.length > 1) {
            return "Please mention a user to get information about.";
        }

        const usr = msg.guild.members.get((msg.mentions.length > 0 ? msg.mentions[0] : msg.author).id);
        if (this.getConfig(guildId).ignoredUsers.indexOf(usr.id) >= 0) {
            return "That user has no stats."
        }

        let events;

        try {
            events = await MessageReceiveEvent.find({
                user:      usr.id,
                guild:     guildId,
                timestamp: {$gte: moment().subtract(30, 'days').toDate()}
            });
        } catch (e) {
            this.embedError(msg.channel, e);
            return;
        }

        if (!events || events.length == 0) {
            msg.channel.createMessage("I can't find that user in my database!");
            return;
        }

        let hours = [];
        events.forEach(x => {
            let date  = moment(x.timestamp).utc(),
                hour  = date.hour(),
                index = hours.findIndex(a => a[0] == hour);

            if (index >= 0) {
                hours[index][1]++;

                return;
            }

            hours.push([hour, 1]);
        });
        hours = hours.sort((a, b) => a[1] < b[1]);

        let channels = [];
        events
            .map(x => x.channel)
            .filter(x => this.getConfig(guildId).ignoredChannels.indexOf(x) === -1)
            .forEach(x => {
                let index = channels.findIndex(a => a.id == x);
                if (index >= 0) {
                    channels[index].messages++;

                    return;
                }

                channels.push({id: x, messages: 1});
            });
        const eventsPerHour      = (events.length / (30 * 24)).toFixed(2).toLocaleString(),
              messagesThisMonth  = events.length,
              messagesThisWeek   = events.filter(x => x.timestamp >= moment().subtract(7, 'days')).length,
              messagesToday      = events.filter(x => x.timestamp >= moment().subtract(1, 'days')).length,
              mostActiveHour     = hours.length > 0
                  ? moment(hours[0][0], "H").format('h:00 a')
                  : "No Active Hours",
              mostActiveChannels = channels.sort((a, b) => b.messages - a.message);

        let mostActiveChannel;
        if (mostActiveChannels.length == 0) {
            mostActiveChannel = "No Channel";
        } else {
            mostActiveChannel = msg.guild.channels.get(mostActiveChannels[0].id.toString());
            if (!mostActiveChannel) {
                mostActiveChannel = mostActiveChannels[0].id;
            } else {
                mostActiveChannel = mostActiveChannel.mention;
            }
        }

        msg.channel.createMessage({
            embed: {
                author:    {
                    name: "Analytics Bot"
                },
                type:      "rich",
                title:     `Information on ${usr.mention} for the last: 30 days`,
                footer:    {
                    text: "All times are in UTC | " + moment.duration((new Date()) - start).milliseconds() + 'ms'
                },
                timestamp: new Date(),
                color:     0x00FF00,
                fields:    [
                    {
                        inline: true,
                        name:   '__User Joined:__',
                        value:  moment(usr.joinedAt).utc().format("MMM Do 'YY, h:mm:ss a")
                    },
                    {
                        inline: true,
                        name:   '__Messages per Hour:__',
                        value:  eventsPerHour + ' messages / hour'
                    }, {
                        inline: true,
                        name:   '__Messages this Month:__',
                        value:  messagesThisMonth + ' messages'
                    }, {
                        inline: true,
                        name:   '__Messages this Week:__',
                        value:  messagesThisWeek + ' messages'
                    }, {
                        inline: true,
                        name:   '__Messages Today:__',
                        value:  messagesToday + ' messages'
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
