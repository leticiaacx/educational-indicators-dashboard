# Dashboard de Indicadores Educacionais

**Trabalho de Conclusão de Curso (TCC)**

Painel interativo para visualização e análise descritiva de indicadores educacionais brasileiros (TDI, Aprovação, Reprovação e Abandono) cobrindo o período de 2006 a 2024.

## Sobre o Projeto

Este dashboard foi desenvolvido como parte de um **Trabalho de Conclusão de Curso** focado em análise descritiva de indicadores educacionais no Brasil. O sistema permite explorar dados municipais, estaduais e regionais, oferecendo visualizações interativas que facilitam a identificação de padrões temporais e espaciais na educação básica brasileira.

### Escopo da Análise

O trabalho se concentra em **análise descritiva**, caracterizando a evolução histórica dos indicadores educacionais. Embora o sistema apresente linhas de tendência com coeficientes de determinação (R²) para descrever padrões nos dados históricos, **não realiza previsões ou projeções futuras**. O objetivo é fornecer uma compreensão aprofundada do que já ocorreu, identificando tendências passadas sem extrapolar para cenários futuros.

### Indicadores Disponíveis
- **TDI (Taxa de Distorção Idade-Série)**: Percentual de alunos com atraso escolar de 2 anos ou mais.
- **Taxa de Aprovação**: Percentual de alunos aprovados.
- **Taxa de Reprovação**: Percentual de alunos reprovados.
- **Taxa de Abandono**: Percentual de evasão escolar.

## Tecnologias Utilizadas

### Frontend
- **React 18** com **TypeScript**
- **Vite** (Build tool)
- **Tailwind CSS** (Estilização)
- **shadcn/ui** (Componentes de interface)
- **Recharts** e **Plotly.js** (Visualização de dados/gráficos)
- **React Query** (Gerenciamento de estado/server state)

### Backend
- **FastAPI** (Python 3.12+)
- **Pandas** e **NumPy** (Processamento de dados)

## Instalação e Execução

### Pré-requisitos
- Node.js (v18+)
- Python (v3.12+)

### 1. Configurar e Rodar o Backend API

O backend serve os dados processados e realiza agregações estatísticas.

```bash
# Instalar dependências (use um ambiente virtual se preferir)
pip3 install --user --break-system-packages -r fastapi-backend/requirements.txt

# Executar o servidor
python3 fastapi-backend/main.py
```

O backend estará rodando em `http://localhost:8000`.

### 2. Configurar e Rodar o Frontend

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento
npm run dev
```

O dashboard estará acessível em `http://localhost:8080` (ou porta similar indicada no terminal).

## Estrutura de Dados

Os dados são carregados a partir de arquivos CSV localizados em `public/data` e `fastapi-backend/data`, consolidados dinamicamente para oferecer performance na renderização de mapas e gráficos.

---
Contexto Acadêmico

Este sistema é resultado de um Trabalho de Conclusão de Curso que explora metodologias de análise descritiva aplicadas a dados educacionais públicos brasileiros. O foco está em caracterizar o estado atual e a evolução histórica dos indicadores, fornecendo subsídios para compreensão dos desafios educacionais do país através de visualizações interativas e métricas estatísticas descritivas.