import mongoose, {Schema} from 'mongoose';
import BaseEvent from './BaseEvent';

require('mongoose-long')(mongoose);

export const UserLeftEvent = new Schema({});

export default BaseEvent.discriminator('UserLeftEvent', UserLeftEvent);
