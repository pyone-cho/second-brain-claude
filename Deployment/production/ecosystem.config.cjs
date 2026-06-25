module.exports = {
  apps: [
    {
      name: "second-brain-backend",
      script: "dist/index.js",
      cwd: __dirname + "/../../backend",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      // Load .env file
      env_file: __dirname + "/.env",

      // Logging
      log_file: __dirname + "/logs/backend.log",
      error_file: __dirname + "/logs/backend-error.log",
      out_file: __dirname + "/logs/backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Restart policy
      max_restarts: 10,
      restart_delay: 5000,
      min_uptime: "10s",

      // Memory limit (restart if exceeds)
      max_memory_restart: "256M",

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
    },
  ],
};
