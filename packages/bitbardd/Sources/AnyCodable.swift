import Foundation

/// A type-erased `Codable` wrapper for arbitrary JSON-compatible values.
/// Supported types: `nil`, `Bool`, `Int`, `Double`, `String`,
/// `[AnyCodable]`, `[String: AnyCodable]`.
struct AnyCodable: Codable {
    let value: Any?

    init(_ value: Any?) {
        self.value = value
    }

    /// Encode an `Encodable` value into an `AnyCodable` tree via JSONSerialization.
    /// encode → Data → JSONSerialization.jsonObject → recursive AnyCodable tree
    init<T: Encodable>(encoding value: T, encoder: JSONEncoder = JSONEncoder()) throws {
        let data = try encoder.encode(value)
        let obj = try JSONSerialization.jsonObject(with: data, options: [])
        self.value = AnyCodable.fromFoundation(obj)
    }

    /// Recursively convert a Foundation JSON object into an AnyCodable-compatible value.
    private static func fromFoundation(_ obj: Any) -> Any? {
        switch obj {
        case let dict as [String: Any]:
            return dict.mapValues { AnyCodable(fromFoundation($0)) }
        case let arr as [Any]:
            return arr.map { AnyCodable(fromFoundation($0)) }
        case let num as NSNumber:
            // CFBooleanGetTypeID distinguishes NSNumber-wrapping-bool from numeric NSNumber
            if CFGetTypeID(num) == CFBooleanGetTypeID() {
                return num.boolValue
            } else if num === kCFBooleanTrue || num === kCFBooleanFalse {
                return num.boolValue
            } else {
                // Prefer Int if it round-trips, else Double
                let d = num.doubleValue
                let i = num.intValue
                return Double(i) == d ? i : d
            }
        case let str as String:
            return str
        case is NSNull:
            return nil
        default:
            return nil
        }
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            value = nil
        } else if let b = try? container.decode(Bool.self) {
            value = b
        } else if let i = try? container.decode(Int.self) {
            value = i
        } else if let d = try? container.decode(Double.self) {
            value = d
        } else if let s = try? container.decode(String.self) {
            value = s
        } else if let arr = try? container.decode([AnyCodable].self) {
            value = arr
        } else if let dict = try? container.decode([String: AnyCodable].self) {
            value = dict
        } else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "AnyCodable: unsupported JSON value"
            )
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch value {
        case nil:
            try container.encodeNil()
        case let b as Bool:
            try container.encode(b)
        case let i as Int:
            try container.encode(i)
        case let d as Double:
            try container.encode(d)
        case let s as String:
            try container.encode(s)
        case let arr as [AnyCodable]:
            try container.encode(arr)
        case let dict as [String: AnyCodable]:
            try container.encode(dict)
        default:
            throw EncodingError.invalidValue(
                value as Any,
                .init(codingPath: encoder.codingPath,
                      debugDescription: "AnyCodable: unsupported value type \(type(of: value as Any))")
            )
        }
    }
}
