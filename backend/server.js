const app = require('./app');

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║       ⚔️  THE SYSTEM — BACKEND API       ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log(`🚀 Server online     → http://localhost:${PORT}`);
    console.log(`🩺 Health check      → http://localhost:${PORT}/api/health`);
    console.log(`🌍 Environment       → ${process.env.NODE_ENV || 'development'}`);
    console.log('📡 Awaiting hunter connection...\n');
  });
}

module.exports = app;
