import mongoose, {Schema} from 'mongoose';
import BaseEvent from './BaseEvent';

require('mongoose-long')(mongoose);

export const VoiceEvent = new Schema(
    {
        channel:       {type: Schema.Types.Long, index: true},
        hasLeft:       {type: Boolean, default: false, index: true},
        duration:      {type: Number, default: 0, index: true},
        approximate:   {type: Boolean, index: true, default: false},
        leftTimestamp: {type: Date, default: null, index: true}
    }
);

export default BaseEvent.discriminator('VoiceEvent', VoiceEvent);
