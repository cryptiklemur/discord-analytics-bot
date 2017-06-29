import MessageReceiveEvent from './Model/MessageReceiveEvent';
import MessageReceiveAggregate from './Model/MessageReceiveAggregate';

const AGGREGATOR_INTERVAL = 1;

export default class Aggregator {
    static async aggregate(kernel) {
        let minsAgo = new Date();
        minsAgo.setMinutes(minsAgo.getMinutes() - AGGREGATOR_INTERVAL);
    
        console.log(`Aggregating Message Receive Events for ${kernel.client.guilds.size} guilds`);
        
        for (let [id, guild] of kernel.client.guilds) {
            console.log(`Starting guild: ${id}`);
            await Aggregator.aggregateMessagesReceived(guild, minsAgo);
        }
        
        console.log("Finished aggregating");
    }

    static async aggregateMessagesReceived(guild, timestamp) {
        let events = await MessageReceiveEvent.aggregate([
            {$match: {guild: guild.id, timestamp: {$lt: timestamp}}},
            {
                $group: {
                    _id:   {
                        year:    {$year: '$timestamp'},
                        month:   {$month: '$timestamp'},
                        day:     {$dayOfMonth: '$timestamp'},
                        hour:    {$hour: '$timestamp'},
                        guild:   '$guild',
                        user:    '$user',
                        channel: '$channel'
                    },
                    count: {$sum: 1}
                }
            }
        ]);

        console.log(`Found ${events.length} events for ${guild.id}`);
        if (!events || events.length === 0) {
            return;
        }


        for (let event of events) {
            try {
                await Aggregator.upsertMessageRecievedEvent(event);
            } catch (e) {
                console.error(e);
            }
        }

        try {
            MessageReceiveEvent.remove({timestamp: {$lt: timestamp}}).exec();
        } catch (e) {
            console.error(e);
        }
    }

    static async upsertMessageRecievedEvent(event) {
        let query = {
            year:    event._id.year,
            month:   event._id.month,
            day:     event._id.day,
            hour:    event._id.hour,
            guild:   event._id.guild,
            user:    event._id.user,
            channel: event._id.channel
        };

        let agg;
        try {
            agg = await MessageReceiveAggregate.findOne(query);
        } catch (e) {
            console.error(e);
        }

        if (!agg) {
            agg           = new MessageReceiveAggregate(query);
            agg.timestamp = Date.parse(`${query.year}-${query.month}-${query.day} ${query.hour}:00:00`);
        }

        agg.count += event.count;

        try {
            agg.save();
        } catch (e) {
            console.error(e);
        }
    }
}
