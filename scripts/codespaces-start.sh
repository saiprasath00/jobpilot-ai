#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
  echo 'Jobpilot is already running on port 3000.'
else
  nohup npm start > /tmp/jobpilot-server.log 2>&1 < /dev/null &
  echo 'Jobpilot is starting. Open private port 3000 in the Ports panel.'
fi
