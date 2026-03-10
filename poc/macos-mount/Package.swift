// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "mount-poc",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(name: "MountPOC", targets: ["MountPOC"])
    ],
    targets: [
        .executableTarget(
            name: "MountPOC",
            path: "Sources/MountPOC"
        )
    ]
)
