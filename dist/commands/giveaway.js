"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const discord_js_2 = require("discord.js");
const ms_1 = __importDefault(require("ms"));
const giveaway_utils_1 = require("../giveaway-utils");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('giveaway')
    .setNameLocalization('ko', '추첨')
    .setDescription('Manage giveaways')
    .setDescriptionLocalization('ko', '추첨 이벤트를 관리합니다.')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand => subcommand
    .setName('start')
    .setNameLocalization('ko', '시작')
    .setDescription('Start a new giveaway')
    .setDescriptionLocalization('ko', '새로운 추첨을 시작합니다.')
    .addStringOption(option => option
    .setName('duration')
    .setNameLocalization('ko', '기간')
    .setDescription('Duration of the giveaway (e.g., 1d 12h 30m)')
    .setDescriptionLocalization('ko', '추첨 기간 (예: 1d 12h 30m)')
    .setRequired(true))
    .addIntegerOption(option => option
    .setName('winners')
    .setNameLocalization('ko', '당첨자수')
    .setDescription('Number of winners')
    .setDescriptionLocalization('ko', '당첨자 수')
    .setRequired(true)
    .setMinValue(1))
    .addStringOption(option => option
    .setName('prize')
    .setNameLocalization('ko', '경품')
    .setDescription('Prize for the giveaway')
    .setDescriptionLocalization('ko', '추첨 경품')
    .setRequired(true))
    .addChannelOption(option => option
    .setName('channel')
    .setNameLocalization('ko', '채널')
    .setDescription('Channel to post the giveaway (default: current channel)')
    .setDescriptionLocalization('ko', '추첨을 게시할 채널 (기본: 현재 채널)')
    .addChannelTypes(discord_js_1.ChannelType.GuildText)
    .setRequired(false)))
    .addSubcommand(subcommand => subcommand
    .setName('reroll')
    .setNameLocalization('ko', '재추첨')
    .setDescription('Reroll a giveaway winner')
    .setDescriptionLocalization('ko', '추첨 당첨자를 다시 뽑습니다.')
    .addStringOption(option => option
    .setName('message-id')
    .setNameLocalization('ko', '메시지-id')
    .setDescription('Message ID of the giveaway')
    .setDescriptionLocalization('ko', '추첨 메시지 ID')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('end')
    .setNameLocalization('ko', '종료')
    .setDescription('End a giveaway early')
    .setDescriptionLocalization('ko', '추첨을 조기 종료합니다.')
    .addStringOption(option => option
    .setName('message-id')
    .setNameLocalization('ko', '메시지-id')
    .setDescription('Message ID of the giveaway')
    .setDescriptionLocalization('ko', '추첨 메시지 ID')
    .setRequired(true)));
async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'start') {
        await handleStart(interaction);
    }
    else if (subcommand === 'reroll') {
        await handleReroll(interaction);
    }
    else if (subcommand === 'end') {
        await handleEnd(interaction);
    }
}
async function handleStart(interaction) {
    const durationStr = interaction.options.getString('duration', true);
    const winnerCount = interaction.options.getInteger('winners', true);
    const prize = interaction.options.getString('prize', true);
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    let duration = 0;
    try {
        const parts = durationStr.trim().split(/\s+/);
        for (const part of parts) {
            const parsed = (0, ms_1.default)(part);
            if (typeof parsed !== 'number' || parsed <= 0) {
                await interaction.reply({
                    content: '⚠️ 올바르지 않은 기간 형식입니다. 예: 1d, 12h, 30m, 1d 12h 30m',
                    ephemeral: true
                });
                return;
            }
            duration += parsed;
        }
    }
    catch (error) {
        await interaction.reply({
            content: '⚠️ 올바르지 않은 기간 형식입니다. 예: 1d, 12h, 30m, 1d 12h 30m',
            ephemeral: true
        });
        return;
    }
    if (duration <= 0) {
        await interaction.reply({
            content: '⚠️ 올바르지 않은 기간 형식입니다. 예: 1d, 12h, 30m, 1d 12h 30m',
            ephemeral: true
        });
        return;
    }
    const endTime = Date.now() + duration;
    const endTimestamp = Math.floor(endTime / 1000);
    const giveawayEmbed = new discord_js_2.EmbedBuilder()
        .setTitle('🎉 추첨 이벤트 🎉')
        .setDescription(`**경품:** ${prize}`)
        .addFields({ name: '당첨자 수', value: `${winnerCount}명`, inline: true }, { name: '종료 시간', value: `<t:${endTimestamp}:R>`, inline: true })
        .setColor(0x00FF00)
        .setFooter({ text: '🎉 반응을 눌러 참여하세요!' })
        .setTimestamp();
    const message = await channel.send({ embeds: [giveawayEmbed] });
    await message.react('🎉');
    const giveawayData = {
        messageId: message.id,
        channelId: channel.id,
        guildId: interaction.guildId,
        prize,
        winnerCount,
        endTime,
        hostId: interaction.user.id,
        isActive: true
    };
    const giveaways = (0, giveaway_utils_1.loadGiveaways)();
    giveaways.push(giveawayData);
    (0, giveaway_utils_1.saveGiveaways)(giveaways);
    (0, giveaway_utils_1.scheduleGiveaway)(interaction.client, message.id, endTime);
    await interaction.reply({
        content: `✅ 추첨이 성공적으로 시작되었습니다!\n메시지: ${message.url}`,
        ephemeral: true
    });
}
async function handleReroll(interaction) {
    const messageId = interaction.options.getString('message-id', true);
    const giveaways = (0, giveaway_utils_1.loadGiveaways)();
    const giveaway = giveaways.find(g => g.messageId === messageId);
    if (!giveaway) {
        await interaction.reply({
            content: '⚠️ 해당 메시지 ID의 추첨을 찾을 수 없습니다.',
            ephemeral: true
        });
        return;
    }
    if (giveaway.isActive) {
        await interaction.reply({
            content: '⚠️ 아직 종료되지 않은 추첨입니다.',
            ephemeral: true
        });
        return;
    }
    try {
        const channel = await interaction.client.channels.fetch(giveaway.channelId);
        if (!channel || !channel.isTextBased()) {
            await interaction.reply({
                content: '⚠️ 채널을 찾을 수 없습니다.',
                ephemeral: true
            });
            return;
        }
        const message = await channel.messages.fetch(giveaway.messageId);
        const reaction = message.reactions.cache.get('🎉');
        if (!reaction) {
            await interaction.reply({
                content: '⚠️ 반응을 찾을 수 없습니다.',
                ephemeral: true
            });
            return;
        }
        const users = await reaction.users.fetch();
        const existingWinners = giveaway.winners || [];
        const participants = users
            .filter(user => !user.bot && !existingWinners.includes(user.id))
            .map(user => user.id);
        if (participants.length === 0) {
            await interaction.reply({
                content: '⚠️ 재추첨할 참가자가 없습니다.',
                ephemeral: true
            });
            return;
        }
        const newWinner = participants[Math.floor(Math.random() * participants.length)];
        await channel.send({
            content: `🎉 재추첨 결과!\n축하합니다! <@${newWinner}> 님!\n**${giveaway.prize}**에 당첨되셨습니다!`,
            reply: { messageReference: message.id }
        });
        const giveawayIndex = giveaways.findIndex(g => g.messageId === messageId);
        if (giveawayIndex !== -1) {
            giveaways[giveawayIndex].winners = [...existingWinners, newWinner];
            (0, giveaway_utils_1.saveGiveaways)(giveaways);
        }
        await interaction.reply({
            content: '✅ 재추첨이 완료되었습니다.',
            ephemeral: true
        });
    }
    catch (error) {
        console.error('Error in reroll:', error);
        await interaction.reply({
            content: '⚠️ 재추첨 중 오류가 발생했습니다.',
            ephemeral: true
        });
    }
}
async function handleEnd(interaction) {
    const messageId = interaction.options.getString('message-id', true);
    const giveaways = (0, giveaway_utils_1.loadGiveaways)();
    const giveaway = giveaways.find(g => g.messageId === messageId);
    if (!giveaway) {
        await interaction.reply({
            content: '⚠️ 해당 메시지 ID의 추첨을 찾을 수 없습니다.',
            ephemeral: true
        });
        return;
    }
    if (!giveaway.isActive) {
        await interaction.reply({
            content: '⚠️ 이미 종료된 추첨입니다.',
            ephemeral: true
        });
        return;
    }
    (0, giveaway_utils_1.cancelGiveaway)(messageId);
    await (0, giveaway_utils_1.endGiveaway)(interaction.client, messageId);
    await interaction.reply({
        content: '✅ 추첨이 조기 종료되었습니다.',
        ephemeral: true
    });
}
