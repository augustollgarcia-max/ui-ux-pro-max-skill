# Skills Configuration

Este arquivo documenta as skills instaladas neste projeto para melhorar o desenvolvimento.

## Skills Instaladas

### 1. **find-skills**
O Claude acha e instala a skill certa sozinho
```bash
npx skills add find-skills
```

### 2. **frontend-design**
UI bonita, sem aquela cara de template de IA
```bash
npx skills add frontend-design
```

### 3. **agent-browser**
O agente abre o navegador e testa por você
```bash
npx skills add agent-browser
```

### 4. **react-best-practices**
Código React que não quebra em produção
```bash
npx skills add react-best-practices
```

### 5. **humanizer**
Tira a cara de "texto gerado por IA" de qualquer escrita
```bash
npx skills add humanizer
```

### 6. **google/skills** (127 skills)
Catalogo oficial do Google: Google Cloud (GKE, BigQuery, Cloud Run, Spanner, AlloyDB, IAM,
Logging/Monitoring), Gemini/Agent Platform, Genkit, Firebase, Google Ads e Analytics APIs.
```bash
npx skills add google/skills
```

> Os arquivos das skills ficam em `.agents/skills/` (com symlinks em `.claude/skills/`) e
> **nao sao versionados** — apenas o `skills-lock.json` entra no repo. Para restaurar em um
> clone novo: `npx skills experimental_install`.

<details>
<summary>Lista completa das 127 skills do Google</summary>

- `agent-platform-alert-configuration`
- `agent-platform-deploy`
- `agent-platform-endpoint-management`
- `agent-platform-eval-flywheel`
- `agent-platform-inference`
- `agent-platform-migrate-from-ai-studio`
- `agent-platform-model-registry`
- `agent-platform-prompt-management`
- `agent-platform-rag-engine-management`
- `agent-platform-skill-registry`
- `agent-platform-troubleshooting`
- `agent-platform-tuning`
- `agent-platform-tuning-management`
- `alloydb-basics`
- `application-design-center-design-deploy`
- `bigquery-ai-ml`
- `bigquery-basics`
- `bigquery-bigframes`
- `bigtable-basics`
- `cloud-build-basics`
- `cloud-databases-onboarding`
- `cloud-logging-configuration-basics`
- `cloud-logging-cross-project-configuration`
- `cloud-logging-query-generation`
- `cloud-monitoring-chart-generation`
- `cloud-monitoring-list-time-series-request`
- `cloud-monitoring-metric-selection`
- `cloud-monitoring-promql-query`
- `cloud-run-basics`
- `cloud-sql-basics`
- `data-manager-api-audience-ingestion`
- `data-manager-api-event-ingestion`
- `data-manager-api-setup`
- `datalineage-bigquery-asset-impact-analysis`
- `datalineage-summary`
- `detection-engineering-coverage-evaluation`
- `developer-device-platform-basics`
- `developing-genkit-dart`
- `developing-genkit-go`
- `developing-genkit-js`
- `developing-genkit-python`
- `finding-google-skills`
- `firebase-basics`
- `gcloud`
- `gemini-agents-api`
- `gemini-api`
- `gemini-interactions-api`
- `gemini-live-api`
- `gke-ai-troubleshooting-handle-disruption-gpu-tpu`
- `gke-ai-troubleshooting-jobset-interruption`
- `gke-ai-troubleshooting-tpu-dynamic-slices-monitoring`
- `gke-ai-troubleshooting-tpu-metrics-monitoring`
- `gke-ai-troubleshooting-tpu-vbar-oom`
- `gke-alert-configuration`
- `gke-app-onboarding`
- `gke-backup-dr`
- `gke-basics`
- `gke-batch-hpc`
- `gke-cluster-autoscaler`
- `gke-cluster-creation`
- `gke-compute-classes`
- `gke-cost-analysis`
- `gke-cost-optimization`
- `gke-custom-golden-image-discovery`
- `gke-golden-path`
- `gke-inference`
- `gke-manifest-generation`
- `gke-multitenancy`
- `gke-networking`
- `gke-observability`
- `gke-platform-security`
- `gke-productionize`
- `gke-reliability`
- `gke-service-networking`
- `gke-storage`
- `gke-upgrades`
- `gke-workload-scaling`
- `gke-workload-security`
- `gke-workload-troubleshooting`
- `google-ads-api-account-diagnostics`
- `google-ads-api-mcp-setup`
- `google-ads-api-quickstart`
- `google-agents-cli-onboarding`
- `google-analytics-admin-api-basics`
- `google-analytics-data-api-basics`
- `google-cloud-filestore-autoscale`
- `google-cloud-global-frontend-configuration`
- `google-cloud-networking-observability`
- `google-cloud-recipe-auth`
- `google-cloud-recipe-foundation-builder`
- `google-cloud-recipe-onboarding`
- `google-cloud-scc-query`
- `google-cloud-slo-alert-configuration`
- `google-cloud-solution-agentic-ai-bidirectional-streaming`
- `google-cloud-solution-agentic-ai-borderless-data-lakehouse`
- `google-cloud-solution-agentic-ai-data-science-workflow`
- `google-cloud-solution-agentic-analytics-spark-knowledge-catalog`
- `google-cloud-solution-architecture`
- `google-cloud-solution-build-deploy-agents`
- `google-cloud-solution-guided-gke-ai-migration`
- `google-cloud-solution-hybrid-search-alloydb`
- `google-cloud-solution-multi-agent-security`
- `google-cloud-solution-n-tier-serverless-web-app`
- `google-cloud-solution-rag-enterprise-search-gke-sqldb`
- `google-cloud-storage-basics`
- `google-cloud-storage-fuse`
- `google-cloud-waf-cost-optimization`
- `google-cloud-waf-operational-excellence`
- `google-cloud-waf-performance-optimization`
- `google-cloud-waf-reliability`
- `google-cloud-waf-security`
- `google-cloud-waf-sustainability`
- `google-mobile-ads-android-migrate-to-next-gen`
- `google-mobile-ads-banner`
- `google-mobile-ads-get-started`
- `google-mobile-ads-interstitial`
- `google-mobile-ads-rewarded`
- `iam-helper-for-policy-simulator`
- `iam-helper-for-privileged-access-management`
- `ima-dai-sdk`
- `ima-sdk-client-side`
- `managed-airflow-dag-authoring`
- `managed-airflow-dag-troubleshooting`
- `managed-airflow-migrations`
- `retrieving-developer-knowledge`
- `spanner-basics`
- `workload-manager-basics`

</details>

## Como Instalar

Execute os seguintes comandos para instalar todas as skills:

```bash
# Instalar todas as skills
npx skills add find-skills && \
npx skills add frontend-design && \
npx skills add agent-browser && \
npx skills add react-best-practices && \
npx skills add humanizer && \
npx skills add google/skills
```

Em um clone novo, para reinstalar exatamente as versoes registradas em `skills-lock.json`:

```bash
npx skills experimental_install
```

Ou instale individualmente conforme necessário.

## Benefícios

- ✅ **find-skills**: Automação na descoberta e instalação de skills
- ✅ **frontend-design**: Garantir UI/UX profissional sem parecer gerada por IA
- ✅ **agent-browser**: Testes automatizados no navegador
- ✅ **react-best-practices**: Código React de qualidade produção
- ✅ **humanizer**: Melhor qualidade na documentação e textos
- ✅ **google/skills**: Guias oficiais do Google para Cloud, Gemini, Firebase, Ads e Analytics

