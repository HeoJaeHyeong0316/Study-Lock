package org.example.study_lock.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private String nickname;
    private int currentStreak;
    private int longestStreak;
    private LocalDate lastSuccessDate;
}