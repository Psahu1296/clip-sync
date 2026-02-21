package expo.modules.clipboardaccessibility

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.ClipboardManager
import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import org.json.JSONArray
import org.json.JSONObject

/**
 * Lightweight Accessibility Service for ClipApp
 *
 * DESIGN PHILOSOPHY: User-choice centric, NOT surveillance
 * - Only shows floating button when user selects text or copies
 * - User must explicitly tap the button to save clipboard content
 * - NO automatic clipboard monitoring or polling
 * - Minimal battery usage
 */
class ClipboardAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "ClipboardAccess"
        private const val PREFS_NAME = "ClipboardAccessibilityPrefs"
        private const val KEY_PENDING_CLIPS = "pending_clips"
        private const val MAX_PENDING_CLIPS = 100

        // Copy action detection keywords (multi-language support)
        private val COPY_KEYWORDS = listOf(
            "copy", "copied", "copy text", "copy link", "copy url",
            "copiar", "copiado", // Spanish
            "copier", "copié", // French
            "kopieren", "kopiert", // German
            "कॉपी", // Hindi
            "复制", "已复制", // Chinese
            "コピー", // Japanese
            "복사", // Korean
        )

        private var eventEmitter: ((content: String, timestamp: Long) -> Unit)? = null
        private var serviceInstance: ClipboardAccessibilityService? = null

        fun setEventEmitter(emitter: ((content: String, timestamp: Long) -> Unit)?) {
            Log.d(TAG, "setEventEmitter called, emitter is ${if (emitter != null) "SET" else "NULL"}")
            eventEmitter = emitter
            // When emitter is set (app is active), flush any pending clips
            if (emitter != null) {
                serviceInstance?.flushPendingClips()
            }
        }

        fun getEventEmitter(): ((content: String, timestamp: Long) -> Unit)? = eventEmitter

        fun getPendingClips(context: Context): List<Pair<String, Long>> {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val clipsJson = prefs.getString(KEY_PENDING_CLIPS, "[]") ?: "[]"
            val clips = mutableListOf<Pair<String, Long>>()

            try {
                val jsonArray = JSONArray(clipsJson)
                for (i in 0 until jsonArray.length()) {
                    val obj = jsonArray.getJSONObject(i)
                    clips.add(Pair(obj.getString("content"), obj.getLong("timestamp")))
                }
                Log.d(TAG, "getPendingClips returning ${clips.size} clips")
            } catch (e: Exception) {
                Log.e(TAG, "Error parsing pending clips", e)
            }

            return clips
        }

        fun clearPendingClips(context: Context) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putString(KEY_PENDING_CLIPS, "[]").commit()
            Log.d(TAG, "Cleared pending clips")
        }

        fun savePendingClip(context: Context, content: String, timestamp: Long) {
            try {
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                val clipsJson = prefs.getString(KEY_PENDING_CLIPS, "[]") ?: "[]"
                val jsonArray = JSONArray(clipsJson)

                // Create new clip with current timestamp
                val newClip = JSONObject().apply {
                    put("content", content)
                    put("timestamp", timestamp)
                }

                // Build new array, excluding any duplicates of this content
                val newArray = JSONArray()
                newArray.put(newClip)  // Add the new/updated clip at the top

                var duplicateFound = false
                for (i in 0 until minOf(jsonArray.length(), MAX_PENDING_CLIPS - 1)) {
                    val obj = jsonArray.getJSONObject(i)
                    if (obj.getString("content") == content) {
                        // Skip the duplicate - it's being moved to top
                        duplicateFound = true
                        Log.d(TAG, "Moving duplicate clip to top")
                    } else {
                        newArray.put(obj)
                    }
                }

                prefs.edit().putString(KEY_PENDING_CLIPS, newArray.toString()).commit()
                Log.d(TAG, "Saved pending clip, total: ${newArray.length()}${if (duplicateFound) " (moved to top)" else ""}")

                // Also emit to app if available
                eventEmitter?.invoke(content, timestamp)

            } catch (e: Exception) {
                Log.e(TAG, "Error saving pending clip", e)
            }
        }

        fun captureClipboardContent(context: Context): String? {
            try {
                val service = serviceInstance

                // First, try to get the last copied text that we captured from accessibility events
                val lastCopied = service?.lastCopiedText
                if (!lastCopied.isNullOrEmpty()) {
                    Log.d(TAG, "Returning last captured text from accessibility events")
                    // Clear it after returning to avoid duplicates
                    service.lastCopiedText = null
                    return lastCopied
                }

                // Try using the service instance for clipboard access (Privileged Access)
                if (service != null) {
                    Log.d(TAG, "Capturing clipboard using active Accessibility Service instance")
                    val clipboardManager = service.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    if (clipboardManager.hasPrimaryClip()) {
                        val clipData = clipboardManager.primaryClip
                        if (clipData != null && clipData.itemCount > 0) {
                            val item = clipData.getItemAt(0)
                            val text = item.coerceToText(service)?.toString()
                            if (!text.isNullOrEmpty()) {
                                return text
                            }
                        }
                    }
                } else {
                    Log.w(TAG, "Service instance is null, falling back to context (might fail on Android 10+)")
                    val clipboardManager = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    if (clipboardManager.hasPrimaryClip()) {
                        val clipData = clipboardManager.primaryClip
                        if (clipData != null && clipData.itemCount > 0) {
                            val item = clipData.getItemAt(0)
                            val text = item.coerceToText(context)?.toString()
                            if (!text.isNullOrEmpty()) {
                                return text
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error capturing clipboard content", e)
            }
            return null
        }

        fun setLastCopiedText(text: String?) {
            serviceInstance?.lastCopiedText = text
        }

        fun getLastCopiedText(): String? {
            return serviceInstance?.lastCopiedText
        }
    }

    private lateinit var prefs: SharedPreferences
    private var clipboardManager: ClipboardManager? = null
    private var lastClipboardContent: String? = null
    private var lastCopiedText: String? = null  // Store the last copied text from events

    // Track last shown time to prevent button spam
    private var lastButtonShowTime: Long = 0
    private val BUTTON_COOLDOWN_MS = 1500L // 1.5 second cooldown between button shows

    // Clipboard change listener - most reliable way to detect copy actions
    private val clipboardListener = ClipboardManager.OnPrimaryClipChangedListener {
        Log.d(TAG, "CLIPBOARD CHANGED detected via listener!")
        handleClipboardChange()
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d(TAG, "Accessibility service connected (lightweight mode - user choice centric)")
        serviceInstance = this
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        // CRITICAL: Configure service to listen to ALL apps (no package filter)
        try {
            val info = serviceInfo ?: AccessibilityServiceInfo()
            info.eventTypes = AccessibilityEvent.TYPES_ALL_MASK
            info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC or
                    AccessibilityServiceInfo.FEEDBACK_VISUAL
            info.flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS or
                    AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                    AccessibilityServiceInfo.DEFAULT
            info.notificationTimeout = 50
            // IMPORTANT: Set packageNames to null to receive events from ALL apps
            info.packageNames = null
            serviceInfo = info
            Log.d(TAG, "Service configured to listen to ALL apps")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to configure service info", e)
        }

        // Register clipboard change listener - this is the key for detecting copies in other apps
        try {
            clipboardManager = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            clipboardManager?.addPrimaryClipChangedListener(clipboardListener)
            Log.d(TAG, "Clipboard change listener registered successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to register clipboard listener", e)
        }

        Log.d(TAG, "Service ready - eventTypes=${serviceInfo?.eventTypes}, flags=${serviceInfo?.flags}, packages=${serviceInfo?.packageNames?.joinToString() ?: "ALL"}")
    }

    private fun handleClipboardChange() {
        try {
            val cm = clipboardManager ?: return
            if (!cm.hasPrimaryClip()) return

            val clipData = cm.primaryClip ?: return
            if (clipData.itemCount == 0) return

            val text = clipData.getItemAt(0).coerceToText(this)?.toString()
            if (text.isNullOrEmpty()) return

            // Avoid showing button for the same content
            if (text == lastClipboardContent) {
                Log.d(TAG, "Same clipboard content, skipping")
                return
            }

            lastClipboardContent = text
            Log.d(TAG, "New clipboard content detected: ${text.take(50)}...")
            showFloatingButtonWithCooldown()
        } catch (e: Exception) {
            Log.e(TAG, "Error handling clipboard change", e)
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        // Only log non-scroll events to reduce noise
        if (event.eventType != AccessibilityEvent.TYPE_VIEW_SCROLLED &&
            event.eventType != 2048) { // TYPE_WINDOW_CONTENT_CHANGED = 2048
            Log.d(TAG, "EVENT: type=${event.eventType}, class=${event.className}, text=${event.text}")
        }

        try {
            when (event.eventType) {
                // Show button when user selects text
                AccessibilityEvent.TYPE_VIEW_TEXT_SELECTION_CHANGED -> {
                    handleTextSelection(event)
                }

                // Show button when user clicks "Copy" or any button with copy-related text
                AccessibilityEvent.TYPE_VIEW_CLICKED -> {
                    handleClick(event)
                }

                // Show button when "Copied" toast appears
                AccessibilityEvent.TYPE_NOTIFICATION_STATE_CHANGED -> {
                    handleNotification(event)
                }

                // Handle announcements (some apps announce "Copied to clipboard")
                AccessibilityEvent.TYPE_ANNOUNCEMENT -> {
                    handleAnnouncement(event)
                }

                // Handle window state changes (context menus with Copy option)
                AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                    handleWindowStateChange(event)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in onAccessibilityEvent", e)
        }
    }

    private fun handleAnnouncement(event: AccessibilityEvent) {
        val eventText = getEventText(event)
        val lowerText = eventText.lowercase()
        if (lowerText.contains("copied") || lowerText.contains("clipboard")) {
            Log.d(TAG, "Copy announcement detected: '$eventText'")
            markCopyDetected()  // Mark that a copy just happened
            showFloatingButtonWithCooldown()
        }
    }

    private var justCopied = false  // Flag to track if we just detected a copy action
    private var copyDetectedTime: Long = 0

    private fun handleWindowStateChange(event: AccessibilityEvent) {
        val eventText = getEventText(event)

        // Detect when a context menu or popup with "copy" appears
        if (isCopyAction(eventText)) {
            Log.d(TAG, "Copy menu detected: '$eventText'")
            // Don't show button here - wait for the click
            return
        }

        // Only capture text if we recently detected a copy action (within 2 seconds)
        // This is the Chrome share bar that shows "[copied text], Send to device"
        if (justCopied && System.currentTimeMillis() - copyDetectedTime < 2000) {
            if (eventText.contains("Send to device") || eventText.contains("Share")) {
                // Extract the copied text - it's the first part before ", Send to device"
                val parts = eventText.split(", Send to device", ", Share")
                if (parts.isNotEmpty() && parts[0].isNotEmpty()) {
                    val copiedText = parts[0].trim()
                    if (copiedText.isNotEmpty() && copiedText.length > 1) {
                        Log.d(TAG, "Captured copied text from share bar: '${copiedText.take(50)}...'")
                        lastCopiedText = copiedText
                        justCopied = false  // Reset the flag
                    }
                }
            }
        }
    }

    private fun markCopyDetected() {
        justCopied = true
        copyDetectedTime = System.currentTimeMillis()

        // Try to capture clipboard immediately when copy is detected
        // The accessibility service may have a brief window to access it
        try {
            val cm = clipboardManager ?: return
            if (cm.hasPrimaryClip()) {
                val clipData = cm.primaryClip
                if (clipData != null && clipData.itemCount > 0) {
                    val text = clipData.getItemAt(0).coerceToText(this)?.toString()
                    if (!text.isNullOrEmpty()) {
                        Log.d(TAG, "Captured clipboard at copy time: '${text.take(50)}...'")
                        lastCopiedText = text
                    }
                }
            }
        } catch (e: Exception) {
            Log.d(TAG, "Could not capture clipboard immediately: ${e.message}")
        }
    }

    private fun handleTextSelection(event: AccessibilityEvent) {
        // Check if there's actual text selected (not just cursor movement)
        val fromIndex = event.fromIndex
        val toIndex = event.toIndex
        val hasSelection = fromIndex >= 0 && toIndex > fromIndex

        if (hasSelection) {
            Log.d(TAG, "Text selection detected (from: $fromIndex, to: $toIndex)")
            showFloatingButtonWithCooldown()
        }
    }

    private fun handleClick(event: AccessibilityEvent) {
        val eventText = getEventText(event)

        // Check text content for copy keywords
        if (isCopyAction(eventText)) {
            Log.d(TAG, "Copy button clicked: '$eventText'")
            markCopyDetected()  // Mark that a copy just happened
            showFloatingButtonWithCooldown()
            return
        }

        // Also check the view ID (some apps use IDs like "copy_button", "menu_copy", etc.)
        val viewId = event.source?.viewIdResourceName ?: ""
        if (viewId.isNotEmpty()) {
            val lowerViewId = viewId.lowercase()
            if (lowerViewId.contains("copy") || lowerViewId.contains("clipboard")) {
                Log.d(TAG, "Copy button clicked (by viewId): '$viewId'")
                markCopyDetected()  // Mark that a copy just happened
                showFloatingButtonWithCooldown()
                return
            }
        }

        // Check class name for copy-related popups/menus
        val className = event.className?.toString() ?: ""
        if (className.contains("PopupMenu") || className.contains("ContextMenu") ||
            className.contains("ActionMode")) {
            // When clicking inside a popup/context menu, check if any text matches copy
            if (isCopyAction(eventText)) {
                Log.d(TAG, "Copy action in popup: '$eventText'")
                markCopyDetected()  // Mark that a copy just happened
                showFloatingButtonWithCooldown()
            }
        }
    }

    private fun handleNotification(event: AccessibilityEvent) {
        val eventText = getEventText(event)
        val lowerText = eventText.lowercase()
        if (lowerText.contains("copied") || lowerText.contains("clipboard")) {
            Log.d(TAG, "Copied notification detected: '$eventText'")
            markCopyDetected()  // Mark that a copy just happened
            showFloatingButtonWithCooldown()
        }
    }

    private fun showFloatingButtonWithCooldown() {
        val now = System.currentTimeMillis()
        if (now - lastButtonShowTime < BUTTON_COOLDOWN_MS) {
            Log.d(TAG, "Button cooldown active, skipping")
            return
        }

        lastButtonShowTime = now
        try {
            Log.d(TAG, "Showing floating capture button")
            FloatingClipButtonService.showButton(this)
        } catch (e: Exception) {
            Log.e(TAG, "Error showing floating button", e)
        }
    }

    private fun getEventText(event: AccessibilityEvent): String {
        val textBuilder = StringBuilder()

        event.text?.forEach { text ->
            if (!text.isNullOrEmpty()) {
                textBuilder.append(text.toString()).append(" ")
            }
        }

        event.contentDescription?.let { desc ->
            textBuilder.append(desc.toString()).append(" ")
        }

        return textBuilder.toString().trim()
    }

    private fun isCopyAction(text: String): Boolean {
        if (text.isEmpty()) return false
        val lowerText = text.lowercase()
        return COPY_KEYWORDS.any { keyword ->
            lowerText.contains(keyword.lowercase())
        }
    }

    private fun flushPendingClips() {
        try {
            val clips = getPendingClips(this)
            if (clips.isEmpty()) {
                Log.d(TAG, "No pending clips to flush")
                return
            }

            Log.d(TAG, "Flushing ${clips.size} pending clips")
            clips.reversed().forEach { (content, timestamp) ->
                eventEmitter?.invoke(content, timestamp)
            }
            clearPendingClips(this)
        } catch (e: Exception) {
            Log.e(TAG, "Error flushing pending clips", e)
        }
    }

    override fun onInterrupt() {
        Log.d(TAG, "Accessibility service interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "Accessibility service destroyed")

        // Unregister clipboard listener
        try {
            clipboardManager?.removePrimaryClipChangedListener(clipboardListener)
        } catch (e: Exception) {
            Log.e(TAG, "Error removing clipboard listener", e)
        }

        serviceInstance = null
        FloatingClipButtonService.hideButton(this)
    }
}
