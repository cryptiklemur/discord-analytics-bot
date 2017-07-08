import MessageReceiveEvent from "./Model/MessageReceiveEvent";
import UserBannedEvent from "./Model/UserBannedEvent";
import UserLeftEvent from "./Model/UserLeftEvent";
import UserJoinedEvent from "./Model/UserJoinedEvent";
import VoiceEvent from "./Model/VoiceEvent";

import MessageReceiveAggregate from "./Model/MessageReceiveAggregate";

const AGGREGATOR_INTERVAL = 5;

export default class Aggregator {
    static aggregating = false;
    
    static async aggregate(kernel) {
        if (Aggregator.aggregating) {
            return;
        }
        Aggregator.aggregating = true;
        
        let minsAgo = new Date();
        minsAgo.setMinutes(minsAgo.getMinutes() - AGGREGATOR_INTERVAL);
        
        console.log(`Aggregating Message Receive Events for ${kernel.client.guilds.size} guilds`);
        // Delete user banned, user left, and user join
        
        try {
            await Aggregator.aggregateMessagesReceived(minsAgo);
        } catch (e) {
            console.error(e);
        }
    
        Aggregator.aggregating = false;
        console.log("Finished aggregating");
    }
    
    static async aggregateMessagesReceived(timestamp) {
        let events = await MessageReceiveEvent.aggregate([
            {$match: {timestamp: {$lt: timestamp}}},
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
        
        if (!events || events.length === 0) {
            return;
        }
        
        console.log(`Found ${events.length} events`);
        
        
        let i = 0;
        for (let event of events) {
            console.log(i);
            try {
                await Aggregator.upsertMessageRecievedEvent(event);
            } catch (e) {
                console.error(e);
            }
            
            i++;
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
