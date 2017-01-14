import mongoose, {Schema} from 'mongoose';
require('mongoose-long')(mongoose);

export default mongoose.model(
    'MessageReceiveAggregate',
    new Schema(
        {
            guild:     {type: Schema.Types.Long, index: true},
            channel:   {type: Schema.Types.Long, index: true},
            user:      {type: Schema.Types.Long, index: true},
            year:      {type: Number, index: true},
            month:     {type: Number, index: true},
            day:       {type: Number, index: true},
            hour:      {type: Number, index: true},
            count:     {type: Number, default: 0, index: true},
            timestamp: {type: Date, index: true}
        },
        {
            collection: (process.env.NODE_ENV === 'production' ? '' : 'development_') + 'message_receive_aggregate'
        }
    )
);
