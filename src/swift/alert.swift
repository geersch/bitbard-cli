import AppKit
import SwiftUI

// Usage: screen-alert <message> [duration]
//   message  - text to display
//   duration - seconds to show (default 2.0)

let args = CommandLine.arguments

guard args.count >= 2 else {
    fputs("Usage: screen-alert <message> [duration]\n", stderr)
    exit(1)
}

let alertMessage = args[1]
let alertDuration = args.count >= 3 ? (Double(args[2]) ?? 2.0) : 2.0

// MARK: - Style constants (mirrors hs.alert.defaultStyle)

// Variable names intentionally avoid SwiftUI modifier names (e.g. "cornerRadius")
private let pillRadius: CGFloat     = 27
private let pillFillColor           = NSColor(white: 0, alpha: 0.75)
private let pillStrokeColor         = NSColor(white: 1, alpha: 1)
private let pillStrokeWidth: CGFloat = 2
private let pillTextSize: CGFloat   = 27
private let pillFadeIn              = 0.15
private let pillFadeOut             = 0.15

// MARK: - Alert view

struct AlertView: View {
    let message: String

    var body: some View {
        Text(message)
            .font(.system(size: pillTextSize))
            .foregroundColor(.white)
            .padding(.horizontal, pillTextSize)
            .padding(.vertical, pillTextSize / 2)
            .background {
                RoundedRectangle(cornerRadius: pillRadius, style: .continuous)
                    .fill(Color(nsColor: pillFillColor))
                    .overlay {
                        RoundedRectangle(cornerRadius: pillRadius, style: .continuous)
                            .stroke(Color(nsColor: pillStrokeColor), lineWidth: pillStrokeWidth)
                    }
            }
    }
}

// MARK: - App delegate

class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow?

    func applicationDidFinishLaunching(_ notification: Notification) {
        guard let screen = NSScreen.main else { exit(0) }

        let hosting = NSHostingView(rootView: AlertView(message: alertMessage))
        hosting.translatesAutoresizingMaskIntoConstraints = false

        // Size to fit content
        let idealSize = hosting.fittingSize

        // Position: horizontally centred, slight vertical offset above centre
        // (mirrors hs.alert default placement)
        let screenFrame = screen.frame
        let x = screenFrame.midX - idealSize.width / 2
        let y = screenFrame.midY - idealSize.height / 2 + screenFrame.height * 0.05

        let windowRect = NSRect(x: x, y: y, width: idealSize.width, height: idealSize.height)

        let win = NSWindow(
            contentRect: windowRect,
            styleMask: .borderless,
            backing: .buffered,
            defer: false
        )
        win.isOpaque = false
        win.backgroundColor = .clear
        win.level = .floating
        win.ignoresMouseEvents = true
        win.collectionBehavior = [.canJoinAllSpaces, .stationary, .fullScreenAuxiliary]
        win.hasShadow = false

        hosting.frame = NSRect(origin: .zero, size: idealSize)
        win.contentView = hosting

        self.window = win

        // Fade in
        win.alphaValue = 0
        win.orderFront(nil)
        NSAnimationContext.runAnimationGroup { ctx in
            ctx.duration = pillFadeIn
            win.animator().alphaValue = 1
        }

        // Schedule fade-out then quit
        DispatchQueue.main.asyncAfter(deadline: .now() + alertDuration) {
            NSAnimationContext.runAnimationGroup({ ctx in
                ctx.duration = pillFadeOut
                win.animator().alphaValue = 0
            }, completionHandler: {
                NSApp.terminate(nil)
            })
        }
    }
}

// MARK: - Run

let delegate = AppDelegate()
let app = NSApplication.shared
app.setActivationPolicy(.accessory)  // no Dock icon, no menu bar
app.delegate = delegate
app.run()
