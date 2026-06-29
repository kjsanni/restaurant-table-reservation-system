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
        JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
        PORT: process.env.PORT || 8000
      },
      env_production: {
        NODE_ENV: 'production',
        JWT_SECRET: process.env.JWT_SECRET,
        PORT: process.env.PORT || 8000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      max_memory_restart: '1G',
      node_args: '--max_old_space_size=4096'
    },
    {
      name: 'rtrs-frontend',
      cwd: './front-end',
      script: 'serve',
      args: '-s dist -l 8080',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log'
    }
  ]
};