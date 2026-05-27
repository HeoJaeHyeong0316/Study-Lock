package org.example.study_lock.Repository;

import org.example.study_lock.Entity.StudySession;
import org.example.study_lock.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, Long> {

    // 진행 중인 세션 찾기 (ended_at이 null인 것)
    Optional<StudySession> findByUserAndEndedAtIsNull(User user);

    // 오늘 기록 찾기
    List<StudySession> findByUserAndStartedAtBetween(
            User user,
            LocalDateTime start,
            LocalDateTime end
    );

    // 전체 기록 찾기
    List<StudySession> findByUserOrderByStartedAtDesc(User user);

    void deleteByUser(User user);
}