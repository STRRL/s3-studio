# S3 Studio Setup Guide

This guide will help you set up the S3 Studio monorepo for development.

## Prerequisites

### Required

1. **Node.js** >= 20.0.0
   ```bash
   node --version
   ```

2. **pnpm** >= 9.0.0
   ```bash
   npm install -g pnpm
   pnpm --version
   ```

3. **Rust** >= 1.70.0
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup --version
   ```

4. **wasm-pack**
   ```bash
   curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
   wasm-pack --version
   ```

### Optional (for optimization)

5. **wasm-opt** (part of binaryen)
   ```bash
   brew install binaryen
   wasm-opt --version
   ```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-org/s3-studio.git
cd s3-studio
```

### 2. Install dependencies

```bash
pnpm install
```

This will install dependencies for:
- Root workspace
- `apps/s3-studio` (Next.js app)
- `packages/opendal-wasm` (WASM package)

### 3. Build WASM package

```bash
pnpm build:wasm
```

This compiles the Rust code to WebAssembly and generates TypeScript bindings.

**Output**: `packages/opendal-wasm/pkg/`

### 4. Start development server

```bash
pnpm dev
```

This starts:
- Next.js dev server at http://localhost:3000
- Hot reload for both frontend and WASM (after rebuild)

## Project Structure

```
s3-studio/
├── apps/
│   └── s3-studio/              # Next.js application
│       ├── app/                # App router pages
│       │   ├── layout.tsx      # Root layout
│       │   ├── page.tsx        # Home page
│       │   └── globals.css     # Global styles
│       ├── components/         # React components (TBD)
│       ├── lib/                # Utilities (TBD)
│       ├── package.json
│       ├── next.config.ts
│       ├── tsconfig.json
│       └── tailwind.config.ts
│
├── packages/
│   └── opendal-wasm/           # WASM bindings
│       ├── src/
│       │   └── lib.rs          # Rust source
│       ├── pkg/                # Built WASM (gitignored)
│       ├── Cargo.toml          # Rust dependencies
│       ├── package.json
│       └── README.md
│
├── docs/                       # Documentation
├── ai-docs/                    # Research & feasibility
│   └── opendal-s3-studio.md    # Technical feasibility report
│
├── pnpm-workspace.yaml         # Workspace config
├── turbo.json                  # Turborepo config
├── package.json                # Root package.json
└── README.md
```

## Development Workflow

### Building

```bash
pnpm build              # Build all packages
pnpm build:wasm         # Build WASM only
```

### Development

```bash
pnpm dev                # Start all dev servers
```

### Linting

```bash
pnpm lint               # Lint all packages
```

### Cleaning

```bash
pnpm clean              # Remove build artifacts
```

## WASM Development

### Rebuilding WASM after Rust changes

```bash
cd packages/opendal-wasm
pnpm build
```

### Running WASM tests

```bash
cd packages/opendal-wasm
pnpm test
```

This runs tests in headless Chrome browser.

### WASM optimization

The release build is already optimized with:
- `opt-level = "z"` (optimize for size)
- `lto = true` (link-time optimization)
- `strip = true` (strip debug symbols)
- `wasm-opt -Oz` (additional optimization)

Expected size: ~150-250KB (compressed)

## Next.js Development

### Creating new pages

```bash
cd apps/s3-studio
mkdir app/explorer
touch app/explorer/page.tsx
```

### Adding components

```bash
cd apps/s3-studio
npx shadcn@latest add button
```

This uses the configured `components.json` to add shadcn/ui components.

### Importing WASM in Next.js

```typescript
'use client'

import { useEffect, useState } from 'react';
import init, { S3Client } from '@s3-studio/opendal-wasm';

export function FileExplorer() {
  const [client, setClient] = useState<S3Client | null>(null);

  useEffect(() => {
    async function loadWasm() {
      await init();
      const s3 = new S3Client(
        accessKeyId,
        secretAccessKey,
        'us-east-1',
        'my-bucket',
        null
      );
      setClient(s3);
    }
    loadWasm();
  }, []);

  return <div>File Explorer</div>;
}
```

## Troubleshooting

### WASM build fails

**Error**: `wasm-pack: command not found`

**Solution**:
```bash
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

### TypeScript can't find WASM types

**Error**: `Cannot find module '@s3-studio/opendal-wasm'`

**Solution**:
```bash
pnpm build:wasm
pnpm install
```

### Next.js can't import WASM

**Error**: `Module parse failed: magic header not detected`

**Solution**: Make sure you're using `'use client'` directive and importing in a client component.

### Monorepo dependency issues

**Error**: `Package '@s3-studio/opendal-wasm' not found`

**Solution**:
```bash
rm -rf node_modules
pnpm install
pnpm build:wasm
```

### Rust compilation errors

**Error**: `error: linker 'cc' not found`

**Solution** (macOS):
```bash
xcode-select --install
```

**Solution** (Linux):
```bash
sudo apt-get install build-essential
```

## Environment Variables

Create `.env.local` in `apps/s3-studio/`:

```bash
# Not needed for development
# Credentials are entered by users in the UI
```

## Testing

### WASM tests

```bash
cd packages/opendal-wasm
pnpm test
```

### E2E tests (TBD)

```bash
cd apps/s3-studio
pnpm test:e2e
```

## Deployment

### Building for production

```bash
pnpm build
```

This builds:
1. WASM package (optimized)
2. Next.js static export

### Deploy to Vercel

```bash
cd apps/s3-studio
vercel --prod
```

### Deploy to Netlify

```bash
cd apps/s3-studio
netlify deploy --prod
```

## IDE Setup

### VS Code

Recommended extensions:
- Rust Analyzer
- Tailwind CSS IntelliSense
- ESLint
- Prettier

Install:
```bash
code --install-extension rust-lang.rust-analyzer
code --install-extension bradlc.vscode-tailwindcss
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
```

### VS Code Settings

`.vscode/settings.json`:
```json
{
  "rust-analyzer.linkedProjects": [
    "packages/opendal-wasm/Cargo.toml"
  ],
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Next Steps

1. ✅ Set up development environment
2. ⬜ Build credential configuration UI
3. ⬜ Implement file listing
4. ⬜ Add file upload/download
5. ⬜ Create file management operations

## Resources

- [OpenDAL Documentation](https://opendal.apache.org/)
- [wasm-bindgen Guide](https://rustwasm.github.io/wasm-bindgen/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)

## Support

- **Issues**: [GitHub Issues](https://github.com/your-org/s3-studio/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/s3-studio/discussions)
