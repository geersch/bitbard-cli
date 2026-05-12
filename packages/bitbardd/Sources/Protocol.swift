import Foundation

// MARK: - Request

struct FluxRequest: Codable {
    let action: String  // "enable" | "disable" | "toggle" | "status"
}

struct TrueToneRequest: Codable {
    let action: String  // "toggle" | "status"
}

struct LockRequest: Codable {}  // empty — produces {"lock":{}} on the wire

struct AlertRequest: Codable {
    let message: String
    let duration: Double?
}

struct AudioDeviceRequest: Codable {
    let action: String      // "defaultInput" | "defaultOutput" | "mute" | "unmute"
    let deviceId: UInt32?   // present for "mute" / "unmute"
}

/// Swift enum `Codable` synthesis wraps associated values under `_0`, producing
/// `{"flux":{"_0":{"action":"toggle"}}}` — not what we want.
/// We hand-write `encode(to:)` and `init(from:)` to produce the flat nested format:
/// `{"flux":{"action":"toggle"}}`, `{"lock":{}}`, etc.
enum DaemonRequest {
    case flux(FluxRequest)
    case truetone(TrueToneRequest)
    case lock(LockRequest)
    case alert(AlertRequest)
    case audiodevice(AudioDeviceRequest)
}

extension DaemonRequest: Encodable {
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .flux(let r):        try container.encode(r, forKey: .flux)
        case .truetone(let r):    try container.encode(r, forKey: .truetone)
        case .lock(let r):        try container.encode(r, forKey: .lock)
        case .alert(let r):       try container.encode(r, forKey: .alert)
        case .audiodevice(let r): try container.encode(r, forKey: .audiodevice)
        }
    }

    private enum CodingKeys: String, CodingKey {
        case flux, truetone, lock, alert, audiodevice
    }
}

extension DaemonRequest: Decodable {
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        if let r = try? container.decode(FluxRequest.self, forKey: .flux) {
            self = .flux(r)
        } else if let r = try? container.decode(TrueToneRequest.self, forKey: .truetone) {
            self = .truetone(r)
        } else if let r = try? container.decode(LockRequest.self, forKey: .lock) {
            self = .lock(r)
        } else if let r = try? container.decode(AlertRequest.self, forKey: .alert) {
            self = .alert(r)
        } else if let r = try? container.decode(AudioDeviceRequest.self, forKey: .audiodevice) {
            self = .audiodevice(r)
        } else {
            throw DecodingError.dataCorruptedError(
                forKey: .flux,
                in: container,
                debugDescription: "DaemonRequest: unrecognised command"
            )
        }
    }

    private enum CodingKeys: String, CodingKey {
        case flux, truetone, lock, alert, audiodevice
    }
}

// MARK: - Response

struct DaemonResponse: Codable {
    let ok: Bool
    let result: AnyCodable?  // wraps String or object; nil on error
    let error: String?

    static func success(_ result: String) -> DaemonResponse {
        DaemonResponse(ok: true, result: AnyCodable(result), error: nil)
    }

    static func successData<T: Encodable>(_ data: T, encoder: JSONEncoder = JSONEncoder()) -> DaemonResponse {
        let coded = try? AnyCodable(encoding: data, encoder: encoder)
        return DaemonResponse(ok: true, result: coded, error: nil)
    }

    static func failure(_ error: String) -> DaemonResponse {
        DaemonResponse(ok: false, result: nil, error: error)
    }
}
