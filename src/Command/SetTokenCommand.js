module.exports = class SetTokenCommand {
    static get name() { return 'set-token'; }

    static get config() {
        return {
            description:     "Set your Google Analytics UA Token",
            fullDescription: "Set your Google Analytics UA Token",
            guildOnly:       true,
            requirements:    {
                permissions: {
                    administrator: true
                }
            }
        };
    }

    static run(msg, args) {
        msg.delete();
        if (args.length !== 1) {
            return "Must only pass a Google Analytics token.";
        }

        if (!msg.guild || !msg.guild.id) {
            return;
        }

        this.getConfig(msg.guild.id).token = args[0];
        this.saveConfig(this.config);

        return "All Set!";
    }
}
