# Keep all classes in our module
-keep class expo.modules.clipboardaccessibility.** { *; }
-keepclassmembers class expo.modules.clipboardaccessibility.** { *; }

# Keep the service classes specifically
-keep public class expo.modules.clipboardaccessibility.ClipboardAccessibilityService { *; }
-keep public class expo.modules.clipboardaccessibility.FloatingClipButtonService { *; }
-keep public class expo.modules.clipboardaccessibility.ClipboardAccessibilityModule { *; }
