package org.example.study_lock.Service;

import lombok.RequiredArgsConstructor;
import org.example.study_lock.Config.JWTutil;
import org.example.study_lock.Entity.StudySession;
import org.example.study_lock.Entity.User;
import org.example.study_lock.Repository.StudySessionRepository;
import org.example.study_lock.Repository.UserRepository;
import org.example.study_lock.dto.StudyEndRequest;
import org.example.study_lock.dto.StudyStartRequest;
import org.example.study_lock.dto.StudyStartResponse;
import org.example.study_lock.Service.FcmService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class StudyService {

    private final StudySessionRepository studySessionRepository;
    private final UserRepository userRepository;
    private final JWTutil jwtUtil;

    // 공부 시작
    public StudyStartResponse startStudy(String token, StudyStartRequest request) {
        // 토큰에서 이메일 추출
        String email = jwtUtil.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        // 이미 진행 중인 세션이 있으면 자동 종료 처리 (앱 강제 종료/네트워크 실패/뒤로가기 등 대비)
        studySessionRepository.findByUserAndEndedAtIsNull(user)
                .ifPresent(s -> {
                    long actualTime = ChronoUnit.SECONDS.between(s.getStartedAt(), LocalDateTime.now());
                    s.setActualTime((int) actualTime);
                    s.setEndedAt(LocalDateTime.now());
                    s.setSuccess(actualTime >= s.getGoalTime());
                    studySessionRepository.save(s);
                });

        // 세션 생성
        StudySession session = new StudySession();
        session.setUser(user);
        session.setSubject(request.getSubject());
        session.setGoalTime(request.getGoalTime());

        studySessionRepository.save(session);

        return new StudyStartResponse(
                session.getId(),
                session.getSubject(),
                session.getGoalTime(),
                session.getStartedAt()
        );
    }

    // 공부 종료
    public void endStudy(String token, StudyEndRequest request) {
        String email = jwtUtil.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        StudySession session = studySessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new RuntimeException("세션을 찾을 수 없습니다"));

        // 실제 공부 시간 계산 (초 단위)
        long actualTime = ChronoUnit.SECONDS.between(
                session.getStartedAt(),
                LocalDateTime.now()
        );
        // 목표 달성 여부
        boolean isSuccess = actualTime >= session.getGoalTime();

        session.setActualTime((int) actualTime);
        session.setEscapeCount(request.getEscapeCount());
        session.setSuccess(isSuccess);
        session.setEndedAt(LocalDateTime.now());

        studySessionRepository.save(session);
        // 목표 달성 시 알림
        if (isSuccess && user.getFcmToken() != null) {
            FcmService.sendNotification(
                    user.getFcmToken(),
                    "🎉 목표 달성!",
                    session.getSubject() + " 공부 목표를 달성했어요!"
            );
        }

    }

    // 이탈 감지
    public int escapeStudy(String token, Long sessionId) {
        String email = jwtUtil.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        StudySession session = studySessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("세션을 찾을 수 없습니다"));

        session.setEscapeCount(session.getEscapeCount() + 1);
        studySessionRepository.save(session);

        return session.getEscapeCount();
    }

}