# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# ============================================================================
# 2. Ionic / Capacitor & WebView の難読化防止設定
# ============================================================================

# Capacitor 本体のコアクラスとインターフェースの構造をそのまま維持
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }

# Cordova 互換プラグインを使用している場合の保護
-keep class org.apache.cordova.** { *; }

# WebKit（WebView）まわりのネイティブ連携を保護
-keep class android.webkit.** { *; }

# JavaScript とネイティブ（Java/Kotlin）間で橋渡しを行うアノテーション（@JavascriptInterfaceなど）を保護
-keepattributes JavascriptInterface, *Annotation*, Signature, EnclosingMethod

# すべてのCapacitorプラグイン拡張クラスとそのメンバーを強制保護
-keep class * extends com.getcapacitor.Plugin { *; }
-keep class * extends com.getcapacitor.BridgeActivity { *; }

# Google Play Services & AdMob 用の難読化除外設定
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.gms.common.** { *; }
-keep interface com.google.android.gms.** { *; }

# R8のフルモードによる過剰な最適化で広告クラスが消されるのを防ぐお守り
-keepattributes InnerClasses