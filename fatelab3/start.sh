#!/usr/bin/env bash
# start.sh - 由 Guard 应用拉起业务主进程；末行必须 exec
# 由 guard-transform 模板渲染生成
set -eo pipefail
cd "$(dirname "$0")"



export APP_PORT="${APP_PORT:-3000}"
export NODE_ENV=production
# server.cjs 内部已 bind 0.0.0.0:$APP_PORT，无需额外指定
exec node server.cjs 2>&1
