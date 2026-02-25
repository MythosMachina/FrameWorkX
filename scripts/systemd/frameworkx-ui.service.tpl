[Unit]
Description=FrameWorkX UI
After=network.target

[Service]
Type=simple
User=__RUN_AS_USER__
Group=__RUN_AS_GROUP__
WorkingDirectory=__APP_DIR__
EnvironmentFile=__ENV_FILE__
ExecStart=/bin/bash -lc 'cd __APP_DIR__; npm run -w @frameworkx/ui preview -- --host 0.0.0.0 --port ${FRAMEWORKX_UI_PORT:-5180} --strictPort'
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
