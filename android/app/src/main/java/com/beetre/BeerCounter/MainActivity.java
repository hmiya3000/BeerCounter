package com.beetre.BeerCounter;

import android.os.Build;
import android.os.Bundle;
import android.view.Window; 
import android.view.WindowInsets;
import androidx.activity.EdgeToEdge;
import androidx.core.view.WindowCompat; 
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        supportRequestWindowFeature(Window.FEATURE_NO_TITLE);
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }
        // ----------------------------------------------------
        // ★ Android 11〜13（SO-41B等）システムバー引き伸ばし（白い壁）バグ修正
        // ----------------------------------------------------
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
            getWindow().getDecorView().setOnApplyWindowInsetsListener((v, insets) -> {
                // キーボード（IME）が表示されているかチェック
                boolean isKeyboardVisible = insets.isVisible(WindowInsets.Type.ime());
                if (isKeyboardVisible) {
                    // キーボード表示時のみ、キーボードのインセット(ime)をカット
                    // ナビゲーションバー等のセーフエリア情報(systemBars)はそのまま保持してWeb側へ流します
                    return new WindowInsets.Builder(insets)
                            .setInsets(WindowInsets.Type.ime(), android.graphics.Insets.NONE)
                            .build();
                }
                return insets;
            });
        } else {
            // Android 10以下（SO-05K）の場合
            // セーフエリア（ナビゲーションバーの幅）を破壊しないよう、
            // 新しいインセットリスナーの登録を完全にスキップし、OS標準の完全なレイアウト計算に委ねます。
            WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        }
    }
}