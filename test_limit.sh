#!/bin/bash
for i in {1..30}; do
  echo "Burning limit, request $i..."
  OUTPUT=$(claude -p "Generate a 5000 word essay about the entire history of the world and write it down here. Do not stop. Request number $i." --permission-mode dontAsk 2>&1)
  if echo "$OUTPUT" | grep -qi "limit"; then
    echo "Limit Hit!"
    echo "$OUTPUT"
    exit 0
  fi
done
echo "Could not hit limit."
