from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import pandas as pd
import numpy as np
from pathlib import Path

app = FastAPI(
    title="API Indicadores Educacionais",
    description="API para análise de indicadores educacionais dos municípios brasileiros",
    version="2.0.0"
)

# CORS - Em produção, restrinja para seu domínio
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mapeamento de estados para regiões
REGIAO_MAP = {
    'AC': 'Norte', 'AP': 'Norte', 'AM': 'Norte', 'PA': 'Norte', 'RO': 'Norte', 'RR': 'Norte', 'TO': 'Norte',
    'AL': 'Nordeste', 'BA': 'Nordeste', 'CE': 'Nordeste', 'MA': 'Nordeste', 'PB': 'Nordeste',
    'PE': 'Nordeste', 'PI': 'Nordeste', 'RN': 'Nordeste', 'SE': 'Nordeste',
    'DF': 'Centro-Oeste', 'GO': 'Centro-Oeste', 'MT': 'Centro-Oeste', 'MS': 'Centro-Oeste',
    'ES': 'Sudeste', 'MG': 'Sudeste', 'RJ': 'Sudeste', 'SP': 'Sudeste',
    'PR': 'Sul', 'RS': 'Sul', 'SC': 'Sul'
}

ESTADOS_INFO = {
    'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia',
    'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás',
    'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais',
    'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná', 'PE': 'Pernambuco', 'PI': 'Piauí',
    'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte', 'RS': 'Rio Grande do Sul',
    'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina', 'SP': 'São Paulo',
    'SE': 'Sergipe', 'TO': 'Tocantins'
}

# Descrições dos indicadores
INDICADOR_DESCRICOES = {
    "tdi": {
        "nome": "Taxa de Distorção Idade-Série (TDI)",
        "descricao": "Percentual de alunos que têm idade superior à recomendada para a série que estão cursando. Uma TDI alta indica que muitos estudantes estão atrasados em relação à idade ideal para sua série, geralmente devido a reprovações ou entrada tardia no sistema escolar.",
        "unidade": "%",
        "anos_disponiveis": list(range(2006, 2025))
    },
    "aprovacao": {
        "nome": "Taxa de Aprovação",
        "descricao": "Percentual de alunos aprovados ao final do ano letivo em relação ao total de matrículas. Indica o sucesso dos estudantes em cumprir os requisitos mínimos para avançar à série seguinte.",
        "unidade": "%",
        "anos_disponiveis": list(range(2007, 2024))
    },
    "reprovacao": {
        "nome": "Taxa de Reprovação", 
        "descricao": "Percentual de alunos reprovados ao final do ano letivo. Reflete a proporção de estudantes que não atingiram os objetivos de aprendizagem ou frequência mínima exigida para aprovação.",
        "unidade": "%",
        "anos_disponiveis": list(range(2007, 2024))
    },
    "abandono": {
        "nome": "Taxa de Abandono",
        "descricao": "Percentual de alunos que deixaram de frequentar a escola durante o ano letivo sem formalizar transferência. O abandono escolar está associado a fatores socioeconômicos, trabalho infantil e falta de motivação.",
        "unidade": "%",
        "anos_disponiveis": list(range(2007, 2024))
    }
}

# Cache do DataFrame
_df_cache = None
_mun_info_cache = None


def parse_number(value) -> Optional[float]:
    """Converte string numérica brasileira para float"""
    if pd.isna(value) or value == '' or value is None:
        return None
    try:
        if isinstance(value, (int, float)):
            return float(value)
        # Formato brasileiro: vírgula como decimal
        return float(str(value).replace(',', '.'))
    except:
        return None


def load_municipios_info() -> dict:
    """Carrega informações de municípios (UF, nome, etc)"""
    global _mun_info_cache
    if _mun_info_cache is not None:
        return _mun_info_cache
    
    csv_path = Path(__file__).parent.parent / "public" / "data" / "municipios_indicadores.csv"
    
    try:
        df = pd.read_csv(csv_path, encoding='utf-8')
        _mun_info_cache = {}
        for _, row in df.iterrows():
            _mun_info_cache[row['CO_MUNICIPIO']] = {
                'NO_UF': row['NO_UF'],
                'SG_UF': row['SG_UF'],
                'NO_MUNICIPIO': row['NO_MUNICIPIO']
            }
        return _mun_info_cache
    except Exception as e:
        print(f"Erro ao carregar municípios: {e}")
        return {}


