#!/bin/bash

echo "??? Hunting signals... (Ctrl+C to stop)"
docker-compose logs -f spread-scanner risk-engine monad-arb-bot 2>&1 | grep -E "(SPREAD DETECTED|EVAL:|EXEC:|P&L)" | while read line; do
  echo "?? $line"
  ./proof-collector.sh
 done
