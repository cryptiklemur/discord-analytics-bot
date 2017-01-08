module.exports = class CleanCommand {
    static get name() { return 'clean'; }

    static get config() {
        return {
            requirements: {
                userIDs: [process.env.BOT_OWNER]
            }
        };
    }

    static run(msg, args) {
        try {
            msg.channel.getMessages(args[0] || 100, msg.id)
                .then(messages => {
                    messages.forEach(m => {
                        console.log(m.author.id, this.client.user.id);
                        if (m.author.id == this.client.user.id) {
                            m.delete();
                        }
                    })
                }).catch(console.error)
        } catch (e) {
            console.error("Error: ", e);
        }
    }
};
