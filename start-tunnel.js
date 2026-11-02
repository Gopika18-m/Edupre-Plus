const localtunnel = require('localtunnel');
const https = require('https');

async function getTunnelPassword() {
  return new Promise((resolve) => {
    https.get('https://loca.lt/mytunnelpassword', (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data.trim()));
    }).on('error', () => resolve('Unable to fetch IP'));
  });
}

(async () => {
  try {
    const password = await getTunnelPassword();
    const subdomain = `edupre-plus-${Math.floor(1000 + Math.random() * 9000)}`;
    let tunnel;
    try {
      tunnel = await localtunnel({ port: 5174, subdomain });
    } catch {
      tunnel = await localtunnel({ port: 5174 });
    }

    console.log('========================================================');
    console.log('🚀  EDUPRE PLUS IS NOW LIVE ONLINE!');
    console.log(`🌐  Live URL: ${tunnel.url}`);
    console.log(`🔑  Tunnel Password (if prompted for IP): ${password}`);
    console.log('========================================================');
    console.log('Demo Credentials:');
    console.log('  👨‍🏫 Faculty:  faculty@edupreplus.edu  / faculty123');
    console.log('  🧑‍🏫 Mentor:   mentor@edupreplus.edu   / mentor123');
    console.log('  👑 Admin:    admin@edupreplus.edu    / admin123');
    console.log('  🎓 Student:  student@edupreplus.edu  / student123');
    console.log('========================================================');

    tunnel.on('close', () => {
      console.log('Tunnel closed.');
      process.exit(0);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
    });
  } catch (err) {
    console.error('Failed to open tunnel:', err);
    process.exit(1);
  }
})();
