import mongoose, {Schema} from 'mongoose';
import BaseEvent from './BaseEvent';

require('mongoose-long')(mongoose);

export const MessageReceivedEvent = new Schema(
    {
        channel:     {type: Schema.Types.Long, index: true},
        message:     {type: Schema.Types.Long, index: true}
    },
    {
        collection: global.collectionName
    }
);

export default BaseEvent.discriminator('MessageReceive', MessageReceivedEvent, global.collectionName);
