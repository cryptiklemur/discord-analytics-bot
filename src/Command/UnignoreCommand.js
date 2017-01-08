const _ = require('lodash');

module.exports = class UnignoreCommand {
    static get name() { return 'unignore'; }

    static get config() {
        return {
            guildOnly:       true,
            description:     "Unignores the given channel or user",
            fullDescription: "Unignores the given channel or user",
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
            return "Please mention a user or channel to unignore";
        }

        // Check user mentions
        if (msg.mentions.length > 0) {
            msg.mentions.forEach(u => {
                let index = this.getConfig(guildId).ignoredUsers.indexOf(u.id);
                if (index >= 0) {
                    this.getConfig(guildId).ignoredUsers.splice(index, 1);
                }
            });

            this.getConfig(guildId).ignoredUsers = _.uniq(this.getConfig(guildId).ignoredUsers);
        }

        // Check channel mentions
        if (msg.channelMentions.length > 0) {
            msg.channelMentions.forEach(id => {
                let index = this.getConfig(guildId).ignoredChannels.indexOf(id);
                if (index >= 0) {
                    this.getConfig(guildId).ignoredChannels.splice(index, 1);
                }
            });

            this.getConfig(guildId).ignoredChannels = _.uniq(this.getConfig(guildId).ignoredChannels);
        }

        this.saveConfig(this.config);

        msg.channel.createMessage("Users and channels unignored");
    }
};