def load_data() -> pd.DataFrame:
    """Carrega e processa os dados do CSV"""
    global _df_cache
    if _df_cache is not None:
        return _df_cache
    
    csv_path = Path(__file__).parent / "data" / "municipios_indicadores.csv"
    
    # Ler CSV com separador ponto-e-vírgula
    df = pd.read_csv(csv_path, sep=';', encoding='utf-8')
    
    # Lista para armazenar dados transformados
    records = []
    
    for _, row in df.iterrows():
        co_municipio = row['CO_MUNICIPIO']
        
        # Processar TDI (2006-2024)
        for ano in range(2006, 2025):
            tdi_col = f'TDI_FUN {ano}'
            tdi_ai_col = f'TDI_FUN_AI {ano}'
            tdi_af_col = f'TDI_FUN_AF {ano}'
            
            if tdi_col in df.columns:
                tdi_val = parse_number(row.get(tdi_col))
                tdi_ai_val = parse_number(row.get(tdi_ai_col))
                tdi_af_val = parse_number(row.get(tdi_af_col))
                
                if tdi_val is not None:
                    records.append({
                        'co_municipio': co_municipio,
                        'ano': ano,
                        'indicador': 'tdi',
                        'valor': tdi_val,
                        'valor_ai': tdi_ai_val,
                        'valor_af': tdi_af_val
                    })
        
        # Processar Aprovação (2007-2023)
        for ano in range(2007, 2024):
            aprov_col = f'APROV_CAT_FUN {ano}'
            aprov_ai_col = f'APROV_CAT_FUN_AI {ano}'
            aprov_af_col = f'APROV_CAT_FUN_AF {ano}'
            
            if aprov_col in df.columns:
                val = parse_number(row.get(aprov_col))
                val_ai = parse_number(row.get(aprov_ai_col))
                val_af = parse_number(row.get(aprov_af_col))
                
                if val is not None:
                    records.append({
                        'co_municipio': co_municipio,
                        'ano': ano,
                        'indicador': 'aprovacao',
                        'valor': val,
                        'valor_ai': val_ai,
                        'valor_af': val_af
                    })
        
        # Processar Reprovação (2007-2023)
        for ano in range(2007, 2024):
            repro_col = f'REPRO_CAT_FUN {ano}'
            repro_ai_col = f'REPRO_CAT_FUN_AI {ano}'
            repro_af_col = f'REPRO_CAT_FUN_AF {ano}'
            
            if repro_col in df.columns:
                val = parse_number(row.get(repro_col))
                val_ai = parse_number(row.get(repro_ai_col))
                val_af = parse_number(row.get(repro_af_col))
                
                if val is not None:
                    records.append({
                        'co_municipio': co_municipio,
                        'ano': ano,
                        'indicador': 'reprovacao',
                        'valor': val,
                        'valor_ai': val_ai,
                        'valor_af': val_af
                    })
        
        # Processar Abandono (2007-2023)
        for ano in range(2007, 2024):
            aband_col = f'ABAND_CAT_FUN {ano}'
            aband_ai_col = f'ABAND_CAT_FUN_AI {ano}'
            aband_af_col = f'ABAND_CAT_FUN_AF {ano}'
            
            if aband_col in df.columns:
                val = parse_number(row.get(aband_col))
                val_ai = parse_number(row.get(aband_ai_col))
                val_af = parse_number(row.get(aband_af_col))
                
                if val is not None:
                    records.append({
                        'co_municipio': co_municipio,
                        'ano': ano,
                        'indicador': 'abandono',
                        'valor': val,
                        'valor_ai': val_ai,
                        'valor_af': val_af
                    })
    
    # Criar DataFrame transformado
    _df_cache = pd.DataFrame(records)
    
    return _df_cache


