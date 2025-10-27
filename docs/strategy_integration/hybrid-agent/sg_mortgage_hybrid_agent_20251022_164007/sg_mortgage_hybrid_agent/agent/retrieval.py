import re, math
from collections import Counter
from pathlib import Path

def _tokenize(text):
    return [t.lower() for t in re.findall(r"[a-zA-Z0-9%\.]+", text)]

def _vectorize(tokens):
    c = Counter(tokens); n = sum(c.values()) or 1
    return {k:v/n for k,v in c.items()}

def _cos(a,b):
    keys = set(a.keys()) | set(b.keys())
    num = sum(a.get(k,0)*b.get(k,0) for k in keys)
    da = math.sqrt(sum((a.get(k,0))**2 for k in keys))
    db = math.sqrt(sum((b.get(k,0))**2 for k in keys))
    if da==0 or db==0: return 0.0
    return num/(da*db)

def load_kb(kb_dir):
    docs = []
    p = Path(kb_dir)
    for fp in p.glob("*.md"):
        text = fp.read_text(encoding="utf-8")
        words = text.split()
        cur=[]; size=0; chunks=[]
        for w in words:
            cur.append(w); size += len(w)+1
            if size>1200:
                chunks.append(" ".join(cur)); cur=[]; size=0
        if cur: chunks.append(" ".join(cur))
        for i,ch in enumerate(chunks):
            docs.append({"id": f"{fp.stem}#{i}", "text": ch})
    return docs

class Retriever:
    def __init__(self, kb_dir):
        self.docs = load_kb(kb_dir)
        self.vecs = [_vectorize(_tokenize(d["text"])) for d in self.docs]
    def search(self, query, k=4):
        qv = _vectorize(_tokenize(query))
        scored = [(i, _cos(qv, v)) for i,v in enumerate(self.vecs)]
        scored.sort(key=lambda x:x[1], reverse=True)
        return [ {**self.docs[i], "score":s} for i,s in scored[:k] ]
