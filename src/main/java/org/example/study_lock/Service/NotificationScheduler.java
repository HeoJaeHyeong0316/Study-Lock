package org.example.study_lock.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.study_lock.Entity.User;
import org.example.study_lock.Repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private final UserRepository userRepository;
    private final FcmService fcmService;

    // 매일 오전 9시 공부 시작 알림
    @Scheduled(cron = "0 0 9 * * *")
    public void sendMorningNotification() {
        userRepository.findAll().stream()
                .filter(u -> u.getFcmToken() != null)
                .forEach(u -> fcmService.sendNotification(
                        u.getFcmToken(),
                        "📚 공부 시작할 시간이에요!",
                        "오늘도 목표를 향해 나아가봐요!"
                ));
    }

    // 연속 달성 축하 알림 (매일 자정)
    @Scheduled(cron = "0 0 0 * * *")
    public void sendStreakNotification() {
        // 연속 달성 API 구현 후 추가 예정
    }
}