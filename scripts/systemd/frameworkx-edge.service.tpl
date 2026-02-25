[Unit]
Description=FrameWorkX Edge (Integrated Ingress)
After=network.target frameworkx-api.service frameworkx-ui.service
Wants=frameworkx-api.service frameworkx-ui.service

[Service]
Type=simple
User=__RUN_AS_USER__
Group=__RUN_AS_GROUP__
WorkingDirectory=__APP_DIR__
EnvironmentFile=__ENV_FILE__
ExecStart=/bin/bash -lc 'cd __APP_DIR__; npm run -w @frameworkx/edge start'
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
