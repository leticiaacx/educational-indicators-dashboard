# API FastAPI - Indicadores Educacionais

**Trabalho de Conclusão de Curso (TCC)**

API para fornecer dados de indicadores educacionais por município brasileiro, com foco em análise descritiva e identificação de tendências históricas.

## Contexto Acadêmico

Este sistema foi desenvolvido como parte de um Trabalho de Conclusão de Curso focado em **análise descritiva** de indicadores educacionais brasileiros. O trabalho utiliza análise de tendências baseada em dados históricos (via coeficiente de determinação R²), sem realizar previsões futuras. O objetivo é identificar e caracterizar padrões temporais e regionais nos indicadores educacionais, oferecendo uma visão compreensiva da evolução histórica da educação básica no Brasil.

## Indicadores Disponíveis

| Indicador | Descrição | Anos |
|-----------|-----------|------|
| **TDI** | Taxa de Distorção Idade-Série - Percentual de alunos com idade superior à recomendada para a série | 2006-2024 |
| **Aprovação** | Taxa de aprovação escolar ao final do ano letivo | 2007-2023 |
| **Reprovação** | Taxa de reprovação escolar | 2007-2023 |
| **Abandono** | Taxa de abandono escolar durante o ano letivo | 2007-2023 |

## Instalação

```bash
cd fastapi-backend
pip install -r requirements.txt

## Estrutura de Arquivos

```
fastapi-backend/
├── main.py                     # Aplicação FastAPI
├── requirements.txt            # Dependências Python
├── data/
│   └── municipios_indicadores.csv  # Dados CSV
└── README.md
```

## Executando Localmente

```bash
uvicorn main:app --reload --port 8000
```

A API estará disponível em `http://localhost:8000`

Documentação interativa (Swagger): `http://localhost:8000/docs`

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Informações da API |
| GET | `/api/indicadores` | Lista de indicadores com descrições |
| GET | `/api/anos` | Range de anos por indicador |
| GET | `/api/metricas` | Métricas agregadas (média, max, min, desvio padrão) |
| GET | `/api/tendencia` | Dados + linha de tendência (R², RMSE) |
| GET | `/api/comparacao` | Comparação entre grupos |
| GET | `/api/dados` | Dados brutos filtrados |
| GET | `/api/regioes` | Lista de regiões |
| GET | `/api/estados` | Lista de estados |

## Análise de Tendências

O endpoint `/api/tendencia` calcula automaticamente:

- **Regressão Linear**: Coeficiente angular e intercepto
- **R² (Coeficiente de Determinação)**: Qualidade do ajuste (0 a 1)
- **RMSE (Root Mean Square Error)**: Erro médio
- **Direção**: Crescente ou decrescente

Exemplo de resposta:
```json
{
  "dados": {
    "SP": [{"ano": 2010, "valor": 15.5}, ...]
  },
  "tendencias": {
    "SP": {
      "coeficiente": -0.8234,
      "intercepto": 1672.5,
      "r2": 0.9456,
      "rmse": 1.234,
      "direcao": "decrescente",
      "linha_tendencia": [...]
    }
  }
}
```

## Parâmetros de Filtro

Todos os endpoints de dados aceitam:

| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| `indicador` | Tipo do indicador | tdi, aprovacao, reprovacao, abandono |
| `regiao` | Filtrar por região | Norte, Nordeste, Sul, Sudeste, Centro-Oeste |
| `estados` | Lista de UFs | SP,RJ,MG |
| `ano_inicio` | Ano inicial | 2010 |
| `ano_fim` | Ano final | 2023 |
| `agrupar_por` | Agrupamento | none, estado, regiao |

## Exemplos de Uso

```bash
# Obter descrição dos indicadores
curl "http://localhost:8000/api/indicadores"

# Métricas para São Paulo
curl "http://localhost:8000/api/metricas?estados=SP&indicador=tdi"

# Tendência por estado no Sudeste com R² e RMSE
curl "http://localhost:8000/api/tendencia?regiao=Sudeste&agrupar_por=estado&indicador=tdi"

# Comparação entre regiões
curl "http://localhost:8000/api/comparacao?agrupar_por=regiao&indicador=aprovacao"
```

## Deploy

### Render.com
```yaml
# render.yaml
services:
  - type: web
    name: api-educacional
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11
```

### Railway
1. Conecte o repositório
2. Configure: `Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Deploy automático

### Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Integrando com o Dashboard React

1. Configure a URL da API no `.env`:
```env
VITE_API_URL=https://sua-api.com
```

2. Use os hooks disponíveis em `src/hooks/useEducationalApi.ts`:
```typescript
import { useMetricas, useTendencia } from '@/hooks/useEducationalApi';

function Dashboard() {
  const { data: metricas } = useMetricas({
    indicador: 'tdi',
    estados: ['SP', 'RJ']
  });
  
  const { data: tendencia } = useTendencia({
    indicador: 'tdi',
    agrupar_por: 'estado'
  });
}
```
