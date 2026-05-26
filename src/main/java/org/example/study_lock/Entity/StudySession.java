package org.example.study_lock.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "study_sessions")
@Getter
@Setter
@NoArgsConstructor
public class StudySession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String subject;

    @Column(name = "goal_time", nullable = false)
    private int goalTime;

    @Column(name = "actual_time")
    private int actualTime = 0;

    @Column(name = "escape_count")
    private int escapeCount = 0;

    @Column(name = "is_success")
    private boolean isSuccess = false;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @PrePersist
    public void prePersist() {
        this.startedAt = LocalDateTime.now();
    }
}