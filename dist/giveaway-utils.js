"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadGiveaways = loadGiveaways;
exports.saveGiveaways = saveGiveaways;
exports.endGiveaway = endGiveaway;
exports.scheduleGiveaway = scheduleGiveaway;
exports.cancelGiveaway = cancelGiveaway;
exports.restoreGiveaways = restoreGiveaways;
const discord_js_1 = require("discord.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const GIVEAWAYS_FILE = path.join(process.cwd(), 'giveaways.json');
const activeTimers = new Map();
function loadGiveaways() {
    try {
        if (!fs.existsSync(GIVEAWAYS_FILE)) {
            fs.writeFileSync(GIVEAWAYS_FILE, '[]', 'utf-8');
            return [];
        }
        const data = fs.readFileSync(GIVEAWAYS_FILE, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error('Error loading giveaways:', error);
        return [];
    }
}
function saveGiveaways(giveaways) {
    try {
        fs.writeFileSync(GIVEAWAYS_FILE, JSON.stringify(giveaways, null, 2), 'utf-8');
    }
    catch (error) {
        console.error('Error saving giveaways:', error);
    }
}
async function endGiveaway(client, messageId) {
    try {
        const giveaways = loadGiveaways();
        const giveawayIndex = giveaways.findIndex(g => g.messageId === messageId);
        if (giveawayIndex === -1) {
            console.error(`Giveaway not found: ${messageId}`);
            return;
        }
        const giveaway = giveaways[giveawayIndex];
        const channel = await client.channels.fetch(giveaway.channelId);
        if (!channel || !channel.isTextBased()) {
            console.error(`Channel not found or not text-based: ${giveaway.channelId}`);
            return;
        }
        const message = await channel.messages.fetch(giveaway.messageId);
        if (!message) {
            console.error(`Message not found: ${giveaway.messageId}`);
            return;
        }
        const reaction = message.reactions.cache.get('🎉');
        if (!reaction) {
            console.error('No 🎉 reaction found');
            return;
        }
        const users = await reaction.users.fetch();
        const participants = users.filter(user => !user.bot).map(user => user.id);
        let winners = [];
        if (participants.length > 0) {
            const winnerCount = Math.min(giveaway.winnerCount, participants.length);
            const shuffled = [...participants].sort(() => Math.random() - 0.5);
            winners = shuffled.slice(0, winnerCount);
        }
        if (winners.length === 0) {
            await channel.send({
                content: `🎉 추첨이 종료되었습니다!\n\n참가자가 없어 당첨자가 없습니다.`,
                reply: { messageReference: message.id }
            });
        }
        else {
            const winnerMentions = winners.map(id => `<@${id}>`).join(', ');
            await channel.send({
                content: `🎉 축하합니다! ${winnerMentions} 님!\n**${giveaway.prize}**에 당첨되셨습니다!`,
                reply: { messageReference: message.id }
            });
        }
        const endedEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('🎉 추첨 종료 🎉')
            .setDescription(`**경품:** ${giveaway.prize}`)
            .addFields({ name: '당첨자 수', value: `${giveaway.winnerCount}명`, inline: true }, { name: '참가자 수', value: `${participants.length}명`, inline: true })
            .setColor(0xFF0000)
            .setTimestamp();
        if (winners.length > 0) {
            endedEmbed.addFields({
                name: '당첨자',
                value: winners.map(id => `<@${id}>`).join('\n'),
                inline: false
            });
        }
        else {
            endedEmbed.addFields({
                name: '당첨자',
                value: '당첨자 없음',
                inline: false
            });
        }
        await message.edit({ embeds: [endedEmbed] });
        giveaways[giveawayIndex].isActive = false;
        giveaways[giveawayIndex].winners = winners;
        saveGiveaways(giveaways);
        if (activeTimers.has(messageId)) {
            clearTimeout(activeTimers.get(messageId));
            activeTimers.delete(messageId);
        }
        console.log(`Giveaway ended: ${messageId}`);
    }
    catch (error) {
        console.error('Error ending giveaway:', error);
    }
}
function scheduleGiveaway(client, messageId, endTime) {
    const now = Date.now();
    const timeLeft = endTime - now;
    if (timeLeft <= 0) {
        endGiveaway(client, messageId);
    }
    else {
        const timeout = setTimeout(() => {
            endGiveaway(client, messageId);
        }, timeLeft);
        activeTimers.set(messageId, timeout);
        console.log(`Giveaway scheduled: ${messageId}, ends in ${Math.floor(timeLeft / 1000)}s`);
    }
}
function cancelGiveaway(messageId) {
    if (activeTimers.has(messageId)) {
        clearTimeout(activeTimers.get(messageId));
        activeTimers.delete(messageId);
        console.log(`Giveaway timer cancelled: ${messageId}`);
    }
}
function restoreGiveaways(client) {
    const giveaways = loadGiveaways();
    const activeGiveaways = giveaways.filter(g => g.isActive);
    console.log(`Restoring ${activeGiveaways.length} active giveaway(s)...`);
    for (const giveaway of activeGiveaways) {
        scheduleGiveaway(client, giveaway.messageId, giveaway.endTime);
    }
}
