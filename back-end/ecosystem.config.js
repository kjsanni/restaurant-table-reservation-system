module.exports = {
  apps: [
    {
      name: 'rtrs-backend',
      cwd: './back-end',
      script: './src/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        JWT_SECRET: process.env.JWT_SECRET,
        PORT: process.env.PORT || 8000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log'
    },
    {
      name: 'rtrs-frontend',
      cwd: './front-end',
      script: 'node_modules/.bin/serve',
      args: '-s dist -l 8080',
      instances: 1,
      exec_mode: 'fork',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log'
    }
  ]
};
