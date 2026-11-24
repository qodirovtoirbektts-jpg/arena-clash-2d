const testAntiCheat = require('./antiCheat.test');
const testReconnect = require('./reconnect.test');
const runLoadTest = require('./loadTest');
const { server } = require('../index');

async function main() {
  console.log('========================================================');
  console.log('  ARENA CLASH 2D — TEST SUITE VA XAVFSIZLIK TEKSHIRUVI  ');
  console.log('========================================================\n');

  try {
    // 1. Anti-cheat & Authority
    testAntiCheat();

    // 2. Disconnect & Reconnect
    testReconnect();

    // 3. Load & Multi-Client Stress Test
    console.log('Server yuklama testi ishga tushirilmoqda...');
    await new Promise(r => setTimeout(r, 1000));
    await runLoadTest(3000, 10, 3);

    console.log('========================================================');
    console.log('  BARCHA TESTLAR (100%) MUVAFFAQIYATLI YAKUNLANDI!      ');
    console.log('========================================================');
  } catch (err) {
    console.error('Testda xatolik yuz berdi:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

main();
