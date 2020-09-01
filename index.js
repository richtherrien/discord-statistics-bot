// import module
const Discord = require('discord.js');
require('custom-env').env('staging')
const client = new Discord.Client();
const token = process.env.TOKEN;


// return the past 10,000 messages from the chanel
async function getAllChannelMessages(channel, limit = 10000) {
    const sumMessages = [];
    let lastId;

    while (true) {
        const options = { limit: 100 };
        if (lastId)
            options.before = lastId;

        const messages = await channel.messages.fetch(options);
        sumMessages.push(...messages.array());

        if (messages.size != 100 || sumMessages.length >= limit) {
            break;
        }

        lastId = messages.last().id;
    }
    console.log("Returned ", sumMessages.length, " messages");
    return sumMessages;
}

client.on('ready', () => {
    console.log('ready');
});

client.on('message', (message) => {

    if (message.content.includes('/msgstats')) {
        console.log("msgstat request from username: ", message.author.username, ", userid: ", message.author.id, ", in guildname: ", message.channel.guild.name, ", guildid: " + message.channel.guild.id);

        // count the number of messages per user using a hash map
        getAllChannelMessages(message.channel).then(messages => {
            let maxCount = 10;
            let userMap = {};
            let sortedUserMap = [];
            let returnMsg = "";

            messages.forEach(msg => {
                if (!userMap[msg.author.id]) {
                    userMap[msg.author.id] = { 'msgCount': 1, 'username': msg.author.username };
                } else {
                    userMap[msg.author.id].msgCount++;
                }
            });
            // sort the map by msgCount
            sortedUserMap = Object.keys(userMap).sort(function (a, b) { return userMap[b].msgCount - userMap[a].msgCount });

            maxCount = maxCount > sortedUserMap.length ? sortedUserMap.length : maxCount;
            returnMsg = "A total of **" + messages.length + "** messages were counted.\n" +
                "\n**Top " + maxCount + " Most Active Users**\n";
            for (var i = 0; i < maxCount; i++) {
                returnMsg += "```" + (i + 1) + ". " + userMap[sortedUserMap[i]].username + "```"
                    + "Message Count: **" + userMap[sortedUserMap[i]].msgCount + "**\n";

            }
            message.reply(returnMsg);
        });
    }
});

// login with token from env file
client.login(token);