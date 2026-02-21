# BOR-455 · S3 Mount POC (OpenDAL Swift + FSKit)

This folder contains a practical scaffold for the macOS mount track.

## Scope

This POC provides:

1. A minimal Swift package to model the mount pipeline (`list/read/write` flow)
2. A mock object-store adapter and a bridge surface for future FSKit integration
3. A concrete implementation plan for moving from scaffold -> runnable Finder mount

This POC does **not** yet perform a real Finder mount. It focuses on de-risking architecture and interfaces before full FSKit implementation.

## Structure

```text
poc/macos-mount/
├─ Package.swift
├─ README.md
└─ Sources/
   └─ MountPOC/
      ├─ main.swift
      └─ pipeline.swift
```

## Run

```bash
cd poc/macos-mount
swift run MountPOC
```

Expected output includes:
- directory listing
- file read sample
- write/update confirmation

## Verified vs Pending

### Verified in this POC
- Mount pipeline interfaces are defined and executable in Swift
- Adapter contract for object store access is stable (`list/read/write`)
- Placeholder FS bridge can be called from entrypoint

### Pending for full BOR-455 DoD
- Real FSKit extension target and mount lifecycle hooks
- OpenDAL Swift binding integration in place of mock adapter
- Finder-visible mounted volume
- Validation on real S3 bucket operations in mounted path

## Next Steps

1. Replace `MockObjectStoreClient` with `OpenDALObjectStoreClient`
2. Add FSKit extension target (`FileProvider` / FS lifecycle handlers)
3. Wire node/path callbacks to adapter operations
4. Validate browse/read/write from Finder on a test bucket
5. Capture perf/stability metrics in Linear ticket notes
