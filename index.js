const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    makeCacheableSignalKeyStore, 
    delay 
} = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startBot() {
    // auth_info ෆෝල්ඩරය තුළ ලොගින් දත්ත ගබඩා වේ
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // ලොගින් වී නොමැති නම් Pairing Code එක ඉල්ලීම
    if (!sock.authState.creds.registered) {
        const phoneNumber = "94762498519"; // ඔයාගේ අංකය
        await delay(5000); // සර්වර් එක සූදානම් වීමට තත්පර 5ක් ලබා දීම
        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log("\n==========================================");
            console.log(`ඔයාගේ PAIRING CODE එක: ${code}`);
            console.log("==========================================\n");
        } catch (err) {
            console.error("Pairing Code එක ලබා ගැනීමට නොහැකි විය: ", err);
        }
    }

    sock.ev.on('creds.update', saveCreds);

    // Group එක Unmute වූ සැණින් Message එක යැවීම
    sock.ev.on('groups.update', async ([group]) => {
        if (group.announce === false) { 
            console.log(`Group ${group.id} Unmuted! Sending message...`);
            
            // යැවිය යුතු පණිවිඩය පහත දැක්වේ
            const myMessage = "Admin විසින් Group එක Unmute කරන ලදී! 🚀 (Auto Bot Message)";
            
            await sock.sendMessage(group.id, { text: myMessage });
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') console.log("WhatsApp Bot එක සාර්ථකව සම්බන්ධ විය! ✅");
        if (connection === 'close') startBot(); 
    });
}

startBot();
