import CoreGraphics
import Foundation

// Usage: tint-helper enable | disable
//
// When enabling: applies warm gamma table and sleeps indefinitely (run as background process).
// When disabling: restores color sync settings.

let args = CommandLine.arguments
guard args.count == 2, args[1] == "enable" || args[1] == "disable" else {
    fputs("Usage: tint-helper enable|disable\n", stderr)
    exit(1)
}

if args[1] == "disable" {
    CGDisplayRestoreColorSyncSettings()
    exit(0)
}

// enable: enumerate all active displays, apply warm gamma table to each, and hold it
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

// Stay alive to hold the gamma table
dispatchMain()
