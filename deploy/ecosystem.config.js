// PM2 config — AlfaDigi ERP
// Usage (VPS pe): pm2 start ecosystem.config.js && pm2 save
module.exports = {
  apps: [
    {
      name: 'alfadigi-erp',
      cwd: '/var/www/alfadigi/server',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      out_file: '/var/www/alfadigi/server/logs/out.log',
      error_file: '/var/www/alfadigi/server/logs/err.log',
      time: true,
    },
  ],
};
