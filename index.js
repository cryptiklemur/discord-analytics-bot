import Kernel from './src/Kernel';
import mongoose from 'mongoose';

const Long = mongoose.mongo.Long;

String.prototype.toLong = function() {
    return Long.fromString(this);
};

mongoose.Promise = global.Promise;

process.on('uncaughtException', function(err) {
    console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
    console.error(err.stack);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    console.error('Reason: ' + reason);
});

try {
    let bot = new Kernel();

    bot.run();
} catch (e) {
    console.log(e);
}
