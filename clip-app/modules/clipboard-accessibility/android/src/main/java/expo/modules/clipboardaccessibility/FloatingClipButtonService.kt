package expo.modules.clipboardaccessibility

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.app.Service
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Floating button service that shows an overlay button when user copies text.
 * User must tap the button to save the clipboard content.
 */
class FloatingClipButtonService : Service() {

    companion object {
        private const val TAG = "FloatingClipButton"
        private const val PREFS_NAME = "ClipboardAccessibilityPrefs"
        private const val KEY_BUTTON_POSITION = "floating_button_position"

        // Position constants
        const val POSITION_TOP_LEFT = 0
        const val POSITION_TOP_RIGHT = 1
        const val POSITION_BOTTOM_LEFT = 2
        const val POSITION_BOTTOM_RIGHT = 3

        private var isShowing = false

        fun showButton(context: Context) {
            Log.d(TAG, "showButton called, isShowing=$isShowing")
            if (!isShowing) {
                try {
                    // Check overlay permission
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        val canDraw = android.provider.Settings.canDrawOverlays(context)
                        Log.d(TAG, "Can draw overlays: $canDraw")
                        if (!canDraw) {
                            Log.e(TAG, "OVERLAY PERMISSION NOT GRANTED - Cannot show button")
                            return
                        }
                    }
                    val intent = Intent(context, FloatingClipButtonService::class.java)
                    intent.action = "SHOW"
                    context.startService(intent)
                    Log.d(TAG, "Service start intent sent")
                } catch (e: Exception) {
                    Log.e(TAG, "Error starting FloatingClipButtonService", e)
                }
            } else {
                Log.d(TAG, "Button already showing, skipping")
            }
        }

        fun hideButton(context: Context) {
            val intent = Intent(context, FloatingClipButtonService::class.java)
            intent.action = "HIDE"
            context.startService(intent)
        }

        fun getButtonPosition(context: Context): Int {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            return prefs.getInt(KEY_BUTTON_POSITION, POSITION_BOTTOM_RIGHT)
        }

