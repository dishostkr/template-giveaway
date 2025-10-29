import { Client, TextChannel, Message, EmbedBuilder } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';

const GIVEAWAYS_FILE = path.join(process.cwd(), 'giveaways.json');

export interface GiveawayData {
    messageId: string;
    channelId: string;
    guildId: string;
    prize: string;
    winnerCount: number;
    endTime: number;
    hostId: string;
    isActive: boolean;
    winners?: string[];
}

// 활성 타이머 저장소
const activeTimers = new Map<string, NodeJS.Timeout>();

/**
 * giveaways.json 파일 읽기
 */
export function loadGiveaways(): GiveawayData[] {
    try {
        if (!fs.existsSync(GIVEAWAYS_FILE)) {
            fs.writeFileSync(GIVEAWAYS_FILE, '[]', 'utf-8');
            return [];
        }
        const data = fs.readFileSync(GIVEAWAYS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading giveaways:', error);
        return [];
    }
}

/**
 * giveaways.json 파일에 저장
 */
export function saveGiveaways(giveaways: GiveawayData[]): void {
    try {
        fs.writeFileSync(GIVEAWAYS_FILE, JSON.stringify(giveaways, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving giveaways:', error);
    }
}

/**
 * 추첨 종료 처리
 */
export async function endGiveaway(client: Client, messageId: string): Promise<void> {
    try {
        const giveaways = loadGiveaways();
        const giveawayIndex = giveaways.findIndex(g => g.messageId === messageId);

        if (giveawayIndex === -1) {
            console.error(`Giveaway not found: ${messageId}`);
            return;
        }

        const giveaway = giveaways[giveawayIndex];

        // 채널과 메시지 가져오기
        const channel = await client.channels.fetch(giveaway.channelId) as TextChannel;
        if (!channel || !channel.isTextBased()) {
            console.error(`Channel not found or not text-based: ${giveaway.channelId}`);
            return;
        }

        const message = await channel.messages.fetch(giveaway.messageId);
        if (!message) {
            console.error(`Message not found: ${giveaway.messageId}`);
            return;
        }

        // 🎉 반응 가져오기
        const reaction = message.reactions.cache.get('🎉');
        if (!reaction) {
            console.error('No 🎉 reaction found');
            return;
        }

        // 반응한 유저 목록 가져오기
        const users = await reaction.users.fetch();
        const participants = users.filter(user => !user.bot).map(user => user.id);

        let winners: string[] = [];
        if (participants.length > 0) {
            // 당첨자 랜덤 선정
            const winnerCount = Math.min(giveaway.winnerCount, participants.length);
            const shuffled = [...participants].sort(() => Math.random() - 0.5);
            winners = shuffled.slice(0, winnerCount);
        }

        // 결과 공지
        if (winners.length === 0) {
            await channel.send({
                content: `🎉 추첨이 종료되었습니다!\n\n참가자가 없어 당첨자가 없습니다.`,
                reply: { messageReference: message.id }
            });
        } else {
            const winnerMentions = winners.map(id => `<@${id}>`).join(', ');
            await channel.send({
                content: `🎉 축하합니다! ${winnerMentions} 님!\n**${giveaway.prize}**에 당첨되셨습니다!`,
                reply: { messageReference: message.id }
            });
        }

        // 임베드 수정
        const endedEmbed = new EmbedBuilder()
            .setTitle('🎉 추첨 종료 🎉')
            .setDescription(`**경품:** ${giveaway.prize}`)
            .addFields(
                { name: '당첨자 수', value: `${giveaway.winnerCount}명`, inline: true },
                { name: '참가자 수', value: `${participants.length}명`, inline: true }
            )
            .setColor(0xFF0000)
            .setTimestamp();

        if (winners.length > 0) {
            endedEmbed.addFields({
                name: '당첨자',
                value: winners.map(id => `<@${id}>`).join('\n'),
                inline: false
            });
        } else {
            endedEmbed.addFields({
                name: '당첨자',
                value: '당첨자 없음',
                inline: false
            });
        }

        await message.edit({ embeds: [endedEmbed] });

        // DB 업데이트
        giveaways[giveawayIndex].isActive = false;
        giveaways[giveawayIndex].winners = winners;
        saveGiveaways(giveaways);

        // 타이머 제거
        if (activeTimers.has(messageId)) {
            clearTimeout(activeTimers.get(messageId)!);
            activeTimers.delete(messageId);
        }

        console.log(`Giveaway ended: ${messageId}`);
    } catch (error) {
        console.error('Error ending giveaway:', error);
    }
}

/**
 * 추첨 타이머 설정
 */
export function scheduleGiveaway(client: Client, messageId: string, endTime: number): void {
    const now = Date.now();
    const timeLeft = endTime - now;

    if (timeLeft <= 0) {
        // 이미 종료 시간이 지난 경우 즉시 종료
        endGiveaway(client, messageId);
    } else {
        // setTimeout 설정
        const timeout = setTimeout(() => {
            endGiveaway(client, messageId);
        }, timeLeft);

        activeTimers.set(messageId, timeout);
        console.log(`Giveaway scheduled: ${messageId}, ends in ${Math.floor(timeLeft / 1000)}s`);
    }
}

/**
 * 타이머 취소
 */
export function cancelGiveaway(messageId: string): void {
    if (activeTimers.has(messageId)) {
        clearTimeout(activeTimers.get(messageId)!);
        activeTimers.delete(messageId);
        console.log(`Giveaway timer cancelled: ${messageId}`);
    }
}

/**
 * 봇 시작 시 활성 추첨 복구
 */
export function restoreGiveaways(client: Client): void {
    const giveaways = loadGiveaways();
    const activeGiveaways = giveaways.filter(g => g.isActive);

    console.log(`Restoring ${activeGiveaways.length} active giveaway(s)...`);

    for (const giveaway of activeGiveaways) {
        scheduleGiveaway(client, giveaway.messageId, giveaway.endTime);
    }
}
