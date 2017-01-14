import mongoose, {Schema} from 'mongoose';
require('mongoose-long')(mongoose);

export default mongoose.model(
    'Event',
    new Schema(
        {
            guild:     {type: Schema.Types.Long, index: true},
            user:      {type: Schema.Types.Long, index: true},
            timestamp: {type: Date, default: () => Date.now(), index: true}
        },
        {
            collection: (process.env.NODE_ENV === 'production' ? '' : 'development_') + 'events'
        }
    )
);
