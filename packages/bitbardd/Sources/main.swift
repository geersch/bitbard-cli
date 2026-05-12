import AppKit
import Foundation

// Ignore SIGPIPE so a client closing the connection mid-send (e.g. the stale-socket
// liveness probe in a second instance) doesn't kill the daemon.
signal(SIGPIPE, SIG_IGN)

let socketPath: String = {
    let dataDir = (ProcessInfo.processInfo.environment["BITBARD_DATA_DIR"]
        ?? (NSHomeDirectory() + "/.local/share/bitbard"))
    // Ensure the directory exists before the socket server tries to bind
    try? FileManager.default.createDirectory(atPath: dataDir,
                                             withIntermediateDirectories: true)
    return dataDir + "/bitbardd.sock"
}()

let app = NSApplication.shared
app.setActivationPolicy(.accessory)

let server = SocketServer()
server.start(at: socketPath)

print("bitbardd: listening at \(socketPath)")
app.run()
