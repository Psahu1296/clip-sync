const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withClipboardAccessibility = (config) => {
  // First, copy resource files
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;

      // Source paths (from our module)
      const moduleResPath = path.join(
        projectRoot,
        'modules/clipboard-accessibility/android/src/main/res'
      );

      // Destination paths (main app resources)
      const appResPath = path.join(platformRoot, 'app/src/main/res');

      // Copy XML resources
      const xmlSrcDir = path.join(moduleResPath, 'xml');
      const xmlDestDir = path.join(appResPath, 'xml');

      if (fs.existsSync(xmlSrcDir)) {
        if (!fs.existsSync(xmlDestDir)) {
          fs.mkdirSync(xmlDestDir, { recursive: true });
        }

        const xmlFiles = fs.readdirSync(xmlSrcDir);
        for (const file of xmlFiles) {
          const srcFile = path.join(xmlSrcDir, file);
          const destFile = path.join(xmlDestDir, file);
          fs.copyFileSync(srcFile, destFile);
          console.log(`[withClipboardAccessibility] Copied ${file} to app resources`);
        }
      }

      // Add ProGuard rules to keep our classes
      const proguardPath = path.join(platformRoot, 'app/proguard-rules.pro');
      if (fs.existsSync(proguardPath)) {
        let proguardContent = fs.readFileSync(proguardPath, 'utf8');
        const keepRule = '-keep class expo.modules.clipboardaccessibility.** { *; }';
        if (!proguardContent.includes(keepRule)) {
          proguardContent += `\n\n# Keep clipboard accessibility service classes\n${keepRule}\n`;
          fs.writeFileSync(proguardPath, proguardContent);
          console.log('[withClipboardAccessibility] Added ProGuard keep rules');
        }
      }

      // Copy string resources (merge with existing)
      const valuesSrcDir = path.join(moduleResPath, 'values');
      const valuesDestDir = path.join(appResPath, 'values');

      if (fs.existsSync(valuesSrcDir)) {
        if (!fs.existsSync(valuesDestDir)) {
          fs.mkdirSync(valuesDestDir, { recursive: true });
        }

        // Read source strings.xml
        const srcStringsPath = path.join(valuesSrcDir, 'strings.xml');
        if (fs.existsSync(srcStringsPath)) {
          const srcContent = fs.readFileSync(srcStringsPath, 'utf8');

          // Extract string entries from source
          const stringMatches = srcContent.match(/<string name="[^"]+">[\s\S]*?<\/string>/g) || [];

          // Check if destination strings.xml exists
          const destStringsPath = path.join(valuesDestDir, 'strings.xml');
          let destContent = '';

          if (fs.existsSync(destStringsPath)) {
            destContent = fs.readFileSync(destStringsPath, 'utf8');
          } else {
            destContent = '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n</resources>';
          }

          // Add each string if not already present
          for (const stringEntry of stringMatches) {
            const nameMatch = stringEntry.match(/name="([^"]+)"/);
            if (nameMatch) {
              const stringName = nameMatch[1];
              if (!destContent.includes(`name="${stringName}"`)) {
                // Insert before closing </resources> tag
                destContent = destContent.replace(
                  '</resources>',
                  `    ${stringEntry}\n</resources>`
                );
              }
            }
          }

          fs.writeFileSync(destStringsPath, destContent);
          console.log('[withClipboardAccessibility] Updated strings.xml with accessibility strings');
        }
      }

      return config;
    },
  ]);

  // Then, update AndroidManifest
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Add accessibility service permission
    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    const accessibilityPermission = {
      $: {
        'android:name': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
      },
    };

    const hasPermission = androidManifest['uses-permission'].some(
      (perm) => perm.$['android:name'] === 'android.permission.BIND_ACCESSIBILITY_SERVICE'
    );

    if (!hasPermission) {
      androidManifest['uses-permission'].push(accessibilityPermission);
    }

    // Add service declaration
    if (!androidManifest.application) {
      androidManifest.application = [{}];
    }

    const application = androidManifest.application[0];

    if (!application.service) {
      application.service = [];
    }

    // Full service declaration with meta-data for accessibility configuration
    const serviceDeclaration = {
      $: {
        'android:name': 'expo.modules.clipboardaccessibility.ClipboardAccessibilityService',
        'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
        'android:exported': 'true',
        'android:label': 'ClipApp Clipboard Monitor',
      },
      'intent-filter': [
        {
          action: [
            {
              $: {
                'android:name': 'android.accessibilityservice.AccessibilityService',
              },
            },
          ],
        },
      ],
      'meta-data': [
        {
          $: {
            'android:name': 'android.accessibilityservice',
            'android:resource': '@xml/accessibility_service_config',
          },
        },
      ],
    };

    // Remove old service declarations if exist
    application.service = application.service.filter(
      (service) => {
        const name = service.$?.['android:name'];
        return name !== '.ClipboardAccessibilityService' &&
               name !== 'expo.modules.clipboardaccessibility.ClipboardAccessibilityService' &&
               name !== 'expo.modules.clipboardaccessibility.FloatingClipButtonService';
      }
    );

    // Add accessibility service declaration
    application.service.push(serviceDeclaration);

    // Add floating button service declaration
    const floatingButtonService = {
      $: {
        'android:name': 'expo.modules.clipboardaccessibility.FloatingClipButtonService',
        'android:exported': 'false',
      },
    };
    application.service.push(floatingButtonService);

    // Add SYSTEM_ALERT_WINDOW permission for overlay
    const overlayPermission = {
      $: {
        'android:name': 'android.permission.SYSTEM_ALERT_WINDOW',
      },
    };
    const hasOverlayPermission = androidManifest['uses-permission'].some(
      (perm) => perm.$['android:name'] === 'android.permission.SYSTEM_ALERT_WINDOW'
    );
    if (!hasOverlayPermission) {
      androidManifest['uses-permission'].push(overlayPermission);
    }

    return config;
  });

  return config;
};

module.exports = withClipboardAccessibility;
