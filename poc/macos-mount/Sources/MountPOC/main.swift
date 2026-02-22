import Foundation

let seed: [String: Data] = [
    "docs/readme.txt": Data("hello from mock s3".utf8),
    "logs/": Data()
]

let pipeline = MountPipeline(store: MockObjectStoreClient(seed: seed))

do {
    print("[POC] Listing root objects")
    let entries = try pipeline.listRoot()
    for entry in entries {
        print("- \(entry.path) (dir=\(entry.isDirectory), size=\(entry.size))")
    }

    print("\n[POC] Reading docs/readme.txt")
    let data = try pipeline.readFile("docs/readme.txt")
    print(String(decoding: data, as: UTF8.self))

    print("\n[POC] Writing docs/notes.txt")
    try pipeline.writeFile("docs/notes.txt", Data("write path OK".utf8))
    let notes = try pipeline.readFile("docs/notes.txt")
    print(String(decoding: notes, as: UTF8.self))

    print("\n[POC] Completed")
} catch {
    fputs("POC failed: \(error)\n", stderr)
    exit(1)
}
