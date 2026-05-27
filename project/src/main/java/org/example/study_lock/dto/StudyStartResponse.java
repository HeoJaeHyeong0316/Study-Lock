package org.example.study_lock.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class StudyStartResponse {
    private Long sessionId;
    private String subject;
    private int goalTime;
    private LocalDateTime startTime;
}