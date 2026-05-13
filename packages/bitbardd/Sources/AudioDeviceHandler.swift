import CoreAudio
import Foundation

class AudioDeviceHandler {
    private let encoder = JSONEncoder()

    func handle(request: AudioDeviceRequest) -> DaemonResponse {
        switch request.action {
        case "defaultInput":
            return defaultDevice(selector: kAudioHardwarePropertyDefaultInputDevice)
        case "defaultOutput":
            return defaultDevice(selector: kAudioHardwarePropertyDefaultOutputDevice)
        case "mute":
            guard let deviceId = request.deviceId else {
                return .failure("audiodevice: mute requires deviceId")
            }
            return setMute(deviceId: deviceId, muted: true)
        case "unmute":
            guard let deviceId = request.deviceId else {
                return .failure("audiodevice: unmute requires deviceId")
            }
            return setMute(deviceId: deviceId, muted: false)
        default:
            return .failure("audiodevice: unknown action '\(request.action)'")
        }
    }

    // MARK: - Private

    private func defaultDevice(selector: AudioObjectPropertySelector) -> DaemonResponse {
        var propertyAddress = AudioObjectPropertyAddress(
            mSelector: selector,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var deviceId: AudioDeviceID = kAudioObjectUnknown
        var size = UInt32(MemoryLayout<AudioDeviceID>.size)

        let status = AudioObjectGetPropertyData(
            AudioObjectID(kAudioObjectSystemObject),
            &propertyAddress,
            0, nil,
            &size, &deviceId
        )
        guard status == noErr, deviceId != kAudioObjectUnknown else {
            let label = selector == kAudioHardwarePropertyDefaultInputDevice ? "input" : "output"
            return .failure("audiodevice: no default \(label) device")
        }

        guard let name = deviceName(deviceId) else {
            return .failure("audiodevice: could not read device name")
        }

        let isInput = hasStreams(deviceId: deviceId, scope: kAudioObjectPropertyScopeInput)
        let isOutput = hasStreams(deviceId: deviceId, scope: kAudioObjectPropertyScopeOutput)
        let scope: AudioObjectPropertyScope = isInput
            ? kAudioObjectPropertyScopeInput
            : kAudioObjectPropertyScopeOutput

        let data = AudioDeviceData(
            id: deviceId,
            name: name,
            isInput: isInput,
            isOutput: isOutput,
            isMuted: isMuted(deviceId: deviceId, scope: scope)
        )
        return .successData(data, encoder: encoder)
    }

    private func deviceName(_ deviceId: AudioDeviceID) -> String? {
        var address = AudioObjectPropertyAddress(
            mSelector: kAudioObjectPropertyName,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        // CFString is a reference type; use Unmanaged<CFString>? so CoreAudio writes
        // a CFStringRef into a pointer-sized slot and ARC is handled via takeRetainedValue().
        var nameRef: Unmanaged<CFString>? = nil
        var size = UInt32(MemoryLayout<Unmanaged<CFString>?>.size)
        let status = AudioObjectGetPropertyData(deviceId, &address, 0, nil, &size, &nameRef)
        guard status == noErr, let nameRef else { return nil }
        return nameRef.takeRetainedValue() as String
    }

    private func hasStreams(deviceId: AudioDeviceID, scope: AudioObjectPropertyScope) -> Bool {
        var address = AudioObjectPropertyAddress(
            mSelector: kAudioDevicePropertyStreams,
            mScope: scope,
            mElement: kAudioObjectPropertyElementMain
        )
        var size: UInt32 = 0
        let status = AudioObjectGetPropertyDataSize(deviceId, &address, 0, nil, &size)
        return status == noErr && size > 0
    }

    private func isMuted(deviceId: AudioDeviceID, scope: AudioObjectPropertyScope) -> Bool {
        var address = AudioObjectPropertyAddress(
            mSelector: kAudioDevicePropertyMute,
            mScope: scope,
            mElement: kAudioObjectPropertyElementMain
        )
        var muteValue: UInt32 = 0
        var size = UInt32(MemoryLayout<UInt32>.size)
        let status = AudioObjectGetPropertyData(deviceId, &address, 0, nil, &size, &muteValue)
        return status == noErr && muteValue != 0
    }

    private func setMute(deviceId: AudioDeviceID, muted: Bool) -> DaemonResponse {
        var muteValue: UInt32 = muted ? 1 : 0
        let size = UInt32(MemoryLayout<UInt32>.size)
        var errors: [String] = []

        let scopes: [(AudioObjectPropertyScope, String)] = [
            (kAudioObjectPropertyScopeInput, "input"),
            (kAudioObjectPropertyScopeOutput, "output"),
        ]

        for (scope, label) in scopes {
            guard hasStreams(deviceId: deviceId, scope: scope) else { continue }
            var address = AudioObjectPropertyAddress(
                mSelector: kAudioDevicePropertyMute,
                mScope: scope,
                mElement: kAudioObjectPropertyElementMain
            )
            // Check mute is settable for this scope
            var isSettable: DarwinBoolean = false
            AudioObjectIsPropertySettable(deviceId, &address, &isSettable)
            guard isSettable.boolValue else { continue }

            let status = AudioObjectSetPropertyData(deviceId, &address, 0, nil, size, &muteValue)
            if status != noErr {
                errors.append("audiodevice: failed to set mute on \(label) scope (err \(status))")
            }
        }

        if errors.isEmpty {
            return .success("ok")
        }
        return .failure(errors.joined(separator: "; "))
    }
}

// MARK: - Data model

struct AudioDeviceData: Codable {
    let id: UInt32
    let name: String
    let isInput: Bool
    let isOutput: Bool
    let isMuted: Bool
}
