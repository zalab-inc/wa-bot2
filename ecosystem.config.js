module.exports = {
  apps: [{
    name: "wa-bot",
    script: "./src/index.ts",
    interpreter: "ts-node",
    watch: true,
    ignore_watch: ["node_modules"],
    max_memory_restart: "2G",
    restart_delay: 3000,
    autorestart: true,
    exp_backoff_restart_delay: 100
  }]
}
