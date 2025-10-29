import { Client, Events } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";
import { deployCommands } from "./deploy-commands";
import { startScheduledJobs } from "./scheduler";

// Event handlers
import { handleMessageCreate } from "./events/messageCreate";

// 클라이언트 생성
const client = new Client({
    intents: ["Guilds", "GuildMessages", "DirectMessages", "GuildMembers", "GuildVoiceStates"],
});

// 봇이 준비되었을 때의 이벤트 핸들러
client.once(Events.ClientReady, () => {
    console.log(`Discord bot is ready! 🤖`);
    console.log(`Logged in as ${client.user!.tag}!`);

    // 활동 상태 설정
    client.user?.setActivity('Activity', { type: 3 }); // 3: Watching

    // 명령어 갱신
    console.log("Started refreshing application (/) commands.");
    deployCommands();
    console.log("Successfully reloaded application (/) commands.");

    // 스케줄러 시작
    startScheduledJobs(client);
    console.log("스케줄러가 시작되었습니다.");
});

// 인터랙션 핸들러
client.on(Events.InteractionCreate, async (interaction) => {
    try {
        // 슬래시 커맨드 체크
        if (!interaction.isChatInputCommand()) return;

        const command = commands[interaction.commandName as keyof typeof commands];
        if (!command) return;

        // 옵션 처리를 포함한 명령어 실행
        await command.execute(interaction).catch(async (error) => {
            console.error(`Error executing command ${interaction.commandName}:`, error);

            // 이미 응답된 경우 followUp 사용
            const replyMethod = interaction.replied ? 'followUp' : 'reply';
            await interaction[replyMethod]({
                content: '명령어 실행 중 오류가 발생했습니다.',
                ephemeral: true
            });
        });

    } catch (error) {
        console.error('Error handling interaction:', error);
    }
});

// 이벤트 리스너
client.on(Events.MessageCreate, handleMessageCreate);
// 봇 로그인
client.login(config.DISCORD_TOKEN).then(() => {
    console.log("봇이 시작되었습니다.");
});