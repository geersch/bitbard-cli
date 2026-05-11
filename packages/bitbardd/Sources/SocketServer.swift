import Foundation

class SocketServer {
    private let flux = FluxHandler()
    private let truetone = TrueToneHandler()
    private let lock = LockHandler()
    private let alert = AlertHandler()

    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    func start(at path: String) {
        removeStaleSocket(at: path)

        let serverFd = socket(AF_UNIX, SOCK_STREAM, 0)
        guard serverFd >= 0 else {
            fputs("bitbardd: socket() failed: \(String(cString: strerror(errno)))\n", stderr)
            exit(1)
        }

        var addr = sockaddr_un()
        addr.sun_family = sa_family_t(AF_UNIX)
        // sun_path is 104 bytes on macOS
        withUnsafeMutablePointer(to: &addr.sun_path) { ptr in
            ptr.withMemoryRebound(to: CChar.self, capacity: 104) { chars in
                _ = strlcpy(chars, path, 104)
            }
        }

        let bindResult = withUnsafePointer(to: &addr) {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                bind(serverFd, $0, socklen_t(MemoryLayout<sockaddr_un>.size))
            }
        }
        guard bindResult == 0 else {
            fputs("bitbardd: bind() failed: \(String(cString: strerror(errno)))\n", stderr)
            exit(1)
        }

        guard listen(serverFd, 16) == 0 else {
            fputs("bitbardd: listen() failed: \(String(cString: strerror(errno)))\n", stderr)
            exit(1)
        }

        DispatchQueue.global(qos: .default).async {
            while true {
                let clientFd = accept(serverFd, nil, nil)
                guard clientFd >= 0 else { continue }
                DispatchQueue.global(qos: .default).async {
                    self.handle(clientFd)
                }
            }
        }
    }

    // MARK: - Private

    private func removeStaleSocket(at path: String) {
        guard FileManager.default.fileExists(atPath: path) else { return }

        let testFd = socket(AF_UNIX, SOCK_STREAM, 0)
        var addr = sockaddr_un()
        addr.sun_family = sa_family_t(AF_UNIX)
        withUnsafeMutablePointer(to: &addr.sun_path) { ptr in
            ptr.withMemoryRebound(to: CChar.self, capacity: 104) { chars in
                _ = strlcpy(chars, path, 104)
            }
        }
        let connected = withUnsafePointer(to: &addr) {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                connect(testFd, $0, socklen_t(MemoryLayout<sockaddr_un>.size))
            }
        }
        close(testFd)

        if connected == 0 {
            // Another instance is running
            fputs("bitbardd: another instance is already running at \(path)\n", stderr)
            exit(0)
        }
        // Stale socket — remove it
        try? FileManager.default.removeItem(atPath: path)
    }

    private func handle(_ fd: Int32) {
        defer { close(fd) }

        // Read until newline
        var data = Data()
        var byte = UInt8(0)
        while recv(fd, &byte, 1, 0) == 1 {
            if byte == UInt8(ascii: "\n") { break }
            data.append(byte)
        }

        let response: DaemonResponse
        do {
            let request = try decoder.decode(DaemonRequest.self, from: data)
            response = dispatch(request)
        } catch {
            response = .failure("Failed to parse request: \(error)")
        }

        do {
            var responseData = try encoder.encode(response)
            responseData.append(UInt8(ascii: "\n"))
            _ = responseData.withUnsafeBytes { send(fd, $0.baseAddress!, responseData.count, 0) }
        } catch {
            fputs("bitbardd: failed to encode response: \(error)\n", stderr)
        }
    }

    private func dispatch(_ request: DaemonRequest) -> DaemonResponse {
        switch request.command {
        case .flux:
            return DispatchQueue.main.sync { flux.handle(action: request.action) }
        case .truetone:
            return DispatchQueue.main.sync { truetone.handle(action: request.action) }
        case .lock:
            return DispatchQueue.main.sync { lock.handle() }
        case .alert:
            let message = request.message ?? ""
            let duration = request.duration ?? 2.0
            return DispatchQueue.main.sync { alert.handle(message: message, duration: duration) }
        }
    }
}
