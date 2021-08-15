import express from 'express'
import bodyParser from 'body-parser'
import Discord, { GuildMember, Snowflake } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';
import { Track } from './music/track';
import { MusicSubscription } from './music/subscription';

const PORT = process.env.PORT || 5001;
const TOKEN = process.env.DISCORD_TOKEN;
const app = express(); app.use(bodyParser.json());
const client = new Discord.Client({ intents: ['GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILDS'] });
const subscriptions = new Map<Snowflake, MusicSubscription>();

client.on('ready', () => console.log('Ready!'));

client.on('messageCreate', async (message: Discord.Message) => {
	if (!message.guild) return;
	if (!client.application?.owner) await client.application?.fetch();
	if (message.author.bot) return;

	if (message.content.toLowerCase().includes('family') || message.content.toLowerCase() === 'femily') { 
		if (!message.guildId) return;
		console.log(`Playing on Guild: ${message.guildId}`)
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
					console.log(`Playing: https://www.youtube.com/watch?v=RgKAFK5djSk`);
					subscription.enqueue(track);
				},
				onFinish() {
				},
				onError(error) {
					console.warn(error);
				},
			});
			if (subscription) {
				await message.reply("♫ I don't have friends, I got family 👪 ♫");
				subscription.enqueue(track);
			}
		} catch (error) {
			console.warn(error);
		}
	}
});

client.on('error', console.warn);

void client.login(TOKEN);

app.get('/', async (req, res) => {
    res.send("FemilyBot - I don't have friends, I got family 👪")
})

app.post('/play', async (req, res) => {
	console.log(req.body)
	let subscription = subscriptions.get(req.body.guildId);
	if (!subscription) {
		res.send("Not playing in this server!")		
	} else {
		subscription.queueLock = false;
		const track = await Track.from(req.body.link, {
				onStart() {
					console.log(`Playing: ${req.body.link}`);
				},
				onFinish() {
				},
				onError(error) {
					console.warn(error);
				},
		});
		subscription.enqueue(track);
		res.send(`Queuing: ${req.body.link}`)
	}

})

app.listen(PORT, () => {
    console.log(`FemilyBot is running on port ${ PORT }`);
});
