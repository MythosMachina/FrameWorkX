[Unit]
Description=FrameWorkX Worker (%i)
After=network.target

[Service]
Type=simple
User=__RUN_AS_USER__
Group=__RUN_AS_GROUP__
WorkingDirectory=__APP_DIR__
EnvironmentFile=__ENV_FILE__
Environment=FRAMEWORKX_ROLE=%i
ExecStart=/usr/bin/node __APP_DIR__/apps/worker/dist/main.js
Restart=always
RestartSec=2
StandardOutput=append:__APP_DIR__/.logs/worker_%i.log
StandardError=append:__APP_DIR__/.logs/worker_%i.log

[Install]
WantedBy=multi-user.target