def filter_data(
    df: pd.DataFrame,
    regiao: Optional[str] = None,
    estados: Optional[List[str]] = None,
    ano_inicio: Optional[int] = None,
    ano_fim: Optional[int] = None,
    indicador: Optional[str] = None
) -> pd.DataFrame:
    """Aplica filtros aos dados"""
    result = df.copy()
    
    # Carregar info de municípios
    mun_info = load_municipios_info()
    
    if indicador:
        result = result[result['indicador'] == indicador]
    
    if ano_inicio:
        result = result[result['ano'] >= ano_inicio]
    
    if ano_fim:
        result = result[result['ano'] <= ano_fim]
    
    if estados:
        # Filtrar por estados usando info de municípios
        valid_municipios = [
            co for co, info in mun_info.items() 
            if info.get('SG_UF') in estados
        ]
        result = result[result['co_municipio'].isin(valid_municipios)]
    elif regiao:
        # Filtrar por região
        estados_regiao = [uf for uf, reg in REGIAO_MAP.items() if reg == regiao]
        valid_municipios = [
            co for co, info in mun_info.items() 
            if info.get('SG_UF') in estados_regiao
        ]
        result = result[result['co_municipio'].isin(valid_municipios)]
    
    return result


# ==================== ENDPOINTS ====================

@app.get("/")
def root():
    """Informações da API"""
    return {
        "nome": "API Indicadores Educacionais",
        "versao": "2.0.0",
        "descricao": "API para análise de indicadores educacionais dos municípios brasileiros",
        "indicadores": list(INDICADOR_DESCRICOES.keys()),
        "endpoints": [
            "/api/indicadores - Lista indicadores disponíveis com descrições",
            "/api/anos - Anos disponíveis por indicador",
            "/api/metricas - Métricas agregadas (média, max, min)",
            "/api/tendencia - Dados para gráficos de tendência",
            "/api/comparacao - Dados para gráficos de comparação",
            "/api/dados - Dados brutos filtrados",
            "/api/regioes - Lista de regiões",
            "/api/estados - Lista de estados"
        ]
    }


@app.get("/api/indicadores")
def get_indicadores():
    """Retorna lista de indicadores com descrições detalhadas"""
    return {
        "indicadores": [
            {
                "id": key,
                "nome": val["nome"],
                "descricao": val["descricao"],
                "unidade": val["unidade"],
                "anos_disponiveis": {
                    "inicio": min(val["anos_disponiveis"]),
                    "fim": max(val["anos_disponiveis"])
                }
            }
            for key, val in INDICADOR_DESCRICOES.items()
        ]
    }


@app.get("/api/anos")
def get_anos(indicador: Optional[str] = None):
    """Retorna range de anos disponíveis"""
    if indicador and indicador in INDICADOR_DESCRICOES:
        anos = INDICADOR_DESCRICOES[indicador]["anos_disponiveis"]
        return {"inicio": min(anos), "fim": max(anos), "anos": anos}
    
    # Anos gerais
    return {
        "tdi": {"inicio": 2006, "fim": 2024},
        "aprovacao": {"inicio": 2007, "fim": 2023},
        "reprovacao": {"inicio": 2007, "fim": 2023},
        "abandono": {"inicio": 2007, "fim": 2023}
    }


@app.get("/api/regioes")
def get_regioes():
    """Lista de regiões brasileiras"""
    return {"regioes": list(set(REGIAO_MAP.values()))}


@app.get("/api/estados")
def get_estados(regiao: Optional[str] = None):
    """Lista de estados, opcionalmente filtrados por região"""
    if regiao:
        estados = [
            {"sigla": uf, "nome": ESTADOS_INFO[uf], "regiao": reg}
            for uf, reg in REGIAO_MAP.items()
            if reg == regiao
        ]
    else:
        estados = [
            {"sigla": uf, "nome": ESTADOS_INFO[uf], "regiao": REGIAO_MAP[uf]}
            for uf in sorted(ESTADOS_INFO.keys())
        ]
    return {"estados": estados}


