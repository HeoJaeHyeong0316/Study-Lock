package org.example.study_lock.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class RecordResponse {
    private Long sessionId;
    private String subject;
    private int goalTime;
    private int actualTime;
    private int escapeCount;
    private boolean isSuccess;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
}