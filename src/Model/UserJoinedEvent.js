import mongoose, {Schema} from 'mongoose';
import BaseEvent from './BaseEvent';

require('mongoose-long')(mongoose);

export const UserJoinedEvent = new Schema({});

export default BaseEvent.discriminator('UserJoinedEvent', UserJoinedEvent);
