import fs from "fs";
import {CommandClient} from "eris";
import request from "request";
import mongoose from "mongoose";
import querystring from "querystring";

import SetTokenCommand from "./Command/SetTokenCommand";
import InfoCommand from "./Command/InfoCommand";
import IgnoreCommand from "./Command/IgnoreCommand";
import UnignoreCommand from "./Command/UnignoreCommand";
import ChannelLeaderboardCommand from "./Command/ChannelLeaderboardCommand";
import LeaderboardCommand from "./Command/LeaderboardCommand";
import StatsCommand from "./Command/StatsCommand";
import CleanCommand from "./Command/CleanCommand";
import RestartCommand from "./Command/RestartCommand";
import EvalCommand from "./Command/EvalCommand";

import ReadyHandler from "./Handler/ReadyHandler";
import VoiceEvent from "./Model/VoiceEvent";
import Aggregator from "./Aggregator";

const AGGREGATOR_INTERVAL = 1 * 60 * 1000;

export default class Kernel {
    constructor() {
        try {
            fs.writeFileSync(__dirname + '/../config.json', '{}', {flag: 'wx'});
        } catch (e) {
        }
        try {
            this.config = JSON.parse(fs.readFileSync(__dirname + '/../config.json'));
        } catch (e) {
            this.config = {};
        }
        
        mongoose.connect(process.env.MONGO_URL);
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function () {
            console.log("DB Connected");
        });
        
        this.client = new CommandClient(process.env.BOT_TOKEN, {
            messageLimit: 5,
            getAllUsers:  true,
        }, {
            owner:       "Aaron",
            description: "Google Analytics for your Discord Server!",
            prefix:      process.env.NODE_ENV === 'development' ? '\\' : '/'
        });
        
        let cmds = [
            SetTokenCommand,
            EvalCommand,
            RestartCommand,
            StatsCommand,
            InfoCommand,
            UnignoreCommand,
            IgnoreCommand,
            ChannelLeaderboardCommand,
            LeaderboardCommand,
            CleanCommand
        ];
        for (let cmd of cmds) {
            this.client.registerCommand(cmd.name, this.wrapError.bind(this, cmd.run.bind(this)), cmd.config);
        }
        
        ReadyHandler.run.call(this);
        this.client.stats = {
            disconnects: 0,
            connects: 0,
            resumes: 0,
            raw: [],
            rawTotal: {}
        };
        
        
        this.client.on('err', console.error);
        this.client.on('error', console.error);
        this.client.on('disconnect', () => this.client.stats.disconnects++);
        this.client.on('connect', () => this.client.stats.connects++);
        this.client.on('resume', () => this.client.stats.resumes++);
        this.client.on('rawWS', (packet, id) => {
            const type = packet.t || 'MISC';
            if (!this.client.stats.raw[id]) {
                this.client.stats.raw[id] = {};
            }
            if (!this.client.stats.raw[id][type]) {
                this.client.stats.raw[id][type] = 0;
            }
            if (!this.client.stats.rawTotal[type]) {
                this.client.stats.rawTotal[type] = 0;
            }
            
            this.client.stats.rawTotal[type]++;
        });
        
        process.on('SIGUSR2', () => {
            console.log("SIGUSR2");
            this.gracefulShutdown();
        });
        
