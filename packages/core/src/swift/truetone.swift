import Darwin
import Foundation
import ObjectiveC

// Usage: truetone status | toggle
//
// Uses CBTrueToneClient from the CoreBrightness private framework to read
// and toggle the macOS True Tone setting.
//
// NOTE: CoreBrightness.framework and CBTrueToneClient are private Apple APIs.
// They may change or disappear across macOS versions.

let frameworkPath = "/System/Library/PrivateFrameworks/CoreBrightness.framework/CoreBrightness"
guard dlopen(frameworkPath, RTLD_NOW) != nil else {
    let reason = String(cString: dlerror())
    fputs("Failed to load CoreBrightness: \(reason)\n", stderr)
    exit(1)
}

guard let cls = NSClassFromString("CBTrueToneClient") as? NSObject.Type else {
    fputs("CBTrueToneClient not found — this macOS version may not support True Tone via this API\n", stderr)
    exit(1)
}

let client = cls.init()

let enabledSel = NSSelectorFromString("enabled")
guard client.responds(to: enabledSel),
      let enabledIMP = class_getMethodImplementation(cls, enabledSel) else {
    fputs("'enabled' selector not found on CBTrueToneClient\n", stderr)
    exit(1)
}
typealias BoolGetter = @convention(c) (AnyObject, Selector) -> Bool
let getEnabled = unsafeBitCast(enabledIMP, to: BoolGetter.self)

let setEnabledSel = NSSelectorFromString("setEnabled:")
guard client.responds(to: setEnabledSel),
      let setEnabledIMP = class_getMethodImplementation(cls, setEnabledSel) else {
    fputs("'setEnabled:' selector not found on CBTrueToneClient\n", stderr)
    exit(1)
}
typealias BoolSetter = @convention(c) (AnyObject, Selector, Bool) -> Void
let setEnabled = unsafeBitCast(setEnabledIMP, to: BoolSetter.self)

let args = CommandLine.arguments
guard args.count == 2 else {
    fputs("Usage: truetone status|toggle\n", stderr)
    exit(1)
}

switch args[1] {
case "status":
    print(getEnabled(client, enabledSel) ? "enabled" : "disabled")
case "toggle":
    let current = getEnabled(client, enabledSel)
    setEnabled(client, setEnabledSel, !current)
    print(!current ? "enabled" : "disabled")
default:
    fputs("Usage: truetone status|toggle\n", stderr)
    exit(1)
}
