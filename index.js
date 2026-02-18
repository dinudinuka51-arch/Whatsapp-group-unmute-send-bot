const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: true,
        logger: pino({ level: "fatal" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);

    // Group Settings වෙනස් වීම හඳුනා ගැනීම
    sock.ev.on('groups.update', async ([group]) => {
        // announce: false කියන්නේ group එක unmute (All participants) වුණු අවස්ථාවයි
        if (group.announce === false) { 
            console.log(`Group ${group.id} is now Unmuted!`);
            
            // යැවිය යුතු Message එක මෙතන ලියන්න
            const myMessage = "මෙන්න Group එක Unmute කළා! 🚀 (Auto Message)";
            
            await sock.sendMessage(group.id, { text: myMessage });
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') console.log("Bot is Online! ✅");
        if (connection === 'close') startBot(); 
    });
}

startBot();
