package org.example.study_lock.Config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import io.github.cdimascio.dotenv.Dotenv;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void init() {
        try {
            InputStream serviceAccount;
            String base64 = System.getenv("FIREBASE_CREDENTIALS_BASE64");

            if (base64 != null && !base64.isEmpty()) {
                // Railway 환경: Base64 디코딩
                byte[] decoded = Base64.getDecoder().decode(base64);
                serviceAccount = new ByteArrayInputStream(decoded);
            } else {
                // 로컬 환경: 파일에서 읽기
                serviceAccount = getClass().getClassLoader()
                        .getResourceAsStream("firebase-adminsdk.json");
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
        } catch (Exception e) {
            throw new RuntimeException("Firebase 초기화 실패: " + e.getMessage());
        }
    }
}