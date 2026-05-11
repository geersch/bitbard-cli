import Foundation

// MARK: - Request

enum DaemonCommand: String, Codable {
    case flux
    case truetone
    case lock
    case alert
}

struct DaemonRequest: Codable {
    let command: DaemonCommand
    // flux / truetone
    let action: String?
    // alert
    let message: String?
    let duration: Double?
}

// MARK: - Response

struct DaemonResponse: Codable {
    let ok: Bool
    let result: String?
    let error: String?

    static func success(_ result: String) -> DaemonResponse {
        DaemonResponse(ok: true, result: result, error: nil)
    }

    static func failure(_ error: String) -> DaemonResponse {
        DaemonResponse(ok: false, result: nil, error: error)
    }
}
