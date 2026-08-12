import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Upload, Download, Trash2, Image as ImageIcon, Sparkles, Zap,
  ShieldCheck, SlidersHorizontal, CheckCircle2, AlertCircle
} from "lucide-react";
import "./styles.css";

const formats = ["jpeg", "png", "webp", "tiff"];

function App() {
  const [files, setFiles] = useState([]);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState("webp");
  const [optimizing, setOptimizing] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const addFiles = (selected) => {
    const valid = [...selected].filter(f => f.type.startsWith("image/"));
    setError(valid.length !== selected.length ? "Only image files are supported." : "");
    setFiles(prev => [...prev, ...valid].slice(0, 10));
    setResults([]);
  };

  const optimize = async () => {
    if (!files.length) return;
    setOptimizing(true);
    setError("");
    setResults([]);
    try {
      const form = new FormData();
      files.forEach(f => form.append("images", f));
      form.append("quality", quality);
      form.append("format", format);

      const res = await fetch("/api/optimize", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Optimization failed.");
      setResults(data.results);
    } catch (e) {
      setError(e.message);
    } finally {
      setOptimizing(false);
    }
  };

  const downloadAll = async () => {
    for (const item of results) {
      const a = document.createElement("a");
      a.href = item.dataUrl;
      a.download = item.filename;
      a.click();
      await new Promise(r => setTimeout(r, 120));
    }
  };

  const totalOriginal = results.reduce((s, r) => s + r.originalSize, 0);
  const totalOptimized = results.reduce((s, r) => s + r.optimizedSize, 0);
  const saved = totalOriginal ? Math.max(0, Math.round((1 - totalOptimized / totalOriginal) * 100)) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="logo"><Zap size={20} /></div>
            <span className="font-bold text-lg">Image Optimizer</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
            <ShieldCheck size={16} /> Fast • Private • Quality-focused
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-12">
        <section className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-300/20 text-cyan-300 text-xs font-semibold mb-5">
            <Sparkles size={14} /> Smart image compression
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Smaller images.<br />
            <span className="gradient-text">Faster websites.</span>
          </h1>
          <p className="mt-5 text-slate-400 text-base sm:text-lg">
            Compress JPEG, PNG, WebP and TIFF images with control over quality and output format.
          </p>
        </section>

        <section className="grid lg:grid-cols-[1.4fr_.8fr] gap-6">
          <div>
            <label
              className="dropzone min-h-[330px] flex flex-col items-center justify-center text-center cursor-pointer"
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            >
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={e => addFiles(e.target.files)} />
              <div className="upload-icon"><Upload size={28} /></div>
              <h2 className="text-xl font-bold mt-5">Drop your images here</h2>
              <p className="text-slate-400 mt-2">or click to browse • up to 10 images</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {formats.map(x => <span key={x} className="format-pill">{x.toUpperCase()}</span>)}
              </div>
            </label>

            {files.length > 0 && (
              <div className="glass-card mt-5 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{files.length} image{files.length > 1 ? "s" : ""} selected</h3>
                  <button className="icon-button" onClick={() => {setFiles([]); setResults([])}} title="Clear">
                    <Trash2 size={17} />
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {files.map((f, i) => (
                    <div key={i} className="file-row">
                      <div className="flex items-center gap-3 min-w-0">
                        <ImageIcon size={17} className="text-cyan-300 shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </div>
                      <span className="text-slate-500 text-sm">{(f.size/1024).toFixed(0)} KB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="glass-card p-6 h-fit">
            <div className="flex items-center gap-2 mb-5">
              <SlidersHorizontal size={19} className="text-cyan-300" />
              <h2 className="font-bold">Compression settings</h2>
            </div>

            <label className="text-sm text-slate-300">Quality: <b className="text-white">{quality}%</b></label>
            <input type="range" min="10" max="100" value={quality}
              onChange={e => setQuality(+e.target.value)} className="range w-full mt-3" />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Smaller</span><span>Sharper</span>
            </div>

            <label className="block text-sm text-slate-300 mt-7 mb-2">Output format</label>
            <div className="grid grid-cols-2 gap-2">
              {formats.map(x => (
                <button key={x} onClick={() => setFormat(x)}
                  className={`format-option ${format === x ? "active" : ""}`}>
                  {x.toUpperCase()}
                </button>
              ))}
            </div>

            <button onClick={optimize} disabled={!files.length || optimizing}
              className="primary-btn w-full mt-7">
              {optimizing ? "Optimizing..." : <><Zap size={18} /> Optimize images</>}
            </button>

            <p className="text-xs text-slate-500 mt-4 text-center">
              Images are processed by the server and are not stored permanently.
            </p>
          </aside>
        </section>

        {error && (
          <div className="alert mt-6"><AlertCircle size={18} /> {error}</div>
        )}

        {results.length > 0 && (
          <section className="mt-10">
            <div className="glass-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                    <CheckCircle2 size={19} /> Optimization complete
                  </div>
                  <p className="text-slate-400 text-sm mt-1">
                    {results.length} file{results.length > 1 ? "s" : ""} optimized • saved {saved}%
                  </p>
                </div>
                <button onClick={downloadAll} className="secondary-btn">
                  <Download size={17} /> Download all
                </button>
              </div>

              <div className="stats mt-6">
                <div><span>Original</span><b>{(totalOriginal/1024).toFixed(1)} KB</b></div>
                <div><span>Optimized</span><b>{(totalOptimized/1024).toFixed(1)} KB</b></div>
                <div><span>Saved</span><b>{saved}%</b></div>
              </div>

              <div className="space-y-3 mt-6">
                {results.map((r, i) => (
                  <div className="result-row" key={i}>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.filename}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {(r.originalSize/1024).toFixed(0)} KB → {(r.optimizedSize/1024).toFixed(0)} KB
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="saved-badge">-{r.savedPercent}%</span>
                      <a href={r.dataUrl} download={r.filename} className="icon-button">
                        <Download size={17} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="grid sm:grid-cols-3 gap-4 mt-10">
          {[
            ["Lightning fast", "Sharp.js uses native image processing for high performance.", Zap],
            ["Quality control", "Adjust compression from smaller files to sharper output.", SlidersHorizontal],
            ["Developer friendly", "REST API architecture makes the optimizer easy to extend.", ShieldCheck]
          ].map(([title, text, Icon]) => (
            <div className="feature-card" key={title}>
              <Icon className="text-cyan-300" size={21} />
              <h3 className="font-bold mt-4">{title}</h3>
              <p className="text-sm text-slate-400 mt-2 leading-6">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-white/10 mt-16">
        <div className="max-w-6xl mx-auto px-5 py-8 text-center text-sm text-slate-500">
          Built with React, Node.js, Express.js, Sharp.js and Tailwind CSS.
        </div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
