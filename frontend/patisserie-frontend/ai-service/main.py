# ai-service/main.py
import os, math
from datetime import datetime, timezone
from typing import List, Optional, Dict

import numpy as np
import pandas as pd
import requests

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

# --------- Config ---------
BACKEND_BASE = os.getenv("BACKEND_BASE", "http://localhost:8084/inesk/api")
DATA_DIR     = os.getenv("DATA_DIR", "./data")
MODEL_NAME   = os.getenv("MODEL_NAME", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
K_DEFAULT    = int(os.getenv("K_DEFAULT", "6"))
TAU_DAYS     = float(os.getenv("TAU_DAYS", "14"))  # décroissance temporelle

EVENT_WEIGHTS = {"view": 0.3, "add_to_cart": 0.7, "purchase": 1.5}
PRODUCTS_CSV  = os.path.join(DATA_DIR, "products.csv")
EVENTS_CSV    = os.path.join(DATA_DIR, "events.csv")
os.makedirs(DATA_DIR, exist_ok=True)

# --------- App ---------
app = FastAPI(title="Patiss IA", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"], allow_credentials=True)

# --------- Modèle + Index (NumPy) ---------
model = SentenceTransformer(MODEL_NAME)
df_products = pd.DataFrame()
emb_matrix: np.ndarray = np.zeros((0, 768), dtype="float32")
id_to_row: Dict[int, int] = {}

# --------- Utils ---------
def now_iso(): 
    return datetime.now(timezone.utc).isoformat()

def normalize(X: np.ndarray) -> np.ndarray:
    if X.ndim == 1:
        X = X.reshape(1, -1)
    n = np.linalg.norm(X, axis=1, keepdims=True) + 1e-12
    return (X / n).astype("float32")

def ensure_events_csv():
    if not os.path.exists(EVENTS_CSV):
        pd.DataFrame(columns=["ts","userId","productId","event"]).to_csv(EVENTS_CSV, index=False)

def load_products_from_backend() -> Optional[pd.DataFrame]:
    try:
        r = requests.get(f"{BACKEND_BASE}/products", timeout=10)
        r.raise_for_status()
        data = r.json()
        if not isinstance(data, list):
            return None
        df = pd.DataFrame(data)
        need = ["id","name","category","description","price","stock","imageUrl"]
        for c in need:
            if c not in df.columns:
                df[c] = ""
        return df[need]
    except Exception as e:
        print("[WARN] backend products:", e)
        return None

def load_products_df() -> pd.DataFrame:
    df = load_products_from_backend()
    if df is not None and len(df):
        df.to_csv(PRODUCTS_CSV, index=False)
        return df
    if os.path.exists(PRODUCTS_CSV):
        return pd.read_csv(PRODUCTS_CSV)
    return pd.DataFrame(columns=["id","name","category","description","price","stock","imageUrl"])

def build_texts(df: pd.DataFrame) -> List[str]:
    return (df["name"].fillna("") + " | " + df["category"].fillna("") + " | " + df["description"].fillna("")).tolist()

def rebuild_index():
    """Construit l'embedding du catalogue (cosine via produit scalaire)."""
    global df_products, emb_matrix, id_to_row
    df_products = load_products_df().drop_duplicates(subset=["id"]).reset_index(drop=True)
    if df_products.empty:
        emb_matrix = np.zeros((0, 768), dtype="float32")
        id_to_row = {}
        print("[INFO] index empty.")
        return

    texts = build_texts(df_products)
    # normalisés => produit scalaire = cosinus
    emb = model.encode(texts, normalize_embeddings=True, show_progress_bar=False).astype("float32")
    emb_matrix = emb
    id_to_row = {int(df_products.iloc[i]["id"]): i for i in range(len(df_products))}
    print(f"[INFO] index built with {len(df_products)} products.")

def ids_to_vecs(ids: List[int]) -> np.ndarray:
    if emb_matrix.size == 0:
        return np.zeros((0, 768), dtype="float32")
    rows = [id_to_row[i] for i in ids if i in id_to_row]
    return emb_matrix[rows] if rows else np.zeros((0, emb_matrix.shape[1]), dtype="float32")

def _search_numpy(vec: np.ndarray, k: int, exclude: Optional[set]=None):
    """Retourne top-k via produit scalaire sur embeddings normalisés."""
    if emb_matrix.size == 0:
        return []
    if vec.ndim == 1:
        vec = vec.reshape(1, -1)
    vec = normalize(vec)
    sims = (emb_matrix @ vec.T).ravel()  # (n,)
    order = np.argsort(-sims)            # top desc

    out = []
    seen = set()
    for j in order:
        pid = int(df_products.iloc[j]["id"])
        if exclude and pid in exclude:
            continue
        if pid in seen:
            continue
        seen.add(pid)
        out.append({"productId": pid, "score": float(sims[j])})
        if len(out) >= k:
            break
    return out

def user_profile(user_id: int) -> Optional[np.ndarray]:
    ensure_events_csv()
    df = pd.read_csv(EVENTS_CSV)
    df = df[df["userId"]==user_id]
    if df.empty:
        return None

    now = datetime.now(timezone.utc)
    parts=[]
    for _,r in df.iterrows():
        pid = int(r["productId"])
        ev  = str(r["event"]).lower().strip()
        base = EVENT_WEIGHTS.get(ev, 0.2)
        try:
            ts = datetime.fromisoformat(str(r["ts"]))
        except Exception:
            continue
        dt_days = max(0.0, (now - ts).total_seconds()/86400.0)
        w = base * math.exp(-dt_days/TAU_DAYS)
        if pid in id_to_row:
            parts.append((w, emb_matrix[id_to_row[pid]]))
    if not parts:
        return None
    v = np.sum([w*v for w,v in parts], axis=0)
    if np.linalg.norm(v) < 1e-9:
        return None
    return normalize(v)

def top_pop(k:int) -> List[int]:
    ensure_events_csv()
    df = pd.read_csv(EVENTS_CSV)
    if df.empty:
        return df_products["id"].astype(int).head(k).tolist()
    counts = (df.groupby("productId")["event"].count()
              .sort_values(ascending=False).index.astype(int).tolist())
    return counts[:k]

# --------- Schemas ---------
class TrackEvent(BaseModel):
    userId: int
    productId: int
    event: str
    ts: Optional[str] = None

class RecommendBody(BaseModel):
    history: Optional[List[str]] = None
    k: Optional[int] = None
    userId: Optional[int] = None

# --------- API ---------
@app.on_event("startup")
def _startup():
    rebuild_index()
    ensure_events_csv()
    print("[READY] IA service started.")

@app.get("/health")
def health():
    return {"status":"ok","products":int(len(df_products))}

@app.post("/reload")
def reload_catalog():
    rebuild_index()
    return {"status":"reloaded","products":int(len(df_products))}

@app.get("/search")
def search(q: str = Query(...), k: int = K_DEFAULT):
    if not len(df_products):
        return {"items":[]}
    qv = model.encode([q], normalize_embeddings=True)
    recs = _search_numpy(qv, k)
    pids = [r["productId"] for r in recs]
    items = df_products[df_products["id"].astype(int).isin(pids)].to_dict(orient="records")
    return {"items": items}

@app.get("/similar")
def similar(product_id: int, k: int = K_DEFAULT):
    if product_id not in id_to_row or emb_matrix.size == 0:
        return {"items":[]}
    vec = emb_matrix[id_to_row[product_id]]
    recs = _search_numpy(vec, k, exclude={product_id})
    pids = [r["productId"] for r in recs]
    items = df_products[df_products["id"].astype(int).isin(pids)].to_dict(orient="records")
    return {"items": items}

@app.post("/track")
def track(ev: TrackEvent):
    ensure_events_csv()
    row = {
        "ts": ev.ts or now_iso(),
        "userId": int(ev.userId),
        "productId": int(ev.productId),
        "event": ev.event.lower().strip()
    }
    pd.DataFrame([row]).to_csv(EVENTS_CSV, mode="a", header=not os.path.exists(EVENTS_CSV), index=False)
    return {"status":"logged"}

@app.post("/recommend")
def recommend(body: RecommendBody):
    k = body.k or K_DEFAULT
    profile = None
    if body.userId is not None:
        profile = user_profile(int(body.userId))
    if profile is None and body.history:
        ids=[]
        for s in body.history:
            try:
                ids.append(int(s))
            except:
                pass
        V = ids_to_vecs(ids)
        if len(V):
            profile = normalize(np.mean(V, axis=0))
    if profile is None:
        return {"items":[{"productId": int(pid), "score": 0.0} for pid in top_pop(k)]}
    return {"items": _search_numpy(profile, k)}
