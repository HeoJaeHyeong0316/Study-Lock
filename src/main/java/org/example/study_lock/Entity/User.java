package org.example.study_lock.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String nickname;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "refresh_token")
    private String refreshToken;

    @Column(name = "fcm_token")
    private  String fcmToken;

    @Column(name = "current_streak", nullable = false)
    private int currentStreak = 0;

    @Column(name = "longest_streak", nullable = false)
    private int longestStreak = 0;

    @Column(name = "last_success_date")
    private LocalDate lastSuccessDate;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}