import express from 'express'
import bodyParser from 'body-parser'
import Discord, { DiscordAPIError, GuildMember, Snowflake } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';
import { Track } from './music/track';
import { MusicSubscription } from './music/subscription';

const PORT = process.env.PORT || 5001;
const TOKEN = process.env.DISCORD_TOKEN;
const app = express(); app.use(bodyParser.json());
const client = new Discord.Client({ intents: ['GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILDS'] });
const subscriptions = new Map<Snowflake, MusicSubscription>();

const domQuotes = [
	"Money🤑 will come and go. We all know that. The most important thing in life will always be the people in this room 😭. Right here, right now.",
	"I live my life 🧬 a quarter-mile at a time.⏩",
	"I don’t have friends👨‍👧‍👧, I've got family. 😿",
	"Ride or die, remember? 🚗🚔",
	"You don't turn your back on family.👪 Even when they do.",
	"What did you put in that sandwich? 🥪",
	"Why the smile? You lost. 🤣",
	"You got schooled.🎒 Learn your lesson 🏫 and go home. 🏠",
	"The thing about street fights ... The street always win. 🔧"
]

let avatarPath = '';

client.on('ready', () => console.log('Ready!'));

client.on('error', console.warn);

client.on('messageCreate', async (message: Discord.Message) => {
	if (!message.guild) return;
	if (!client.application?.owner) await client.application?.fetch();
	if (message.author.bot) return;
	console.log(`Playing on Guild: ${message.guildId}`)

	if (message.content.toLowerCase().includes('family')) { 

		const subscription = checkSubscription(message)

		if (subscription) {
			subscription.queueLock = false;
		}

		changeAvatar('./avatar/thanos.png');

		client?.user?.setActivity("👨‍👧‍👧")
		
		let link = 'https://www.youtube.com/watch?v=JfUriaSWSgg';
		queueTrack(subscription, message, link) 

	} else if (message.content.toLowerCase().includes('femly')) {
		
		const subscription = checkSubscription(message);

		changeAvatar('./avatar/vin.png');

		client?.user?.setActivity(undefined)

		if (message.content.toLowerCase().includes('femly')) {
			if (subscription) {
				subscription.stop();
				await message.reply(getRandomDomQuote());
			} else {
				await message.reply('Not playing in this server!');
			}
		}

	} else if (message.content.toLowerCase().includes('paul walker')) {

		const subscription = checkSubscription(message);
		
		changeAvatar('./avatar/stanwalker.png');

		client?.user?.setActivity("Car Crash")

		if (subscription) {
			subscription.queueLock = false;
		}
		
		let link = 'https://www.youtube.com/watch?v=qZmKOLY-cpw';
		queueTrack(subscription, message, link);
	}
});

function checkSubscription(message:Discord.Message) {
	if (!message || !message.guildId) return
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
			subscriptions.set(message.guildId, subscription);
		}
	}
	return subscription
}

async function queueTrack(subscription: MusicSubscription | undefined, message: Discord.Message, link: string) {
	const track = await Track.from(link, {
		onStart() {
			if (!subscription) {
				return;
			}
			console.log(`Playing: ${link}`);
			subscription.enqueue(track);
		},
		onFinish() {
		},
		onError(error) {
			console.warn(error);
		},
	});
	try {
		if (subscription) {
			await message.reply(getRandomDomQuote());
			subscription.queue.pop();
			subscription.enqueue(track);
		}
	} catch (error) {
		console.warn(error);
	}
}

async function changeAvatar(path: string){
	if (!client.user) return;
	if (avatarPath != path) {
		try {
			await client.user.setAvatar(path);
		} catch(error) {
			console.log("Too many avatar changes, please try again later");
		}
		avatarPath = path
	}
	console.log(avatarPath);
}

function getRandomDomQuote() {
	const randIdx = Math.floor(Math.random()*domQuotes.length);
	return domQuotes[randIdx];
}

void client.login(TOKEN);

app.get('/', async (req, res) => {
    res.send("FemlyBot - I don't have friends, I got family 👪")
})

app.listen(PORT, () => {
    console.log(`FemlyBot is running on port ${ PORT }`);
});
