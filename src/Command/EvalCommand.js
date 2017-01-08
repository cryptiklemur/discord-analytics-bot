module.exports = class EvalCommand {
    static get name() { return 'eval'; }

    static get config() {
        return {
            requirements: {
                userIDs: [process.env.BOT_OWNER]
            }
        };
    }

    static run(msg, args) {
        let code  = args.join(' '),
            found = code.match(/^\`\`\`[a-z]*\n([\s\S]*)?\n\`\`\`$/);
        if (found) {
            code = found[1];
        } else {
            found = code.match(/^\`?([^`]*)?\`?$/);
            if (found) {
                code = found[1];
            }
        }

        let response, error;
        try {
            response = eval(code);
        } catch (e) {
            error = e;
        }

        if (Array.isArray(response) || typeof response === 'object') {
            try {
                response = JSON.stringify(response, null, 4).replace(/","/g, '", "');
            } catch (e) {
                error = e;
            }
        }

        if (error) {
            msg.channel.createMessage({
                embed: {
                    author:      {
                        name: "Error executing eval!"
                    },
                    title:       error.message,
                    description: error.stack || error,
                    timestamp:   new Date(),
                    color:       0xFF0000
                }
            }).catch(e => console.log(e.response));

            return;
        }

        msg.channel.createMessage({
            embed: {
                author:      {
                    name: "Execution Success!"
                },
                type:        "rich",
                title:       "Response: ",
                description: "" + response,
                timestamp:   new Date(),
                color:       0x00FF00
            }
        }).catch(e => console.log(e.response));
    }
};
