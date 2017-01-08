import mongoose, {Schema} from 'mongoose';
import BaseEvent from './BaseEvent';

require('mongoose-long')(mongoose);

export const UserLeftEvent = new Schema({}, {collection: global.collectionName});

export default BaseEvent.discriminator('UserLeftEvent', UserLeftEvent, global.collectionName);
