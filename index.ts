// Loading
console.log("Loading...")

// Import packages
import dotenv from "dotenv"
dotenv.config()
import { TwitterApi } from "twitter-api-v2"
import inquirer from "inquirer"
import Table from "cli-table"
import moment from "moment"
import fs from "fs"

// API Keys
const appKey = process.env.API_KEY
const appSecret = process.env.API_KEY_SECRET
const accessToken = process.env.ACCESS_TOKEN
const accessSecret = process.env.ACCESS_TOKEN_SECRET

// Twitter API V2 Client Init
const twitterClient = new TwitterApi({ appKey, appSecret, accessSecret, accessToken })

const client = twitterClient.readWrite;

// Logging
if (fs.existsSync("./logs/tweetLog.txt") === true) {
    
} else if (fs.existsSync("./logs/tweetLog.txt") === false) {
    console.log("Tweet Log File Doesn't Exist. Creating log file...")
    fs.mkdirSync("./logs")
    fs.writeFileSync("./logs/tweetLog.txt", `${moment().format("DD-MM-YYYY hh:mm:ss a")}: Tweet Log File Created`)
}

const fsLogger = fs.createWriteStream("./logs/tweetLog.txt", {
    flags: "a"
})

const logger = (line:string) => fsLogger.write(`\n${line}`)

// Main function/program
async function main() {
    console.clear()

    await inquirer.prompt({
        name: "tweetOrReply",
        type: "list",
        message: "Do you want to tweet or reply? (no media)",
        choices: ["Tweet", "Reply", "Exit"]
    }).then(async answers => {
        const choice = answers.tweetOrReply

        if (choice === "Tweet") {
            await inquirer.prompt({
                name: "tweetMsg",
                type: "input",
                message: "What would you like to tweet:"
            }).then(async answers => {
                const tweetMsg = answers.tweetMsg

                if (tweetMsg === "") {
                    return console.log("Error: You need text to tweet")
                }

                await client.v2.tweet(tweetMsg)
                    .then(async tweet => {
                        console.log(`\nTweet Information (https://twitter.com/${(await client.currentUserV2()).data.username}/status/${tweet.data.id})`)

                        const table = new Table({
                            head: ['Time of the tweet\'s creation', 'Tweet Content']
                        });

                        table.push(
                            [moment().format("DD-MM-YYYY hh:mm:ss a"), tweet.data.text]
                        );

                        console.log(table.toString());
                        logger(`${moment().format("DD-MM-YYYY hh:mm:ss a")}: A Tweet has been created. Tweet Content: ${tweetMsg} (ID: ${tweet.data.id})`)
                    })
                    .catch(err => console.error(err))
            })
        } else if (choice === "Reply") {
            await inquirer.prompt({
                name: "tweetID",
                type: "input",
                message: "Tweet ID:"
            }).then(async replyAnswer => {
                if (replyAnswer.tweetID === "") {
                    return console.log("Error: You need to provide a Tweet ID")
                }

                await inquirer.prompt({
                    name: "replyMsg",
                    type: "input",
                    message: "Reply message:"
                }).then(async answers => {
                    await client.v2.reply(answers.replyMsg, replyAnswer.tweetID)
                        .then(async tweet => {
                            console.log(`\nReply Information (https://twitter.com/${(await client.currentUserV2()).data.username}/status/${tweet.data.id})`)

                            const table = new Table({
                                head: ['Time of the reply\'s creation', 'Reply Content']
                            });
    
                            table.push(
                                [moment().format("DD-MM-YYYY hh:mm:ss a"), tweet.data.text]
                            );
    
                            console.log(table.toString());
                            logger(`${moment().format("DD-MM-YYYY hh:mm:ss a")}: A reply has been created. Reply Content: ${answers.replyMsg} (ID: ${tweet.data.id})`)
                        })
                        .catch(err => console.error(err))
                })
            })
        } else if (choice === "Exit") {
            process.exit(0)
        }
    })
}

main()