@app.get("/api/metricas")
def get_metricas(
    indicador: str = Query(default="tdi", description="Indicador: tdi, aprovacao, reprovacao, abandono"),
    regiao: Optional[str] = None,
    estados: Optional[str] = None,
    ano_inicio: Optional[int] = None,
    ano_fim: Optional[int] = None
):
    """Retorna métricas agregadas para análise"""
    df = load_data()
    estados_list = estados.split(',') if estados else None
    
    filtered = filter_data(df, regiao, estados_list, ano_inicio, ano_fim, indicador)
    
    if filtered.empty:
        return {
            "total_registros": 0,
            "total_municipios": 0,
            "media": None,
            "maximo": None,
            "minimo": None,
            "indicador": indicador,
            "info": INDICADOR_DESCRICOES.get(indicador, {})
        }
    
    return {
        "total_registros": len(filtered),
        "total_municipios": int(filtered['co_municipio'].nunique()),
        "media": round(float(filtered['valor'].mean()), 2),
        "maximo": round(float(filtered['valor'].max()), 2),
        "minimo": round(float(filtered['valor'].min()), 2),
        "desvio_padrao": round(float(filtered['valor'].std()), 2),
        "indicador": indicador,
        "info": INDICADOR_DESCRICOES.get(indicador, {})
    }


@app.get("/api/tendencia")
def get_tendencia(
    indicador: str = Query(default="tdi"),
    regiao: Optional[str] = None,
    estados: Optional[str] = None,
    ano_inicio: Optional[int] = None,
    ano_fim: Optional[int] = None,
    agrupar_por: str = Query(default="none", description="none, estado, regiao")
):
    """Retorna dados agregados por ano para gráficos de tendência"""
    df = load_data()
    estados_list = estados.split(',') if estados else None
    
    filtered = filter_data(df, regiao, estados_list, ano_inicio, ano_fim, indicador)
    
    if filtered.empty:
        return {"dados": {}, "tendencias": {}}
    
    mun_info = load_municipios_info()
    
    # Adicionar UF aos dados
    filtered = filtered.copy()
    filtered['uf'] = filtered['co_municipio'].map(
        lambda x: mun_info.get(x, {}).get('SG_UF', 'XX')
    )
    filtered['regiao'] = filtered['uf'].map(lambda x: REGIAO_MAP.get(x, 'Desconhecido'))
    
    result = {}
    
    if agrupar_por == 'estado':
        for uf in filtered['uf'].unique():
            uf_data = filtered[filtered['uf'] == uf]
            agg = uf_data.groupby('ano')['valor'].mean().reset_index()
            result[uf] = [
                {"ano": int(r['ano']), "valor": round(float(r['valor']), 2)}
                for _, r in agg.iterrows()
            ]
    elif agrupar_por == 'regiao':
        for reg in filtered['regiao'].unique():
            reg_data = filtered[filtered['regiao'] == reg]
            agg = reg_data.groupby('ano')['valor'].mean().reset_index()
            result[reg] = [
                {"ano": int(r['ano']), "valor": round(float(r['valor']), 2)}
                for _, r in agg.iterrows()
            ]
    else:
        agg = filtered.groupby('ano')['valor'].mean().reset_index()
        result['Brasil'] = [
            {"ano": int(r['ano']), "valor": round(float(r['valor']), 2)}
            for _, r in agg.iterrows()
        ]
    
    # Calcular tendência linear para cada série
    tendencias = {}
    for key, dados in result.items():
        if len(dados) >= 2:
            x = np.array([d['ano'] for d in dados])
            y = np.array([d['valor'] for d in dados])
            
            # Regressão linear
            n = len(x)
            sum_x = np.sum(x)
            sum_y = np.sum(y)
            sum_xy = np.sum(x * y)
            sum_x2 = np.sum(x ** 2)
            
            slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x ** 2)
            intercept = (sum_y - slope * sum_x) / n
            
            # Valores previstos
            y_pred = slope * x + intercept
            
            # R² e RMSE
            ss_res = np.sum((y - y_pred) ** 2)
            ss_tot = np.sum((y - np.mean(y)) ** 2)
            r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
            rmse = np.sqrt(np.mean((y - y_pred) ** 2))
            
            tendencias[key] = {
                "coeficiente": round(float(slope), 4),
                "intercepto": round(float(intercept), 2),
                "r2": round(float(r2), 4),
                "rmse": round(float(rmse), 4),
                "direcao": "decrescente" if slope < 0 else "crescente",
                "linha_tendencia": [
                    {"ano": int(ano), "valor": round(float(val), 2)}
                    for ano, val in zip(x, y_pred)
                ]
            }
    
    return {
        "dados": result,
        "tendencias": tendencias,
        "indicador": indicador,
        "info": INDICADOR_DESCRICOES.get(indicador, {})
    }


