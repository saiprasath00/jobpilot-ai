#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
  echo 'Jobpilot is already running on port 3000.'
else
  nohup npm start > /tmp/jobpilot-server.log 2>&1 < /dev/null &
  jobpilot_pid=$!
  for _ in {1..20}; do
    if node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
      echo 'Jobpilot is running. Open private port 3000 in the Ports panel.'
      exit 0
    fi
    if ! kill -0 "$jobpilot_pid" 2>/dev/null; then
      echo 'Jobpilot failed to start. Server log:' >&2
      tail -n 80 /tmp/jobpilot-server.log >&2
      exit 1
    fi
    sleep 1
  done
  echo 'Jobpilot did not become healthy within 20 seconds. Server log:' >&2
  tail -n 80 /tmp/jobpilot-server.log >&2
  exit 1
fi
