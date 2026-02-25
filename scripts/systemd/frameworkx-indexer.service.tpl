[Unit]
Description=FrameWorkX Indexer
After=network.target

[Service]
Type=simple
User=__RUN_AS_USER__
Group=__RUN_AS_GROUP__
WorkingDirectory=__APP_DIR__
EnvironmentFile=__ENV_FILE__
ExecStart=/usr/bin/node __APP_DIR__/apps/indexer/dist/main.js
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
