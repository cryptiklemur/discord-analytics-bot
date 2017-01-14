export default class SetTokenCommand {
    static get name() { return 'set-token'; }

    static get config() {
        return {
            description:     "Set your Google Analytics UA Token",
            fullDescription: "Set your Google Analytics UA Token. Run with --delete to remove your token.",
            guildOnly:       true,
            requirements:    {
                permissions: {
                    manageGuild: true
                }
            }
        };
    }

    static async run(msg, args) {
        msg.delete();
        if (args.length !== 1) {
            return "Must only pass a Google Analytics token.";
        }

        if (!msg.guild || !msg.guild.id) {
            return;
        }

        let message;
        if (args[0] === '--delete') {
            this.getConfig(msg.guild.id).token = undefined;
            message = await msg.channel.createMessage("All Set!");
        } else {
            this.getConfig(msg.guild.id).token = args[0];
            message = await msg.channel.createMessage("All Set! Your message was deleted to hide your key from the public.");
        }

        this.saveConfig(this.config);
        setTimeout(message.delete.bind(message), 3000);

    }
}
