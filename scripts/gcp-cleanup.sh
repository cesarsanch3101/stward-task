#!/usr/bin/env bash
# gcp-cleanup.sh — Limpieza periódica de recursos huérfanos en GCP
# Proyecto: stward-task-1cbf3
# Uso: bash scripts/gcp-cleanup.sh [--dry-run]
# Recomendado: ejecutar mensualmente

set -euo pipefail

PROJECT="stward-task-1cbf3"
REGION="us-central1"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "[DRY-RUN] Solo mostrando — no se elimina nada"
fi

echo ""
echo "=============================="
echo " GCP Cleanup — $(date '+%Y-%m-%d %H:%M')"
echo " Proyecto: $PROJECT"
echo "=============================="

# ── 1. Jobs de Cloud Run huérfanos (todos excepto check-overdue-tasks) ─────────
echo ""
echo "[ Cloud Run Jobs ]"

KEEP_JOBS=("check-overdue-tasks")

JOBS=$(gcloud run jobs list --region "$REGION" --project "$PROJECT" \
  --format="value(metadata.name)" 2>/dev/null || true)

if [[ -z "$JOBS" ]]; then
  echo "  No hay jobs."
else
  while IFS= read -r job; do
    keep=false
    for k in "${KEEP_JOBS[@]}"; do
      [[ "$job" == "$k" ]] && keep=true && break
    done

    if $keep; then
      echo "  ✅ CONSERVAR: $job"
    else
      echo "  🗑️  ELIMINAR:  $job"
      if ! $DRY_RUN; then
        gcloud run jobs delete "$job" --region "$REGION" --project "$PROJECT" --quiet
        echo "     → Eliminado."
      fi
    fi
  done <<< "$JOBS"
fi

# ── 2. Imágenes antiguas en GCR (conserva las 2 más recientes por imagen) ──────
echo ""
echo "[ GCR — imágenes antiguas (conserva las 2 más recientes) ]"

for IMAGE in stward-backend stward-frontend; do
  FULL="gcr.io/$PROJECT/$IMAGE"

  DIGESTS=$(gcloud container images list-tags "$FULL" \
    --project "$PROJECT" \
    --sort-by="~TIMESTAMP" \
    --format="value(digest)" 2>/dev/null | tail -n +3 || true)

  if [[ -z "$DIGESTS" ]]; then
    echo "  ✅ $IMAGE — sin imágenes antiguas"
  else
    COUNT=$(echo "$DIGESTS" | wc -l | tr -d ' ')
    echo "  🗑️  $IMAGE — $COUNT imagen(es) antigua(s) a eliminar"
    while IFS= read -r digest; do
      echo "     → $FULL@$digest"
      if ! $DRY_RUN; then
        gcloud container images delete "$FULL@$digest" \
          --project "$PROJECT" --quiet --force-delete-tags 2>/dev/null || true
      fi
    done <<< "$DIGESTS"
  fi
done

# ── 3. Resumen de servicios activos ────────────────────────────────────────────
echo ""
echo "[ Servicios Cloud Run activos ]"
gcloud run services list --region "$REGION" --project "$PROJECT" \
  --format="table(metadata.name,spec.template.metadata.annotations['autoscaling.knative.dev/minScale'],spec.template.spec.containers[0].resources.limits.cpu,spec.template.spec.containers[0].resources.limits.memory)" 2>/dev/null

echo ""
echo "[ Cloud Scheduler Jobs ]"
gcloud scheduler jobs list --project "$PROJECT" --location "$REGION" \
  --format="table(name,schedule,state)" 2>/dev/null

echo ""
echo "=============================="
echo " Limpieza completada"
echo "=============================="
