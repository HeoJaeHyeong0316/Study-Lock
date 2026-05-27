package org.example.study_lock.Service;

import lombok.RequiredArgsConstructor;
import org.example.study_lock.Config.JWTutil;
import org.example.study_lock.Entity.StudySession;
import org.example.study_lock.Entity.User;
import org.example.study_lock.Repository.StudySessionRepository;
import org.example.study_lock.Repository.UserRepository;
import org.example.study_lock.dto.SubjectStatsResponse;
import org.example.study_lock.dto.WeeklyStatsResponse;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final StudySessionRepository studySessionRepository;
    private final UserRepository userRepository;
    private final JWTutil jwtUtil;

    // 주간 통계
    public WeeklyStatsResponse getWeeklyStats(String token) {
        String email = jwtUtil.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        // 이번 주 월요일 ~ 일요일
        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        LocalDate sunday = today.with(DayOfWeek.SUNDAY);

        LocalDateTime start = monday.atStartOfDay();
        LocalDateTime end = sunday.plusDays(1).atStartOfDay();

        List<StudySession> sessions = studySessionRepository
                .findByUserAndStartedAtBetween(user, start, end);

        // 요일별 통계
        String[] days = {"월", "화", "수", "목", "금", "토", "일"};
        List<WeeklyStatsResponse.DailyStats> dailyStats = new ArrayList<>();

        for (int i = 0; i < 7; i++) {
            LocalDate date = monday.plusDays(i);
            LocalDateTime dayStart = date.atStartOfDay();
            LocalDateTime dayEnd = dayStart.plusDays(1);

            int dayTotal = sessions.stream()
                    .filter(s -> s.getStartedAt() != null &&
                            s.getStartedAt().isAfter(dayStart) &&
                            s.getStartedAt().isBefore(dayEnd))
                    .mapToInt(StudySession::getActualTime)
                    .sum();

            dailyStats.add(new WeeklyStatsResponse.DailyStats(
                    days[i], dayTotal, date.equals(today)
            ));
        }

        // 총 공부 시간
        int totalTime = sessions.stream()
                .mapToInt(StudySession::getActualTime)
                .sum();

        // 달성률 (목표 달성한 세션 / 전체 세션)
        long successCount = sessions.stream()
                .filter(StudySession::isSuccess)
                .count();
        double achieveRate = sessions.isEmpty() ? 0 :
                (double) successCount / sessions.size() * 100;

        return new WeeklyStatsResponse(totalTime, achieveRate, dailyStats);
    }

    // 과목별 통계
    public List<SubjectStatsResponse> getSubjectStats(String token) {
        String email = jwtUtil.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        List<StudySession> sessions = studySessionRepository
                .findByUserOrderByStartedAtDesc(user);

        // 과목별 그룹핑
        Map<String, List<StudySession>> grouped = sessions.stream()
                .collect(Collectors.groupingBy(StudySession::getSubject));

        return grouped.entrySet().stream()
                .map(entry -> new SubjectStatsResponse(
                        entry.getKey(),
                        entry.getValue().stream().mapToInt(StudySession::getActualTime).sum(),
                        entry.getValue().size()
                ))
                .sorted((a, b) -> b.getTotalTime() - a.getTotalTime())
                .collect(Collectors.toList());
    }
}