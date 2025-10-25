const { spawn } = require('child_process');
const fs = require('fs');

let tunnelProcess = null;
let serverProcess = null;

function startServer() {
  console.log('🚀 Starting server...');
  serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  serverProcess.on('error', (err) => {
    console.error('❌ Server error:', err);
  });
}

function startTunnel() {
  console.log('🌐 Starting localtunnel...');
  
  // Try different subdomains
  const subdomains = ['conference-local', 'conference-demo', 'conference-fast', 'conference-app'];
  const randomSubdomain = subdomains[Math.floor(Math.random() * subdomains.length)];
  
  console.log(`📡 Using subdomain: ${randomSubdomain}`);
  
  tunnelProcess = spawn('lt', ['--port', '3000', '--subdomain', randomSubdomain], {
    stdio: 'pipe',
    shell: true
  });

  tunnelProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('📡 Tunnel:', output);
    
    // Extract URL from output
    const urlMatch = output.match(/your url is: (https:\/\/[^\s]+)/);
    if (urlMatch) {
      console.log(`✅ Tunnel ready: ${urlMatch[1]}`);
      console.log('🌍 Opening browser...');
      spawn('start', [urlMatch[1]], { shell: true });
    }
  });

  tunnelProcess.stderr.on('data', (data) => {
    console.error('❌ Tunnel error:', data.toString());
  });

  tunnelProcess.on('close', (code) => {
    console.log(`🔄 Tunnel closed with code ${code}, restarting...`);
    setTimeout(startTunnel, 2000);
  });

  tunnelProcess.on('error', (err) => {
    console.error('❌ Tunnel process error:', err);
    setTimeout(startTunnel, 5000);
  });
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  if (tunnelProcess) tunnelProcess.kill();
  if (serverProcess) serverProcess.kill();
  process.exit(0);
});

// Start everything
startServer();
setTimeout(startTunnel, 3000); // Wait for server to start

console.log('🎯 Conference App Launcher');
console.log('📱 Server will start on http://localhost:3000');
console.log('🌐 Localtunnel will be created automatically');
console.log('🔄 Press Ctrl+C to stop');
console.log('📋 Available URLs:');
console.log('   - http://localhost:3000 (local)');
console.log('   - https://conference-local.loca.lt');
console.log('   - https://conference-demo.loca.lt');
console.log('   - https://conference-fast.loca.lt');
console.log('   - https://conference-app.loca.lt');
