import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { ChatInputCommandInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import ms from 'ms';
import {
    loadGiveaways,
    saveGiveaways,
    scheduleGiveaway,
    cancelGiveaway,
    endGiveaway,
    GiveawayData
} from '../giveaway-utils';

// 명령어 정의
export const data = new SlashCommandBuilder()
    .setName('giveaway')
    .setNameLocalization('ko', '추첨')
    .setDescription('Manage giveaways')
    .setDescriptionLocalization('ko', '추첨 이벤트를 관리합니다.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
        subcommand
            .setName('start')
            .setNameLocalization('ko', '시작')
            .setDescription('Start a new giveaway')
            .setDescriptionLocalization('ko', '새로운 추첨을 시작합니다.')
            .addStringOption(option =>
                option
                    .setName('duration')
                    .setNameLocalization('ko', '기간')
                    .setDescription('Duration of the giveaway (e.g., 1d 12h 30m)')
                    .setDescriptionLocalization('ko', '추첨 기간 (예: 1d 12h 30m)')
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option
                    .setName('winners')
                    .setNameLocalization('ko', '당첨자수')
                    .setDescription('Number of winners')
                    .setDescriptionLocalization('ko', '당첨자 수')
                    .setRequired(true)
                    .setMinValue(1)
            )
            .addStringOption(option =>
                option
                    .setName('prize')
                    .setNameLocalization('ko', '경품')
                    .setDescription('Prize for the giveaway')
                    .setDescriptionLocalization('ko', '추첨 경품')
                    .setRequired(true)
            )
            .addChannelOption(option =>
                option
                    .setName('channel')
                    .setNameLocalization('ko', '채널')
                    .setDescription('Channel to post the giveaway (default: current channel)')
                    .setDescriptionLocalization('ko', '추첨을 게시할 채널 (기본: 현재 채널)')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(false)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('reroll')
            .setNameLocalization('ko', '재추첨')
            .setDescription('Reroll a giveaway winner')
            .setDescriptionLocalization('ko', '추첨 당첨자를 다시 뽑습니다.')
            .addStringOption(option =>
                option
                    .setName('message-id')
                    .setNameLocalization('ko', '메시지-id')
                    .setDescription('Message ID of the giveaway')
                    .setDescriptionLocalization('ko', '추첨 메시지 ID')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('end')
            .setNameLocalization('ko', '종료')
            .setDescription('End a giveaway early')
            .setDescriptionLocalization('ko', '추첨을 조기 종료합니다.')
            .addStringOption(option =>
                option
                    .setName('message-id')
                    .setNameLocalization('ko', '메시지-id')
                    .setDescription('Message ID of the giveaway')
                    .setDescriptionLocalization('ko', '추첨 메시지 ID')
                    .setRequired(true)
            )
    );

/**
 * giveaway 명령어 실행
 */
export async function execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'start') {
        await handleStart(interaction);
    } else if (subcommand === 'reroll') {
        await handleReroll(interaction);
    } else if (subcommand === 'end') {
        await handleEnd(interaction);
    }
}

/**
 * 추첨 시작
 */
async function handleStart(interaction: ChatInputCommandInteraction) {
    const durationStr = interaction.options.getString('duration', true);
    const winnerCount = interaction.options.getInteger('winners', true);
    const prize = interaction.options.getString('prize', true);
    const channel = (interaction.options.getChannel('channel') as TextChannel) || interaction.channel as TextChannel;

    // duration 파싱 - 여러 부분으로 나눠진 경우 처리
    let duration = 0;
    try {
        const parts = durationStr.trim().split(/\s+/);
        for (const part of parts) {
            const parsed: number | undefined = ms(part as any) as any;
            if (typeof parsed !== 'number' || parsed <= 0) {
                await interaction.reply({
                    content: '⚠️ 올바르지 않은 기간 형식입니다. 예: 1d, 12h, 30m, 1d 12h 30m',
                    ephemeral: true
                });
                return;
            }
            duration += parsed;
        }
    } catch (error) {
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

    // 추첨 임베드 생성
    const giveawayEmbed = new EmbedBuilder()
        .setTitle('🎉 추첨 이벤트 🎉')
        .setDescription(`**경품:** ${prize}`)
        .addFields(
            { name: '당첨자 수', value: `${winnerCount}명`, inline: true },
            { name: '종료 시간', value: `<t:${endTimestamp}:R>`, inline: true }
        )
        .setColor(0x00FF00)
        .setFooter({ text: '🎉 반응을 눌러 참여하세요!' })
        .setTimestamp();

    // 메시지 전송
    const message = await channel.send({ embeds: [giveawayEmbed] });
    await message.react('🎉');

    // 추첨 정보 저장
    const giveawayData: GiveawayData = {
        messageId: message.id,
        channelId: channel.id,
        guildId: interaction.guildId!,
        prize,
        winnerCount,
        endTime,
        hostId: interaction.user.id,
        isActive: true
    };

    const giveaways = loadGiveaways();
    giveaways.push(giveawayData);
    saveGiveaways(giveaways);

    // 타이머 설정
    scheduleGiveaway(interaction.client, message.id, endTime);

    await interaction.reply({
        content: `✅ 추첨이 성공적으로 시작되었습니다!\n메시지: ${message.url}`,
        ephemeral: true
    });
}

/**
 * 재추첨
 */
async function handleReroll(interaction: ChatInputCommandInteraction) {
    const messageId = interaction.options.getString('message-id', true);

    const giveaways = loadGiveaways();
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
        // 채널과 메시지 가져오기
        const channel = await interaction.client.channels.fetch(giveaway.channelId) as TextChannel;
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

        // 반응한 유저 목록 가져오기
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

        // 새로운 당첨자 1명 선정
        const newWinner = participants[Math.floor(Math.random() * participants.length)];

        // 공지
        await channel.send({
            content: `🎉 재추첨 결과!\n축하합니다! <@${newWinner}> 님!\n**${giveaway.prize}**에 당첨되셨습니다!`,
            reply: { messageReference: message.id }
        });

        // 당첨자 목록 업데이트
        const giveawayIndex = giveaways.findIndex(g => g.messageId === messageId);
        if (giveawayIndex !== -1) {
            giveaways[giveawayIndex].winners = [...existingWinners, newWinner];
            saveGiveaways(giveaways);
        }

        await interaction.reply({
            content: '✅ 재추첨이 완료되었습니다.',
            ephemeral: true
        });
    } catch (error) {
        console.error('Error in reroll:', error);
        await interaction.reply({
            content: '⚠️ 재추첨 중 오류가 발생했습니다.',
            ephemeral: true
        });
    }
}

/**
 * 조기 종료
 */
async function handleEnd(interaction: ChatInputCommandInteraction) {
    const messageId = interaction.options.getString('message-id', true);

    const giveaways = loadGiveaways();
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

    // 타이머 취소
    cancelGiveaway(messageId);

    // 즉시 종료
    await endGiveaway(interaction.client, messageId);

    await interaction.reply({
        content: '✅ 추첨이 조기 종료되었습니다.',
        ephemeral: true
    });
}
