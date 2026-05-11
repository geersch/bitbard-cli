import AppKit
import SwiftUI

// MARK: - Style constants (mirrors alert.swift)

private let pillRadius: CGFloat      = 27
private let pillFillColor            = NSColor(white: 0, alpha: 0.75)
private let pillStrokeColor          = NSColor(white: 1, alpha: 1)
private let pillStrokeWidth: CGFloat = 2
private let pillTextSize: CGFloat    = 27
private let pillFadeIn               = 0.15
private let pillFadeOut              = 0.15

// MARK: - Alert view

private struct AlertView: View {
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

// MARK: - Handler

class AlertHandler {
    // Keep strong references to active windows so they are not deallocated early.
    private var activeWindows: [NSWindow] = []

    func handle(message: String, duration: Double) -> DaemonResponse {
        guard let screen = NSScreen.main else {
            return .failure("alert: no main screen available")
        }

        let hosting = NSHostingView(rootView: AlertView(message: message))
        hosting.translatesAutoresizingMaskIntoConstraints = false
        let idealSize = hosting.fittingSize

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
                win.close()
                self?.activeWindows.removeAll { $0 === win }
            })
        }

        return .success("ok")
    }
}
