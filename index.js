// import module
const Discord = require('discord.js');
require('custom-env').env('staging')
const client = new Discord.Client();
const token = process.env.TOKEN;

// return the past messages from the chanel
async function getAllChannelMessages(channel, limit = 100000) {
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

function countImgs(msg) {
    let count = 0;
    msg.attachments.forEach(attachment => {
        if ((attachment.url).match(/\.(jpeg|jpg|gif|png)$/i))
            count++;
    })

    msg.embeds.forEach(embed => {
        if (embed.type == "image")
            count++;
    })
    return count;
}

function getMessageStats(messages) {
    let userMap = {};
    messages.forEach(msg => {
        if (!userMap[msg.author.id]) {
            userMap[msg.author.id] = { 'msgCount': 1, 'username': msg.author.username, 'charCount': msg.content.length, 'imgCount': 0 };
        } else {
            userMap[msg.author.id].msgCount++;
            userMap[msg.author.id].charCount += msg.content.length;
        }
        // counting the embedded images linked in the messages as well as those pasted into the discord window
        userMap[msg.author.id].imgCount += countImgs(msg);
    });
    return userMap;
}

function replyMessageStatistics(message) {
    // count the number of messages per user using a hash map
    getAllChannelMessages(message.channel).then(messages => {
        let maxCount = 10, sortedUserList = [], returnMsg = "";
        let userMap = getMessageStats(messages);

        // sort the map by msgCount
        sortedUserList = Object.keys(userMap).sort(function (a, b) { return userMap[b].msgCount - userMap[a].msgCount });

        maxCount = maxCount > sortedUserList.length ? sortedUserList.length : maxCount;
        returnMsg = "A total of **" + messages.length + "** messages were counted.\n" +
            "\n**Top " + maxCount + " Most Active Users**\n";
        for (var i = 0; i < maxCount; i++) {
            returnMsg += "```" + (i + 1) + ". " + userMap[sortedUserList[i]].username + "```"
                + "Messages Sent: **" + userMap[sortedUserList[i]].msgCount + "**\n"
                + "Characters Typed: **" + userMap[sortedUserList[i]].charCount + "**\n"
                + "Images Posted: **" + userMap[sortedUserList[i]].imgCount + "**\n";
        }
        message.reply(returnMsg);
    });
}

client.on('ready', () => {
    console.log('ready');
});

client.on('message', (message) => {
    if (message.content.includes('/msgstats')) {
        console.log("msgstat request from username: ", message.author.username, ", userid: ", message.author.id, ", in guildname: ", message.channel.guild.name, ", guildid: " + message.channel.guild.id);
        replyMessageStatistics(message);
    }
});

// login with token from env file
client.login(token);