import { channel } from "diagnostics_channel"
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, CommandInteraction, PermissionFlags, SlashCommandBuilder, UserSelectMenuBuilder } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName("poll")
        .setDescription("creates poll")
        .addChannelOption(option => option.setName("channel").setDescription("description").setRequired(true)),
    
    async execute(interaction: CommandInteraction) {
        const option = await interaction.options.get("channel", true)

        if (option.channel?.id) {
            const channel = await interaction.guild?.channels.fetch(option.channel.id)

            if (channel) {
                if (channel.isTextBased()) {
                    await interaction.reply("sendin it")
                    
                    const select = new UserSelectMenuBuilder()
                    .setCustomId("votes")
                    .setPlaceholder("Make a selection")
                    .setMaxValues(4)
                    .setMinValues(4)

                    const row = new ActionRowBuilder<UserSelectMenuBuilder>()
                    .addComponents(select)

                    const row2 = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(new ButtonBuilder().setCustomId("confirm").setEmoji("✅").setLabel("Confirm").setDisabled(false).setStyle(ButtonStyle.Success))

                    const message = await channel.send({
                        content: "will write thing here",
                        components: [row]
                    })

                    return;
                }
            }

        }


        await interaction.reply("somethin wen wrong")
    }
}