import Foundation

public struct ObjectEntry: Equatable {
    public let path: String
    public let isDirectory: Bool
    public let size: Int
}

public protocol ObjectStoreClient {
    func list(prefix: String) throws -> [ObjectEntry]
    func read(path: String) throws -> Data
    func write(path: String, data: Data) throws
}

public final class MockObjectStoreClient: ObjectStoreClient {
    private var objects: [String: Data]

    public init(seed: [String: Data] = [:]) {
        self.objects = seed
    }

    public func list(prefix: String) throws -> [ObjectEntry] {
        let normalized = prefix == "/" ? "" : prefix
        return objects
            .keys
            .filter { $0.hasPrefix(normalized) }
            .sorted()
            .map { key in
                ObjectEntry(path: key, isDirectory: key.hasSuffix("/"), size: objects[key]?.count ?? 0)
            }
    }

    public func read(path: String) throws -> Data {
        let key = path.hasPrefix("/") ? String(path.dropFirst()) : path
        guard let data = objects[key] else {
            throw NSError(domain: "MountPOC", code: 404, userInfo: [NSLocalizedDescriptionKey: "Object not found: \(path)"])
        }
        return data
    }

    public func write(path: String, data: Data) throws {
        let key = path.hasPrefix("/") ? String(path.dropFirst()) : path
        objects[key] = data
    }
}

/// Bridge surface reserved for FSKit callback wiring.
/// In full implementation, FSKit handlers should delegate to this bridge.
public final class MountPipeline {
    private let store: ObjectStoreClient

    public init(store: ObjectStoreClient) {
        self.store = store
    }

    public func listRoot() throws -> [ObjectEntry] {
        try store.list(prefix: "")
    }

    public func readFile(_ path: String) throws -> Data {
        try store.read(path: path)
    }

    public func writeFile(_ path: String, _ data: Data) throws {
        try store.write(path: path, data: data)
    }
}
