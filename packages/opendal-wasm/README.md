# @s3-studio/opendal-wasm

WebAssembly bindings for Apache OpenDAL S3 operations.

## Features

- **Direct S3 Access**: Call S3 APIs directly from the browser
- **Apache OpenDAL**: Built on production-ready OpenDAL library
- **Type Safety**: Full TypeScript type definitions
- **Optimized**: Small bundle size with aggressive optimizations

## Installation

```bash
pnpm add @s3-studio/opendal-wasm
```

## Usage

```typescript
import init, { S3Client } from '@s3-studio/opendal-wasm';

async function main() {
  await init();

  const client = new S3Client(
    'YOUR_ACCESS_KEY_ID',
    'YOUR_SECRET_ACCESS_KEY',
    'us-east-1',
    'your-bucket-name',
    null
  );

  const files = await client.list('/');
  console.log('Files:', files);

  const content = await client.read('path/to/file.txt');
  console.log('Content:', new TextDecoder().decode(content));

  await client.write('path/to/new-file.txt', new TextEncoder().encode('Hello, World!'));

  await client.delete('path/to/file.txt');
}

main();
```

## API

### `S3Client`

#### Constructor

```typescript
new S3Client(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  bucket: string,
  endpoint?: string
)
```

#### Methods

- `list(path: string): Promise<FileEntry[]>` - List files and directories
- `read(path: string): Promise<Uint8Array>` - Read file contents
- `write(path: string, data: Uint8Array): Promise<void>` - Write file
- `delete(path: string): Promise<void>` - Delete file
- `stat(path: string): Promise<FileEntry>` - Get file metadata

### `FileEntry`

```typescript
interface FileEntry {
  path: string;
  name: string;
  size: number;
  is_dir: boolean;
  last_modified?: string;
}
```

## Building

```bash
pnpm build
```

## Testing

```bash
pnpm test
```

## License

Apache-2.0
