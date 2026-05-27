package org.example.study_lock.Service;

import lombok.RequiredArgsConstructor;
import org.example.study_lock.Config.JWTutil;
import org.example.study_lock.Entity.StudySession;
import org.example.study_lock.Entity.User;
import org.example.study_lock.Repository.StudySessionRepository;
import org.example.study_lock.Repository.UserRepository;
import org.example.study_lock.dto.RecordResponse;
import org.example.study_lock.dto.TodayRecordResponse;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecordService {

    private final StudySessionRepository studySessionRepository;
    private final UserRepository userRepository;
    private final JWTutil jwtUtil;

    // 오늘 기록 조회
    public TodayRecordResponse getTodayRecords(String token) {
        String email = jwtUtil.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        List<StudySession> sessions = studySessionRepository
                .findByUserAndStartedAtBetween(user, startOfDay, endOfDay);

        int totalTime = sessions.stream()
                .mapToInt(StudySession::getActualTime)
                .sum();

        List<RecordResponse> records = sessions.stream()
                .map(s -> new RecordResponse(
                        s.getId(),
                        s.getSubject(),
                        s.getGoalTime(),
                        s.getActualTime(),
                        s.getEscapeCount(),
                        s.isSuccess(),
                        s.getStartedAt(),
                        s.getEndedAt()
                ))
                .collect(Collectors.toList());

        return new TodayRecordResponse(totalTime, sessions.size(), records);
    }

    // 전체 기록 조회
    public List<RecordResponse> getAllRecords(String token) {
        String email = jwtUtil.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        List<StudySession> sessions = studySessionRepository
                .findByUserOrderByStartedAtDesc(user);

        return sessions.stream()
                .map(s -> new RecordResponse(
                        s.getId(),
                        s.getSubject(),
                        s.getGoalTime(),
                        s.getActualTime(),
                        s.getEscapeCount(),
                        s.isSuccess(),
                        s.getStartedAt(),
                        s.getEndedAt()
                ))
                .collect(Collectors.toList());
    }
}