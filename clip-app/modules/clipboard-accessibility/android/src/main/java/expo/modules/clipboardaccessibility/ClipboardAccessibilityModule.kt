package expo.modules.clipboardaccessibility

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.text.TextUtils
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ClipboardAccessibilityModule : Module() {
    private val context: Context
        get() = appContext.reactContext ?: throw IllegalStateException("React context is not available")

    override fun definition() = ModuleDefinition {
        Name("ClipboardAccessibility")

        Events("onClipboardChange")

        Function("isServiceEnabled") {
            isAccessibilityServiceEnabled()
        }

        Function("openAccessibilitySettings") {
            openAccessibilitySettings()
        }

        // Check if overlay permission is granted
        Function("isOverlayPermissionGranted") {
            isOverlayPermissionGranted()
        }

        // Open overlay permission settings
        Function("openOverlaySettings") {
            openOverlaySettings()
        }

        // Get floating button position (0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right)
        Function("getFloatingButtonPosition") {
            FloatingClipButtonService.getButtonPosition(context)
        }

        // Set floating button position
        Function("setFloatingButtonPosition") { position: Int ->
            FloatingClipButtonService.setButtonPosition(context, position)
        }

        // Get any clips that were captured while app was in background
        Function("getPendingClips") {
            val pendingClips = ClipboardAccessibilityService.getPendingClips(context)
            pendingClips.map { (content, timestamp) ->
                mapOf(
                    "content" to content,
                    "timestamp" to timestamp
                )
            }
        }

        // Clear pending clips after they've been processed
        Function("clearPendingClips") {
            ClipboardAccessibilityService.clearPendingClips(context)
        }

        OnCreate {
            // Register this module to receive clipboard events from the service
            ClipboardAccessibilityService.setEventEmitter { content, timestamp ->
                sendEvent("onClipboardChange", mapOf(
                    "content" to content,
                    "timestamp" to timestamp
                ))
            }
        }

        OnDestroy {
            ClipboardAccessibilityService.setEventEmitter(null)
        }
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        val serviceName = "${context.packageName}/${ClipboardAccessibilityService::class.java.canonicalName}"

        val enabledServices = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false

        val colonSplitter = TextUtils.SimpleStringSplitter(':')
        colonSplitter.setString(enabledServices)

        while (colonSplitter.hasNext()) {
            val componentName = colonSplitter.next()
            if (componentName.equals(serviceName, ignoreCase = true)) {
                return true
            }
        }

        return false
    }

    private fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }

    private fun isOverlayPermissionGranted(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true // Permission not needed before Android M
        }
    }

    private fun openOverlaySettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${context.packageName}")
            )
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        }
    }
}
