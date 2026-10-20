#!/bin/sh
# Backup diário da NEX: banco (pg_dump) e arquivos enviados (volume uploads). Guarda 14 dias.
# Uso: sh deploy/backup.sh   (rodar dentro de /opt/nex)
# Agendar: crontab -e →  0 3 * * * cd /opt/nex && sh deploy/backup.sh >> backups/backup.log 2>&1
set -eu

cd "$(dirname "$0")/.."
mkdir -p backups
DATA=$(date +%F)

docker compose exec -T db pg_dump -U nex nex | gzip > "backups/nex-banco-$DATA.sql.gz"
docker compose run --rm --no-deps -T -u root -v "$PWD/backups:/backups" --entrypoint sh app \
  -c "tar czf /backups/nex-arquivos-$DATA.tar.gz -C /app uploads"

find backups -name 'nex-*' -mtime +14 -delete
echo "$(date '+%F %T') backup concluído: $DATA"
