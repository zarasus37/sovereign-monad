#!/bin/sh
chown appuser:appuser /app/logs 2>/dev/null || true
exec gosu appuser "$@"
