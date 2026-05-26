package org.example.study_lock.dto;

import lombok.Getter;

@Getter
public class StudyEndRequest {
    private Long sessionId;
    private int escapeCount;
}