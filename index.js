const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    makeCacheableSignalKeyStore, 
    delay 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

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

    // පළමු වරට ලොගින් වන විට Pairing Code එක ලබා ගැනීම
    if (!sock.authState.creds.registered) {
        console.log("------------------------------------------");
        const phoneNumber = await question('ඔයාගේ WhatsApp අංකය රටේ කේතය සමග ඇතුළත් කරන්න (Ex: 94762498519): ');
        const code = await sock.requestPairingCode(phoneNumber);
        console.log(`\nඔයාගේ Pairing Code එක: \x1b[32m${code}\x1b[0m`);
        console.log("මෙම කේතය WhatsApp -> Linked Devices -> Link with Phone Number වෙත ගොස් ඇතුළත් කරන්න.\n");
        console.log("------------------------------------------");
    }

    sock.ev.on('creds.update', saveCreds);

    // Group එකක් Unmute වූ සැණින් Message එක යැවීම
    sock.ev.on('groups.update', async ([group]) => {
        // announce: false යනු "Only Admins" සෙටින් එක ඉවත් වූ අවස්ථාවයි
        if (group.announce === false) { 
            console.log(`Group ${group.id} is now Unmuted! Sending message...`);
            
            // --- මෙතන ඔයාට අවශ්‍ය Message එක ලියන්න ---
            const myMessage = "Admin විසින් Group එක Unmute කරන ලදී! 🚀 මෙන්න මගේ Auto Message එක.";
            
            await sock.sendMessage(group.id, { text: myMessage });
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log("WhatsApp Bot එක සාර්ථකව සම්බන්ධ විය! ✅");
        }
        if (connection === 'close') {
            console.log("සම්බන්ධතාවය විසන්ධි විය, නැවත උත්සාහ කරයි...");
            startBot();
        }
    });
}

startBot();
