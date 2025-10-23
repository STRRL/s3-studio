# S3 Studio

> **Multi-cloud file browser powered by Apache OpenDAL and WebAssembly**

A pure frontend application for browsing and managing files across AWS S3, Azure Blob Storage, Google Cloud Storage, and 50+ storage services.

## 🎯 Features

- **🌐 Multi-Cloud Support**: Works with 59+ storage services via OpenDAL
- **🚀 Pure Frontend**: No backend required - deploy as static site
- **⚡ WASM Performance**: Near-native speed with Rust/WebAssembly
- **🔒 Secure**: Your credentials stay in your browser
- **📱 Progressive Web App**: Works offline, installable on desktop/mobile
- **🎨 Modern UI**: Built with Next.js 16, React 19, and Tailwind CSS 4

## 📦 Monorepo Structure

```
s3-studio/
├── apps/
│   └── s3-studio/          # Next.js web application
├── packages/
│   └── opendal-wasm/       # WASM bindings for OpenDAL
├── docs/                   # Documentation
├── ai-docs/                # Feasibility reports
└── turbo.json              # Turborepo config
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Rust** >= 1.70.0
- **wasm-pack** (install: `curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh`)

### Installation

```bash
git clone https://github.com/your-org/s3-studio.git
cd s3-studio

pnpm install

pnpm build:wasm

pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🏗️ Development

```bash
pnpm dev              # Start all dev servers
pnpm build            # Build all packages
pnpm build:wasm       # Build WASM only
pnpm lint             # Lint all packages
```

## 📚 Documentation

- **[Feasibility Report](./ai-docs/opendal-s3-studio.md)** - Technical analysis
- **[WASM Package](./packages/opendal-wasm/README.md)** - OpenDAL bindings

## 📄 License

Apache-2.0

---

**Built with ❤️ using Rust, WebAssembly, and React**
