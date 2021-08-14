import Discord, { Interaction, GuildMember, Snowflake } from 'discord.js';
import { AudioPlayerStatus, AudioResource, entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import { Track } from './music/track';
import { MusicSubscription } from './music/subscription';
const token = process.env.DISCORD_TOKEN;

const client = new Discord.Client({ intents: ['GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILDS'] });

client.on('ready', () => console.log('Ready!'));

const subscriptions = new Map<Snowflake, MusicSubscription>();

client.on('messageCreate', async (message: Discord.Message) => {
	if (!message.guild) return;
	if (!client.application?.owner) await client.application?.fetch();
	if (message.author.bot) return;

	if (message.content.toLowerCase().includes('family') || message.content.toLowerCase() === 'femily') { 
		if (!message.guildId) return;
		let subscription = subscriptions.get(message.guildId);
		if (!subscription) {
			if (message.member instanceof GuildMember && message.member.voice.channel) {
				const channel = message.member.voice.channel;
				subscription = new MusicSubscription(
					joinVoiceChannel({
						channelId: channel.id,
						guildId: channel.guild.id,
						adapterCreator: channel.guild.voiceAdapterCreator,
					}),
				);
				subscription.voiceConnection.on('error', console.warn);
				subscriptions.set(message.guild.id, subscription);
			}
			
		}
		if (subscription) {
			subscription.queueLock = false;
		}
		if (message.content.toLowerCase() === 'femily') {
			if (subscription) {
				subscription.stop();
				await message.reply('You don\'t turn your back on family, even when they do');
			} else {
				await message.reply('Not playing in this server!');
			}
		}
		try {
			const track = await Track.from("https://www.youtube.com/watch?v=RgKAFK5djSk", {
				onStart() {
					if (!subscription){
						return
					}
					console.log("Start Song!");
					subscription.enqueue(track);
				},
				onFinish() {
				},
				onError(error) {
					console.warn(error);
				},
			});
			if (subscription) {
				subscription.enqueue(track);
			}
		} catch (error) {
			console.warn(error);
		}
	}
});

client.on('error', console.warn);

void client.login(token);
