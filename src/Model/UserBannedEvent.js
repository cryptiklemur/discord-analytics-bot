import mongoose, {Schema} from 'mongoose';
import BaseEvent from './BaseEvent';

require('mongoose-long')(mongoose);

export const UserBannedEvent = new Schema({}, {collection: global.collectionName});

export default BaseEvent.discriminator('UserBannedEvent', UserBannedEvent, global.collectionName);