        setInterval(Aggregator.aggregate.bind(null, this), AGGREGATOR_INTERVAL);
        this.client.on('ready', Aggregator.aggregate.bind(null, this));
    }
    
    track(action, server, user, extra = {}) {
        if (!action) {
            console.log("No action!");
            return;
        }
        
        if (server && user) {
            let tokens = [process.env.BOT_ANALYTICS];
            if (this.getConfig(server).token) {
                tokens.push(this.getConfig(server).token);
            }
            
            let data = Object.assign({}, {v: 1, t: 'event', cid: user, ec: server, ea: action, el: user}, extra);
            
            tokens.forEach(token => {
                request.post(
                    `https://www.google-analytics.com/collect?tid=${token}&aip=1&${querystring.stringify(data)}`,
                    err => {
                        if (err) {
                            console.log(err);
                        } else {
                            //console.log(`TRACKED EVENT: ${action}, ${server}, ${user}`);
                        }
                    }
                )
            });
        }
    }
    
    async checkVoiceChannelStates() {
        let results;
        try {
            results = await VoiceEvent.find({hasLeft: false});
        } catch (e) {
            console.log(e);
            return;
        }
        
        if (results.length === 0) {
            return;
        }
        
        for (let result of results) {
            if (!result) {
                console.log(result);
                continue;
            }
            
            try {
                let guild = this.client.guilds.get(result.guild.toString()), user;
                if (guild) {
                    user = guild.members.get(result.user.toString());
                    if (user && user.voiceState && user.voiceState.channelID) {
                        if (user.voiceState.channelID != result.channel) {
                            console.log("User in a different in voice, stopping and starting event approximately.");
                            ReadyHandler.stopVoiceEvent(user, guild.channels.get(result.channel.toString()), true);
                            ReadyHandler.startVoiceEvent(user, guild.channels.get(user.voiceState.channelID), true);
                            continue;
                        }
                        
                        if (user.voiceState.deaf || user.voiceState.selfDeaf) {
                            console.log("User no longer in voice undeafened, stopping event approximately.");
                            ReadyHandler.stopVoiceEvent(user, guild.channels.get(result.channel.toString()), true);
                        }
                        continue;
                    }
                    
                    console.log("User no longer in voice, stopping event approximately.");
                    ReadyHandler.stopVoiceEvent(user, guild.channels.get(result.channel.toString()), true);
                    continue;
                }
                
                result.remove().catch(console.error);
            } catch (e) {
                console.error(e)
            }
        }
    }
    
    embedError(channel, error) {
        channel.createMessage({
            embed: {
                author:      {
                    name: "Error!"
                },
                title:       error.message || error,
                description: error.stack || error,
                timestamp:   new Date(),
                color:       0xFF0000
            }
        }).catch(e => console.log(e.response));
    }
    
    getConfig(guildId) {
        if (!this.config[guildId]) {
            this.config[guildId] = {
                token:           undefined,
                ignoredUsers:    [],
                ignoredChannels: []
            };
        }
        
        return this.config[guildId];
    }
    
    wrapError(func, msg, args) {
        (function (msg, args) {
            try {
                func(msg, args);
            } catch (e) {
                console.log(e);
            }
        })(msg, args);
    }
    
    saveConfig() {
        try {
            fs.writeFile(
                fs.realpathSync(__dirname + '/../config.json'),
                JSON.stringify(this.config, null, 4),
                err => {
                    if (err) {
                        console.error(err);
                    }
                }
            );
        } catch (e) {
            console.error(e);
        }
    }
    
    gracefulShutdown() {
        console.log("Process killed.");
        this.client.editStatus("dnd", {name: "Restarting"});
        
        setTimeout(() => {
            this.client.disconnect({reconnect: false});
            delete this.client;
            process.exit(0);
        }, 300)
    }
    
    run() {
        console.log("Starting bot!");
        this.client.connect();
        setInterval(this.sendServerCount.bind(this), 60000);
    }
    
    sendServerCount() {
        request({
            uri:     'https://bots.discord.pw/api/bots/264569236129579008/stats',
            method:  'POST',
            headers: {
                Authorization: process.env.BOTS_DISCORD_PW_KEY
            },
            json:    {
                server_count: this.client.guilds.size
            }
        }, err => {
            if (err) {
                console.log(err)
            }
        });
        
        request({
            uri:    'https://www.carbonitex.net/discord/data/botdata.php?debug=true',
            method: 'POST',
            json:   {
                key:         process.env.CARBONITE_KEY,
                servercount: this.client.guilds.size
            }
        }, err => {
            if (err) {
                console.log(err)
            }
        });
    }
}
