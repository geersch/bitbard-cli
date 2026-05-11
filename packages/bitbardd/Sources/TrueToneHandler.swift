import Darwin
import Foundation
import ObjectiveC

class TrueToneHandler {
    private var client: NSObject?
    private var getEnabled: ((AnyObject, Selector) -> Bool)?
    private var setEnabled: ((AnyObject, Selector, Bool) -> Void)?
    private let enabledSel = NSSelectorFromString("enabled")
    private let setEnabledSel = NSSelectorFromString("setEnabled:")

    private func loadClient() -> String? {
        let frameworkPath = "/System/Library/PrivateFrameworks/CoreBrightness.framework/CoreBrightness"
        guard dlopen(frameworkPath, RTLD_NOW) != nil else {
            return "Failed to load CoreBrightness: \(String(cString: dlerror()))"
        }
        guard let cls = NSClassFromString("CBTrueToneClient") as? NSObject.Type else {
            return "CBTrueToneClient not found — this macOS version may not support True Tone via this API"
        }
        let c = cls.init()
        guard c.responds(to: enabledSel),
              let imp = class_getMethodImplementation(cls, enabledSel) else {
            return "'enabled' selector not found on CBTrueToneClient"
        }
        typealias BoolGetter = @convention(c) (AnyObject, Selector) -> Bool
        getEnabled = unsafeBitCast(imp, to: BoolGetter.self)

        guard c.responds(to: setEnabledSel),
              let setImp = class_getMethodImplementation(cls, setEnabledSel) else {
            return "'setEnabled:' selector not found on CBTrueToneClient"
        }
        typealias BoolSetter = @convention(c) (AnyObject, Selector, Bool) -> Void
        setEnabled = unsafeBitCast(setImp, to: BoolSetter.self)

        client = c
        return nil
    }

    func handle(action: String?) -> DaemonResponse {
        if client == nil {
            if let err = loadClient() {
                return .failure(err)
            }
        }
        guard let c = client else { return .failure("truetone: client unavailable") }

        switch action {
        case "status":
            let on = getEnabled!(c, enabledSel)
            return .success(on ? "enabled" : "disabled")
        case "toggle":
            let current = getEnabled!(c, enabledSel)
            setEnabled!(c, setEnabledSel, !current)
            return .success(!current ? "enabled" : "disabled")
        default:
            return .failure("truetone: unknown action '\(action ?? "nil")'. Use status or toggle.")
        }
    }
}
