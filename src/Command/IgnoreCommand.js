const _ = require('lodash');

module.exports = class IgnoreCommand {
    static get name() { return 'ignore'; }

    static get config() {
        return {
            guildOnly:       true,
            description:     "Ignores the given channel or user",
            fullDescription: "Ignores the given channel or user. You can specify multiple.",
            requirements:    {
                permissions: {
                    administrator: true
                }
            }
        }
    }

    static run(msg, args) {
        let guildId = msg.guild.id;
        if (args.length === 0) {
            return "Please mention a user or channel to ignore";
        }

        // Check user mentions
        if (msg.mentions.length > 0) {
            msg.mentions.forEach(u => {
                if (this.getConfig(guildId).ignoredUsers.indexOf(u.id) === -1) {
                    this.getConfig(guildId).ignoredUsers.push(u.id);
                }
            });

            this.getConfig(guildId).ignoredUsers = _.uniq(this.getConfig(guildId).ignoredUsers);
        }

        // Check channel mentions
        if (msg.channelMentions.length > 0) {
            msg.channelMentions.forEach(id => {
                if (this.getConfig(guildId).ignoredChannels.indexOf(id) === -1) {
                    this.getConfig(guildId).ignoredChannels.push(id);
                }
            });

            this.getConfig(guildId).ignoredChannels = _.uniq(this.getConfig(guildId).ignoredChannels);
        }

        this.saveConfig(this.config);

        msg.channel.createMessage("Users and channels ignored");
    }
};
