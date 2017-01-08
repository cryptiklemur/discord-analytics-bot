import Kernel from './src/Kernel';
import mongoose from 'mongoose';

const Long = mongoose.mongo.Long;

String.prototype.toLong = function() {
    return Long.fromString(this);
};

mongoose.Promise = global.Promise;

global.eventsThisSession = {
    total:             0,
    message_receive:   0,
    user_joined:       0,
    user_left:         0,
    user_banned:       0,
    user_joined_voice: 0,
    user_left_voice:   0,
};

global.collectionName = process.env.COLLECTION_NAME ? process.env.COLLECTION_NAME : 'events';

process.on('uncaughtException', function(err) {
    console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
    console.error(err.stack);
    process.exit(1);
});

try {
    let bot = new Kernel();

    bot.run();
} catch (e) {
    console.log(e);
}