@app.get("/api/comparacao")
def get_comparacao(
    indicador: str = Query(default="tdi"),
    estados: Optional[str] = None,
    regiao: Optional[str] = None,
    ano_inicio: Optional[int] = None,
    ano_fim: Optional[int] = None,
    agrupar_por: str = Query(default="estado", description="estado ou regiao")
):
    """Retorna dados para comparação entre grupos"""
    df = load_data()
    estados_list = estados.split(',') if estados else None
    
    filtered = filter_data(df, regiao, estados_list, ano_inicio, ano_fim, indicador)
    
    if filtered.empty:
        return {"dados": []}
    
    mun_info = load_municipios_info()
    
    filtered = filtered.copy()
    filtered['uf'] = filtered['co_municipio'].map(
        lambda x: mun_info.get(x, {}).get('SG_UF', 'XX')
    )
    filtered['regiao'] = filtered['uf'].map(lambda x: REGIAO_MAP.get(x, 'Desconhecido'))
    
    group_col = 'uf' if agrupar_por == 'estado' else 'regiao'
    
    result = []
    for grupo in filtered[group_col].unique():
        grupo_data = filtered[filtered[group_col] == grupo]
        
        result.append({
            "grupo": grupo,
            "nome": ESTADOS_INFO.get(grupo, grupo) if agrupar_por == 'estado' else grupo,
            "media": round(float(grupo_data['valor'].mean()), 2),
            "maximo": round(float(grupo_data['valor'].max()), 2),
            "minimo": round(float(grupo_data['valor'].min()), 2),
            "total_registros": len(grupo_data),
            "total_municipios": int(grupo_data['co_municipio'].nunique())
        })
    
    # Ordenar por média
    result.sort(key=lambda x: x['media'], reverse=True)
    
    return {
        "dados": result,
        "indicador": indicador,
        "info": INDICADOR_DESCRICOES.get(indicador, {})
    }


@app.get("/api/dados")
def get_dados(
    indicador: str = Query(default="tdi"),
    regiao: Optional[str] = None,
    estados: Optional[str] = None,
    ano_inicio: Optional[int] = None,
    ano_fim: Optional[int] = None,
    limite: int = Query(default=1000, le=10000)
):
    """Retorna dados brutos filtrados"""
    df = load_data()
    estados_list = estados.split(',') if estados else None
    
    filtered = filter_data(df, regiao, estados_list, ano_inicio, ano_fim, indicador)
    
    mun_info = load_municipios_info()
    
    records = []
    for _, row in filtered.head(limite).iterrows():
        co = row['co_municipio']
        info = mun_info.get(co, {})
        records.append({
            "co_municipio": co,
            "municipio": info.get('NO_MUNICIPIO', 'Desconhecido'),
            "uf": info.get('SG_UF', 'XX'),
            "estado": info.get('NO_UF', 'Desconhecido'),
            "ano": int(row['ano']),
            "valor": round(float(row['valor']), 2),
            "valor_ai": round(float(row['valor_ai']), 2) if pd.notna(row['valor_ai']) else None,
            "valor_af": round(float(row['valor_af']), 2) if pd.notna(row['valor_af']) else None
        })
    
    return {
        "dados": records,
        "total": len(filtered),
        "limite": limite,
        "indicador": indicador
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
