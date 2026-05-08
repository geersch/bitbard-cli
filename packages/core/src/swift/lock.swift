import Foundation

// Locks the screen immediately using the private SACLockScreenImmediate API.
//
// NOTE: This relies on a private Apple framework. It may stop working
// in a future macOS release without warning.

guard let bundleURL = URL(string: "file:///System/Library/PrivateFrameworks/login.framework"),
      let bundle = Bundle(url: bundleURL)
else {
    fputs("lock: failed to locate login.framework\n", stderr)
    exit(1)
}

bundle.load()

typealias SACLockScreenImmediateFn = @convention(c) () -> Void

guard let cfBundle = CFBundleCreate(kCFAllocatorDefault, bundleURL as CFURL),
      let sym = CFBundleGetFunctionPointerForName(cfBundle, "SACLockScreenImmediate" as CFString)
else {
    fputs("lock: SACLockScreenImmediate not found in login.framework\n", stderr)
    exit(1)
}

let lockScreen = unsafeBitCast(sym, to: SACLockScreenImmediateFn.self)
lockScreen()
