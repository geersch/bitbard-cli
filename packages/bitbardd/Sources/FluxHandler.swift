import CoreGraphics
import Foundation

class FluxHandler {
    private var isEnabled = false

    func handle(action: String?) -> DaemonResponse {
        switch action {
        case "enable":
            enable()
            return .success("enabled")
        case "disable":
            disable()
            return .success("disabled")
        case "toggle":
            if isEnabled {
                disable()
                return .success("disabled")
            } else {
                enable()
                return .success("enabled")
            }
        case "status":
            return .success(isEnabled ? "enabled" : "disabled")
        default:
            return .failure("flux: unknown action '\(action ?? "nil")'. Use enable, disable, toggle, or status.")
        }
    }

    // MARK: - Private

    private func enable() {
        guard !isEnabled else { return }
        var displayCount: UInt32 = 0
        CGGetActiveDisplayList(0, nil, &displayCount)
        var displayIDs = [CGDirectDisplayID](repeating: 0, count: Int(displayCount))
        CGGetActiveDisplayList(displayCount, &displayIDs, &displayCount)

        for displayID in displayIDs {
            let cap = Int(CGDisplayGammaTableCapacity(displayID))
            var redTable   = [CGGammaValue](repeating: 0, count: cap)
            var greenTable = [CGGammaValue](repeating: 0, count: cap)
            var blueTable  = [CGGammaValue](repeating: 0, count: cap)

            for i in 0..<cap {
                let v = CGGammaValue(i) / CGGammaValue(cap - 1)
                redTable[i]   = v * 1.0
                greenTable[i] = v * 0.76902770996094
                blueTable[i]  = v * 0.5240478515625
            }
            CGSetDisplayTransferByTable(displayID, UInt32(cap), &redTable, &greenTable, &blueTable)
        }
        isEnabled = true
    }

    private func disable() {
        CGDisplayRestoreColorSyncSettings()
        isEnabled = false
    }
}
