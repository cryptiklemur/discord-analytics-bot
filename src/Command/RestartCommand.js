module.exports = class RestartCommand {
    static get name() { return 'restart'; }

    static get config() {
        return {
            requirements: {
                userIDs: [process.env.BOT_OWNER]
            }
        };
    }

    static run() {
        setTimeout(() => {
            this.gracefulShutdown();
        }, 1000);

        return "Restarting...";
    }
}
