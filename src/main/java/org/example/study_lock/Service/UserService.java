package org.example.study_lock.Service;

import lombok.RequiredArgsConstructor;
import org.example.study_lock.Config.JWTutil;
import org.example.study_lock.Entity.User;
import org.example.study_lock.Repository.StudySessionRepository;
import org.example.study_lock.Repository.UserRepository;
import org.example.study_lock.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final StudySessionRepository studySessionRepository;
    private final JWTutil jwtUtil;

    // 내 정보 조회
    public UserResponse getMyInfo(String token) {
        String email = jwtUtil.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        // 마지막 달성일이 어제보다 이전이면 연속 끊긴 상태 → 0으로 표시
        int effectiveStreak = user.getCurrentStreak();
        LocalDate last = user.getLastSuccessDate();
        LocalDate today = LocalDate.now();
        if (last == null || last.isBefore(today.minusDays(1))) {
            effectiveStreak = 0;
        }

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                effectiveStreak,
                user.getLongestStreak(),
                user.getLastSuccessDate()
        );
    }

    // 회원 탈퇴
    @Transactional
    public void deleteUser(String token) {
        String email = jwtUtil.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        // 세션 먼저 삭제 후 유저 삭제
        studySessionRepository.deleteByUser(user);
        userRepository.delete(user);
    }
    public void saveFcmToken(String token, String fcmToken) {
        String email = jwtUtil.getEmailFromToken(token);
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));
        user.setFcmToken(fcmToken);
        userRepository.save(user);
    }
}