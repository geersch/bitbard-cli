import Foundation

class LockHandler {
    func handle() -> DaemonResponse {
        guard let bundleURL = URL(string: "file:///System/Library/PrivateFrameworks/login.framework"),
              let bundle = Bundle(url: bundleURL)
        else {
            return .failure("lock: failed to locate login.framework")
        }
        bundle.load()

        guard let cfBundle = CFBundleCreate(kCFAllocatorDefault, bundleURL as CFURL),
              let sym = CFBundleGetFunctionPointerForName(cfBundle, "SACLockScreenImmediate" as CFString)
        else {
            return .failure("lock: SACLockScreenImmediate not found in login.framework")
        }

        typealias SACLockScreenImmediateFn = @convention(c) () -> Void
        let lockScreen = unsafeBitCast(sym, to: SACLockScreenImmediateFn.self)
        lockScreen()
        return .success("ok")
    }
}
