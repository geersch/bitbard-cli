import AppKit

// MARK: - Style constants

private let pillRadius: CGFloat      = 27
private let pillFillAlpha: CGFloat   = 0.75
private let pillPaddingH: CGFloat    = 27
private let pillPaddingV: CGFloat    = 13
private let pillTextSize: CGFloat    = 27
private let pillFadeIn               = 0.15
private let pillFadeOut              = 0.15

// MARK: - Pill view
//
// Pure AppKit, no SwiftUI.
//
// NSHostingView and NSHostingController both register SwiftUI attribute-graph
// objects in the Objective-C autorelease pool. When a second alert is shown
// before the first window closes, the pool accumulates stale back-pointers into
// the first view's already-deallocated SwiftUI graph. When NSApp.run() drains
// the pool between run-loop cycles, objc_release dereferences a dangling
// pointer → EXC_BAD_ACCESS / SIGSEGV. Using plain AppKit drawing avoids the
// autorelease pool entirely and is simpler for a static pill label.

private class PillView: NSView {
    private let label: NSTextField

    init(message: String) {
        label = NSTextField(labelWithString: message)
        label.font = NSFont.systemFont(ofSize: pillTextSize, weight: .regular)
        label.textColor = .white
        label.backgroundColor = .clear
        label.isBezeled = false
        label.isEditable = false
        label.sizeToFit()

        let size = NSSize(
            width:  label.frame.width  + pillPaddingH * 2,
            height: label.frame.height + pillPaddingV * 2
        )
        super.init(frame: NSRect(origin: .zero, size: size))
        wantsLayer = true

        label.frame = NSRect(
            x: pillPaddingH,
            y: pillPaddingV,
            width: label.frame.width,
            height: label.frame.height
        )
        addSubview(label)
    }

    required init?(coder: NSCoder) { fatalError() }

    override func layout() {
        super.layout()
        guard let layer else { return }
        layer.backgroundColor = NSColor(white: 0, alpha: pillFillAlpha).cgColor
        layer.cornerRadius    = pillRadius
        layer.borderColor     = NSColor.white.cgColor
        layer.borderWidth     = 2
    }
}

// MARK: - Handler

class AlertHandler {
    // Strong references keep windows alive until their fade-out completes.
    private var activeWindows: [NSWindow] = []

    @discardableResult
    func handle(message: String, duration: Double) -> DaemonResponse {
        guard let screen = NSScreen.main else {
            return .failure("alert: no main screen available")
        }

        let pill = PillView(message: message)
        let size = pill.frame.size

        let screenFrame = screen.frame
        let x = screenFrame.midX - size.width  / 2
        let y = screenFrame.midY - size.height / 2 + screenFrame.height * 0.05

        let win = NSWindow(
            contentRect: NSRect(x: x, y: y, width: size.width, height: size.height),
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
        win.contentView = pill

        activeWindows.append(win)
        win.alphaValue = 0
        win.orderFront(nil)

        NSAnimationContext.runAnimationGroup { ctx in
            ctx.duration = pillFadeIn
            win.animator().alphaValue = 1
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + duration) { [weak self, weak win] in
            guard let win else { return }
            NSAnimationContext.runAnimationGroup({ ctx in
                ctx.duration = pillFadeOut
                win.animator().alphaValue = 0
            }, completionHandler: { [weak self, weak win] in
                guard let win else { return }
                win.orderOut(nil)
                self?.activeWindows.removeAll { $0 === win }
            })
        }

        return .success("ok")
    }
}