        fun setButtonPosition(context: Context, position: Int) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putInt(KEY_BUTTON_POSITION, position).apply()
        }
    }

    private var windowManager: WindowManager? = null
    private var floatingView: View? = null
    private val hideHandler = Handler(Looper.getMainLooper())
    private var hideRunnable: Runnable? = null
    private var pulseAnimator: AnimatorSet? = null

    // App colors
    private val primaryColor = 0xFF0d93f2.toInt() // #0d93f2
    private val surfaceColor = 0xFF1e2730.toInt() // Dark surface

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            "SHOW" -> showFloatingButton()
            "HIDE" -> hideFloatingButton()
        }
        return START_NOT_STICKY
    }

    private fun showFloatingButton() {
        if (isShowing) {
            Log.d(TAG, "Button already showing, resetting timer")
            resetAutoHideTimer()
            return
        }

        try {
            windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

            // Create the main container
            val container = FrameLayout(this)

            // Create the button layout with gradient background
            val buttonLayout = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setPadding(16, 12, 20, 12)

                // Create gradient background
                background = GradientDrawable().apply {
                    shape = GradientDrawable.RECTANGLE
                    cornerRadius = 28f * resources.displayMetrics.density
                    setColor(surfaceColor)
                    setStroke(
                        (2 * resources.displayMetrics.density).toInt(),
                        primaryColor
                    )
                }
                elevation = 12f * resources.displayMetrics.density
            }

            // Create icon container with pulse effect background
            val iconContainer = FrameLayout(this).apply {
                val size = (40 * resources.displayMetrics.density).toInt()
                layoutParams = LinearLayout.LayoutParams(size, size).apply {
                    marginEnd = (12 * resources.displayMetrics.density).toInt()
                }
            }

            // Pulse ring view
            val pulseRing = View(this).apply {
                background = GradientDrawable().apply {
                    shape = GradientDrawable.OVAL
                    setColor(Color.TRANSPARENT)
                    setStroke((2 * resources.displayMetrics.density).toInt(), primaryColor)
                }
                alpha = 0f
            }
            iconContainer.addView(pulseRing, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ))

            // Icon background circle
            val iconBg = View(this).apply {
                background = GradientDrawable().apply {
                    shape = GradientDrawable.OVAL
                    setColor(primaryColor)
                }
            }
            val iconBgSize = (36 * resources.displayMetrics.density).toInt()
            iconContainer.addView(iconBg, FrameLayout.LayoutParams(iconBgSize, iconBgSize).apply {
                gravity = Gravity.CENTER
            })

            // Clipboard icon
            val iconText = TextView(this).apply {
                text = "📋"
                textSize = 18f
                gravity = Gravity.CENTER
            }
            iconContainer.addView(iconText, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ).apply {
                gravity = Gravity.CENTER
            })

            buttonLayout.addView(iconContainer)

            // Text container
            val textContainer = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
            }

            // Main text
            val mainText = TextView(this).apply {
                text = "Save to ClipApp"
                textSize = 14f
                setTextColor(Color.WHITE)
                typeface = android.graphics.Typeface.DEFAULT_BOLD
            }
            textContainer.addView(mainText)

            // Sub text
            val subText = TextView(this).apply {
                text = "Tap to capture"
                textSize = 11f
                setTextColor(0xFFB0B0B0.toInt())
            }
            textContainer.addView(subText)

            buttonLayout.addView(textContainer)
            container.addView(buttonLayout)

            // Get position from preferences
            val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val position = prefs.getInt(KEY_BUTTON_POSITION, POSITION_BOTTOM_RIGHT)

            // Set up layout params
            val layoutParams = WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                else
                    @Suppress("DEPRECATION")
                    WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = when (position) {
                    POSITION_TOP_LEFT -> Gravity.TOP or Gravity.START
                    POSITION_TOP_RIGHT -> Gravity.TOP or Gravity.END
                    POSITION_BOTTOM_LEFT -> Gravity.BOTTOM or Gravity.START
                    POSITION_BOTTOM_RIGHT -> Gravity.BOTTOM or Gravity.END
                    else -> Gravity.BOTTOM or Gravity.END
                }
                x = (16 * resources.displayMetrics.density).toInt()
                y = (100 * resources.displayMetrics.density).toInt()
            }

            // Touch handling
            var initialX = 0
            var initialY = 0
            var initialTouchX = 0f
            var initialTouchY = 0f
            var isDragging = false

            container.setOnTouchListener { v, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = layoutParams.x
                        initialY = layoutParams.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        isDragging = false

                        // Scale animation
                        v.animate().scaleX(0.95f).scaleY(0.95f).setDuration(100).start()
                        true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val deltaX = (initialTouchX - event.rawX).toInt()
                        val deltaY = (event.rawY - initialTouchY).toInt()

                        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                            isDragging = true
                        }

                        if (isDragging) {
                            when (layoutParams.gravity and Gravity.HORIZONTAL_GRAVITY_MASK) {
                                Gravity.START -> layoutParams.x = initialX - deltaX
                                Gravity.END -> layoutParams.x = initialX + deltaX
                            }
                            when (layoutParams.gravity and Gravity.VERTICAL_GRAVITY_MASK) {
                                Gravity.TOP -> layoutParams.y = initialY + deltaY
                                Gravity.BOTTOM -> layoutParams.y = initialY - deltaY
                            }
                            windowManager?.updateViewLayout(floatingView, layoutParams)
                        }
                        true
                    }
                    MotionEvent.ACTION_UP -> {
                        v.animate().scaleX(1f).scaleY(1f).setDuration(100).start()

                        if (!isDragging) {
                            performClickAnimation(v) {
                                captureClipboard()
                                hideFloatingButton()
                            }
                        }
                        true
                    }
                    else -> false
                }
            }

            floatingView = container
            windowManager?.addView(floatingView, layoutParams)
            isShowing = true

            // Entry animation
            container.alpha = 0f
            container.scaleX = 0.5f
            container.scaleY = 0.5f
            container.animate()
                .alpha(1f)
                .scaleX(1f)
                .scaleY(1f)
                .setDuration(300)
                .setInterpolator(OvershootInterpolator(1.2f))
                .start()

            startPulseAnimation(pulseRing)
            resetAutoHideTimer()

            Log.d(TAG, "Floating button successfully added to window")

        } catch (e: Exception) {
            Log.e(TAG, "Error showing floating button", e)
            isShowing = false
        }
    }

    private fun startPulseAnimation(pulseRing: View) {
        val scaleX = ObjectAnimator.ofFloat(pulseRing, "scaleX", 1f, 1.5f)
        val scaleY = ObjectAnimator.ofFloat(pulseRing, "scaleY", 1f, 1.5f)
        val alpha = ObjectAnimator.ofFloat(pulseRing, "alpha", 0.8f, 0f)

        pulseAnimator = AnimatorSet().apply {
            playTogether(scaleX, scaleY, alpha)
            duration = 1500
            interpolator = AccelerateDecelerateInterpolator()
            addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    if (isShowing) {
                        pulseRing.scaleX = 1f
                        pulseRing.scaleY = 1f
                        pulseRing.alpha = 0f
                        start()
                    }
                }
            })
            start()
        }
    }

    private fun performClickAnimation(view: View, onComplete: () -> Unit) {
        val scaleDown = ObjectAnimator.ofFloat(view, "scaleX", 1f, 0.9f)
        val scaleDownY = ObjectAnimator.ofFloat(view, "scaleY", 1f, 0.9f)
        val scaleUp = ObjectAnimator.ofFloat(view, "scaleX", 0.9f, 1.1f)
        val scaleUpY = ObjectAnimator.ofFloat(view, "scaleY", 0.9f, 1.1f)
        val fadeOut = ObjectAnimator.ofFloat(view, "alpha", 1f, 0f)

        val animSet = AnimatorSet()
        animSet.play(scaleDown).with(scaleDownY)
        animSet.play(scaleUp).with(scaleUpY).after(scaleDown)
        animSet.play(fadeOut).after(scaleUp)
        animSet.duration = 150
        animSet.addListener(object : AnimatorListenerAdapter() {
            override fun onAnimationEnd(animation: Animator) {
                onComplete()
            }
        })
        animSet.start()
    }

    private fun resetAutoHideTimer() {
        hideRunnable?.let { hideHandler.removeCallbacks(it) }
        hideRunnable = Runnable {
            hideFloatingButtonWithAnimation()
        }
        hideHandler.postDelayed(hideRunnable!!, 6000) // Hide after 6 seconds
    }

    private fun hideFloatingButtonWithAnimation() {
        floatingView?.let { view ->
            view.animate()
                .alpha(0f)
                .scaleX(0.5f)
                .scaleY(0.5f)
                .setDuration(200)
                .withEndAction {
                    hideFloatingButton()
                }
                .start()
        } ?: hideFloatingButton()
    }

    private fun hideFloatingButton() {
        try {
            pulseAnimator?.cancel()
            pulseAnimator = null
            hideRunnable?.let { hideHandler.removeCallbacks(it) }

            if (floatingView != null && windowManager != null) {
                try {
                    windowManager?.removeView(floatingView)
                } catch (e: IllegalArgumentException) {
                    // View not attached or already removed
                }
                floatingView = null
            }
            isShowing = false
            stopSelf()
            Log.d(TAG, "Floating button hidden")
        } catch (e: Exception) {
            Log.e(TAG, "Error hiding floating button", e)
        }
    }

    private fun captureClipboard() {
        try {
            // Use the accessibility service's privileged context to read clipboard
            // This works on Android 10+ where background clipboard access is restricted
            val text = ClipboardAccessibilityService.captureClipboardContent(this)

            if (!text.isNullOrEmpty()) {
                val timestamp = System.currentTimeMillis()
                Log.d(TAG, "CAPTURED via floating button: ${text.take(50)}...")
                saveToPendingClips(text, timestamp)
            } else {
                // Fallback: try direct access (works if we have focus)
                Log.d(TAG, "Accessibility capture returned null, trying direct access...")
                val clipboardManager = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                if (clipboardManager.hasPrimaryClip()) {
                    val clipData = clipboardManager.primaryClip
                    if (clipData != null && clipData.itemCount > 0) {
                        val item = clipData.getItemAt(0)
                        val directText = item.coerceToText(this)?.toString()
                        if (!directText.isNullOrEmpty()) {
                            val timestamp = System.currentTimeMillis()
                            Log.d(TAG, "CAPTURED via direct access: ${directText.take(50)}...")
                            saveToPendingClips(directText, timestamp)
                        } else {
                            Log.w(TAG, "Clipboard content is empty")
                        }
                    }
                } else {
                    Log.w(TAG, "No clipboard content available")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error capturing clipboard", e)
        }
    }

    private fun saveToPendingClips(content: String, timestamp: Long) {
        ClipboardAccessibilityService.savePendingClip(this, content, timestamp)
        Log.d(TAG, "Clip saved via ClipboardAccessibilityService")
    }

    override fun onDestroy() {
        super.onDestroy()
        hideFloatingButton()
    }
}
