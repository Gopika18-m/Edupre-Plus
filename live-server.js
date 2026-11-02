const path = require('path');
const https = require('https');
const backendDir = path.join(__dirname, 'backend');
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const mongoose = require(path.join(backendDir, 'node_modules/mongoose'));
const app = require('./backend/app');
const localtunnel = require('localtunnel');

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edupre_plus';

async function getTunnelPassword() {
  return new Promise((resolve) => {
    https.get('https://loca.lt/mytunnelpassword', (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data.trim()));
    }).on('error', () => resolve('Unable to fetch IP automatically'));
  });
}

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected successfully.');
    
    const server = app.listen(PORT, async () => {
      console.log(`EduPre Plus backend & frontend running on port ${PORT}`);
      
      try {
        console.log('Creating secure live public tunnel...');
        const tunnelPassword = await getTunnelPassword();
        
        let tunnel;
        try {
          tunnel = await localtunnel({ port: PORT, subdomain: `edupre-plus-${Math.floor(1000 + Math.random() * 9000)}` });
        } catch {
          tunnel = await localtunnel({ port: PORT });
        }

        console.log('\n======================================================');
        console.log('🚀  EDUPRE PLUS IS LIVE ONLINE!');
        console.log(`🌐  Live URL: ${tunnel.url}`);
        console.log(`🔑  Tunnel Password (if prompted for IP): ${tunnelPassword}`);
        console.log('======================================================');
        console.log('Demo Logins:');
        console.log('  👨‍🏫 Faculty:  faculty@edupreplus.edu  / faculty123');
        console.log('  🧑‍🏫 Mentor:   mentor@edupreplus.edu   / mentor123');
        console.log('  👑 Admin:    admin@edupreplus.edu    / admin123');
        console.log('  🎓 Student:  student@edupreplus.edu  / student123');
        console.log('======================================================\n');

        tunnel.on('close', () => {
          console.log('Tunnel closed.');
        });
      } catch (err) {
        console.error('Failed to create tunnel:', err.message);
      }
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
