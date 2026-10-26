# Reproducible page board renderer

Run with the bundled Node runtime from the repository root:

```powershell
& 'C:\Users\Asus\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'docs/designs/pages/render-source/generate-pages.mjs'
```

Optional: pass `--limit 1` to render only the first target for a controlled sample. The source uses local NOVA assets only, disables capture animations, waits for document fonts, and renders desktop/mobile independently. Desktop and mobile full-page captures are stored under `targets/<target>/variants`; the named clean references show the first viewport. Required tablet frames are rendered separately.

Renderer: Playwright 156.0.4314.42; executable: Microsoft Edge at `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`; device scale: 1; font fallback: Tahoma (Peyda/Vazirmatn unavailable in checked environment). Asset rights remain UNKNOWN.
