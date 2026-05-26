package org.example.study_lock.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    // Jackson이 boolean isSuccess를 기본적으로 "success"로 직렬화하는 것 방지
    @JsonProperty("isSuccess")
    private boolean isSuccess;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
}