#!/bin/bash
# Script para executar o worker de monitoramento de email

cd /home/kali/Documents/Smartquote/back_end
exec npx ts-node src/workers/emailMonitorWorker.ts
