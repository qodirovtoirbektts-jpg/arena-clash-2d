const WebSocket = require('ws');
const { MSG } = require('../../shared/protocol');

async function runLoadTest(port = 3000, clientCount = 10, durationSeconds = 3) {
  console.log(`--- Load Test boshlandi: ${clientCount} ta bot klientlar ---`);

  const clients = [];
  let snapshotsReceived = 0;
  let matchesStarted = 0;

  // Botlarni ulash
  for (let i = 0; i < clientCount; i++) {
    const ws = new WebSocket(`ws://localhost:${port}`);
    const botId = `bot_${i}`;
    const char = ['blaze_knight', 'shadow_ninja', 'frost_mage'][i % 3];

    await new Promise((resolve) => {
      ws.on('open', () => {
        // Auth
        ws.send(JSON.stringify({
          type: MSG.C_AUTH,
          username: `LoadBot_${i}`,
          favoriteCharacter: char
        }));

        // Navbatga qo'shilish
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: MSG.C_JOIN_QUEUE,
            characterId: char
          }));
          resolve();
        }, 100);
      });

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw);
          if (msg.type === MSG.S_MATCH_START) {
            matchesStarted++;
          }
          if (msg.type === MSG.S_SNAPSHOT) {
            snapshotsReceived++;
          }
        } catch (e) {}
      });
    });

    clients.push(ws);
  }

  console.log(`✓ ${clientCount} ta bot muvaffaqiyatli serverga ulandi va navbatga kirdi.`);

  // O'yin davomida kirish buyruqlarini (Input spam) yuborish
  const inputInterval = setInterval(() => {
    clients.forEach((ws, idx) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: MSG.C_INPUT,
          seq: Date.now(),
          moveX: Math.sin(Date.now() / 200 + idx),
          moveY: 0,
          jump: Math.random() < 0.1,
          drop: false,
          attackLight: Math.random() < 0.2,
          attackHeavy: Math.random() < 0.1,
          skill: Math.random() < 0.05,
          dodge: Math.random() < 0.05
        }));
      }
    });
  }, 33); // 30 Hz

  await new Promise(r => setTimeout(r, durationSeconds * 1000));

  clearInterval(inputInterval);
  clients.forEach(ws => ws.close());

  console.log(`✓ Test yakunlandi: Jami qabul qilingan Snapshotlar: ${snapshotsReceived}, Boshlangan matchlar: ${matchesStarted}`);
  console.log('=== Load Test muvaffaqiyatli yakunlandi! ===\n');
}

module.exports = runLoadTest;

if (require.main === module) {
  const { server } = require('../index');
  setTimeout(async () => {
    try {
      await runLoadTest(3000, 10, 3);
    } catch (e) {
      console.error(e);
    } finally {
      server.close();
      process.exit(0);
    }
  }, 1000);
}
