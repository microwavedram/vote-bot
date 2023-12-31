import { Client, TextChannel, Collection, REST, Routes, EmbedBuilder, ActivityType, PresenceUpdateStatus, UserSelectMenuInteraction, GuildMember } from "discord.js"
import dotenv from "dotenv"
import path from "path"
import fs from "fs"
import { DiscordCommand } from "./types"

import { Config } from "./config"

dotenv.config()

const Commands: Map<string, DiscordCommand> = new Map()
const VoteMap: Map<string, string[]> = new Map()

interface Vote {id: string, votes: string[]}

const message_id = ""

async function saveVotes() {
    const votes: Vote[] = []

    VoteMap.forEach((value, key) => {
        votes.push({
            id: key,
            votes: value
        })
    })

    fs.writeFileSync("votes.json", JSON.stringify(votes))
}

async function uploadCommands() {
    const rest = new REST().setToken(process.env.TOKEN as string)

    const commandsPath = path.join(__dirname, 'commands')
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))

    const command_jsons: string[] = []
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file)
        const command = require(filePath).default

        command_jsons.push(command.data.toJSON())
        Commands.set(command.data.name, command)
    }

    try {
        console.log(`Started refreshing ${command_jsons.length} application (/) commands.`);

		const data = await rest.put(
			Config.mode == "DEV" ?
                Routes.applicationGuildCommands(Config.client_id, Config.dev_guild) :
                Routes.applicationCommands(Config.client_id),
			{ body: command_jsons },
		) as any[]

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error)
    }
}

async function main() {

    (() => {
        const votesjson = fs.readFileSync("votes.json")

        const votes: Vote[] = JSON.parse(votesjson.toString())

        votes.forEach(vote => {
            VoteMap.set(vote.id, vote.votes)
        })

        console.log(votes)
    })()

    const discord_client = new Client({
        intents: ["Guilds", "GuildMembers"],
        presence: {
            activities: [
                {
                    name: "for interations.",
                    type: ActivityType.Watching
                }
            ]
        }
    })

    await uploadCommands()

    discord_client.on("interactionCreate", async interaction => {

        if (interaction.isUserSelectMenu()) {
            interaction = interaction as UserSelectMenuInteraction

            const member = interaction.member as GuildMember

            if (member.joinedTimestamp) {
                if (member.joinedTimestamp > 1699901180012) {
                    interaction.reply(`You cannot vote. Please open a ticket and screenshot this message. DEBUG: ${member.id}`)
                }
            }

            if (interaction.customId == "votes") {
                const values = interaction.values

                if (values.length != 4) {
                    interaction.reply("Select Exactly Four.")
                }

                VoteMap.set(interaction.user.id, values)

                saveVotes()

                interaction.reply({
                    content: "Your vote has been recorded",
                    ephemeral: true
                })
            }
        }

        if (!interaction.isChatInputCommand()) return

        const command = Commands.get(interaction.commandName)

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`)
            return
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error)
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: `There was an error while executing this command! Please either check your not being an absolute bafoon or if your convinced its really bad, send a screenshot to <@${Config.developer_id}>`, ephemeral: true });
            } else {
                await interaction.reply({ content: `There was an error while executing this command! Please either check your not being an absolute bafoon or if your convinced its really bad, send a screenshot to <@${Config.developer_id}>`, ephemeral: true });
            }
        }
    })

    discord_client.on("ready", () => {
        console.log(`Discord bot logged in as ${discord_client.user?.username}`)
    })

    discord_client.login(process.env.TOKEN)
}

main()